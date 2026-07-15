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

export default async function CompaniesPage() {
  await requireRole(["ADMIN", "SALES", "ACCOUNTANT"]);
  const companies = await prisma.company.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <PageHeader
        title="الشركات"
        description="شركات الشراء (B2B) وكشوف الحساب الآجل/الجزئي"
        action={<ButtonLink href="/companies/new">شركة جديدة</ButtonLink>}
      />
      {companies.length === 0 ? (
        <EmptyState message="لا توجد شركات." />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>الاسم</Th>
              <Th>الرقم الضريبي</Th>
              <Th>جهة الاتصال</Th>
              <Th>المستحق</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {companies.map((c) => (
              <tr key={c.id}>
                <Td className="font-medium">{c.name}</Td>
                <Td>{c.taxNumber || "—"}</Td>
                <Td>{c.contactName || c.phone || "—"}</Td>
                <Td>{formatMoney(c.balance)}</Td>
                <Td>
                  <Link
                    href={`/companies/${c.id}`}
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
