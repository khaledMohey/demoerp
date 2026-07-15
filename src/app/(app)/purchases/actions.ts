"use server";

import {
  BankTxnType,
  LedgerEntryType,
  PartyType,
  PaymentMethod,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { receiveBatch } from "@/lib/inventory";
import { addLedgerEntry } from "@/lib/ledger";
import { round2, toNum } from "@/lib/format";
import { requireRole } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function nextPurchaseNumber() {
  const count = await prisma.purchase.count();
  return `PO-${String(count + 1).padStart(5, "0")}`;
}

export async function createPurchase(formData: FormData) {
  const session = await requireRole(["ADMIN", "STORE"]);

  const supplierId = String(formData.get("supplierId") || "");
  const paymentMethod = String(formData.get("paymentMethod") || "") as PaymentMethod;
  const bankAccountId = String(formData.get("bankAccountId") || "") || null;
  const notes = String(formData.get("notes") || "") || null;
  const paidAmountInput = Number(formData.get("paidAmount") || 0);

  const itemIds = formData.getAll("itemId") as string[];
  const quantities = formData.getAll("quantity") as string[];
  const unitCosts = formData.getAll("unitCost") as string[];
  const sellPrices = formData.getAll("sellPrice") as string[];

  if (!supplierId || itemIds.length === 0) {
    throw new Error("اختر المورد وأضف أصناف");
  }

  const lines = itemIds
    .map((itemId, i) => ({
      itemId,
      quantity: Number(quantities[i] || 0),
      unitCost: Number(unitCosts[i] || 0),
      sellPrice: Number(sellPrices[i] || 0),
    }))
    .filter((l) => l.itemId && l.quantity > 0);

  if (lines.length === 0) throw new Error("أضف سطر توريد واحد على الأقل");

  const totalCost = round2(
    lines.reduce((s, l) => s + l.quantity * l.unitCost, 0)
  );

  let paidAmount = 0;
  if (paymentMethod === "CASH" || paymentMethod === "INSTA") {
    paidAmount = totalCost;
    if (!bankAccountId) throw new Error("اختر حساب الدفع");
  } else if (paymentMethod === "PARTIAL") {
    paidAmount = Math.min(paidAmountInput, totalCost);
    if (paidAmount > 0 && !bankAccountId) throw new Error("اختر حساب الدفع");
  } else {
    paidAmount = 0;
  }

  const creditAmount = round2(totalCost - paidAmount);
  const number = await nextPurchaseNumber();

  await prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.create({
      data: {
        number,
        supplierId,
        paymentMethod,
        bankAccountId: paymentMethod === "CREDIT" ? null : bankAccountId,
        totalCost,
        paidAmount,
        notes,
        createdById: session.user.id,
      },
    });

    for (const l of lines) {
      const pl = await tx.purchaseLine.create({
        data: {
          purchaseId: purchase.id,
          itemId: l.itemId,
          quantity: l.quantity,
          unitCost: l.unitCost,
          sellPrice: l.sellPrice,
          lineTotal: round2(l.quantity * l.unitCost),
        },
      });
      await receiveBatch(tx, {
        itemId: l.itemId,
        quantity: l.quantity,
        unitCost: l.unitCost,
        sellPrice: l.sellPrice,
        supplierId,
        purchaseId: purchase.id,
        purchaseLineId: pl.id,
        receivedAt: purchase.date,
      });
    }

    if (paidAmount > 0 && bankAccountId) {
      const bank = await tx.bankAccount.findUniqueOrThrow({
        where: { id: bankAccountId },
      });
      await tx.bankAccount.update({
        where: { id: bankAccountId },
        data: { balance: toNum(bank.balance) - paidAmount },
      });
      await tx.bankTransaction.create({
        data: {
          bankAccountId,
          type: BankTxnType.PURCHASE_PAYMENT,
          amount: -paidAmount,
          reference: number,
          description: `دفع توريد ${number}`,
          createdById: session.user.id,
        },
      });
    }

    if (creditAmount > 0) {
      await addLedgerEntry(tx, {
        partyType: PartyType.SUPPLIER,
        partyId: supplierId,
        type: LedgerEntryType.PURCHASE,
        credit: creditAmount,
        reference: number,
        description: `توريد آجل ${number}`,
        createdById: session.user.id,
      });
    } else {
      await addLedgerEntry(tx, {
        partyType: PartyType.SUPPLIER,
        partyId: supplierId,
        type: LedgerEntryType.PURCHASE,
        credit: totalCost,
        debit: totalCost,
        reference: number,
        description: `توريد مدفوع ${number}`,
        createdById: session.user.id,
      });
    }
  });

  revalidatePath("/purchases");
  revalidatePath("/items");
  revalidatePath("/suppliers");
  revalidatePath("/banks");
  redirect("/purchases");
}

export async function paySupplier(formData: FormData) {
  const session = await requireRole(["ADMIN", "ACCOUNTANT", "STORE"]);
  const supplierId = String(formData.get("supplierId") || "");
  const amount = Number(formData.get("amount") || 0);
  const bankAccountId = String(formData.get("bankAccountId") || "");
  if (!supplierId || amount <= 0 || !bankAccountId) {
    throw new Error("بيانات الدفع غير مكتملة");
  }

  await prisma.$transaction(async (tx) => {
    const bank = await tx.bankAccount.findUniqueOrThrow({
      where: { id: bankAccountId },
    });
    await tx.bankAccount.update({
      where: { id: bankAccountId },
      data: { balance: toNum(bank.balance) - amount },
    });
    await tx.bankTransaction.create({
      data: {
        bankAccountId,
        type: BankTxnType.SUPPLIER_PAYMENT,
        amount: -amount,
        reference: supplierId,
        description: `سداد مورد`,
        createdById: session.user.id,
      },
    });
    await addLedgerEntry(tx, {
      partyType: PartyType.SUPPLIER,
      partyId: supplierId,
      type: LedgerEntryType.PAYMENT,
      debit: amount,
      reference: bankAccountId,
      description: "سداد للمورد",
      createdById: session.user.id,
    });
  });

  revalidatePath(`/suppliers/${supplierId}`);
  revalidatePath("/suppliers");
  revalidatePath("/banks");
  redirect(`/suppliers/${supplierId}`);
}
