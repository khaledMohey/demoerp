import { requireRole } from "@/lib/session";
import { createCustomer } from "../../parties/actions";
import {
  Card,
  Input,
  PageHeader,
  SubmitButton,
  Textarea,
} from "@/components/ui";

export default async function NewCustomerPage() {
  await requireRole(["ADMIN", "SALES"]);
  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="إضافة عميل" />
      <Card>
        <form action={createCustomer} className="grid gap-4">
          <Input label="الاسم" name="name" required />
          <Input label="الهاتف" name="phone" />
          <Input label="البريد" name="email" type="email" />
          <Input label="العنوان" name="address" />
          <Textarea label="ملاحظات" name="notes" />
          <SubmitButton>حفظ</SubmitButton>
        </form>
      </Card>
    </div>
  );
}
