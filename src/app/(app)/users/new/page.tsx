import { requireRole } from "@/lib/session";
import { createUser } from "../actions";
import {
  Card,
  Input,
  PageHeader,
  Select,
  SubmitButton,
} from "@/components/ui";

export default async function NewUserPage() {
  await requireRole(["ADMIN"]);
  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="إضافة موظف" />
      <Card>
        <form action={createUser} className="grid gap-4">
          <Input label="الاسم" name="name" required />
          <Input label="اسم المستخدم" name="username" required />
          <Input label="البريد" name="email" type="email" required />
          <Input label="كلمة المرور" name="password" type="password" required />
          <Select label="الدور" name="role" required defaultValue="SALES">
            <option value="ADMIN">مدير</option>
            <option value="STORE">مخازن</option>
            <option value="SALES">مبيعات</option>
            <option value="ACCOUNTANT">محاسب</option>
          </Select>
          <SubmitButton>حفظ</SubmitButton>
        </form>
      </Card>
    </div>
  );
}
