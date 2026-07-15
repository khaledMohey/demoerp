"use server";

import {
  BankTxnType,
  BuyerType,
  LedgerEntryType,
  PartyType,
  PaymentMethod,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { consumeFifo } from "@/lib/inventory";
import { addLedgerEntry } from "@/lib/ledger";
import { round2, toNum } from "@/lib/format";
import { requireRole } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function nextSaleNumber() {
  const count = await prisma.sale.count();
  return `SO-${String(count + 1).padStart(5, "0")}`;
}

export async function createSale(formData: FormData) {
  const session = await requireRole(["ADMIN", "SALES"]);

  const buyerType = String(formData.get("buyerType") || "") as BuyerType;
  const customerId = String(formData.get("customerId") || "") || null;
  const companyId = String(formData.get("companyId") || "") || null;
  const paymentMethod = String(formData.get("paymentMethod") || "") as PaymentMethod;
  const bankAccountId = String(formData.get("bankAccountId") || "") || null;
  const notes = String(formData.get("notes") || "") || null;
  const paidAmountInput = Number(formData.get("paidAmount") || 0);

  if (buyerType === "CUSTOMER" && !customerId) throw new Error("اختر العميل");
  if (buyerType === "COMPANY" && !companyId) throw new Error("اختر الشركة");

  const itemIds = formData.getAll("itemId") as string[];
  const quantities = formData.getAll("quantity") as string[];
  const unitPrices = formData.getAll("unitPrice") as string[];

  const rawLines = itemIds
    .map((itemId, i) => ({
      itemId,
      quantity: Number(quantities[i] || 0),
      unitPrice: Number(unitPrices[i] || 0),
    }))
    .filter((l) => l.itemId && l.quantity > 0);

  if (rawLines.length === 0) throw new Error("أضف أصناف للفاتورة");

  const number = await nextSaleNumber();

  await prisma.$transaction(async (tx) => {
    type BuiltLine = {
      itemId: string;
      quantity: number;
      unitPrice: number;
      unitCost: number;
      lineTotal: number;
      lineCost: number;
      lineProfit: number;
      allocations: {
        batchId: string;
        quantity: number;
        unitCost: number;
        lineCost: number;
      }[];
    };

    const built: BuiltLine[] = [];
    let totalSale = 0;
    let totalCost = 0;

    for (const line of rawLines) {
      const item = await tx.item.findUniqueOrThrow({ where: { id: line.itemId } });
      if (toNum(item.quantity) < line.quantity) {
        throw new Error(`الكمية غير كافية للصنف ${item.name}`);
      }

      const fifo = await consumeFifo(tx, line.itemId, line.quantity);
      const lineTotal = round2(line.quantity * line.unitPrice);
      const lineCost = fifo.totalCost;
      const lineProfit = round2(lineTotal - lineCost);

      built.push({
        itemId: line.itemId,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        unitCost: fifo.unitCost,
        lineTotal,
        lineCost,
        lineProfit,
        allocations: fifo.allocations,
      });
      totalSale += lineTotal;
      totalCost += lineCost;
    }

    totalSale = round2(totalSale);
    totalCost = round2(totalCost);
    const totalProfit = round2(totalSale - totalCost);

    let paidAmount = 0;
    if (paymentMethod === "CASH" || paymentMethod === "INSTA") {
      paidAmount = totalSale;
      if (!bankAccountId) throw new Error("اختر حساب التحصيل");
    } else if (paymentMethod === "PARTIAL") {
      paidAmount = Math.min(Math.max(paidAmountInput, 0), totalSale);
      if (paidAmount > 0 && !bankAccountId) throw new Error("اختر حساب التحصيل");
    } else {
      paidAmount = 0;
    }

    const creditAmount = round2(totalSale - paidAmount);

    const sale = await tx.sale.create({
      data: {
        number,
        buyerType,
        customerId: buyerType === "CUSTOMER" ? customerId : null,
        companyId: buyerType === "COMPANY" ? companyId : null,
        paymentMethod,
        bankAccountId: paidAmount > 0 ? bankAccountId : null,
        totalSale,
        totalCost,
        totalProfit,
        paidAmount,
        notes,
        createdById: session.user.id,
      },
    });

    for (const l of built) {
      const saleLine = await tx.saleLine.create({
        data: {
          saleId: sale.id,
          itemId: l.itemId,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          unitCost: l.unitCost,
          lineTotal: l.lineTotal,
          lineCost: l.lineCost,
          lineProfit: l.lineProfit,
        },
      });
      for (const alloc of l.allocations) {
        await tx.saleAllocation.create({
          data: {
            saleLineId: saleLine.id,
            batchId: alloc.batchId,
            quantity: alloc.quantity,
            unitCost: alloc.unitCost,
            lineCost: alloc.lineCost,
          },
        });
      }
    }

    if (paidAmount > 0 && bankAccountId) {
      const bank = await tx.bankAccount.findUniqueOrThrow({
        where: { id: bankAccountId },
      });
      await tx.bankAccount.update({
        where: { id: bankAccountId },
        data: { balance: toNum(bank.balance) + paidAmount },
      });
      await tx.bankTransaction.create({
        data: {
          bankAccountId,
          type: BankTxnType.SALE_RECEIPT,
          amount: paidAmount,
          reference: number,
          description: `تحصيل بيع ${number}`,
          createdById: session.user.id,
        },
      });
    }

    const partyType =
      buyerType === "CUSTOMER" ? PartyType.CUSTOMER : PartyType.COMPANY;
    const partyId = buyerType === "CUSTOMER" ? customerId! : companyId!;

    if (creditAmount > 0) {
      await addLedgerEntry(tx, {
        partyType,
        partyId,
        type: LedgerEntryType.SALE,
        debit: creditAmount,
        reference: number,
        description: `بيع آجل/جزئي ${number}`,
        createdById: session.user.id,
      });
    } else {
      await addLedgerEntry(tx, {
        partyType,
        partyId,
        type: LedgerEntryType.SALE,
        debit: totalSale,
        credit: totalSale,
        reference: number,
        description: `بيع مدفوع ${number}`,
        createdById: session.user.id,
      });
    }
  });

  revalidatePath("/sales");
  revalidatePath("/items");
  revalidatePath("/customers");
  revalidatePath("/companies");
  revalidatePath("/banks");
  redirect("/sales");
}

export async function receivePartyPayment(formData: FormData) {
  const session = await requireRole(["ADMIN", "ACCOUNTANT", "SALES"]);
  const partyType = String(formData.get("partyType") || "") as PartyType;
  const partyId = String(formData.get("partyId") || "");
  const amount = Number(formData.get("amount") || 0);
  const bankAccountId = String(formData.get("bankAccountId") || "");

  if (
    !partyId ||
    amount <= 0 ||
    !bankAccountId ||
    (partyType !== "CUSTOMER" && partyType !== "COMPANY")
  ) {
    throw new Error("بيانات التحصيل غير مكتملة");
  }

  await prisma.$transaction(async (tx) => {
    const bank = await tx.bankAccount.findUniqueOrThrow({
      where: { id: bankAccountId },
    });
    await tx.bankAccount.update({
      where: { id: bankAccountId },
      data: { balance: toNum(bank.balance) + amount },
    });
    await tx.bankTransaction.create({
      data: {
        bankAccountId,
        type: BankTxnType.CUSTOMER_PAYMENT,
        amount,
        reference: partyId,
        description: `تحصيل من ${partyType === "CUSTOMER" ? "عميل" : "شركة"}`,
        createdById: session.user.id,
      },
    });
    await addLedgerEntry(tx, {
      partyType,
      partyId,
      type: LedgerEntryType.RECEIPT,
      credit: amount,
      reference: bankAccountId,
      description: "تحصيل نقدي/بنكي",
      createdById: session.user.id,
    });
  });

  const path =
    partyType === "CUSTOMER" ? `/customers/${partyId}` : `/companies/${partyId}`;
  revalidatePath(path);
  revalidatePath("/banks");
  redirect(path);
}
