import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { updateItem } from "../actions";
import {
  Card,
  EmptyState,
  Input,
  PageHeader,
  SubmitButton,
  Table,
  Td,
  Textarea,
  Th,
} from "@/components/ui";
import { formatDate, formatMoney, formatQty, toNum } from "@/lib/format";

export default async function EditItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["ADMIN", "STORE"]);
  const { id } = await params;
  const item = await prisma.item.findUnique({
    where: { id },
    include: {
      batches: {
        include: { supplier: true, purchase: true },
        orderBy: [{ receivedAt: "asc" }, { createdAt: "asc" }],
      },
    },
  });
  if (!item) notFound();

  const update = updateItem.bind(null, item.id);
  const stockValue = item.batches.reduce(
    (s, b) => s + toNum(b.remaining) * toNum(b.unitCost),
    0
  );
  const openBatches = item.batches.filter((b) => toNum(b.remaining) > 0);
  const nextFifoCost =
    openBatches.length > 0 ? toNum(openBatches[0].unitCost) : toNum(item.avgCost);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title={item.name}
        description={`الكمية: ${formatQty(item.quantity)} · قيمة المخزون (FIFO): ${formatMoney(stockValue)} · تكلفة الدفعة التالية للبيع: ${formatMoney(nextFifoCost)}`}
      />

      <Card>
        <form action={update} className="grid gap-4 sm:grid-cols-2">
          <Input label="الكود" name="code" required defaultValue={item.code} />
          <Input label="الاسم" name="name" required defaultValue={item.name} />
          <Input label="الوحدة" name="unit" defaultValue={item.unit} />
          <Input
            label="سعر البيع الافتراضي"
            name="sellPrice"
            type="number"
            step="0.01"
            defaultValue={toNum(item.sellPrice)}
          />
          <Input
            label="الحد الأدنى"
            name="minStock"
            type="number"
            step="0.001"
            defaultValue={toNum(item.minStock)}
          />
          <label className="flex items-end gap-2 pb-2 text-sm">
            <input
              type="checkbox"
              name="active"
              defaultChecked={item.active}
              className="size-4"
            />
            نشط
          </label>
          <div className="sm:col-span-2">
            <Textarea
              label="الوصف"
              name="description"
              defaultValue={item.description ?? ""}
            />
          </div>
          <div className="sm:col-span-2">
            <SubmitButton>حفظ التعديلات</SubmitButton>
          </div>
        </form>
      </Card>

      <div>
        <h3 className="mb-3 text-lg font-semibold">دفعات المخزن (FIFO)</h3>
        <p className="mb-3 text-sm text-[var(--muted)]">
          البيع يخصم من الصف الأقدم أولاً بسعر شراء تلك الدفعة.
        </p>
        {item.batches.length === 0 ? (
          <EmptyState message="لا توجد دفعات — أضف توريداً من الموردين." />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>تاريخ الدخول</Th>
                <Th>المورد / التوريد</Th>
                <Th>الكمية الأصلية</Th>
                <Th>المتبقي</Th>
                <Th>سعر الشراء</Th>
                <Th>سعر البيع</Th>
                <Th>قيمة المتبقي</Th>
              </tr>
            </thead>
            <tbody>
              {item.batches.map((b, idx) => {
                const rem = toNum(b.remaining);
                const isNext = rem > 0 && idx === item.batches.findIndex((x) => toNum(x.remaining) > 0);
                return (
                  <tr
                    key={b.id}
                    className={rem <= 0 ? "opacity-40" : isNext ? "bg-teal-50" : ""}
                  >
                    <Td>
                      {formatDate(b.receivedAt)}
                      {isNext && (
                        <span className="mr-2 text-xs font-semibold text-teal-700">
                          التالي للخصم
                        </span>
                      )}
                    </Td>
                    <Td>
                      <div>{b.supplier?.name || "—"}</div>
                      <div className="text-xs text-[var(--muted)]">
                        {b.purchase?.number || "—"}
                      </div>
                    </Td>
                    <Td>{formatQty(b.quantity)}</Td>
                    <Td className="font-medium">{formatQty(rem)}</Td>
                    <Td>{formatMoney(b.unitCost)}</Td>
                    <Td>{formatMoney(b.sellPrice)}</Td>
                    <Td>{formatMoney(rem * toNum(b.unitCost))}</Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </div>
    </div>
  );
}
