import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { formatMoney, formatQty, toNum } from "@/lib/format";
import {
  ButtonLink,
  EmptyState,
  PageHeader,
  StatCard,
  Table,
  Td,
  Th,
} from "@/components/ui";

export default async function ItemsPage() {
  await requireRole(["ADMIN", "STORE", "SALES", "ACCOUNTANT"]);

  const [items, batches] = await Promise.all([
    prisma.item.findMany({ orderBy: { name: "asc" } }),
    prisma.stockBatch.findMany({
      where: { remaining: { gt: 0 } },
    }),
  ]);

  let totalCost = 0;
  let totalSell = 0;
  for (const b of batches) {
    const rem = toNum(b.remaining);
    totalCost += rem * toNum(b.unitCost);
    totalSell += rem * toNum(b.sellPrice);
  }
  const totalProfit = totalSell - totalCost;
  const itemsCount = items.filter((i) => i.active).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="المخزن / الأصناف"
        description="المخزون بنظام FIFO — التكلفة من الدفعات الأقدم عند البيع"
        action={<ButtonLink href="/items/new">صنف جديد</ButtonLink>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="إجمالي تكلفة المخزون"
          value={formatMoney(totalCost)}
          hint="من الدفعات المتبقية بسعر الشراء"
        />
        <StatCard
          label="إجمالي بيع المخزون"
          value={formatMoney(totalSell)}
          hint="قيمة البيع المتوقعة للدفعات المتبقية"
        />
        <StatCard
          label="إجمالي الربح"
          value={formatMoney(totalProfit)}
          hint="بيع المخزون − تكلفته"
        />
        <StatCard
          label="إجمالي الأصناف"
          value={String(itemsCount)}
          hint={`${items.length} مسجّل · ${batches.length} دفعة نشطة`}
        />
      </div>

      {items.length === 0 ? (
        <EmptyState message="لا توجد أصناف بعد. أضف أول صنف." />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>الكود</Th>
              <Th>الاسم</Th>
              <Th>الكمية</Th>
              <Th>تكلفة مخزون</Th>
              <Th>سعر البيع</Th>
              <Th>ربح تقديري</Th>
              <Th>قيمة المخزون</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const cost = toNum(item.avgCost);
              const sell = toNum(item.sellPrice);
              const qty = toNum(item.quantity);
              const profit = sell - cost;
              return (
                <tr key={item.id} className={!item.active ? "opacity-50" : ""}>
                  <Td>{item.code}</Td>
                  <Td>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-[var(--muted)]">{item.unit}</div>
                  </Td>
                  <Td>
                    {formatQty(qty)}
                    {qty <= toNum(item.minStock) && (
                      <span className="mr-2 text-xs text-red-600">منخفض</span>
                    )}
                  </Td>
                  <Td>{formatMoney(cost)}</Td>
                  <Td>{formatMoney(sell)}</Td>
                  <Td className={profit >= 0 ? "text-teal-700" : "text-red-600"}>
                    {formatMoney(profit)}
                  </Td>
                  <Td>{formatMoney(qty * cost)}</Td>
                  <Td>
                    <Link
                      href={`/items/${item.id}`}
                      className="text-[var(--accent)] hover:underline"
                    >
                      دفعات / تعديل
                    </Link>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </div>
  );
}
