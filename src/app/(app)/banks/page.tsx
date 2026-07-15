import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import {
  BANK_TYPE_LABELS,
  formatDate,
  formatMoney,
  toNum,
} from "@/lib/format";
import {
  ButtonLink,
  Card,
  EmptyState,
  Input,
  PageHeader,
  Select,
  StatCard,
  SubmitButton,
  Table,
  Td,
  Textarea,
  Th,
} from "@/components/ui";
import { adjustBank } from "./actions";

export default async function BanksPage() {
  await requireRole(["ADMIN", "ACCOUNTANT"]);
  const [accounts, txns] = await Promise.all([
    prisma.bankAccount.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    }),
    prisma.bankTransaction.findMany({
      orderBy: { date: "desc" },
      include: { bankAccount: true, createdBy: true },
      take: 50,
    }),
  ]);

  const total = accounts.reduce((s, a) => s + toNum(a.balance), 0);

  return (
    <div className="space-y-8">
      <PageHeader
        title="البنوك والخزنة"
        description="أرصدة وحركات الكاش والبنوك وإنستا باي"
        action={<ButtonLink href="/banks/new">حساب جديد</ButtonLink>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="إجمالي الأرصدة" value={formatMoney(total)} />
        {accounts.map((a) => (
          <StatCard
            key={a.id}
            label={`${a.name} (${BANK_TYPE_LABELS[a.type] || a.type})`}
            value={formatMoney(a.balance)}
          />
        ))}
      </div>

      <Card>
        <h3 className="mb-4 font-semibold">تسوية / إيداع / سحب</h3>
        <form action={adjustBank} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Select label="الحساب" name="bankAccountId" required>
            <option value="">اختر</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
          <Input
            label="المبلغ (+ إيداع / − سحب)"
            name="amount"
            type="number"
            step="0.01"
            required
          />
          <div className="sm:col-span-2 lg:col-span-1">
            <Textarea label="البيان" name="description" rows={1} />
          </div>
          <div className="flex items-end">
            <SubmitButton>تسجيل</SubmitButton>
          </div>
        </form>
      </Card>

      <div>
        <h3 className="mb-3 text-lg font-semibold">آخر الحركات</h3>
        {txns.length === 0 ? (
          <EmptyState message="لا توجد حركات بنكية." />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>التاريخ</Th>
                <Th>الحساب</Th>
                <Th>النوع</Th>
                <Th>البيان</Th>
                <Th>المبلغ</Th>
              </tr>
            </thead>
            <tbody>
              {txns.map((t) => (
                <tr key={t.id}>
                  <Td>{formatDate(t.date)}</Td>
                  <Td>{t.bankAccount.name}</Td>
                  <Td>{t.type}</Td>
                  <Td>{t.description || "—"}</Td>
                  <Td
                    className={
                      toNum(t.amount) >= 0 ? "text-teal-700" : "text-red-600"
                    }
                  >
                    {formatMoney(t.amount)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>
      <p className="text-sm text-[var(--muted)]">
        <Link href="/banks/new" className="text-[var(--accent)] hover:underline">
          إضافة حساب بنكي أو خزنة
        </Link>
      </p>
    </div>
  );
}
