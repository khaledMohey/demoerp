"use server";

import { BankTxnType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { toNum } from "@/lib/format";
import { requireRole } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createBankAccount(formData: FormData) {
  await requireRole(["ADMIN", "ACCOUNTANT"]);
  const name = String(formData.get("name") || "").trim();
  const type = String(formData.get("type") || "BANK");
  if (!name) throw new Error("الاسم مطلوب");
  await prisma.bankAccount.create({
    data: {
      name,
      type,
      accountNo: String(formData.get("accountNo") || "") || null,
      balance: Number(formData.get("balance") || 0),
    },
  });
  revalidatePath("/banks");
  redirect("/banks");
}

export async function adjustBank(formData: FormData) {
  const session = await requireRole(["ADMIN", "ACCOUNTANT"]);
  const bankAccountId = String(formData.get("bankAccountId") || "");
  const amount = Number(formData.get("amount") || 0);
  const description = String(formData.get("description") || "تسوية") || "تسوية";
  if (!bankAccountId || amount === 0) throw new Error("بيانات غير صحيحة");

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
        type: BankTxnType.ADJUSTMENT,
        amount,
        description,
        createdById: session.user.id,
      },
    });
  });

  revalidatePath("/banks");
  redirect("/banks");
}
