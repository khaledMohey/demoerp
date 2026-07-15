import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { formatMoney, toNum } from "@/lib/format";
import { PageHeader, StatCard } from "@/components/ui";
import Link from "next/link";

export default async function DashboardPage() {
  await requireAuth();

  const [items, salesAgg, purchaseAgg, suppliers, customers, companies, banks] =
    await Promise.all([
      prisma.item.findMany({ where: { active: true } }),
      prisma.sale.aggregate({
        _sum: { totalSale: true, totalCost: true, totalProfit: true },
        _count: true,
      }),
      prisma.purchase.aggregate({
        _sum: { totalCost: true },
        _count: true,
      }),
      prisma.supplier.count({ where: { active: true } }),
      prisma.customer.count({ where: { active: true } }),
      prisma.company.count({ where: { active: true } }),
      prisma.bankAccount.findMany({ where: { active: true } }),
    ]);

  const stockValue = items.reduce(
    (s, i) => s + toNum(i.quantity) * toNum(i.avgCost),
    0
  );
  const lowStock = items.filter((i) => toNum(i.quantity) <= toNum(i.minStock));
  const bankTotal = banks.reduce((s, b) => s + toNum(b.balance), 0);

  return (
    <div>
      <PageHeader
        title="لوحة التحكم"
        description="ملخص سريع للمخزون والمبيعات والأرباح"
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="قيمة المخزون" value={formatMoney(stockValue)} />
        <StatCard
          label="إجمالي المبيعات"
          value={formatMoney(salesAgg._sum.totalSale)}
          hint={`${salesAgg._count} فاتورة`}
        />
        <StatCard
          label="إجمالي التكلفة (مبيعات)"
          value={formatMoney(salesAgg._sum.totalCost)}
        />
        <StatCard
          label="إجمالي الربح"
          value={formatMoney(salesAgg._sum.totalProfit)}
        />
        <StatCard
          label="إجمالي التوريدات"
          value={formatMoney(purchaseAgg._sum.totalCost)}
          hint={`${purchaseAgg._count} توريد`}
        />
        <StatCard label="أرصدة البنوك والخزنة" value={formatMoney(bankTotal)} />
        <StatCard
          label="أطراف التعامل"
          value={`${suppliers + customers + companies}`}
          hint={`${suppliers} مورد · ${customers} عميل · ${companies} شركة`}
        />
        <StatCard
          label="أصناف منخفضة"
          value={String(lowStock.length)}
          hint="أقل من أو يساوي الحد الأدنى"
        />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <QuickLink href="/purchases/new" label="توريد مخزون جديد" />
        <QuickLink href="/sales/new" label="فاتورة بيع جديدة" />
        <QuickLink href="/reports" label="عرض التقارير" />
      </div>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-[var(--border)] bg-white px-5 py-6 text-center font-semibold text-[var(--accent)] shadow-sm transition hover:border-[var(--accent)]"
    >
      {label}
    </Link>
  );
}
