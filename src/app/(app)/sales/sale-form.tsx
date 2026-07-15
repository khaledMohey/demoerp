"use client";

import { useMemo, useState } from "react";
import { createSale } from "./actions";
import { Card, Input, Select, SubmitButton, Textarea } from "@/components/ui";

type ItemOpt = {
  id: string;
  code: string;
  name: string;
  sellPrice: number;
  quantity: number;
};
type Party = { id: string; name: string };
type BankOpt = { id: string; name: string; type: string };
type Line = { key: string; itemId: string; quantity: string; unitPrice: string };

export function SaleForm({
  items,
  customers,
  companies,
  banks,
}: {
  items: ItemOpt[];
  customers: Party[];
  companies: Party[];
  banks: BankOpt[];
}) {
  const [buyerType, setBuyerType] = useState<"CUSTOMER" | "COMPANY">("CUSTOMER");
  const [method, setMethod] = useState("CASH");
  const [lines, setLines] = useState<Line[]>([
    { key: "1", itemId: "", quantity: "1", unitPrice: "0" },
  ]);

  function addLine() {
    setLines((prev) => [
      ...prev,
      { key: String(Date.now()), itemId: "", quantity: "1", unitPrice: "0" },
    ]);
  }

  function updateLine(key: string, patch: Partial<Line>) {
    setLines((prev) =>
      prev.map((l) => {
        if (l.key !== key) return l;
        const next = { ...l, ...patch };
        if (patch.itemId) {
          const item = items.find((i) => i.id === patch.itemId);
          if (item) next.unitPrice = String(item.sellPrice || 0);
        }
        return next;
      })
    );
  }

  const total = useMemo(
    () =>
      lines.reduce(
        (s, l) => s + Number(l.quantity || 0) * Number(l.unitPrice || 0),
        0
      ),
    [lines]
  );

  const cashBanks = banks.filter((b) => b.type === "CASH");
  const instaBanks = banks.filter((b) => b.type === "INSTA" || b.type === "BANK");
  const paymentBanks =
    method === "CASH" ? cashBanks : method === "INSTA" ? instaBanks : banks;

  return (
    <Card>
      <form action={createSale} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">نوع المشتري</span>
            <select
              name="buyerType"
              value={buyerType}
              onChange={(e) =>
                setBuyerType(e.target.value as "CUSTOMER" | "COMPANY")
              }
              className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
            >
              <option value="CUSTOMER">عميل</option>
              <option value="COMPANY">شركة</option>
            </select>
          </label>

          {buyerType === "CUSTOMER" ? (
            <Select label="العميل" name="customerId" required>
              <option value="">اختر العميل</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          ) : (
            <Select label="الشركة" name="companyId" required>
              <option value="">اختر الشركة</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          )}

          <label className="block space-y-1.5">
            <span className="text-sm font-medium">طريقة التحصيل</span>
            <select
              name="paymentMethod"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
            >
              <option value="CASH">كاش</option>
              <option value="INSTA">إنستا باي</option>
              <option value="CREDIT">آجل</option>
              <option value="PARTIAL">جزئي</option>
            </select>
          </label>

          {method !== "CREDIT" && (
            <Select label="حساب التحصيل" name="bankAccountId">
              <option value="">اختر الحساب</option>
              {paymentBanks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          )}

          {method === "PARTIAL" && (
            <Input
              label="المبلغ المحصّل الآن"
              name="paidAmount"
              type="number"
              step="0.01"
              min="0"
              defaultValue="0"
            />
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">أصناف الفاتورة</h3>
            <button
              type="button"
              onClick={addLine}
              className="text-sm text-[var(--accent)] hover:underline"
            >
              + سطر
            </button>
          </div>
          {lines.map((line) => {
            const item = items.find((i) => i.id === line.itemId);
            return (
              <div
                key={line.key}
                className="grid gap-3 rounded-lg border border-[var(--border)] p-3 sm:grid-cols-3"
              >
                <label className="block space-y-1 text-sm">
                  <span>الصنف</span>
                  <select
                    name="itemId"
                    required
                    value={line.itemId}
                    onChange={(e) =>
                      updateLine(line.key, { itemId: e.target.value })
                    }
                    className="w-full rounded-lg border border-[var(--border)] px-3 py-2"
                  >
                    <option value="">اختر</option>
                    {items.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.code} — {i.name} (متاح: {i.quantity})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-1 text-sm">
                  <span>الكمية{item ? ` / أقصى ${item.quantity}` : ""}</span>
                  <input
                    name="quantity"
                    type="number"
                    step="0.001"
                    min="0.001"
                    max={item?.quantity}
                    required
                    value={line.quantity}
                    onChange={(e) =>
                      updateLine(line.key, { quantity: e.target.value })
                    }
                    className="w-full rounded-lg border border-[var(--border)] px-3 py-2"
                  />
                </label>
                <label className="block space-y-1 text-sm">
                  <span>سعر البيع</span>
                  <input
                    name="unitPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={line.unitPrice}
                    onChange={(e) =>
                      updateLine(line.key, { unitPrice: e.target.value })
                    }
                    className="w-full rounded-lg border border-[var(--border)] px-3 py-2"
                  />
                </label>
              </div>
            );
          })}
        </div>

        <Textarea label="ملاحظات" name="notes" />
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold">
            الإجمالي:{" "}
            {total.toLocaleString("ar-EG", {
              style: "currency",
              currency: "EGP",
            })}
          </div>
          <SubmitButton>حفظ الفاتورة</SubmitButton>
        </div>
      </form>
    </Card>
  );
}
