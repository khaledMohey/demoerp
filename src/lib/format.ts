export function toNum(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") return Number(value) || 0;
  if (typeof value === "object" && value !== null && "toString" in value) {
    return Number(String(value)) || 0;
  }
  return 0;
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function round4(n: number): number {
  return Math.round((n + Number.EPSILON) * 10000) / 10000;
}

export function formatMoney(value: unknown): string {
  const n = toNum(value);
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 2,
  }).format(n);
}

export function formatQty(value: unknown): string {
  const n = toNum(value);
  return new Intl.NumberFormat("ar-EG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(n);
}

export function formatDate(d: Date | string): string {
  return new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(d));
}

export const PAYMENT_LABELS: Record<string, string> = {
  CASH: "كاش",
  INSTA: "إنستا باي",
  CREDIT: "آجل",
  PARTIAL: "جزئي",
};

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "مدير",
  STORE: "مخازن",
  SALES: "مبيعات",
  ACCOUNTANT: "محاسب",
};

export const BUYER_LABELS: Record<string, string> = {
  CUSTOMER: "عميل",
  COMPANY: "شركة",
};

export const BANK_TYPE_LABELS: Record<string, string> = {
  CASH: "خزنة",
  BANK: "بنك",
  INSTA: "إنستا باي",
};
