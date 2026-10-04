import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Crown,
  Image as ImageIcon,
  Languages,
  Layers3,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { trpc } from "../lib/trpc";

type Language = "ar" | "en";

type PublicProduct = {
  id: number;
  categoryId: number;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  price: number;
  imageUrl: string;
  categoryNameAr: string;
  categoryNameEn: string;
  isAvailable: boolean;
  isFeatured: boolean;
};

const defaultBrand = {
  nameAr: "كوفي الملقا",
  nameEn: "Al Malqa Cafe",
  descriptionAr: "تجربة راقية .. ببساطة",
  descriptionEn: "A refined experience in simple ways",
  logoUrl: "",
  primaryColor: "#5A3825",
  backgroundColor: "#F7F1EA",
  currency: "SAR",
  defaultLanguage: "ar" as Language,
  publicSlug: "al-malqa",
  isPublished: true,
};

const copy = {
  ar: {
    digitalMenu: "المنيو الرقمي",
    welcome: "أهلاً وسهلاً بكم",
    categoriesKicker: "اكتشف قائمتنا",
    categoriesTitle: "الأقسام",
    categoriesCount: "أقسام",
    featuredKicker: "اختيارات خاصة",
    featuredTitle: "الأصناف المميزة",
    menuKicker: "قائمتنا",
    menuTitle: "المنيو",
    all: "الكل",
    featured: "مميز",
    unavailable: "غير متوفر حاليًا",
    viewDetails: "عرض التفاصيل",
    price: "السعر",
    close: "إغلاق",
    loadingCategories: "جاري تحميل الأقسام...",
    loadingProducts: "جاري تحميل الأصناف...",
    noCategories: "لا توجد أقسام متاحة حاليًا",
    noCategoriesDescription:
      "ستظهر الأقسام هنا فور إضافتها وإظهارها من لوحة المالك.",
    noProducts: "لا توجد أصناف متاحة في هذا القسم",
    noProductsDescription: "قد تتم إضافة أصناف جديدة قريبًا.",
    menuUnavailable: "المنيو غير متاح حاليًا",
    menuUnavailableDescription: "نعود لكم قريبًا.",
    loadError: "تعذر تحميل المنيو",
    loadErrorDescription: "تأكد من تشغيل الخادم ثم أعد المحاولة.",
    retry: "إعادة المحاولة",
    noDescription: "تفاصيل الصنف ستظهر هنا.",
    footer: "لحظات جميلة · تفاصيل بسيطة",
  },
  en: {
    digitalMenu: "Digital Menu",
    welcome: "Welcome",
    categoriesKicker: "Discover our menu",
    categoriesTitle: "Categories",
    categoriesCount: "categories",
    featuredKicker: "Special selection",
    featuredTitle: "Featured",
    menuKicker: "Our selection",
    menuTitle: "Menu",
    all: "All",
    featured: "Featured",
    unavailable: "Currently unavailable",
    viewDetails: "View details",
    price: "Price",
    close: "Close",
    loadingCategories: "Loading categories...",
    loadingProducts: "Loading menu...",
    noCategories: "No categories are available",
    noCategoriesDescription:
      "Categories will appear here when they are published.",
    noProducts: "No items are available in this category",
    noProductsDescription: "New items may be added soon.",
    menuUnavailable: "Menu is currently unavailable",
    menuUnavailableDescription: "We will be back soon.",
    loadError: "Unable to load the menu",
    loadErrorDescription: "Please check the server and try again.",
    retry: "Try again",
    noDescription: "Item details will appear here.",
    footer: "Beautiful moments · Simple details",
  },
} as const;

