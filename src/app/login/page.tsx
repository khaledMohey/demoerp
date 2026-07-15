"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      username: String(form.get("username") || "").trim().toLowerCase(),
      password: form.get("password"),
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("بيانات الدخول غير صحيحة");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[linear-gradient(145deg,#0a3d3f_0%,#0d7377_45%,#e8f5f4_45%,#f0f4f3_100%)] p-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-white p-6 shadow-xl sm:p-8">
        <div className="mb-8 text-center">
          <div className="text-2xl font-bold text-[var(--accent)] sm:text-3xl">
            DemoERP
          </div>
          <p className="mt-2 text-sm text-[var(--muted)]">
            تسجيل الدخول لنظام البيع والتوريدات
          </p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">اسم المستخدم</span>
            <input
              name="username"
              type="text"
              required
              autoComplete="username"
              defaultValue="admin"
              className="w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-base outline-none ring-[var(--accent)] focus:ring-2"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">كلمة المرور</span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              defaultValue="admin123"
              className="w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-base outline-none ring-[var(--accent)] focus:ring-2"
            />
          </label>
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[var(--accent)] py-3 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-60"
          >
            {loading ? "جاري الدخول..." : "دخول"}
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-[var(--muted)]">
          admin / admin123
        </p>
      </div>
    </div>
  );
}
