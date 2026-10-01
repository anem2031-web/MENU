# Al Malqa Digital Menu

مشروع المنيو الرقمي الخاص بكوفي الملقا. الواجهة العامة للعميل بدون تسجيل دخول، ولوحة المالك محمية بجلسة آمنة.

## الحالة الحالية
- المرحلة 1: مكتملة.
- المرحلة 2: مكتملة — TiDB + Drizzle + migrations + الفهارس.
- المرحلة 3: مكتملة — تسجيل دخول المالك والصلاحيات.
- المرحلة 4: جاري التنفيذ — هوية الكوفي وإعداداته وربطها بواجهة العميل.

## التشغيل على Windows PowerShell
من جذر المشروع:

```powershell
pnpm install
pnpm typecheck
pnpm dev
```

الواجهة: `http://localhost:5173`

الخادم: `http://localhost:3001`

لوحة المالك: `http://localhost:5173/admin`

## المرحلة 4
تحتوي النسخة الحالية على migration جديدة:

```text
packages/db/drizzle/0002_brand_settings.sql
```

بعد استبدال المشروع وتشغيل `pnpm install` طبّقها من مجلد `packages/db`:

```powershell
pnpm exec drizzle-kit migrate
```

ثم شغّل `pnpm typecheck` و`pnpm dev` واختبر تعديل الهوية وحفظها من لوحة المالك.

## التخزين
- قاعدة البيانات: TiDB، قاعدة `MENU`.
- صور المنتجات والشعار النهائية: IDrive S3/e2 في مرحلة الصور.
- الأسرار وكلمات المرور تبقى في `.env` المحلي ولا تُرفع إلى Git أو ملفات التسليم.

## الهوية البصرية
المرجع الرسمي موجود في:

```text
docs/brand-reference.png
```

والقواعد المستخلصة منه موجودة في:

```text
docs/BRAND_GUIDE.md
```
