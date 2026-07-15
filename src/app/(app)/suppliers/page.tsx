import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { formatMoney } from "@/lib/format";
import {
  ButtonLink,
  EmptyState,
  PageHeader,
  Table,
  Td,
  Th,
} from "@/components/ui";

export default async function SuppliersPage() {
  await requireRole(["ADMIN", "STORE", "ACCOUNTANT"]);
  const suppliers = await prisma.supplier.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <PageHeader
        title="الموردين"
        description="أرصدة الموردين وكشوف الحساب"
        action={<ButtonLink href="/suppliers/new">مورد جديد</ButtonLink>}
      />
      {suppliers.length === 0 ? (
        <EmptyState message="لا يوجد موردون." />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>الاسم</Th>
              <Th>الهاتف</Th>
              <Th>المستحق عليه (لنا / له)</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s) => (
              <tr key={s.id}>
                <Td className="font-medium">{s.name}</Td>
                <Td>{s.phone || "—"}</Td>
                <Td>{formatMoney(s.balance)}</Td>
                <Td>
                  <Link
                    href={`/suppliers/${s.id}`}
                    className="text-[var(--accent)] hover:underline"
                  >
                    كشف حساب
                  </Link>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
