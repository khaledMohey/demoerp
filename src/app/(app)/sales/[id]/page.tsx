import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import {
  BUYER_LABELS,
  formatDate,
  formatMoney,
  formatQty,
  PAYMENT_LABELS,
} from "@/lib/format";
import { Card, PageHeader, Table, Td, Th } from "@/components/ui";

export default async function SaleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["ADMIN", "SALES", "ACCOUNTANT"]);
  const { id } = await params;
  const sale = await prisma.sale.findUnique({
    where: { id },
    include: {
      customer: true,
      company: true,
      bankAccount: true,
      createdBy: true,
      lines: {
        include: {
          item: true,
          allocations: {
            include: { batch: true },
            orderBy: { id: "asc" },
          },
        },
      },
    },
  });
  if (!sale) notFound();

  const buyerName =
    sale.buyerType === "CUSTOMER" ? sale.customer?.name : sale.company?.name;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title={`فاتورة ${sale.number}`}
        description={`${formatDate(sale.date)} · ${BUYER_LABELS[sale.buyerType]}: ${buyerName} · تكلفة محسوبة بـ FIFO`}
      />
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <div className="text-sm text-[var(--muted)]">التحصيل</div>
          <div className="mt-1 font-semibold">
            {PAYMENT_LABELS[sale.paymentMethod]}
          </div>
        </Card>
        <Card>
          <div className="text-sm text-[var(--muted)]">البيع</div>
          <div className="mt-1 font-semibold">{formatMoney(sale.totalSale)}</div>
        </Card>
        <Card>
          <div className="text-sm text-[var(--muted)]">التكلفة (FIFO)</div>
          <div className="mt-1 font-semibold">{formatMoney(sale.totalCost)}</div>
        </Card>
        <Card>
          <div className="text-sm text-[var(--muted)]">الربح</div>
          <div className="mt-1 font-semibold text-teal-700">
            {formatMoney(sale.totalProfit)}
          </div>
        </Card>
      </div>
      <Table>
        <thead>
          <tr>
            <Th>الصنف</Th>
            <Th>الكمية</Th>
            <Th>سعر البيع</Th>
            <Th>تكلفة FIFO</Th>
            <Th>إجمالي البيع</Th>
            <Th>الربح</Th>
          </tr>
        </thead>
        <tbody>
          {sale.lines.map((l) => (
            <tr key={l.id}>
              <Td>
                {l.item.code} — {l.item.name}
                {l.allocations.length > 0 && (
                  <div className="mt-1 space-y-0.5 text-xs text-[var(--muted)]">
                    {l.allocations.map((a) => (
                      <div key={a.id}>
                        من دفعة {formatDate(a.batch.receivedAt)}:{" "}
                        {formatQty(a.quantity)} × {formatMoney(a.unitCost)}
                      </div>
                    ))}
                  </div>
                )}
              </Td>
              <Td>{formatQty(l.quantity)}</Td>
              <Td>{formatMoney(l.unitPrice)}</Td>
              <Td>{formatMoney(l.unitCost)}</Td>
              <Td>{formatMoney(l.lineTotal)}</Td>
              <Td className="text-teal-700">{formatMoney(l.lineProfit)}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
