"use client";

import { useState } from "react";
import { createPurchase } from "./actions";
import { Card, Input, Select, SubmitButton, Textarea } from "@/components/ui";

type ItemOpt = {
  id: string;
  code: string;
  name: string;
  avgCost: number;
  sellPrice: number;
};
type SupplierOpt = { id: string; name: string };
type BankOpt = { id: string; name: string; type: string };

type Line = {
  key: string;
  itemId: string;
  quantity: string;
  unitCost: string;
  sellPrice: string;
};

export function PurchaseForm({
  items,
  suppliers,
  banks,
}: {
  items: ItemOpt[];
  suppliers: SupplierOpt[];
  banks: BankOpt[];
}) {
  const [method, setMethod] = useState("CASH");
  const [lines, setLines] = useState<Line[]>([
    { key: "1", itemId: "", quantity: "1", unitCost: "0", sellPrice: "0" },
  ]);

  function addLine() {
    setLines((prev) => [
      ...prev,
      {
        key: String(Date.now()),
        itemId: "",
        quantity: "1",
        unitCost: "0",
        sellPrice: "0",
      },
    ]);
  }

  function updateLine(key: string, patch: Partial<Line>) {
    setLines((prev) =>
      prev.map((l) => {
        if (l.key !== key) return l;
        const next = { ...l, ...patch };
        if (patch.itemId) {
          const item = items.find((i) => i.id === patch.itemId);
          if (item) {
            next.unitCost = String(item.avgCost || 0);
            next.sellPrice = String(item.sellPrice || 0);
          }
        }
        return next;
      })
    );
  }

  const total = lines.reduce(
    (s, l) => s + Number(l.quantity || 0) * Number(l.unitCost || 0),
    0
  );

  const cashBanks = banks.filter((b) => b.type === "CASH");
  const instaBanks = banks.filter((b) => b.type === "INSTA" || b.type === "BANK");
  const paymentBanks =
    method === "CASH" ? cashBanks : method === "INSTA" ? instaBanks : banks;

  return (
    <Card>
      <form action={createPurchase} className="space-y-6">
        <p className="rounded-lg bg-[var(--surface)] px-3 py-2 text-sm text-[var(--muted)]">
          كل توريد يُحفظ كدفعة منفصلة بسعر شرائها. عند البيع يُخصم بنظام{" "}
          <strong className="text-[var(--fg)]">FIFO</strong> من الدفعات الأقدم أولاً.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="المورد" name="supplierId" required defaultValue="">
            <option value="" disabled>
              اختر المورد
            </option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">طريقة الدفع</span>
            <select
              name="paymentMethod"
              required
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none ring-[var(--accent)] focus:ring-2"
            >
              <option value="CASH">كاش</option>
              <option value="INSTA">إنستا باي</option>
              <option value="CREDIT">آجل</option>
              <option value="PARTIAL">جزئي</option>
            </select>
          </label>
          {method !== "CREDIT" && (
            <Select
              label="حساب الدفع"
              name="bankAccountId"
              required={method !== "CREDIT"}
            >
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
              label="المبلغ المدفوع الآن"
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
            <h3 className="font-semibold">دفعات التوريد للمخزن</h3>
            <button
              type="button"
              onClick={addLine}
              className="text-sm text-[var(--accent)] hover:underline"
            >
              + دفعة
            </button>
          </div>
          {lines.map((line) => (
            <div
              key={line.key}
              className="grid gap-3 rounded-lg border border-[var(--border)] p-3 sm:grid-cols-2 lg:grid-cols-4"
            >
              <label className="block space-y-1 text-sm">
                <span>الصنف</span>
                <select
                  name="itemId"
                  required
                  value={line.itemId}
                  onChange={(e) => updateLine(line.key, { itemId: e.target.value })}
                  className="w-full rounded-lg border border-[var(--border)] px-3 py-2"
                >
                  <option value="">اختر</option>
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.code} — {i.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1 text-sm">
                <span>الكمية</span>
                <input
                  name="quantity"
                  type="number"
                  step="0.001"
                  min="0.001"
                  required
                  value={line.quantity}
                  onChange={(e) =>
                    updateLine(line.key, { quantity: e.target.value })
                  }
                  className="w-full rounded-lg border border-[var(--border)] px-3 py-2"
                />
              </label>
              <label className="block space-y-1 text-sm">
                <span>سعر الشراء (للوحدة)</span>
                <input
                  name="unitCost"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={line.unitCost}
                  onChange={(e) =>
                    updateLine(line.key, { unitCost: e.target.value })
                  }
                  className="w-full rounded-lg border border-[var(--border)] px-3 py-2"
                />
              </label>
              <label className="block space-y-1 text-sm">
                <span>سعر البيع (للوحدة)</span>
                <input
                  name="sellPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={line.sellPrice}
                  onChange={(e) =>
                    updateLine(line.key, { sellPrice: e.target.value })
                  }
                  className="w-full rounded-lg border border-[var(--border)] px-3 py-2"
                />
              </label>
            </div>
          ))}
        </div>

        <Textarea label="ملاحظات" name="notes" />
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold">
            إجمالي الشراء:{" "}
            {total.toLocaleString("ar-EG", {
              style: "currency",
              currency: "EGP",
            })}
          </div>
          <SubmitButton>إدخال للمخزن</SubmitButton>
        </div>
      </form>
    </Card>
  );
}
