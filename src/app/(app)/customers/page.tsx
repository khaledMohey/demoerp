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

export default async function CustomersPage() {
  await requireRole(["ADMIN", "SALES", "ACCOUNTANT"]);
  const customers = await prisma.customer.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <PageHeader
        title="العملاء"
        description="عملاء أفراد وكشوف الحساب"
        action={<ButtonLink href="/customers/new">عميل جديد</ButtonLink>}
      />
      {customers.length === 0 ? (
        <EmptyState message="لا يوجد عملاء." />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>الاسم</Th>
              <Th>الهاتف</Th>
              <Th>المستحق علينا (له / عليه)</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id}>
                <Td className="font-medium">{c.name}</Td>
                <Td>{c.phone || "—"}</Td>
                <Td>{formatMoney(c.balance)}</Td>
                <Td>
                  <Link
                    href={`/customers/${c.id}`}
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
