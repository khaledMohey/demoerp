import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { toNum } from "@/lib/format";
import { PageHeader } from "@/components/ui";
import { SaleForm } from "../sale-form";

export default async function NewSalePage() {
  await requireRole(["ADMIN", "SALES"]);
  const [items, customers, companies, banks] = await Promise.all([
    prisma.item.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.customer.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.company.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.bankAccount.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="فاتورة بيع"
        description="اختر عميل أو شركة وطريقة التحصيل"
      />
      <SaleForm
        items={items.map((i) => ({
          id: i.id,
          code: i.code,
          name: i.name,
          sellPrice: toNum(i.sellPrice),
          quantity: toNum(i.quantity),
        }))}
        customers={customers.map((c) => ({ id: c.id, name: c.name }))}
        companies={companies.map((c) => ({ id: c.id, name: c.name }))}
        banks={banks.map((b) => ({ id: b.id, name: b.name, type: b.type }))}
      />
    </div>
  );
}
