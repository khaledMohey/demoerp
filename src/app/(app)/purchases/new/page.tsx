import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { toNum } from "@/lib/format";
import { PageHeader } from "@/components/ui";
import { PurchaseForm } from "../purchase-form";

export default async function NewPurchasePage() {
  await requireRole(["ADMIN", "STORE"]);
  const [items, suppliers, banks] = await Promise.all([
    prisma.item.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.supplier.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.bankAccount.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="توريد للمخزن (FIFO)"
        description="كل وارد يُحفظ كدفعة بسعر شرائها وبيعها — الخصم عند البيع من الأقدم أولاً"
      />
      <PurchaseForm
        items={items.map((i) => ({
          id: i.id,
          code: i.code,
          name: i.name,
          avgCost: toNum(i.avgCost),
          sellPrice: toNum(i.sellPrice),
        }))}
        suppliers={suppliers.map((s) => ({ id: s.id, name: s.name }))}
        banks={banks.map((b) => ({ id: b.id, name: b.name, type: b.type }))}
      />
    </div>
  );
}
