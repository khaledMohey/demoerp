# DemoERP — نظام بيع وتوريدات

نظام ERP ويب بالعربية لإدارة المخزون، التوريدات، المبيعات (عميل/شركة)، الموردين، البنوك، وكشوف الحساب والتقارير.

## المتطلبات

- Node.js 20+

## التشغيل المحلي (SQLite)

يعمل مباشرة بدون تثبيت قاعدة بيانات:

```bash
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

افتح [http://localhost:3000](http://localhost:3000)

### حسابات تجريبية

| الدور | اسم المستخدم | كلمة المرور |
|--------|---------|-------------|
| مدير | admin | admin123 |
| مخازن | store | store123 |
| مبيعات | sales | sales123 |
| محاسب | acc | acc123 |

### دليل الاستخدام (PDF)

- من داخل النظام: القائمة → **دليل الاستخدام (PDF)**
- أو افتح: `public/guides/دليل-استخدام-DemoERP.pdf`
- لإعادة إنشاء الدليل: `npm run guide:pdf`

### الموبايل

النظام متجاوب — على الهاتف اضغط ☰ لفتح/إغلاق القائمة الجانبية.

## PostgreSQL للإنتاج

1. شغّل Postgres: `docker compose up -d` (أو استخدم Neon/RDS)
2. في `prisma/schema.prisma` غيّر:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

3. ضع في `.env`:

```
DATABASE_URL="postgresql://erp:erp_secret@localhost:5432/demoerp?schema=public"
AUTH_SECRET="..."
NEXTAUTH_URL="https://your-domain.com"
```

4. `npx prisma migrate deploy && npm run db:seed && npm run build && npm start`

## الوحدات

- **أصناف / مخزن (FIFO)** — كل توريد = دفعة بسعر شراء وبيع؛ البيع يخصم من الأقدم أولاً
- **توريدات** — مورد + كاش / إنستا / آجل / جزئي + إدخال دفعات للمخزن
- **مبيعات** — اختيار عميل أو شركة + كاش / إنستا / آجل / جزئي
- **موردين / عملاء / شركات** — كشوف حساب وسداد/تحصيل
- **بنوك وخزنة** — أرصدة وحركات
- **تقارير** — ربح الفترة، ربح الأصناف، قيمة المخزون
- **موظفين** — أدوار: مدير / مخازن / مبيعات / محاسب
