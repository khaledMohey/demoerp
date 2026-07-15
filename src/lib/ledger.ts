import {
  PartyType,
  LedgerEntryType,
  Prisma,
  type PrismaClient,
} from "@prisma/client";
import { toNum, round2 } from "./format";

type Tx = Prisma.TransactionClient | PrismaClient;

async function getLastBalance(
  tx: Tx,
  partyType: PartyType,
  partyId: string
): Promise<number> {
  const last = await tx.ledgerEntry.findFirst({
    where: { partyType, partyId },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });
  return last ? toNum(last.balance) : 0;
}

async function updatePartyBalance(
  tx: Tx,
  partyType: PartyType,
  partyId: string,
  newBalance: number
) {
  if (partyType === PartyType.SUPPLIER) {
    await tx.supplier.update({
      where: { id: partyId },
      data: { balance: newBalance },
    });
  } else if (partyType === PartyType.CUSTOMER) {
    await tx.customer.update({
      where: { id: partyId },
      data: { balance: newBalance },
    });
  } else {
    await tx.company.update({
      where: { id: partyId },
      data: { balance: newBalance },
    });
  }
}

export async function addLedgerEntry(
  tx: Tx,
  params: {
    partyType: PartyType;
    partyId: string;
    type: LedgerEntryType;
    debit?: number;
    credit?: number;
    reference?: string;
    description?: string;
    date?: Date;
    createdById?: string;
  }
) {
  const debit = round2(params.debit ?? 0);
  const credit = round2(params.credit ?? 0);
  const prev = await getLastBalance(tx, params.partyType, params.partyId);

  // Supplier: credit increases what we owe; Customer/Company: debit increases what they owe
  let balance: number;
  if (params.partyType === PartyType.SUPPLIER) {
    balance = round2(prev + credit - debit);
  } else {
    balance = round2(prev + debit - credit);
  }

  const entry = await tx.ledgerEntry.create({
    data: {
      partyType: params.partyType,
      partyId: params.partyId,
      type: params.type,
      debit,
      credit,
      balance,
      reference: params.reference,
      description: params.description,
      date: params.date ?? new Date(),
      createdById: params.createdById,
    },
  });

  await updatePartyBalance(tx, params.partyType, params.partyId, balance);
  return entry;
}

export async function getPartyLedger(
  partyType: PartyType,
  partyId: string
) {
  const { prisma } = await import("./db");
  return prisma.ledgerEntry.findMany({
    where: { partyType, partyId },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
  });
}
