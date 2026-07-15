import { requireAuth } from "@/lib/session";
import { AppShell } from "@/components/app-shell";
import { ROLE_LABELS } from "@/lib/format";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();

  return (
    <AppShell
      role={session.user.role}
      name={`${session.user.name} · ${ROLE_LABELS[session.user.role] ?? session.user.role}`}
    >
      {children}
    </AppShell>
  );
}
