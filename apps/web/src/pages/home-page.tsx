import { useMemo, useState, type ReactNode } from "react";
import { Coffee, Eye, Gem, Image as ImageIcon, Leaf, Layers3, Sparkles, Star } from "lucide-react";
import { trpc } from "../lib/trpc";

const defaultBrand = {
  nameAr: "كوفي الملقا",
  nameEn: "Al Malqa Cafe",
  descriptionAr: "تجربة راقية .. ببساطة",
  descriptionEn: "A refined experience in simple ways",
  logoUrl: "",
  primaryColor: "#5A3825",
  backgroundColor: "#F7F1EA",
  currency: "SAR",
  defaultLanguage: "ar" as const,
  publicSlug: "al-malqa",
  isPublished: true,
};

const categoryIcons = [Coffee, Sparkles, Leaf, Gem, Layers3];

export function HomePage() {
  const settings = trpc.cafe.publicSettings.useQuery(undefined, {
    retry: 1,
    refetchOnWindowFocus: false,
  });
  const categories = trpc.cafe.publicCategories.useQuery(undefined, {
    retry: 1,
    refetchOnWindowFocus: false,
  });
  const products = trpc.cafe.publicProducts.useQuery(undefined, {
    retry: 1,
    refetchOnWindowFocus: false,
  });
  const [activeCategoryId, setActiveCategoryId] = useState<number>(0);

  const brand = settings.data ?? defaultBrand;
  const filteredProducts = useMemo(() => {
    const rows = products.data ?? [];
    if (!activeCategoryId) return rows;
    return rows.filter((product) => product.categoryId === activeCategoryId);
  }, [products.data, activeCategoryId]);
  const featuredProducts = useMemo(() => (products.data ?? []).filter((product) => product.isFeatured), [products.data]);

  if (settings.isError) {
    return (
      <main dir="rtl" className="brand-shell flex min-h-screen items-center justify-center p-6">
        <div className="brand-panel max-w-md p-8 text-center">
          <h1 className="text-2xl font-bold text-[#4a3021]">تعذر تحميل المنيو</h1>
          <p className="mt-3 leading-7 text-[#8d715d]">تأكد من تشغيل الخادم ثم أعد المحاولة.</p>
          <button className="brand-primary-button mx-auto mt-5" onClick={() => settings.refetch()}>إعادة المحاولة</button>
        </div>
      </main>
    );
  }

  if (!brand.isPublished) {
    return (
      <main dir="rtl" className="min-h-screen p-5" style={{ backgroundColor: brand.backgroundColor }}>
        <section className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-lg items-center justify-center">
          <div className="w-full rounded-[34px] border border-black/5 bg-white/70 p-8 text-center shadow-[0_24px_80px_rgba(68,42,26,0.12)] backdrop-blur">
            <BrandMark logoUrl={brand.logoUrl} primaryColor={brand.primaryColor} />
            <h1 className="text-safe-wrap mt-5 text-2xl font-bold min-[390px]:text-3xl" style={{ color: brand.primaryColor }}>{brand.nameAr}</h1>
            <p className="brand-english mt-1 text-xs" style={{ color: brand.primaryColor }}>{brand.nameEn}</p>
            <p className="mt-7 leading-8 text-[#846b59]">المنيو غير متاح حاليًا. نعود لكم قريبًا.</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main dir="rtl" className="relative min-h-screen min-h-dvh overflow-x-clip" style={{ backgroundColor: brand.backgroundColor }}>
      <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-white/60 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-20 h-80 w-80 rounded-full bg-[#d8c2ae]/25 blur-3xl" />

      <section className="vip-container relative px-3 pb-[max(1.5rem,var(--safe-bottom))] pt-[max(1rem,var(--safe-top))] min-[390px]:px-4 sm:px-6 sm:py-10">
        <header className="flex min-w-0 items-center justify-between gap-3 sm:gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <BrandMark logoUrl={brand.logoUrl} primaryColor={brand.primaryColor} compact />
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold min-[390px]:text-xl" style={{ color: brand.primaryColor }}>{brand.nameAr}</h1>
              <p className="brand-english truncate text-[9px] min-[390px]:text-[10px]" style={{ color: brand.primaryColor }}>{brand.nameEn}</p>
            </div>
          </div>
          <span className="touch-target shrink-0 rounded-full border border-black/5 bg-white/55 px-3 py-2 text-[11px] font-semibold text-[#7c624f] backdrop-blur sm:text-xs">
            {brand.defaultLanguage === "ar" ? "العربية" : "English"}
          </span>
        </header>

        <div className="mt-6 grid min-w-0 items-center gap-6 sm:mt-8 sm:gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <div className="order-2 min-w-0 text-center lg:order-1 lg:text-right">
            <p className="brand-kicker" style={{ color: brand.primaryColor }}>AL MALQA DIGITAL MENU</p>
            <h2 className="text-safe-wrap mt-3 text-[clamp(2rem,9vw,3.25rem)] font-bold leading-[1.18]" style={{ color: brand.primaryColor }}>{brand.descriptionAr || "تجربة راقية .. ببساطة"}</h2>
            <p className="brand-english mx-auto mt-3 max-w-xl text-xs leading-6 opacity-70 lg:mx-0" style={{ color: brand.primaryColor }}>{brand.descriptionEn || "A refined experience in simple ways"}</p>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-[#806754] min-[390px]:text-base min-[390px]:leading-8 lg:mx-0">قائمة رقمية هادئة وواضحة لعرض الأقسام والأصناف والأسعار والتوفر مباشرة من لوحة المالك.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-2.5 lg:justify-start">
              <div className="brand-value-chip"><Leaf className="h-4 w-4" /> هدوء وخصوصية</div>
              <div className="brand-value-chip"><Eye className="h-4 w-4" /> عناية بالتفاصيل</div>
              <div className="brand-value-chip"><Gem className="h-4 w-4" /> تجربة راقية</div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="relative mx-auto max-w-md rounded-[30px] border border-black/5 bg-white/55 p-3 shadow-[0_30px_90px_rgba(71,43,27,0.15)] backdrop-blur min-[390px]:rounded-[36px] min-[390px]:p-5 sm:rounded-[40px] sm:p-7">
              <div className="absolute -right-3 top-16 h-20 w-20 rounded-full border border-[#b99c82]/20" />
              <div className="relative rounded-[24px] border border-black/5 bg-white/70 px-4 py-6 text-center shadow-inner min-[390px]:rounded-[30px] min-[390px]:px-6 min-[390px]:py-8">
                <BrandMark logoUrl={brand.logoUrl} primaryColor={brand.primaryColor} />
                <h3 className="text-safe-wrap mt-5 text-2xl font-bold min-[390px]:text-3xl" style={{ color: brand.primaryColor }}>{brand.nameAr}</h3>
                <p className="brand-english mt-1 text-[10px]" style={{ color: brand.primaryColor }}>{brand.nameEn}</p>
                <div className="mx-auto my-5 h-px w-14 opacity-30" style={{ backgroundColor: brand.primaryColor }} />
                <p className="leading-8 text-[#806754]">أهلاً وسهلاً بكم</p>
                <p className="mt-1 text-sm text-[#9b806a]">في {brand.nameAr}</p>
              </div>
            </div>
          </div>
        </div>

        <section className="mt-10 sm:mt-16">
          <div className="flex flex-wrap items-end justify-between gap-3 sm:gap-4">
            <div><p className="brand-kicker" style={{ color: brand.primaryColor }}>CHOOSE A CATEGORY</p><h2 className="mt-1 text-2xl font-bold" style={{ color: brand.primaryColor }}>اختر الفئة</h2></div>
            <span className="text-xs text-[#9a806b]">{categories.data?.length ?? 0} أقسام ظاهرة</span>
          </div>

          {categories.isLoading ? (
            <LoadingBlock text="جاري تحميل الأقسام..." />
          ) : categories.data?.length ? (
            <div className="mt-5 grid grid-cols-1 gap-3 min-[430px]:grid-cols-2 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
              {categories.data.map((category, index) => {
                const Icon = categoryIcons[index % categoryIcons.length] ?? Layers3;
                const selected = activeCategoryId === category.id;
                return (
                  <button key={category.id} type="button" onClick={() => setActiveCategoryId(selected ? 0 : category.id)} className="group min-w-0 overflow-hidden rounded-[24px] border text-right shadow-[0_14px_40px_rgba(72,45,28,0.07)] backdrop-blur transition md:rounded-[26px] md:hover:-translate-y-1" style={{ borderColor: selected ? `${brand.primaryColor}55` : "rgba(0,0,0,.05)", backgroundColor: selected ? "rgba(255,255,255,.9)" : "rgba(255,255,255,.58)" }}>
                    {category.imageUrl ? (
                      <div className="relative aspect-[16/9] overflow-hidden bg-[#eadbcf]">
                        <img src={category.imageUrl} alt={category.nameAr} className="h-full w-full object-cover transition duration-300 md:group-hover:scale-[1.03]" loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
                        <span className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-base font-bold shadow-sm" style={{ color: brand.primaryColor }}>{selected ? "✓" : "←"}</span>
                      </div>
                    ) : null}
                    <div className="p-4 min-[430px]:p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/75" style={{ color: brand.primaryColor }}><Icon className="h-5 w-5" /></div>
                        {!category.imageUrl ? <span className="text-xl opacity-50" style={{ color: brand.primaryColor }}>{selected ? "✓" : "←"}</span> : null}
                      </div>
                      <h3 className="mt-4 text-xl font-bold" style={{ color: brand.primaryColor }}>{category.nameAr}</h3>
                      <p className="brand-english mt-1 text-[9px] opacity-60" style={{ color: brand.primaryColor }}>{category.nameEn || "CATEGORY"}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <EmptyBlock icon={<Layers3 className="h-9 w-9" />} title="لا توجد أقسام متاحة حاليًا" description="ستظهر الأقسام هنا فور إضافتها وإظهارها من لوحة المالك." primaryColor={brand.primaryColor} />
          )}
        </section>

        {featuredProducts.length ? (
          <section className="mt-10 sm:mt-16">
            <div><p className="brand-kicker" style={{ color: brand.primaryColor }}>FEATURED SELECTION</p><h2 className="mt-1 text-2xl font-bold" style={{ color: brand.primaryColor }}>اختيارات مميزة</h2></div>
            <div className="mt-5 grid grid-cols-1 gap-4 min-[430px]:grid-cols-2 lg:grid-cols-3">
              {featuredProducts.slice(0, 6).map((product) => <ProductCard key={product.id} product={product} currency={brand.currency} primaryColor={brand.primaryColor} featured />)}
            </div>
          </section>
        ) : null}

        <section className="mt-10 sm:mt-16">
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="brand-kicker" style={{ color: brand.primaryColor }}>OUR MENU</p><h2 className="mt-1 text-2xl font-bold" style={{ color: brand.primaryColor }}>{activeCategoryId ? categories.data?.find((item) => item.id === activeCategoryId)?.nameAr ?? "المنيو" : "المنيو"}</h2></div>
            <div className="horizontal-scroll -mx-3 flex gap-2 overflow-x-auto px-3 pb-2 min-[390px]:mx-0 min-[390px]:px-0">
              <button type="button" onClick={() => setActiveCategoryId(0)} className="touch-target whitespace-nowrap rounded-full border px-4 py-2 text-xs font-bold" style={{ borderColor: activeCategoryId === 0 ? brand.primaryColor : "rgba(90,56,37,.12)", backgroundColor: activeCategoryId === 0 ? brand.primaryColor : "rgba(255,255,255,.65)", color: activeCategoryId === 0 ? "white" : brand.primaryColor }}>الكل</button>
              {categories.data?.map((category) => <button key={category.id} type="button" onClick={() => setActiveCategoryId(category.id)} className="touch-target whitespace-nowrap rounded-full border px-4 py-2 text-xs font-bold" style={{ borderColor: activeCategoryId === category.id ? brand.primaryColor : "rgba(90,56,37,.12)", backgroundColor: activeCategoryId === category.id ? brand.primaryColor : "rgba(255,255,255,.65)", color: activeCategoryId === category.id ? "white" : brand.primaryColor }}>{category.nameAr}</button>)}
            </div>
          </div>

          {products.isLoading ? <LoadingBlock text="جاري تحميل الأصناف..." /> : filteredProducts.length ? (
            <div className="mt-5 grid grid-cols-1 gap-4 min-[430px]:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((product) => <ProductCard key={product.id} product={product} currency={brand.currency} primaryColor={brand.primaryColor} />)}
            </div>
          ) : (
            <EmptyBlock icon={<Coffee className="h-9 w-9" />} title="لا توجد أصناف متاحة في هذا القسم" description="قد تتم إضافة أصناف جديدة قريبًا." primaryColor={brand.primaryColor} />
          )}
        </section>

        <footer className="mt-12 border-t border-[#5A3825]/10 py-6 text-center">
          <p className="brand-english text-[9px] tracking-[0.28em]" style={{ color: brand.primaryColor }}>BEAUTIFUL MOMENTS · SIMPLE DETAILS</p>
          <p className="mt-2 text-xs text-[#9a806b]">عملة المنيو: {brand.currency}</p>
        </footer>
      </section>
    </main>
  );
}

function ProductCard({ product, currency, primaryColor, featured = false }: { product: { id: number; nameAr: string; nameEn: string; descriptionAr: string; price: number; imageUrl: string; categoryNameAr: string; isAvailable: boolean; isFeatured: boolean }; currency: string; primaryColor: string; featured?: boolean }) {
  return (
    <article className={`min-w-0 overflow-hidden rounded-[24px] border bg-white/68 shadow-[0_16px_44px_rgba(71,43,27,.08)] backdrop-blur min-[430px]:rounded-[28px] ${!product.isAvailable ? "opacity-70" : ""}`} style={{ borderColor: featured ? `${primaryColor}28` : "rgba(0,0,0,.05)" }}>
      <div className="relative aspect-[4/3] overflow-hidden bg-[#eadbcf]">
        {product.imageUrl ? <img src={product.imageUrl} alt={product.nameAr} className="h-full w-full object-cover" loading="lazy" /> : <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#f2e5d9] to-[#dfc9b5]" style={{ color: primaryColor }}><ImageIcon className="h-10 w-10 opacity-55" /></div>}
        {product.isFeatured ? <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-bold shadow-sm" style={{ color: primaryColor }}><Star className="h-3 w-3 fill-current" />مميز</span> : null}
        {!product.isAvailable ? <span className="absolute inset-x-3 bottom-3 rounded-full bg-[#4b3425]/90 px-3 py-2 text-center text-xs font-bold text-white">غير متوفر حاليًا</span> : null}
      </div>
      <div className="p-4 min-[430px]:p-5">
        <p className="text-[10px] font-bold text-[#a0846e]">{product.categoryNameAr}</p>
        <h3 className="text-safe-wrap mt-1 text-lg font-bold min-[430px]:text-xl" style={{ color: primaryColor }}>{product.nameAr}</h3>
        <p className="brand-english mt-1 text-[9px] opacity-55" style={{ color: primaryColor }}>{product.nameEn || "MENU ITEM"}</p>
        <p className="text-safe-wrap mt-3 text-sm leading-6 text-[#866b57] min-[430px]:min-h-12">{product.descriptionAr || "وصف الصنف سيظهر هنا."}</p>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-2 border-t border-[#5A3825]/8 pt-4">
          <span className="text-xs text-[#9a806b]">السعر</span>
          <div className="text-left"><span className="text-xl font-bold" style={{ color: primaryColor }}>{formatPrice(product.price)}</span><span className="mr-1 text-xs font-bold text-[#92735d]">{currency}</span></div>
        </div>
      </div>
    </article>
  );
}

function LoadingBlock({ text }: { text: string }) {
  return <div className="mt-5 rounded-[26px] border border-black/5 bg-white/50 px-5 py-10 text-center text-sm text-[#8d715d]">{text}</div>;
}

function EmptyBlock({ icon, title, description, primaryColor }: { icon: ReactNode; title: string; description: string; primaryColor: string }) {
  return <div className="mt-5 rounded-[26px] border border-dashed border-black/10 bg-white/45 px-5 py-12 text-center"><div className="mx-auto w-fit opacity-50" style={{ color: primaryColor }}>{icon}</div><h3 className="mt-4 font-bold" style={{ color: primaryColor }}>{title}</h3><p className="mt-2 text-sm text-[#92745e]">{description}</p></div>;
}

function BrandMark({ logoUrl, primaryColor, compact = false }: { logoUrl: string; primaryColor: string; compact?: boolean }) {
  const size = compact ? "h-12 w-12" : "h-24 w-24";
  if (logoUrl) return <img src={logoUrl} alt="شعار الكوفي" className={`${size} mx-auto rounded-full object-contain`} />;
  return <div className={`${size} mx-auto flex flex-col items-center justify-center rounded-full border bg-white/45 shadow-sm`} style={{ borderColor: `${primaryColor}40`, color: primaryColor }}><Coffee className={compact ? "h-5 w-5" : "h-8 w-8"} />{!compact ? <span className="mt-1 text-[10px] font-bold">الملقا</span> : null}</div>;
}

function formatPrice(price: number) {
  return Number.isInteger(price) ? String(price) : price.toFixed(2);
}
