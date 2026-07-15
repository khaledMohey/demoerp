import { requireRole } from "@/lib/session";
import { createCompany } from "../../parties/actions";
import {
  Card,
  Input,
  PageHeader,
  SubmitButton,
  Textarea,
} from "@/components/ui";

export default async function NewCompanyPage() {
  await requireRole(["ADMIN", "SALES"]);
  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="إضافة شركة" />
      <Card>
        <form action={createCompany} className="grid gap-4">
          <Input label="اسم الشركة" name="name" required />
          <Input label="الرقم الضريبي" name="taxNumber" />
          <Input label="مسؤول الاتصال" name="contactName" />
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
