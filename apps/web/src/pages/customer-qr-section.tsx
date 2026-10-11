import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Download, ExternalLink, Pencil, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "../lib/trpc";
import { canvasToPdfBlob, canvasToPngBlob, downloadBlob, renderQrToCanvas } from "../lib/qr-export";

export function CustomerQrSection() {
  const utils = trpc.useUtils();
  const archive = trpc.admin.qr.archive.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const settings = trpc.admin.settings.useQuery();
  const [draft, setDraft] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [confirmation, setConfirmation] = useState<{ kind: "create" | "update"; destinationUrl: string; origin: string; revision: number } | null>(null);
  const [exporting, setExporting] = useState(false);
  const record = archive.data?.record;
  const origin = archive.data?.configuredOrigin || window.location.origin;
  const suggestedUrl = `${window.location.origin}/menu/${encodeURIComponent(settings.data?.publicSlug || "al-malqa")}`;
  // A legacy browser-only URL is merely a draft, never an archived/dynamic QR.
  const [legacyUrl] = useState(() => localStorage.getItem("customer-menu-url"));
  const destinationUrl = draft ?? record?.destinationUrl ?? legacyUrl ?? suggestedUrl;

  async function saved() {
    setConfirmation(null);
    setEditing(false);
    setDraft(null);
    await utils.admin.qr.archive.invalidate();
    toast.success("تم الحفظ في الأرشيف؛ رابط الباركود الثابت لا يتغير");
  }
  const create = trpc.admin.qr.create.useMutation({ onSuccess: saved, onError: (error) => { toast.error(error.message); void utils.admin.qr.archive.invalidate(); setConfirmation(null); } });
  const update = trpc.admin.qr.update.useMutation({ onSuccess: saved, onError: (error) => { toast.error(error.message); void utils.admin.qr.archive.invalidate(); setConfirmation(null); } });
  const busy = create.isPending || update.isPending;

  function requestSave() {
    try {
      const url = new URL(destinationUrl.trim());
      if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) throw new Error();
      setConfirmation({ kind: record ? "update" : "create", destinationUrl: url.href, origin, revision: record?.revision ?? 0 });
    } catch { toast.error("اكتب رابط HTTP أو HTTPS كاملًا بدون بيانات دخول"); }
  }

  function confirmSave() {
    if (!confirmation || busy) return;
    if (confirmation.kind === "create") {
      create.mutate({ origin: confirmation.origin, destinationUrl: confirmation.destinationUrl, confirmed: true });
    } else {
      update.mutate({ destinationUrl: confirmation.destinationUrl, expectedRevision: confirmation.revision, confirmed: true });
    }
  }

  async function copyLink() {
    if (!record) return;
    try { await navigator.clipboard.writeText(record.stableUrl); toast.success("تم نسخ الرابط الثابت"); }
    catch { toast.error("تعذر نسخ الرابط"); }
  }

  async function downloadQr(format: "png" | "pdf" | "svg") {
    if (!record || exporting) return;
    setExporting(true);
    try {
      const svg = document.getElementById("customer-menu-qr") as SVGSVGElement | null;
      if (!svg) throw new Error("تعذر العثور على الباركود المحفوظ");
      if (format === "svg") {
        downloadBlob(new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml" }), "al-malqa-menu-qr.svg");
      } else {
        const canvas = await renderQrToCanvas(svg);
        const blob = format === "png" ? await canvasToPngBlob(canvas) : canvasToPdfBlob(canvas);
        downloadBlob(blob, `al-malqa-menu-qr.${format}`);
      }
    } catch (error) { toast.error(error instanceof Error ? error.message : "تعذر التنزيل"); }
    finally { setExporting(false); }
  }

  function downloadBackup() {
    if (!record) return;
    downloadBlob(new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), ...archive.data }, null, 2)], { type: "application/json" }), "al-malqa-qr-archive.json");
  }

  if (archive.isLoading || settings.isLoading) return <p className="mt-6" role="status">جاري تحميل أرشيف الباركود...</p>;
  if (archive.isError || settings.isError) return <div className="brand-panel mt-6 p-5" role="alert">
    تعذر تحميل الأرشيف. لم يتم إنشاء أو استبدال أي باركود. تأكد من تحديث قاعدة البيانات والخادم.
    <button type="button" className="brand-secondary-button mt-3" onClick={() => { void archive.refetch(); void settings.refetch(); }}>إعادة المحاولة</button>
  </div>;

  return <section className="mt-6 min-w-0 space-y-5" dir="rtl">
    <div className="rounded-2xl border border-amber-700/15 bg-amber-50 p-4 text-sm leading-7 text-amber-900">
      قبل الطباعة أو الحفر: اعتمد نطاقًا تملكونه ويخدم مسار /q/. الرابط الثابت لا يمكن استبداله بعد الحفظ، ويحتاج استمرار النطاق وخدمة التحويل.
      {!archive.data?.configuredOrigin && <p>لم يُضبط نطاق خاص للباركود؛ سيُستخدم عنوان الموقع الحالي. لا تطبع باركودًا بعنوان localhost أو عنوان استضافة مؤقت.</p>}
    </div>
    <div className="grid min-w-0 gap-5 lg:grid-cols-2">
      <div className="brand-panel min-w-0 p-5 text-center sm:p-7">
        <h2 className="text-2xl font-bold text-[#3d2b20]">الباركود المحفوظ</h2>
        {record ? <>
          <p className="mt-2 text-sm leading-7 text-[#8e735f]">نفس الباركود دائمًا؛ تعديل الوجهة لا يغيّره.</p>
          <div className="mx-auto mt-5 w-fit max-w-full rounded-2xl border bg-white p-3">
            <QRCodeSVG id="customer-menu-qr" value={record.stableUrl} size={250} marginSize={4} bgColor="#FFFFFF" fgColor="#000000" level="H" style={{ maxWidth: "100%", height: "auto" }} />
          </div>
          <p className="mt-4 text-sm font-bold"><ShieldCheck className="inline h-4 w-4" /> الرابط الثابت — مقفل</p>
          <p className="mt-2 break-all text-sm" dir="ltr">{record.stableUrl}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {(["png", "pdf", "svg"] as const).map((format) => <button key={format} type="button" disabled={exporting} className="brand-secondary-button" onClick={() => void downloadQr(format)}><Download className="h-4 w-4" />{format.toUpperCase()}</button>)}
          </div>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <button type="button" onClick={() => void copyLink()} className="brand-secondary-button"><Copy className="h-4 w-4" />نسخ الرابط الثابت</button>
            <a href={record.stableUrl} target="_blank" rel="noreferrer" className="brand-secondary-button"><ExternalLink className="h-4 w-4" />اختبار الباركود</a>
          </div>
          <p className="mt-4 text-xs">محفوظ منذ {new Date(record.createdAt).toLocaleString("ar-SA")} · مراجعة {record.revision}</p>
        </> : <p className="mt-5 leading-7">لا يوجد باركود مؤرشف بعد. لن يتم إنشاء أي باركود قابل للتنزيل حتى تؤكد الحفظ الأول.</p>}
      </div>
      <div className="brand-panel min-w-0 p-5 sm:p-7">
        <h2 className="text-2xl font-bold text-[#3d2b20]">رابط المنيو — الوجهة</h2>
        <p className="mt-2 text-sm leading-7 text-[#8e735f]">هذا هو الرابط الذي يفتحه العميل بعد المسح. يمكنك تغييره دون تغيير الباركود المحفوظ.</p>
        {!record && <p className="mt-3 break-all text-sm">عنوان الرابط الثابت عند الإنشاء: <span dir="ltr">{origin}/q/…</span></p>}
        {!record && legacyUrl && <p className="mt-3 text-sm text-amber-900">تمت تعبئة الرابط القديم المحفوظ في هذا المتصفح كمسودة فقط. الباركود المباشر السابق لا يصبح ديناميكيًا بأثر رجعي.</p>}
        <label htmlFor="qr-destination" className="mt-5 mb-2 block font-bold">رابط المنيو</label>
        <input id="qr-destination" type="url" dir="ltr" className="brand-input text-left" value={destinationUrl} disabled={busy || (!!record && !editing)} onChange={(event) => setDraft(event.target.value)} />
        {record && !editing ? <button type="button" disabled={busy} onClick={() => { setDraft(record.destinationUrl); setEditing(true); }} className="brand-secondary-button mt-4"><Pencil className="h-4 w-4" />تعديل الوجهة فقط</button> : <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" disabled={busy || !destinationUrl.trim() || (!!record && destinationUrl.trim() === record.destinationUrl)} onClick={requestSave} className="brand-primary-button"><Save className="h-4 w-4" />{record ? "حفظ الوجهة الجديدة" : "إنشاء الباركود وحفظه في الأرشيف"}</button>
          {record && <button type="button" disabled={busy} onClick={() => { setEditing(false); setDraft(null); }} className="brand-secondary-button">إلغاء</button>}
        </div>}
        {record && <a href={record.destinationUrl} target="_blank" rel="noreferrer" className="brand-secondary-button mt-4"><ExternalLink className="h-4 w-4" />فتح الوجهة المحفوظة</a>}
        <p className="mt-5 text-sm leading-7">تغيير هوية الكوفي أو رابط المنيو في الإعدادات لا يغيّر الباركود المؤرشف تلقائيًا. لا يوجد زر لإعادة توليد رابط ثابت أو حذفه.</p>
      </div>
    </div>
    {record && <div className="brand-panel min-w-0 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-xl font-bold">الأرشيف وسجل تغيير الوجهة</h3><button type="button" className="brand-secondary-button" onClick={downloadBackup}><Download className="h-4 w-4" />تنزيل نسخة الأرشيف</button></div>
      <p className="mt-2 text-sm">حفظ دائم في قاعدة البيانات، وليس في هذا المتصفح فقط. احتفظ أيضًا بنسخة الأرشيف وملف SVG خارج الموقع.</p>
      <ol className="mt-4 space-y-3">{archive.data?.history.map((entry) => <li key={entry.id} className="min-w-0 rounded-xl border p-3 text-sm">
        <p>مراجعة {entry.revision} · {new Date(entry.createdAt).toLocaleString("ar-SA")} · حساب رقم {entry.changedBy}</p>
        {entry.previousUrl && <p className="mt-1 break-all">الوجهة السابقة: <span dir="ltr">{entry.previousUrl}</span></p>}
        <p className="mt-1 break-all">الوجهة المحفوظة: <span dir="ltr">{entry.destinationUrl}</span></p>
      </li>)}</ol>
    </div>}
    {confirmation && <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div role="alertdialog" aria-modal="true" aria-labelledby="qr-confirm-title" aria-describedby="qr-confirm-description" className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl" onKeyDown={(event) => {
        if (event.key === "Escape" && !busy) setConfirmation(null);
        if (event.key === "Tab") {
          const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)");
          const first = buttons[0]; const last = buttons[buttons.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
          if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        }
      }}>
        <h3 id="qr-confirm-title" className="text-xl font-bold">{confirmation.kind === "create" ? "تأكيد إنشاء الباركود الثابت" : "تأكيد تغيير وجهة الباركود"}</h3>
        <div id="qr-confirm-description" className="mt-3 space-y-3 text-sm leading-7">
          {confirmation.kind === "create" ? <p>سيُحفظ رابط ثابت على <span dir="ltr">{confirmation.origin}</span> ولا يمكن تغييره بعد ذلك. هل هذا هو النطاق الذي تريد الاحتفاظ به؟</p> : <><p>كل من يمسح الباركود القديم سيفتح الوجهة الجديدة فور الحفظ. لن يتغير الباركود أو رابطه الثابت.</p><p className="break-all">الوجهة السابقة: {record?.destinationUrl}</p></>}
          <p>الوجهة الجديدة:</p><p dir="ltr" className="break-all rounded-lg bg-stone-100 p-3 text-left">{confirmation.destinationUrl}</p>
        </div>
        <div className="mt-5 flex flex-wrap gap-3"><button type="button" autoFocus disabled={busy} onClick={() => setConfirmation(null)} className="brand-secondary-button">إلغاء</button><button type="button" disabled={busy} onClick={confirmSave} className="brand-primary-button">{busy ? "جاري الحفظ..." : "أؤكد الحفظ"}</button></div>
      </div>
    </div>}
  </section>;
}
