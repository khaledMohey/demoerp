import { requireRole } from "@/lib/session";
import { createBankAccount } from "../actions";
import {
  Card,
  Input,
  PageHeader,
  Select,
  SubmitButton,
} from "@/components/ui";

export default async function NewBankPage() {
  await requireRole(["ADMIN", "ACCOUNTANT"]);
  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="إضافة حساب" />
      <Card>
        <form action={createBankAccount} className="grid gap-4">
          <Input label="الاسم" name="name" required placeholder="البنك الأهلي / خزنة فرع" />
          <Select label="النوع" name="type" required defaultValue="BANK">
            <option value="CASH">خزنة</option>
            <option value="BANK">بنك</option>
            <option value="INSTA">إنستا باي</option>
          </Select>
          <Input label="رقم الحساب" name="accountNo" />
          <Input
            label="الرصيد الافتتاحي"
            name="balance"
            type="number"
            step="0.01"
            defaultValue="0"
          />
          <SubmitButton>حفظ</SubmitButton>
        </form>
      </Card>
    </div>
  );
}
