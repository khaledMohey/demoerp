import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import {
  BUYER_LABELS,
  formatDate,
  formatMoney,
  PAYMENT_LABELS,
} from "@/lib/format";
import {
  ButtonLink,
  EmptyState,
  PageHeader,
  Table,
  Td,
  Th,
} from "@/components/ui";

export default async function SalesPage() {
  await requireRole(["ADMIN", "SALES"]);
  const sales = await prisma.sale.findMany({
    orderBy: { date: "desc" },
    include: { customer: true, company: true, createdBy: true },
    take: 100,
  });

  return (
    <div>
      <PageHeader
        title="المبيعات"
        description="فواتير البيع لعملاء أو شركات"
        action={<ButtonLink href="/sales/new">فاتورة جديدة</ButtonLink>}
      />
      {sales.length === 0 ? (
        <EmptyState message="لا توجد فواتير بعد." />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>الرقم</Th>
              <Th>التاريخ</Th>
              <Th>المشتري</Th>
              <Th>الدفع</Th>
              <Th>البيع</Th>
              <Th>التكلفة</Th>
              <Th>الربح</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr key={s.id}>
                <Td className="font-medium">{s.number}</Td>
                <Td>{formatDate(s.date)}</Td>
                <Td>
                  <div>{BUYER_LABELS[s.buyerType]}</div>
                  <div className="text-xs text-[var(--muted)]">
                    {s.buyerType === "CUSTOMER"
                      ? s.customer?.name
                      : s.company?.name}
                  </div>
                </Td>
                <Td>{PAYMENT_LABELS[s.paymentMethod]}</Td>
                <Td>{formatMoney(s.totalSale)}</Td>
                <Td>{formatMoney(s.totalCost)}</Td>
                <Td className="font-semibold text-teal-700">
                  {formatMoney(s.totalProfit)}
                </Td>
                <Td>
                  <Link
                    href={`/sales/${s.id}`}
                    className="text-[var(--accent)] hover:underline"
                  >
                    عرض
                  </Link>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
