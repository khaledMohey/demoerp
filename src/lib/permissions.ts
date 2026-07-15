import type { Role } from "@prisma/client";

export type NavItem = {
  href: string;
  label: string;
  roles: Role[] | "ALL";
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "الرئيسية", roles: "ALL" },
  { href: "/items", label: "المخزن / الأصناف", roles: ["ADMIN", "STORE", "SALES", "ACCOUNTANT"] },
  { href: "/purchases", label: "التوريدات", roles: ["ADMIN", "STORE"] },
  { href: "/sales", label: "المبيعات", roles: ["ADMIN", "SALES"] },
  { href: "/suppliers", label: "الموردين", roles: ["ADMIN", "STORE", "ACCOUNTANT"] },
  { href: "/customers", label: "العملاء", roles: ["ADMIN", "SALES", "ACCOUNTANT"] },
  { href: "/companies", label: "الشركات", roles: ["ADMIN", "SALES", "ACCOUNTANT"] },
  { href: "/banks", label: "البنوك والخزنة", roles: ["ADMIN", "ACCOUNTANT"] },
  { href: "/reports", label: "التقارير", roles: ["ADMIN", "ACCOUNTANT", "SALES"] },
  { href: "/users", label: "الموظفين", roles: ["ADMIN"] },
];

export function canAccess(role: Role, href: string): boolean {
  const item = NAV_ITEMS.find((n) => n.href === href);
  if (!item) return role === "ADMIN";
  if (item.roles === "ALL") return true;
  return item.roles.includes(role);
}

export function requireRoles(userRole: Role, allowed: Role[]): boolean {
  return allowed.includes(userRole);
}
