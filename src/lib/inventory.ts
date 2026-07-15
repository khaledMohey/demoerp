import type { Prisma } from "@prisma/client";
import { round2, round4, toNum } from "./format";

type Tx = Prisma.TransactionClient;

export type FifoAllocation = {
  batchId: string;
  quantity: number;
  unitCost: number;
  lineCost: number;
};

async function syncItemFromBatches(tx: Tx, itemId: string, sellPrice?: number) {
  const batches = await tx.stockBatch.findMany({
    where: { itemId, remaining: { gt: 0 } },
  });
  const quantity = round4(
    batches.reduce((s, b) => s + toNum(b.remaining), 0)
  );
  const stockValue = batches.reduce(
    (s, b) => s + toNum(b.remaining) * toNum(b.unitCost),
    0
  );
  const item = await tx.item.findUniqueOrThrow({ where: { id: itemId } });
  await tx.item.update({
    where: { id: itemId },
    data: {
      quantity,
      avgCost: quantity > 0 ? round4(stockValue / quantity) : 0,
      ...(sellPrice !== undefined && sellPrice > 0
        ? { sellPrice }
        : {}),
    },
  });
  return { quantity, avgCost: quantity > 0 ? round4(stockValue / quantity) : 0, item };
}

/** Create a stock batch from a purchase receipt (FIFO layer). */
export async function receiveBatch(
  tx: Tx,
  params: {
    itemId: string;
    quantity: number;
    unitCost: number;
    sellPrice: number;
    supplierId?: string | null;
    purchaseId?: string | null;
    purchaseLineId?: string | null;
    receivedAt?: Date;
  }
) {
  const batch = await tx.stockBatch.create({
    data: {
      itemId: params.itemId,
      quantity: params.quantity,
      remaining: params.quantity,
      unitCost: params.unitCost,
      sellPrice: params.sellPrice,
      supplierId: params.supplierId ?? null,
      purchaseId: params.purchaseId ?? null,
      purchaseLineId: params.purchaseLineId ?? null,
      receivedAt: params.receivedAt ?? new Date(),
    },
  });

  await syncItemFromBatches(tx, params.itemId, params.sellPrice);
  return batch;
}

/**
 * Consume quantity from oldest batches first (FIFO).
 * Returns allocations and total / average unit cost for this sale qty.
 */
export async function consumeFifo(
  tx: Tx,
  itemId: string,
  quantity: number
): Promise<{ allocations: FifoAllocation[]; totalCost: number; unitCost: number }> {
  if (quantity <= 0) {
    throw new Error("الكمية يجب أن تكون أكبر من صفر");
  }

  const batches = await tx.stockBatch.findMany({
    where: { itemId, remaining: { gt: 0 } },
    orderBy: [{ receivedAt: "asc" }, { createdAt: "asc" }],
  });

  const available = batches.reduce((s, b) => s + toNum(b.remaining), 0);
  if (available + 1e-9 < quantity) {
    throw new Error("الكمية غير كافية في الدفعات (FIFO)");
  }

  let left = quantity;
  const allocations: FifoAllocation[] = [];
  let totalCost = 0;

  for (const batch of batches) {
    if (left <= 0) break;
    const rem = toNum(batch.remaining);
    if (rem <= 0) continue;

    const take = Math.min(rem, left);
    const unitCost = toNum(batch.unitCost);
    const lineCost = round2(take * unitCost);

    await tx.stockBatch.update({
      where: { id: batch.id },
      data: { remaining: rem - take },
    });

    allocations.push({
      batchId: batch.id,
      quantity: take,
      unitCost,
      lineCost,
    });
    totalCost += lineCost;
    left -= take;
  }

  totalCost = round2(totalCost);
  const unitCost = quantity > 0 ? round4(totalCost / quantity) : 0;

  await syncItemFromBatches(tx, itemId);
  return { allocations, totalCost, unitCost };
}
