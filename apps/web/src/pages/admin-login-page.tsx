import { FormEvent, useEffect, useState } from "react";
import { Coffee, LockKeyhole, LogIn, ShieldCheck } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "../lib/trpc";

export function AdminLoginPage() {
  const [, navigate] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const me = trpc.auth.me.useQuery(undefined, { retry: false });
  const brand = trpc.cafe.publicSettings.useQuery(undefined, { retry: false });
  const utils = trpc.useUtils();

  useEffect(() => {
    if (me.data) navigate("/admin", { replace: true });
  }, [me.data, navigate]);

  const login = trpc.auth.login.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      toast.success("تم تسجيل الدخول بنجاح");
      navigate("/admin", { replace: true });
    },
    onError: (error) => {
      toast.error(error.message || "تعذر تسجيل الدخول");
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    login.mutate({ username, password });
  }

  const primary = brand.data?.primaryColor ?? "#5A3825";
  const background = brand.data?.backgroundColor ?? "#F7F1EA";
  const nameAr = brand.data?.nameAr ?? "كوفي الملقا";
  const nameEn = brand.data?.nameEn ?? "Al Malqa Cafe";

  return (
    <main dir="rtl" className="safe-page landscape-compact grid min-h-screen min-h-dvh place-items-center overflow-x-clip" style={{ backgroundColor: background }}>
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,.9),transparent_30%)]" />
      <section className="relative mx-auto my-auto w-full max-w-md overflow-hidden rounded-[26px] border border-black/5 bg-white/82 shadow-[0_28px_90px_rgba(78,45,27,0.14)] backdrop-blur-xl min-[390px]:rounded-[30px] sm:rounded-[34px]">
        <div className="px-5 py-7 text-center text-white min-[390px]:px-7 min-[390px]:py-8 sm:px-8 sm:py-9" style={{ backgroundColor: primary }}>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/12 min-[390px]:h-16 min-[390px]:w-16">
            {brand.data?.logoUrl ? (
              <img src={brand.data.logoUrl} alt="شعار الكوفي" className="h-14 w-14 rounded-xl object-contain" />
            ) : (
              <Coffee className="h-8 w-8" />
            )}
          </div>
          <p className="brand-english mt-5 text-[9px] text-white/65">OWNER ACCESS</p>
          <h1 className="mt-2 text-xl font-bold min-[390px]:text-2xl">دخول لوحة المالك</h1>
          <p className="mt-2 text-sm text-white/72">{nameAr} · {nameEn}</p>
        </div>

        <form className="space-y-5 p-5 min-[390px]:p-7 sm:p-8" onSubmit={handleSubmit}>
          <div className="mb-1 flex items-center gap-2 text-xs text-[#9a806b]">
            <ShieldCheck className="h-4 w-4" />
            جلسة إدارة محمية
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[#5A3825]">اسم المستخدم</span>
            <input
              className="brand-input"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              minLength={3}
              maxLength={100}
              required
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[#5A3825]">كلمة المرور</span>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9d806c]" />
              <input
                className="brand-input py-3.5 pl-4 pr-12"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                minLength={8}
                maxLength={128}
                required
              />
            </div>
          </label>

          <button
            className="touch-target flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 font-bold text-white shadow-lg transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            style={{ backgroundColor: primary }}
            type="submit"
            disabled={login.isPending || me.isLoading}
          >
            <LogIn className="h-5 w-5" />
            {login.isPending ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
          </button>

          <p className="text-center text-xs leading-6 text-[#9d806c]">
            هذه الصفحة مخصصة لمالك الكوفي والمستخدمين الإداريين فقط.
          </p>
        </form>
      </section>
    </main>
  );
}
