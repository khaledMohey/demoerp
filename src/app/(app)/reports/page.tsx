import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { formatMoney, formatQty, toNum } from "@/lib/format";
import {
  Card,
  PageHeader,
  StatCard,
  Table,
  Td,
  Th,
} from "@/components/ui";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  await requireRole(["ADMIN", "ACCOUNTANT", "SALES"]);
  const sp = await searchParams;
  const from = sp.from ? new Date(sp.from) : new Date(new Date().getFullYear(), 0, 1);
  const to = sp.to ? new Date(sp.to) : new Date();
  to.setHours(23, 59, 59, 999);

  const dateFilter = { gte: from, lte: to };

  const [salesAgg, purchasesAgg, saleLines, items, banks] = await Promise.all([
    prisma.sale.aggregate({
      where: { date: dateFilter },
      _sum: { totalSale: true, totalCost: true, totalProfit: true },
      _count: true,
    }),
    prisma.purchase.aggregate({
      where: { date: dateFilter },
      _sum: { totalCost: true },
      _count: true,
    }),
    prisma.saleLine.findMany({
      where: { sale: { date: dateFilter } },
      include: { item: true },
    }),
    prisma.item.findMany({ where: { active: true } }),
    prisma.bankAccount.findMany({ where: { active: true } }),
  ]);

  const itemProfitMap = new Map<
    string,
    { name: string; code: string; qty: number; revenue: number; cost: number; profit: number }
  >();

  for (const line of saleLines) {
    const cur = itemProfitMap.get(line.itemId) || {
      name: line.item.name,
      code: line.item.code,
      qty: 0,
      revenue: 0,
      cost: 0,
      profit: 0,
    };
    cur.qty += toNum(line.quantity);
    cur.revenue += toNum(line.lineTotal);
    cur.cost += toNum(line.lineCost);
    cur.profit += toNum(line.lineProfit);
    itemProfitMap.set(line.itemId, cur);
  }

  const itemProfits = Array.from(itemProfitMap.values()).sort(
    (a, b) => b.profit - a.profit
  );

  const stockValue = items.reduce(
    (s, i) => s + toNum(i.quantity) * toNum(i.avgCost),
    0
  );
  const bankTotal = banks.reduce((s, b) => s + toNum(b.balance), 0);

  const fromStr = from.toISOString().slice(0, 10);
  const toStr = to.toISOString().slice(0, 10);

  return (
    <div className="space-y-8">
      <PageHeader
        title="التقارير"
        description="الربح وربح الأصناف والمخزون والملخص المالي"
      />

      <Card>
        <form className="flex flex-wrap items-end gap-4">
          <label className="space-y-1 text-sm">
            <span>من</span>
            <input
              type="date"
              name="from"
              defaultValue={fromStr}
              className="block rounded-lg border border-[var(--border)] px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span>إلى</span>
            <input
              type="date"
              name="to"
              defaultValue={toStr}
              className="block rounded-lg border border-[var(--border)] px-3 py-2"
            />
          </label>
          <button
            type="submit"
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm text-white"
          >
            تطبيق
          </button>
        </form>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="إجمالي البيع"
          value={formatMoney(salesAgg._sum.totalSale)}
          hint={`${salesAgg._count} فاتورة`}
        />
        <StatCard
          label="إجمالي التكلفة"
          value={formatMoney(salesAgg._sum.totalCost)}
        />
        <StatCard
          label="صافي الربح"
          value={formatMoney(salesAgg._sum.totalProfit)}
        />
        <StatCard
          label="إجمالي التوريدات"
          value={formatMoney(purchasesAgg._sum.totalCost)}
          hint={`${purchasesAgg._count} توريد`}
        />
        <StatCard label="قيمة المخزون الحالية" value={formatMoney(stockValue)} />
        <StatCard label="أرصدة البنوك والخزنة" value={formatMoney(bankTotal)} />
      </div>

      <div>
        <h3 className="mb-3 text-lg font-semibold">ربح الأصناف</h3>
        {itemProfits.length === 0 ? (
          <Card>لا مبيعات في الفترة المحددة.</Card>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>الصنف</Th>
                <Th>الكمية المباعة</Th>
                <Th>الإيراد</Th>
                <Th>التكلفة</Th>
                <Th>الربح</Th>
              </tr>
            </thead>
            <tbody>
              {itemProfits.map((row) => (
                <tr key={row.code}>
                  <Td>
                    <div className="font-medium">{row.name}</div>
                    <div className="text-xs text-[var(--muted)]">{row.code}</div>
                  </Td>
                  <Td>{formatQty(row.qty)}</Td>
                  <Td>{formatMoney(row.revenue)}</Td>
                  <Td>{formatMoney(row.cost)}</Td>
                  <Td className="font-semibold text-teal-700">
                    {formatMoney(row.profit)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>

      <div>
        <h3 className="mb-3 text-lg font-semibold">المخزون الحالي</h3>
        <Table>
          <thead>
            <tr>
              <Th>الصنف</Th>
              <Th>الكمية</Th>
              <Th>متوسط التكلفة</Th>
              <Th>سعر البيع</Th>
              <Th>قيمة المخزون</Th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id}>
                <Td>
                  {i.code} — {i.name}
                </Td>
                <Td>{formatQty(i.quantity)}</Td>
                <Td>{formatMoney(i.avgCost)}</Td>
                <Td>{formatMoney(i.sellPrice)}</Td>
                <Td>
                  {formatMoney(toNum(i.quantity) * toNum(i.avgCost))}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
}
