"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/permissions";
import type { Role } from "@prisma/client";

export function Sidebar({
  role,
  name,
  open,
  onClose,
}: {
  role: Role;
  name: string;
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter(
    (item) => item.roles === "ALL" || item.roles.includes(role)
  );

  return (
    <aside
      className={`fixed inset-y-0 right-0 z-50 flex w-[min(85vw,16rem)] shrink-0 flex-col border-l border-[var(--border)] bg-[var(--sidebar)] text-[var(--sidebar-fg)] transition-transform duration-300 ease-out lg:static lg:z-auto lg:w-64 lg:translate-x-0 ${
        open ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      }`}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
        <div>
          <div className="text-xl font-bold tracking-tight text-white">DemoERP</div>
          <div className="mt-1 text-sm text-teal-200/80">بيع وتوريدات</div>
        </div>
        <button
          type="button"
          aria-label="إغلاق القائمة"
          onClick={onClose}
          className="rounded-lg p-1.5 text-teal-100 hover:bg-white/10 lg:hidden"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="size-5"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`block rounded-lg px-3 py-2.5 text-sm transition ${
                active
                  ? "bg-teal-500/20 font-semibold text-white"
                  : "text-teal-100/80 hover:bg-white/5 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
        <a
          href="/guides/دليل-استخدام-DemoERP.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 block rounded-lg px-3 py-2.5 text-sm text-teal-100/80 hover:bg-white/5 hover:text-white"
        >
          دليل الاستخدام (PDF)
        </a>
      </nav>
      <div className="border-t border-white/10 px-5 py-4 text-sm">
        <div className="font-medium text-white">{name}</div>
        <div className="text-teal-200/70">{role}</div>
      </div>
    </aside>
  );
}
