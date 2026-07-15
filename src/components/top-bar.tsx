import { signOut } from "@/lib/auth";

export function TopBar({ title }: { title: string }) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-[var(--border)] bg-white px-6">
      <h1 className="text-lg font-semibold text-[var(--fg)]">{title}</h1>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}
      >
        <button
          type="submit"
          className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--fg)]"
        >
          تسجيل الخروج
        </button>
      </form>
    </header>
  );
}
