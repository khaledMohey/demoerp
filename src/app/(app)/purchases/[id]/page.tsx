import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import {
  formatDate,
  formatMoney,
  formatQty,
  PAYMENT_LABELS,
} from "@/lib/format";
import { Card, PageHeader, Table, Td, Th } from "@/components/ui";

export default async function PurchaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["ADMIN", "STORE", "ACCOUNTANT"]);
  const { id } = await params;
  const purchase = await prisma.purchase.findUnique({
    where: { id },
    include: {
      supplier: true,
      bankAccount: true,
      createdBy: true,
      lines: { include: { item: true } },
    },
  });
  if (!purchase) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title={`توريد ${purchase.number}`}
        description={`${formatDate(purchase.date)} · ${purchase.supplier.name}`}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <div className="text-sm text-[var(--muted)]">طريقة الدفع</div>
          <div className="mt-1 font-semibold">
            {PAYMENT_LABELS[purchase.paymentMethod]}
          </div>
        </Card>
        <Card>
          <div className="text-sm text-[var(--muted)]">الإجمالي</div>
          <div className="mt-1 font-semibold">
            {formatMoney(purchase.totalCost)}
          </div>
        </Card>
        <Card>
          <div className="text-sm text-[var(--muted)]">المدفوع</div>
          <div className="mt-1 font-semibold">
            {formatMoney(purchase.paidAmount)}
          </div>
        </Card>
      </div>
      <Table>
        <thead>
          <tr>
            <Th>الصنف</Th>
            <Th>الكمية</Th>
            <Th>سعر الشراء</Th>
            <Th>سعر البيع</Th>
            <Th>إجمالي الشراء</Th>
          </tr>
        </thead>
        <tbody>
          {purchase.lines.map((l) => (
            <tr key={l.id}>
              <Td>
                {l.item.code} — {l.item.name}
              </Td>
              <Td>{formatQty(l.quantity)}</Td>
              <Td>{formatMoney(l.unitCost)}</Td>
              <Td>{formatMoney(l.sellPrice)}</Td>
              <Td>{formatMoney(l.lineTotal)}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
      {purchase.notes && (
        <Card>
          <div className="text-sm text-[var(--muted)]">ملاحظات</div>
          <p className="mt-1">{purchase.notes}</p>
        </Card>
      )}
    </div>
  );
}
