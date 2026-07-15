import { requireRole } from "@/lib/session";
import { createItem } from "../actions";
import {
  Card,
  Input,
  PageHeader,
  SubmitButton,
  Textarea,
} from "@/components/ui";

export default async function NewItemPage() {
  await requireRole(["ADMIN", "STORE"]);
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="إضافة صنف" description="أدخل بيانات الصنف" />
      <Card>
        <form action={createItem} className="grid gap-4 sm:grid-cols-2">
          <Input label="الكود" name="code" required placeholder="ITM-001" />
          <Input label="الاسم" name="name" required />
          <Input label="الوحدة" name="unit" defaultValue="قطعة" />
          <Input
            label="سعر البيع"
            name="sellPrice"
            type="number"
            step="0.01"
            min="0"
            defaultValue="0"
          />
          <Input
            label="متوسط التكلفة (اختياري)"
            name="avgCost"
            type="number"
            step="0.01"
            min="0"
            defaultValue="0"
          />
          <Input
            label="الحد الأدنى للمخزون"
            name="minStock"
            type="number"
            step="0.001"
            min="0"
            defaultValue="0"
          />
          <div className="sm:col-span-2">
            <Textarea label="الوصف" name="description" />
          </div>
          <div className="sm:col-span-2">
            <SubmitButton>حفظ الصنف</SubmitButton>
          </div>
        </form>
      </Card>
    </div>
  );
}
