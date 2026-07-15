import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { ROLE_LABELS } from "@/lib/format";
import {
  ButtonLink,
  EmptyState,
  PageHeader,
  Table,
  Td,
  Th,
} from "@/components/ui";
import { toggleUser } from "./actions";

export default async function UsersPage() {
  await requireRole(["ADMIN"]);
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div>
      <PageHeader
        title="الموظفين"
        description="إدارة المستخدمين والصلاحيات"
        action={<ButtonLink href="/users/new">موظف جديد</ButtonLink>}
      />
      {users.length === 0 ? (
        <EmptyState message="لا يوجد مستخدمون." />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>الاسم</Th>
              <Th>المستخدم</Th>
              <Th>البريد</Th>
              <Th>الدور</Th>
              <Th>الحالة</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <Td className="font-medium">{u.name}</Td>
                <Td>{u.username}</Td>
                <Td>{u.email}</Td>
                <Td>{ROLE_LABELS[u.role]}</Td>
                <Td>{u.active ? "نشط" : "موقوف"}</Td>
                <Td>
                  <form action={toggleUser.bind(null, u.id)}>
                    <button
                      type="submit"
                      className="text-sm text-[var(--accent)] hover:underline"
                    >
                      {u.active ? "إيقاف" : "تفعيل"}
                    </button>
                  </form>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
