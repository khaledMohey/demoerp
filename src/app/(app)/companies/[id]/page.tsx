import { notFound } from "next/navigation";
import { PartyType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { formatDate, formatMoney } from "@/lib/format";
import { receivePartyPayment } from "@/app/(app)/sales/actions";
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

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["ADMIN", "SALES", "ACCOUNTANT"]);
  const { id } = await params;
  const company = await prisma.company.findUnique({ where: { id } });
  if (!company) notFound();

  const [ledger, banks] = await Promise.all([
    prisma.ledgerEntry.findMany({
      where: { partyType: PartyType.COMPANY, partyId: id },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    }),
    prisma.bankAccount.findMany({ where: { active: true } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={company.name}
        description={`الرصيد المستحق على الشركة: ${formatMoney(company.balance)}`}
      />

      <Card>
        <h3 className="mb-4 font-semibold">تحصيل من الشركة</h3>
        <form action={receivePartyPayment} className="grid gap-4 sm:grid-cols-3">
          <input type="hidden" name="partyType" value="COMPANY" />
          <input type="hidden" name="partyId" value={company.id} />
          <Input label="المبلغ" name="amount" type="number" step="0.01" min="0.01" required />
          <Select label="إلى حساب" name="bankAccountId" required>
            <option value="">اختر</option>
            {banks.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
          <div className="flex items-end">
            <SubmitButton>تسجيل التحصيل</SubmitButton>
          </div>
        </form>
      </Card>

      {ledger.length === 0 ? (
        <EmptyState message="لا توجد حركات." />
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
