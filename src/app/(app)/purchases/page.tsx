import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import {
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

export default async function PurchasesPage() {
  await requireRole(["ADMIN", "STORE"]);
  const purchases = await prisma.purchase.findMany({
    orderBy: { date: "desc" },
    include: { supplier: true, createdBy: true },
    take: 100,
  });

  return (
    <div>
      <PageHeader
        title="التوريدات"
        description="استلام مخزون من الموردين"
        action={<ButtonLink href="/purchases/new">توريد جديد</ButtonLink>}
      />
      {purchases.length === 0 ? (
        <EmptyState message="لا توجد توريدات بعد." />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>الرقم</Th>
              <Th>التاريخ</Th>
              <Th>المورد</Th>
              <Th>الدفع</Th>
              <Th>الإجمالي</Th>
              <Th>المدفوع</Th>
              <Th>بواسطة</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {purchases.map((p) => (
              <tr key={p.id}>
                <Td className="font-medium">{p.number}</Td>
                <Td>{formatDate(p.date)}</Td>
                <Td>{p.supplier.name}</Td>
                <Td>{PAYMENT_LABELS[p.paymentMethod]}</Td>
                <Td>{formatMoney(p.totalCost)}</Td>
                <Td>{formatMoney(p.paidAmount)}</Td>
                <Td>{p.createdBy.name}</Td>
                <Td>
                  <Link
                    href={`/purchases/${p.id}`}
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
