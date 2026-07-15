import { notFound } from "next/navigation";
import { PartyType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { formatDate, formatMoney } from "@/lib/format";
import { paySupplier } from "@/app/(app)/purchases/actions";
import {
  Card,
  EmptyState,
  Input,
  PageHeader,
  Select,
  SubmitButton,
  Table,
  Td,
  Th,
} from "@/components/ui";

export default async function SupplierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["ADMIN", "STORE", "ACCOUNTANT"]);
  const { id } = await params;
  const supplier = await prisma.supplier.findUnique({ where: { id } });
  if (!supplier) notFound();

  const [ledger, banks] = await Promise.all([
    prisma.ledgerEntry.findMany({
      where: { partyType: PartyType.SUPPLIER, partyId: id },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    }),
    prisma.bankAccount.findMany({ where: { active: true } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={supplier.name}
        description={`الرصيد الحالي (مستحق للمورد): ${formatMoney(supplier.balance)}`}
      />

      <Card>
        <h3 className="mb-4 font-semibold">سداد للمورد</h3>
        <form action={paySupplier} className="grid gap-4 sm:grid-cols-3">
          <input type="hidden" name="supplierId" value={supplier.id} />
          <Input label="المبلغ" name="amount" type="number" step="0.01" min="0.01" required />
          <Select label="من حساب" name="bankAccountId" required>
            <option value="">اختر</option>
            {banks.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({formatMoney(b.balance)})
              </option>
            ))}
          </Select>
          <div className="flex items-end">
            <SubmitButton>تسجيل السداد</SubmitButton>
          </div>
        </form>
      </Card>

      {ledger.length === 0 ? (
        <EmptyState message="لا توجد حركات على الكشف." />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>التاريخ</Th>
              <Th>البيان</Th>
              <Th>مرجع</Th>
              <Th>مدين</Th>
              <Th>دائن</Th>
              <Th>الرصيد</Th>
            </tr>
          </thead>
          <tbody>
            {ledger.map((e) => (
              <tr key={e.id}>
                <Td>{formatDate(e.date)}</Td>
                <Td>{e.description}</Td>
                <Td>{e.reference || "—"}</Td>
                <Td>{formatMoney(e.debit)}</Td>
                <Td>{formatMoney(e.credit)}</Td>
                <Td className="font-medium">{formatMoney(e.balance)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
