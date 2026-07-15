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

## PostgreSQL على Neon + الرفع على Vercel

### 1) Neon
1. أنشئ مشروع على [neon.tech](https://neon.tech)
2. انسخ **Connection string**
   - للتطبيق: **Pooled**
   - للـ migrations (اختياري): **Direct**

مثال `.env` (لا ترفعه على GitHub):

```
DATABASE_URL="postgresql://USER:PASSWORD@HOST-pooler....neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://USER:PASSWORD@HOST....neon.tech/neondb?sslmode=require"
AUTH_SECRET="سلسلة-عشوائية-طويلة"
NEXTAUTH_SECRET="نفس-الـAUTH_SECRET"
NEXTAUTH_URL="https://your-app.vercel.app"
AUTH_URL="https://your-app.vercel.app"
```

### 2) تطبيق الجداول محلياً
لو عندك VPN (مثل ProtonVPN) وفشل الاتصال — أوقفه مؤقتاً ثم:

```bash
npx prisma db push
npm run db:seed
```

دخول الأدمن: `admin` / `admin123`

### 3) Vercel
1. Import المشروع من GitHub: `khaledMohey/demoerp`
2. Environment Variables: نفس المتغيرات فوق (بس `NEXTAUTH_URL` = رابط Vercel)
3. Deploy
4. بعد أول رفع ناجح شغّل seed مرة واحدة من جهازك (مع نفس `DATABASE_URL`):

```bash
npm run db:seed
```

البناء يشغّل `prisma db push` تلقائياً ليخلق الجداول على Neon.

## الوحدات

- **أصناف / مخزن (FIFO)** — كل توريد = دفعة بسعر شراء وبيع؛ البيع يخصم من الأقدم أولاً
- **توريدات** — مورد + كاش / إنستا / آجل / جزئي + إدخال دفعات للمخزن
- **مبيعات** — اختيار عميل أو شركة + كاش / إنستا / آجل / جزئي
- **موردين / عملاء / شركات** — كشوف حساب وسداد/تحصيل
- **بنوك وخزنة** — أرصدة وحركات
- **تقارير** — ربح الفترة، ربح الأصناف، قيمة المخزون
- **موظفين** — أدوار: مدير / مخازن / مبيعات / محاسب