export function HomePage({ expectedSlug }: { expectedSlug?: string } = {}) {
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

  const [activeCategoryId, setActiveCategoryId] = useState(0);
  const [language, setLanguage] = useState<Language>("ar");
  const [selectedProduct, setSelectedProduct] =
    useState<PublicProduct | null>(null);

  const languageInitialized = useRef(false);
  const menuSectionRef = useRef<HTMLElement | null>(null);

  const brand = settings.data ?? defaultBrand;
  const text = copy[language];
  const isArabic = language === "ar";

  useEffect(() => {
    if (!settings.data || languageInitialized.current) {
      return;
    }

    setLanguage(settings.data.defaultLanguage);
    languageInitialized.current = true;
  }, [settings.data]);

  useEffect(() => {
    if (!selectedProduct) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedProduct(null);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedProduct]);

  const filteredProducts = useMemo(() => {
    const rows = products.data ?? [];

    if (!activeCategoryId) {
      return rows;
    }

    return rows.filter(
      (product) => product.categoryId === activeCategoryId,
    );
  }, [products.data, activeCategoryId]);

  const featuredProducts = useMemo(
    () =>
      (products.data ?? []).filter(
        (product) => product.isFeatured,
      ),
    [products.data],
  );

  const activeCategory = useMemo(
    () =>
      categories.data?.find(
        (category) => category.id === activeCategoryId,
      ),
    [categories.data, activeCategoryId],
  );

  const displayName = isArabic
    ? brand.nameAr
    : brand.nameEn || brand.nameAr;

  const displayDescription = isArabic
    ? brand.descriptionAr || defaultBrand.descriptionAr
    : brand.descriptionEn ||
      brand.descriptionAr ||
      defaultBrand.descriptionEn;

  const chooseCategory = (categoryId: number) => {
    setActiveCategoryId(categoryId);

    window.requestAnimationFrame(() => {
      menuSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  if (settings.isError) {
    return (
      <main
        dir="rtl"
        className="brand-shell flex min-h-screen min-h-dvh items-center justify-center p-5"
      >
        <div className="brand-panel w-full max-w-md p-8 text-center">
          <Coffee className="mx-auto h-10 w-10 text-[#5A3825]" />

          <h1 className="mt-5 text-2xl font-bold text-[#4A3021]">
            تعذر تحميل المنيو
          </h1>

          <p className="mt-3 leading-7 text-[#8D715D]">
            تأكد من تشغيل الخادم ثم أعد المحاولة.
          </p>

          <button
            type="button"
            className="brand-primary-button mx-auto mt-6"
            onClick={() => settings.refetch()}
          >
            إعادة المحاولة
          </button>
        </div>
      </main>
    );
  }

  if (
    expectedSlug &&
    settings.data &&
    settings.data.publicSlug !== expectedSlug
  ) {
    return (
      <main
        dir="rtl"
        className="brand-shell flex min-h-screen min-h-dvh items-center justify-center p-5"
      >
        <div className="brand-panel w-full max-w-md p-8 text-center">
          <Coffee className="mx-auto h-10 w-10 text-[#5A3825]" />

          <h1 className="mt-5 text-2xl font-bold text-[#4A3021]">
            رابط المنيو غير صحيح
          </h1>

          <p className="mt-3 leading-7 text-[#8D715D]">
            Menu not found
          </p>
        </div>
      </main>
    );
  }

  if (!brand.isPublished) {
    return (
      <main
        dir={isArabic ? "rtl" : "ltr"}
        className="min-h-screen min-h-dvh p-5"
        style={{ backgroundColor: brand.backgroundColor }}
      >
        <section className="mx-auto flex min-h-[calc(100dvh-2.5rem)] max-w-lg items-center justify-center">
          <div className="w-full rounded-[34px] border border-black/5 bg-white/70 p-8 text-center shadow-[0_24px_80px_rgba(68,42,26,0.12)] backdrop-blur">
            <BrandMark
              logoUrl={brand.logoUrl}
              primaryColor={brand.primaryColor}
            />

            <h1
              className="text-safe-wrap mt-6 text-3xl font-bold"
              style={{ color: brand.primaryColor }}
            >
              {displayName}
            </h1>

            <p
              className="brand-english mt-2 text-[10px]"
              style={{ color: brand.primaryColor }}
            >
              {isArabic
                ? brand.nameEn
                : brand.nameAr}
            </p>

            <div
              className="mx-auto my-6 h-px w-16 opacity-25"
              style={{ backgroundColor: brand.primaryColor }}
            />

            <p className="font-bold text-[#745B49]">
              {text.menuUnavailable}
            </p>

            <p className="mt-2 text-sm leading-7 text-[#947866]">
              {text.menuUnavailableDescription}
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="relative min-h-screen min-h-dvh overflow-x-clip"
      style={{
        backgroundColor: brand.backgroundColor,
        color: brand.primaryColor,
      }}
    >
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/70 blur-3xl" />
        <div className="absolute left-[-7rem] top-[34rem] h-80 w-80 rounded-full bg-[#C7B099]/20 blur-3xl" />
        <div className="absolute bottom-[-8rem] right-[10%] h-80 w-80 rounded-full bg-white/50 blur-3xl" />
      </div>

      <div className="vip-container relative">
        <header className="px-3 pb-3 pt-[max(0.75rem,var(--safe-top))] min-[390px]:px-4 sm:px-6 sm:pt-5">
          <div className="flex min-w-0 items-center justify-between gap-3 rounded-[22px] border border-black/5 bg-white/55 px-3 py-2.5 shadow-[0_8px_28px_rgba(70,43,28,0.06)] backdrop-blur-xl sm:rounded-[26px] sm:px-4">
            <div className="flex min-w-0 items-center gap-3">
              <BrandMark
                logoUrl={brand.logoUrl}
                primaryColor={brand.primaryColor}
                compact
              />

              <div className="min-w-0">
                <h1
                  className="truncate text-[15px] font-bold min-[390px]:text-lg"
                  style={{ color: brand.primaryColor }}
                >
                  {displayName}
                </h1>

                <p
                  className="brand-english mt-0.5 truncate text-[8px] opacity-60 min-[390px]:text-[9px]"
                  style={{ color: brand.primaryColor }}
                >
                  {isArabic ? brand.nameEn : brand.nameAr}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setLanguage((current) =>
                  current === "ar" ? "en" : "ar",
                )
              }
              className="touch-target inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-black/5 bg-white/75 px-3 text-[11px] font-bold shadow-sm transition hover:bg-white"
              style={{ color: brand.primaryColor }}
              aria-label={
                isArabic
                  ? "Switch to English"
                  : "التبديل إلى العربية"
              }
            >
              <Languages className="h-4 w-4" />
              <span>{isArabic ? "EN" : "عربي"}</span>
            </button>
          </div>
        </header>

        <section className="px-3 pt-3 min-[390px]:px-4 sm:px-6 sm:pt-5">
          <div className="relative overflow-hidden rounded-[30px] border border-black/5 bg-white/58 px-5 py-9 shadow-[0_28px_80px_rgba(68,42,26,0.10)] backdrop-blur-xl min-[390px]:rounded-[36px] min-[390px]:px-7 sm:px-10 sm:py-12 lg:grid lg:grid-cols-[1fr_0.72fr] lg:items-center lg:gap-10 lg:px-14 lg:py-14">
            <div className="pointer-events-none absolute -left-16 -top-20 h-52 w-52 rounded-full border border-[#C7B099]/20" />
            <div className="pointer-events-none absolute -bottom-20 -right-12 h-48 w-48 rounded-full border border-[#C7B099]/20" />

            <div className="relative text-center lg:text-start">
              <div
                className="mx-auto inline-flex items-center gap-2 rounded-full border border-black/5 bg-white/60 px-3 py-2 text-[10px] font-bold lg:mx-0"
                style={{ color: brand.primaryColor }}
              >
                <Crown className="h-3.5 w-3.5" />
                {text.digitalMenu}
              </div>

              <h2
                className="text-safe-wrap mx-auto mt-5 max-w-2xl text-[clamp(2rem,7vw,3.4rem)] font-bold leading-[1.16] lg:mx-0"
                style={{ color: brand.primaryColor }}
              >
                {displayDescription}
              </h2>

              <p
                className="brand-english mx-auto mt-4 max-w-xl text-[10px] leading-6 opacity-55 lg:mx-0"
                style={{ color: brand.primaryColor }}
              >
                AL MALQA CAFÉ · RIYADH
              </p>

              <div
                className="mx-auto mt-6 h-px w-16 opacity-25 lg:mx-0"
                style={{ backgroundColor: brand.primaryColor }}
              />

              <p className="mt-5 text-sm font-medium leading-7 text-[#806754] min-[390px]:text-base">
                {text.welcome}
              </p>
            </div>

            <div className="relative mt-8 lg:mt-0">
              <div className="mx-auto flex aspect-square w-full max-w-[17rem] items-center justify-center rounded-full border border-black/5 bg-white/65 p-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,.7),0_24px_60px_rgba(72,43,27,.10)] min-[390px]:max-w-[19rem]">
                <div className="flex h-full w-full items-center justify-center rounded-full border border-[#C7B099]/25 bg-[#F8EFE5]/60">
                  <BrandMark
                    logoUrl={brand.logoUrl}
                    primaryColor={brand.primaryColor}
                    hero
                  />
                </div>
              </div>

              <Sparkles
                className="absolute right-[8%] top-[5%] h-5 w-5 opacity-25"
                style={{ color: brand.primaryColor }}
              />

              <Sparkles
                className="absolute bottom-[10%] left-[6%] h-4 w-4 opacity-20"
                style={{ color: brand.primaryColor }}
              />
            </div>
          </div>
        </section>

        <section className="mt-11 px-3 min-[390px]:px-4 sm:mt-16 sm:px-6">
          <SectionHeading
            kicker={text.categoriesKicker}
            title={text.categoriesTitle}
            primaryColor={brand.primaryColor}
            side={
              <span className="text-[11px] font-medium text-[#9A806B]">
                {categories.data?.length ?? 0}{" "}
                {text.categoriesCount}
              </span>
            }
          />

          {categories.isLoading ? (
            <LoadingBlock text={text.loadingCategories} />
          ) : categories.data?.length ? (
            <div className="horizontal-scroll -mx-3 mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-3 pb-3 min-[390px]:-mx-4 min-[390px]:px-4 sm:mx-0 sm:flex sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0">
              {categories.data.map((category) => {
                const selected =
                  activeCategoryId === category.id;

                const categoryName = localize(
                  language,
                  category.nameAr,
                  category.nameEn,
                );

                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() =>
                      chooseCategory(
                        selected ? 0 : category.id,
                      )
                    }
                    className="group relative min-w-[76vw] max-w-[20rem] snap-center overflow-hidden rounded-[26px] border text-start shadow-[0_14px_42px_rgba(72,45,28,0.08)] transition sm:w-[18rem] sm:min-w-[18rem] sm:max-w-[18rem] sm:rounded-[28px] md:hover:-translate-y-1"
                    style={{
                      borderColor: selected
                        ? `${brand.primaryColor}55`
                        : "rgba(0,0,0,.05)",
                      backgroundColor: selected
                        ? "rgba(255,255,255,.94)"
                        : "rgba(255,255,255,.62)",
                    }}
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-[#EADBCF]">
                      {category.imageUrl ? (
                        <img
                          src={category.imageUrl}
                          alt={categoryName}
                          className="h-full w-full object-cover transition duration-500 md:group-hover:scale-[1.035]"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#F4E9DE] to-[#DCC4AE]">
                          <Coffee
                            className="h-10 w-10 opacity-40"
                            style={{
                              color: brand.primaryColor,
                            }}
                          />
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-[#2E2118]/65 via-transparent to-transparent" />

                      <span
                        className="absolute end-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-md"
                        style={{
                          color: brand.primaryColor,
                        }}
                      >
                        {selected ? (
                          <Check className="h-4 w-4" />
                        ) : isArabic ? (
                          <ChevronLeft className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </span>

                      <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                        <h3 className="text-safe-wrap text-xl font-bold">
                          {categoryName}
                        </h3>

                        {isArabic &&
                        category.nameEn ? (
                          <p className="brand-english mt-1 text-[8px] text-white/65">
                            {category.nameEn}
                          </p>
                        ) : !isArabic &&
                          category.nameAr ? (
                          <p className="mt-1 text-xs text-white/65">
                            {category.nameAr}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <EmptyBlock
              icon={<Layers3 className="h-9 w-9" />}
              title={text.noCategories}
              description={text.noCategoriesDescription}
              primaryColor={brand.primaryColor}
            />
          )}
        </section>

        {featuredProducts.length > 0 ? (
          <section className="mt-11 px-3 min-[390px]:px-4 sm:mt-16 sm:px-6">
            <SectionHeading
              kicker={text.featuredKicker}
              title={text.featuredTitle}
              primaryColor={brand.primaryColor}
            />

            <div className="mt-5 flex flex-wrap justify-center gap-4">
              {featuredProducts
                .slice(0, 6)
                .map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    currency={brand.currency}
                    primaryColor={brand.primaryColor}
                    language={language}
                    featured
                    onOpen={() =>
                      setSelectedProduct(product)
                    }
                  />
                ))}
            </div>
          </section>
        ) : null}

        <section
          ref={menuSectionRef}
          className="scroll-mt-4 mt-11 px-3 min-[390px]:px-4 sm:mt-16 sm:px-6"
        >
          <SectionHeading
            kicker={text.menuKicker}
            title={
              activeCategory
                ? localize(
                    language,
                    activeCategory.nameAr,
                    activeCategory.nameEn,
                  )
                : text.menuTitle
            }
            primaryColor={brand.primaryColor}
          />

          <div className="horizontal-scroll -mx-3 mt-5 flex gap-2 overflow-x-auto px-3 pb-3 min-[390px]:-mx-4 min-[390px]:px-4 sm:mx-0 sm:px-0">
            <CategoryPill
              label={text.all}
              selected={activeCategoryId === 0}
              primaryColor={brand.primaryColor}
              onClick={() => setActiveCategoryId(0)}
            />

            {categories.data?.map((category) => (
              <CategoryPill
                key={category.id}
                label={localize(
                  language,
                  category.nameAr,
                  category.nameEn,
                )}
                selected={
                  activeCategoryId === category.id
                }
                primaryColor={brand.primaryColor}
                onClick={() =>
                  setActiveCategoryId(category.id)
                }
              />
            ))}
          </div>

          {products.isLoading ? (
            <LoadingBlock text={text.loadingProducts} />
          ) : filteredProducts.length ? (
            <div className="mt-3 flex flex-wrap justify-center gap-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  currency={brand.currency}
                  primaryColor={brand.primaryColor}
                  language={language}
                  onOpen={() =>
                    setSelectedProduct(product)
                  }
                />
              ))}
            </div>
          ) : (
            <EmptyBlock
              icon={<Coffee className="h-9 w-9" />}
              title={text.noProducts}
              description={text.noProductsDescription}
              primaryColor={brand.primaryColor}
            />
          )}
        </section>

        <footer className="mt-14 px-3 pb-[max(1.5rem,var(--safe-bottom))] min-[390px]:px-4 sm:mt-20 sm:px-6">
          <div className="border-t border-[#5A3825]/10 py-8 text-center">
            <BrandMark
              logoUrl={brand.logoUrl}
              primaryColor={brand.primaryColor}
              compact
            />

            <p
              className="mt-4 text-sm font-bold"
              style={{ color: brand.primaryColor }}
            >
              {displayName}
            </p>

            <p
              className="brand-english mt-2 text-[8px] tracking-[0.22em] opacity-55"
              style={{ color: brand.primaryColor }}
            >
              {text.footer}
            </p>
          </div>
        </footer>
      </div>

      {selectedProduct ? (
        <ProductDetailsModal
          product={selectedProduct}
          language={language}
          currency={brand.currency}
          primaryColor={brand.primaryColor}
          onClose={() => setSelectedProduct(null)}
        />
      ) : null}
    </main>
  );
}

function ProductCard({
  product,
  currency,
  primaryColor,
  language,
  featured = false,
  onOpen,
}: {
  product: PublicProduct;
  currency: string;
  primaryColor: string;
  language: Language;
  featured?: boolean;
  onOpen: () => void;
}) {
  const text = copy[language];

  const productName = localize(
    language,
    product.nameAr,
    product.nameEn,
  );

  const description = localize(
    language,
    product.descriptionAr,
    product.descriptionEn,
  );

  const categoryName = localize(
    language,
    product.categoryNameAr,
    product.categoryNameEn,
  );

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`group w-full min-w-0 max-w-[24rem] overflow-hidden rounded-[26px] border bg-white/70 text-start shadow-[0_16px_46px_rgba(71,43,27,.08)] backdrop-blur transition min-[430px]:rounded-[30px] md:hover:-translate-y-1 ${
        !product.isAvailable ? "opacity-[0.78]" : ""
      }`}
      style={{
        borderColor: featured
          ? `${primaryColor}30`
          : "rgba(0,0,0,.05)",
      }}
      aria-label={`${text.viewDetails}: ${productName}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#EADBCF]">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={productName}
            className="h-full w-full object-cover transition duration-500 md:group-hover:scale-[1.035]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#F2E5D9] to-[#DFC9B5]">
            <ImageIcon
              className="h-11 w-11 opacity-40"
              style={{ color: primaryColor }}
            />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

        {product.isFeatured ? (
          <span
            className="absolute start-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/92 px-3 py-1.5 text-[10px] font-bold shadow-md backdrop-blur"
            style={{ color: primaryColor }}
          >
            <Star className="h-3 w-3 fill-current" />
            {text.featured}
          </span>
        ) : null}

        {!product.isAvailable ? (
          <span className="absolute inset-x-3 bottom-3 rounded-full bg-[#3B2A20]/90 px-3 py-2 text-center text-[11px] font-bold text-white shadow-lg backdrop-blur">
            {text.unavailable}
          </span>
        ) : null}
      </div>

      <div className="p-4 min-[430px]:p-5">
        <p className="text-[10px] font-bold text-[#A0846E]">
          {categoryName}
        </p>

        <div className="mt-1 flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <h3
              className="text-safe-wrap text-lg font-bold leading-7 min-[430px]:text-xl"
              style={{ color: primaryColor }}
            >
              {productName}
            </h3>

            {language === "ar" && product.nameEn ? (
              <p
                className="brand-english mt-1 text-[8px] opacity-50"
                style={{ color: primaryColor }}
              >
                {product.nameEn}
              </p>
            ) : language === "en" &&
              product.nameAr ? (
              <p className="mt-1 text-xs opacity-50">
                {product.nameAr}
              </p>
            ) : null}
          </div>

          <span
            className="shrink-0 text-xl font-bold"
            style={{ color: primaryColor }}
          >
            {formatPrice(product.price)}
          </span>
        </div>

        <p className="text-safe-wrap mt-3 line-clamp-2 min-h-12 text-sm leading-6 text-[#866B57]">
          {description || text.noDescription}
        </p>

        <div className="mt-4 flex items-center justify-between border-t border-[#5A3825]/8 pt-4">
          <span className="text-[11px] font-medium text-[#9A806B]">
            {currency}
          </span>

          <span
            className="inline-flex items-center gap-1 text-[11px] font-bold"
            style={{ color: primaryColor }}
          >
            {text.viewDetails}
            {language === "ar" ? (
              <ChevronLeft className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </span>
        </div>
      </div>
    </button>
  );
}

function ProductDetailsModal({
  product,
  language,
  currency,
  primaryColor,
  onClose,
}: {
  product: PublicProduct;
  language: Language;
  currency: string;
  primaryColor: string;
  onClose: () => void;
}) {
  const text = copy[language];

  const productName = localize(
    language,
    product.nameAr,
    product.nameEn,
  );

  const description = localize(
    language,
    product.descriptionAr,
    product.descriptionEn,
  );

  const categoryName = localize(
    language,
    product.categoryNameAr,
    product.categoryNameEn,
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#241810]/45 p-0 backdrop-blur-sm sm:items-center sm:p-5"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={productName}
        className="relative max-h-[92dvh] w-full overflow-y-auto rounded-t-[32px] border border-white/40 bg-[#FAF5EF] shadow-[0_-20px_70px_rgba(37,23,15,.25)] sm:max-w-2xl sm:rounded-[36px]"
        dir={language === "ar" ? "rtl" : "ltr"}
      >
        <div className="sticky top-0 z-10 flex justify-end bg-gradient-to-b from-[#FAF5EF] via-[#FAF5EF]/95 to-transparent p-3 pb-5 sm:p-4">
          <button
            type="button"
            onClick={onClose}
            className="touch-target flex h-11 w-11 items-center justify-center rounded-full border border-black/5 bg-white/90 shadow-sm"
            style={{ color: primaryColor }}
            aria-label={text.close}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="-mt-5 px-4 pb-[max(1.5rem,var(--safe-bottom))] sm:px-6 sm:pb-7">
          <div className="overflow-hidden rounded-[26px] bg-[#EADBCF] sm:rounded-[30px]">
            <div className="relative aspect-[16/11]">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={productName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#F2E5D9] to-[#DFC9B5]">
                  <ImageIcon
                    className="h-14 w-14 opacity-35"
                    style={{ color: primaryColor }}
                  />
                </div>
              )}

              {product.isFeatured ? (
                <span
                  className="absolute start-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/92 px-3 py-2 text-[11px] font-bold shadow-md"
                  style={{ color: primaryColor }}
                >
                  <Star className="h-3.5 w-3.5 fill-current" />
                  {text.featured}
                </span>
              ) : null}

              {!product.isAvailable ? (
                <div className="absolute inset-x-4 bottom-4 rounded-full bg-[#38271D]/92 px-4 py-2.5 text-center text-xs font-bold text-white backdrop-blur">
                  {text.unavailable}
                </div>
              ) : null}
            </div>
          </div>

          <div className="px-1 pb-2 pt-6 sm:px-2">
            <p className="text-[11px] font-bold text-[#A0846E]">
              {categoryName}
            </p>

            <h2
              className="text-safe-wrap mt-1 text-2xl font-bold leading-9 min-[390px]:text-3xl"
              style={{ color: primaryColor }}
            >
              {productName}
            </h2>

            {language === "ar" && product.nameEn ? (
              <p
                className="brand-english mt-2 text-[9px] opacity-50"
                style={{ color: primaryColor }}
              >
                {product.nameEn}
              </p>
            ) : language === "en" &&
              product.nameAr ? (
              <p
                className="mt-2 text-sm opacity-50"
                style={{ color: primaryColor }}
              >
                {product.nameAr}
              </p>
            ) : null}

            <div
              className="my-5 h-px w-full opacity-10"
              style={{ backgroundColor: primaryColor }}
            />

            <p className="text-safe-wrap text-sm leading-7 text-[#806754] min-[390px]:text-base min-[390px]:leading-8">
              {description || text.noDescription}
            </p>

            <div className="mt-7 flex items-end justify-between rounded-[22px] border border-black/5 bg-white/60 p-4">
              <span className="text-xs font-medium text-[#9A806B]">
                {text.price}
              </span>

              <div
                className="flex items-baseline gap-2"
                style={{ color: primaryColor }}
              >
                <span className="text-3xl font-bold">
                  {formatPrice(product.price)}
                </span>
                <span className="text-xs font-bold opacity-60">
                  {currency}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function CategoryPill({
  label,
  selected,
  primaryColor,
  onClick,
}: {
  label: string;
  selected: boolean;
  primaryColor: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="touch-target shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-xs font-bold shadow-sm transition"
      style={{
        borderColor: selected
          ? primaryColor
          : "rgba(90,56,37,.10)",
        backgroundColor: selected
          ? primaryColor
          : "rgba(255,255,255,.65)",
        color: selected ? "#FFFFFF" : primaryColor,
      }}
    >
      {label}
    </button>
  );
}

function SectionHeading({
  kicker,
  title,
  primaryColor,
  side,
}: {
  kicker: string;
  title: string;
  primaryColor: string;
  side?: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-end justify-between gap-4">
      <div className="min-w-0">
        <p
          className="brand-kicker"
          style={{ color: primaryColor }}
        >
          {kicker}
        </p>

        <h2
          className="text-safe-wrap mt-1 text-2xl font-bold min-[390px]:text-[1.7rem]"
          style={{ color: primaryColor }}
        >
          {title}
        </h2>
      </div>

      {side}
    </div>
  );
}

function LoadingBlock({ text }: { text: string }) {
  return (
    <div className="mt-5 animate-pulse rounded-[26px] border border-black/5 bg-white/50 px-5 py-12 text-center text-sm text-[#8D715D]">
      {text}
    </div>
  );
}

function EmptyBlock({
  icon,
  title,
  description,
  primaryColor,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  primaryColor: string;
}) {
  return (
    <div className="mt-5 rounded-[28px] border border-dashed border-black/10 bg-white/45 px-5 py-12 text-center">
      <div
        className="mx-auto w-fit opacity-45"
        style={{ color: primaryColor }}
      >
        {icon}
      </div>

      <h3
        className="mt-4 font-bold"
        style={{ color: primaryColor }}
      >
        {title}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-[#92745E]">
        {description}
      </p>
    </div>
  );
}

function BrandMark({
  logoUrl,
  primaryColor,
  compact = false,
  hero = false,
}: {
  logoUrl: string;
  primaryColor: string;
  compact?: boolean;
  hero?: boolean;
}) {
  const size = hero
    ? "h-36 w-36 min-[390px]:h-40 min-[390px]:w-40"
    : compact
      ? "h-11 w-11 min-[390px]:h-12 min-[390px]:w-12"
      : "h-24 w-24";

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt="شعار الكوفي"
        className={`${size} mx-auto rounded-full object-contain`}
      />
    );
  }

  return (
    <div
      className={`${size} mx-auto flex flex-col items-center justify-center rounded-full border bg-white/45 shadow-sm`}
      style={{
        borderColor: `${primaryColor}35`,
        color: primaryColor,
      }}
    >
      <Coffee
        className={
          hero
            ? "h-12 w-12"
            : compact
              ? "h-5 w-5"
              : "h-8 w-8"
        }
      />

      {!compact && !hero ? (
        <span className="mt-1 text-[10px] font-bold">
          الملقا
        </span>
      ) : null}
    </div>
  );
}

function localize(
  language: Language,
  arabic: string,
  english: string,
) {
  if (language === "en" && english.trim()) {
    return english;
  }

  return arabic;
}

function formatPrice(price: number) {
  return Number.isInteger(price)
    ? String(price)
    : price.toFixed(2);
}
