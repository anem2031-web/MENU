# Al Malqa Digital Menu

مشروع المنيو الرقمي الخاص بكوفي الملقا. واجهة العميل عامة بدون تسجيل دخول، ولوحة المالك محمية بجلسة آمنة.

## الحالة الحالية
- المراحل 1–5: مكتملة حسب `PROJECT_PLAN.md`.
- المرحلة 6: التنفيذ موجود؛ التحقق النهائي من ظهور الأصناف في واجهة العميل مؤجل بطلب المالك.
- المرحلة 6.5: تحسينات Responsive/VIP منفذة، واختبارات الجوال/التابلت مؤجلة بطلب المالك.
- المرحلة 7: جاري التنفيذ — رفع الصور إلى IDrive e2/S3.

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

## المرحلة 7 — الصور وIDrive e2
النسخة الحالية تضيف:
- `@aws-sdk/client-s3` للربط مع IDrive e2/S3.
- Multer لاستقبال ملف واحد في الرفع.
- Sharp لتصغير وضغط الصور وتحويلها إلى WebP.
- حد 8MB وأنواع مسموحة JPG/PNG/WebP/AVIF.
- رفع شعار الكوفي وصور الأقسام وصور الأصناف مباشرة من لوحة المالك.
- حفظ المفتاح والرابط في TiDB: الشعار في `cafe_settings`، وصور الأقسام والأصناف في حقول `image_key/image_url`.

تحديث v2.6 يضيف حقلي `image_key/image_url` إلى جدول `categories`، لذلك يلزم توليد Migration جديدة ثم تطبيقها قبل اختبار صور الأقسام.

بعد الاستبدال شغّل `pnpm install` لأن هذه المرحلة تضيف حزمًا جديدة، ثم ضع بيانات IDrive e2 في `.env` حسب:

```text
docs/IDRIVE_E2_SETUP.md
```

## التخزين والأسرار
- قاعدة البيانات: TiDB / `MENU`.
- الصور: IDrive e2 عبر S3-compatible API.
- لا تضع `S3_SECRET_ACCESS_KEY` أو كلمة مرور TiDB داخل Git أو ملفات ZIP التي تشاركها.
- `.env` مستبعد من Git أصلًا.

## الهوية البصرية
المرجع الرسمي:

```text
docs/brand-reference.png
```

ودليل الهوية:

```text
docs/BRAND_GUIDE.md
```

## Responsive / VIP
تحسينات Safe Areas و`dvh` واللمس وشبكات الهاتف/التابلت/الكمبيوتر موجودة، ومصفوفة QA في:

```text
docs/RESPONSIVE_QA.md
```

الاختبارات الفعلية على الأجهزة مؤجلة حاليًا بطلب المالك وستُستأنف لاحقًا.
