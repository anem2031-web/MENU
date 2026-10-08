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
  Home,
  Image as ImageIcon,
  Languages,
  Layers3,
  Menu as MenuIcon,
  MoreHorizontal,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  Star,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { trpc } from "../lib/trpc";

type Language = "ar" | "en";
type MobileScreen = "categories" | "products";

type PublicCategory = {
  id: number;
  nameAr: string;
  nameEn: string;
  imageUrl: string;
};

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
  welcomeEnabled: true,
  welcomeLogoKey: "",
  welcomeLogoUrl: "",
  welcomeTitleAr: "أهلًا وسهلًا بكم",
  welcomeTitleEn: "Welcome",
  welcomeSubtitleAr: "في قهوة الملقا",
  welcomeSubtitleEn: "at Al Malqa Cafe",
  welcomeDescriptionAr: "نجعل كل زيارة لحظة دافئة ومميزة",
  welcomeDescriptionEn: "We make every visit a warm and memorable moment",
  welcomeButtonAr: "استعرض المنيو",
  welcomeButtonEn: "View Menu",
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
  const [mobileScreen, setMobileScreen] =
    useState<MobileScreen>("categories");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileSearchTerm, setMobileSearchTerm] = useState("");
  const [welcomeEntered, setWelcomeEntered] = useState(false);

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

  const mobileVisibleCategories = useMemo(() => {
    const term = mobileSearchTerm.trim().toLocaleLowerCase();
    const rows = (categories.data ?? []) as PublicCategory[];

    if (!term || mobileScreen !== "categories") {
      return rows;
    }

    return rows.filter((category) =>
      `${category.nameAr} ${category.nameEn}`
        .toLocaleLowerCase()
        .includes(term),
    );
  }, [categories.data, mobileScreen, mobileSearchTerm]);

  const mobileVisibleProducts = useMemo(() => {
    const term = mobileSearchTerm.trim().toLocaleLowerCase();
    const rows = filteredProducts;

    if (!term || mobileScreen !== "products") {
      return rows;
    }

    return rows.filter((product) =>
      `${product.nameAr} ${product.nameEn} ${product.categoryNameAr} ${product.categoryNameEn}`
        .toLocaleLowerCase()
        .includes(term),
    );
  }, [filteredProducts, mobileScreen, mobileSearchTerm]);

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

  const openMobileCategory = (categoryId: number) => {
    setActiveCategoryId(categoryId);
    setMobileScreen("products");
    setMobileSearchOpen(false);
    setMobileSearchTerm("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const showMobileCategories = () => {
    setMobileScreen("categories");
    setMobileSearchOpen(false);
    setMobileSearchTerm("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const showAllMobileProducts = () => {
    setActiveCategoryId(0);
    setMobileScreen("products");
    setMobileSearchOpen(false);
    setMobileSearchTerm("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (settings.isLoading) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen min-h-dvh items-center justify-center p-5"
        style={{ backgroundColor: defaultBrand.backgroundColor }}
      >
        <div className="text-center" style={{ color: defaultBrand.primaryColor }}>
          <Coffee className="mx-auto h-9 w-9 animate-pulse" />
          <p className="mt-4 text-sm font-bold">جاري تجهيز المنيو...</p>
        </div>
      </main>
    );
  }

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

  if (brand.welcomeEnabled && !welcomeEntered) {
    return (
      <WelcomeScreen
        brand={brand}
        language={language}
        onEnter={() => {
          setWelcomeEntered(true);
          setMobileScreen("categories");
          setActiveCategoryId(0);
          setMobileSearchOpen(false);
          setMobileSearchTerm("");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onToggleLanguage={() =>
          setLanguage((current) => current === "ar" ? "en" : "ar")
        }
      />
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
      <div className="pointer-events-none fixed inset-0 hidden overflow-hidden sm:block">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/70 blur-3xl" />
        <div className="absolute left-[-7rem] top-[34rem] h-80 w-80 rounded-full bg-[#C7B099]/20 blur-3xl" />
        <div className="absolute bottom-[-8rem] right-[10%] h-80 w-80 rounded-full bg-white/50 blur-3xl" />
      </div>

      <MobileMenuExperience
        brand={brand}
        language={language}
        categories={mobileVisibleCategories}
        products={mobileVisibleProducts}
        allCategories={(categories.data ?? []) as PublicCategory[]}
        activeCategoryId={activeCategoryId}
        activeCategory={activeCategory as PublicCategory | undefined}
        screen={mobileScreen}
        searchOpen={mobileSearchOpen}
        searchTerm={mobileSearchTerm}
        categoriesLoading={categories.isLoading}
        productsLoading={products.isLoading}
        onSearchToggle={() => {
          setMobileSearchOpen((current) => !current);
          setMobileSearchTerm("");
        }}
        onSearchChange={setMobileSearchTerm}
        onOpenCategory={openMobileCategory}
        onBack={showMobileCategories}
        onBackToWelcome={() => {
          if (brand.welcomeEnabled) {
            setWelcomeEntered(false);
            setMobileScreen("categories");
            setActiveCategoryId(0);
            setMobileSearchOpen(false);
            setMobileSearchTerm("");
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
          }

          if (window.history.length > 1) {
            window.history.back();
          }
        }}
        onShowAllProducts={showAllMobileProducts}
        onSelectCategory={(categoryId) => {
          setActiveCategoryId(categoryId);
          setMobileScreen("products");
          setMobileSearchTerm("");
        }}
        onOpenProduct={setSelectedProduct}
        onToggleLanguage={() =>
          setLanguage((current) => current === "ar" ? "en" : "ar")
        }
      />

      <div className="vip-container relative hidden sm:block">
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

function WelcomeScreen({
  brand,
  language,
  onEnter,
  onToggleLanguage,
}: {
  brand: {
    nameAr: string;
    nameEn: string;
    primaryColor: string;
    backgroundColor: string;
    welcomeLogoUrl: string;
    welcomeTitleAr: string;
    welcomeTitleEn: string;
    welcomeSubtitleAr: string;
    welcomeSubtitleEn: string;
    welcomeDescriptionAr: string;
    welcomeDescriptionEn: string;
    welcomeButtonAr: string;
    welcomeButtonEn: string;
  };
  language: Language;
  onEnter: () => void;
  onToggleLanguage: () => void;
}) {
  const isArabic = language === "ar";
  const title = localize(language, brand.welcomeTitleAr, brand.welcomeTitleEn);
  const subtitle = localize(language, brand.welcomeSubtitleAr, brand.welcomeSubtitleEn);
  const description = localize(language, brand.welcomeDescriptionAr, brand.welcomeDescriptionEn);
  const buttonLabel = localize(language, brand.welcomeButtonAr, brand.welcomeButtonEn);

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="relative isolate flex min-h-screen min-h-dvh overflow-hidden px-[max(1.25rem,var(--safe-left))] py-[max(1.25rem,var(--safe-top))]"
      style={{ backgroundColor: brand.backgroundColor, color: brand.primaryColor }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div
          className="absolute -right-24 -top-24 h-80 w-80 rounded-full blur-2xl sm:h-[30rem] sm:w-[30rem]"
          style={{ backgroundColor: `${brand.primaryColor}10` }}
        />
        <div
          className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full blur-3xl sm:h-[34rem] sm:w-[34rem]"
          style={{ backgroundColor: `${brand.primaryColor}0D` }}
        />
        <div
          className="absolute left-1/2 top-[16%] h-48 w-48 -translate-x-1/2 rounded-full border sm:h-64 sm:w-64"
          style={{ borderColor: `${brand.primaryColor}12` }}
        />
        <div
          className="absolute left-1/2 top-[16%] h-56 w-56 -translate-x-1/2 rounded-full border sm:h-72 sm:w-72"
          style={{ borderColor: `${brand.primaryColor}0A` }}
        />
      </div>

      <button
        type="button"
        onClick={onToggleLanguage}
        className="absolute end-[max(1rem,var(--safe-right))] top-[max(1rem,var(--safe-top))] z-20 flex min-h-11 items-center gap-2 rounded-full border border-black/5 bg-white/55 px-3.5 text-xs font-bold shadow-sm backdrop-blur-md"
        style={{ color: brand.primaryColor }}
        aria-label={isArabic ? "Change language" : "تغيير اللغة"}
      >
        <Languages className="h-4 w-4" />
        {isArabic ? "EN" : "عربي"}
      </button>

      <section className="relative z-10 m-auto flex w-full max-w-xl flex-col items-center text-center">
        {brand.welcomeLogoUrl ? (
          <div className="mb-7 flex h-32 w-32 items-center justify-center rounded-full border border-black/5 bg-white/60 p-4 shadow-[0_20px_55px_rgba(68,42,26,0.14)] backdrop-blur-xl sm:h-40 sm:w-40 sm:p-5">
            <img
              src={brand.welcomeLogoUrl}
              alt={isArabic ? "شعار المقهى" : "Cafe logo"}
              className="max-h-full max-w-full object-contain"
            />
          </div>
        ) : null}

        <p
          className="brand-english text-[9px] font-bold tracking-[0.32em] opacity-55 sm:text-[10px]"
          style={{ color: brand.primaryColor }}
        >
          {isArabic ? "WELCOME" : brand.nameEn || "AL MALQA CAFE"}
        </p>

        <h1 className="text-safe-wrap mt-3 text-4xl font-black leading-[1.25] sm:text-5xl" style={{ color: brand.primaryColor }}>
          {title || (isArabic ? "أهلًا وسهلًا بكم" : "Welcome")}
        </h1>

        <p className="mt-3 text-lg font-extrabold sm:text-xl" style={{ color: brand.primaryColor }}>
          {subtitle || (isArabic ? brand.nameAr : brand.nameEn || brand.nameAr)}
        </p>

        <div className="my-6 flex items-center gap-3" aria-hidden="true">
          <span className="h-px w-10 opacity-25" style={{ backgroundColor: brand.primaryColor }} />
          <Coffee className="h-4 w-4 opacity-45" />
          <span className="h-px w-10 opacity-25" style={{ backgroundColor: brand.primaryColor }} />
        </div>

        {description ? (
          <p className="text-safe-wrap mx-auto max-w-md text-sm font-medium leading-7 opacity-70 sm:text-base sm:leading-8">
            {description}
          </p>
        ) : null}

        <button
          type="button"
          onClick={onEnter}
          className="mt-9 flex min-h-14 w-full max-w-sm items-center justify-center gap-3 rounded-2xl px-6 py-4 text-base font-black text-white shadow-[0_18px_38px_rgba(68,42,26,0.18)] transition active:scale-[0.99] sm:w-auto sm:min-w-72"
          style={{ backgroundColor: brand.primaryColor }}
        >
          <span>{buttonLabel || (isArabic ? "استعرض المنيو" : "View Menu")}</span>
          {isArabic ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </button>

        <p className="brand-english mt-8 text-[8px] tracking-[0.2em] opacity-35">
          {isArabic ? brand.nameEn : brand.nameAr}
        </p>
      </section>
    </main>
  );
}

function MobileMenuExperience({
  brand,
  language,
  categories,
  products,
  allCategories,
  activeCategoryId,
  activeCategory,
  screen,
  searchOpen,
  searchTerm,
  categoriesLoading,
  productsLoading,
  onSearchToggle,
  onSearchChange,
  onOpenCategory,
  onBack,
  onBackToWelcome,
  onShowAllProducts,
  onSelectCategory,
  onOpenProduct,
  onToggleLanguage,
}: {
  brand: typeof defaultBrand;
  language: Language;
  categories: PublicCategory[];
  products: PublicProduct[];
  allCategories: PublicCategory[];
  activeCategoryId: number;
  activeCategory: PublicCategory | undefined;
  screen: MobileScreen;
  searchOpen: boolean;
  searchTerm: string;
  categoriesLoading: boolean;
  productsLoading: boolean;
  onSearchToggle: () => void;
  onSearchChange: (value: string) => void;
  onOpenCategory: (categoryId: number) => void;
  onBack: () => void;
  onBackToWelcome: () => void;
  onShowAllProducts: () => void;
  onSelectCategory: (categoryId: number) => void;
  onOpenProduct: (product: PublicProduct) => void;
  onToggleLanguage: () => void;
}) {
  const isArabic = language === "ar";
  const text = copy[language];
  const currentTitle = activeCategory
    ? localize(language, activeCategory.nameAr, activeCategory.nameEn)
    : text.menuTitle;

  return (
    <div className={`mobile-menu-shell sm:hidden ${screen === "categories" ? "is-categories" : ""}`}>
      <header className={`mobile-menu-header ${screen === "categories" ? "is-category-header" : ""}`}>
        <div className="mobile-menu-topbar" dir="ltr">
          <button
            type="button"
            className="mobile-icon-button"
            onClick={screen === "products" ? onBack : onBackToWelcome}
            aria-label={screen === "products" ? (isArabic ? "العودة للأقسام" : "Back to categories") : (isArabic ? "العودة لصفحة الترحيب" : "Back to welcome page")}
          >
            <ChevronLeft className="h-[19px] w-[19px]" />
          </button>

          <div className="min-w-0 flex-1 text-center" dir={isArabic ? "rtl" : "ltr"}>
            <h1 className={`truncate font-extrabold text-[#30251f] ${screen === "categories" ? "text-[17px] leading-6" : "text-[18px] leading-7"}`}>
              {screen === "categories"
                ? (isArabic ? "اختر الفئة" : "Choose a category")
                : currentTitle}
            </h1>
            {screen === "categories" ? (
              <p className="mobile-category-header-subtitle">
                {isArabic ? "CHOOSE A CATEGORY" : "اختر الفئة"}
              </p>
            ) : null}
          </div>

          {screen === "products" ? (
            <button
              type="button"
              className="mobile-icon-button"
              onClick={onSearchToggle}
              aria-label={isArabic ? "بحث" : "Search"}
            >
              {searchOpen ? <X className="h-[18px] w-[18px]" /> : <Search className="h-[19px] w-[19px]" />}
            </button>
          ) : (
            <span className="mobile-header-spacer" aria-hidden="true" />
          )}
        </div>

        {screen === "products" && searchOpen ? (
          <div className="mobile-search-wrap">
            <Search className="h-4 w-4 shrink-0 text-[#9c8d83]" />
            <input
              autoFocus
              value={searchTerm}
              onChange={(event) => onSearchChange(event.target.value)}
              className="mobile-search-input"
              placeholder={isArabic ? "ابحث في المنيو..." : "Search the menu..."}
              aria-label={isArabic ? "بحث في المنيو" : "Search menu"}
            />
          </div>
        ) : null}
      </header>

      <div className="mobile-menu-content">
        {screen === "categories" ? (
          <section aria-label={text.categoriesTitle}>
            {categoriesLoading ? (
              <MobileSkeleton count={4} variant="category" />
            ) : categories.length ? (
              <div className="mobile-category-list">
                {categories.map((category) => {
                  const categoryName = localize(language, category.nameAr, category.nameEn);
                  const secondaryName = isArabic ? category.nameEn : category.nameAr;

                  return (
                    <button
                      key={category.id}
                      type="button"
                      className="mobile-category-card group"
                      onClick={() => onOpenCategory(category.id)}
                    >
                      <div className="mobile-category-media" aria-hidden="true">
                        {category.imageUrl ? (
                          <img
                            src={category.imageUrl}
                            alt=""
                            className="h-full w-full object-cover transition duration-500 group-active:scale-[1.02]"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#f2e9e1] to-[#ddcec1]">
                            <Coffee className="h-10 w-10 text-[#9a8271]/55" />
                          </div>
                        )}
                      </div>

                      <div className="mobile-category-media-fade" aria-hidden="true" />

                      <div className="mobile-category-card-copy" dir={isArabic ? "rtl" : "ltr"}>
                        <h2 className="truncate text-[16px] font-extrabold leading-6 text-[#3c312b]">
                          {categoryName}
                        </h2>
                        {secondaryName ? (
                          <p className="mt-1 truncate text-[9px] font-semibold tracking-[0.18em] text-[#9d8d82]">
                            {secondaryName}
                          </p>
                        ) : null}
                      </div>

                      <span className="mobile-category-chevron" aria-hidden="true">
                        <ChevronRight className="h-[18px] w-[18px]" />
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <MobileEmpty
                title={searchTerm ? (isArabic ? "لا توجد نتائج" : "No results") : text.noCategories}
                description={searchTerm ? (isArabic ? "جرّب كلمة بحث أخرى." : "Try another search term.") : text.noCategoriesDescription}
              />
            )}
          </section>
        ) : (
          <section aria-label={currentTitle}>
            <div className="horizontal-scroll -mx-3 flex gap-2 overflow-x-auto px-3 pb-3">
              <MobileCategoryChip
                label={text.all}
                selected={activeCategoryId === 0}
                primaryColor={brand.primaryColor}
                onClick={onShowAllProducts}
              />
              {allCategories.map((category) => (
                <MobileCategoryChip
                  key={category.id}
                  label={localize(language, category.nameAr, category.nameEn)}
                  selected={activeCategoryId === category.id}
                  primaryColor={brand.primaryColor}
                  onClick={() => onSelectCategory(category.id)}
                />
              ))}
            </div>

            {productsLoading ? (
              <MobileSkeleton count={6} variant="product" />
            ) : products.length ? (
              <div className="grid grid-cols-2 gap-x-2.5 gap-y-4 pt-1">
                {products.map((product) => (
                  <MobileProductCard
                    key={product.id}
                    product={product}
                    language={language}
                    currency={brand.currency}
                    primaryColor={brand.primaryColor}
                    onOpen={() => onOpenProduct(product)}
                  />
                ))}
              </div>
            ) : (
              <MobileEmpty
                title={searchTerm ? (isArabic ? "لا توجد نتائج" : "No results") : text.noProducts}
                description={searchTerm ? (isArabic ? "جرّب كلمة بحث أخرى." : "Try another search term.") : text.noProductsDescription}
              />
            )}
          </section>
        )}
      </div>

      {screen === "products" ? (
        <nav className="mobile-bottom-nav" aria-label={isArabic ? "التنقل الرئيسي" : "Main navigation"}>
          <button type="button" className="mobile-nav-item" onClick={onBack}>
            <Home className="h-[18px] w-[18px]" />
            <span>{isArabic ? "الرئيسية" : "Home"}</span>
          </button>
          <button type="button" className="mobile-nav-item is-active" onClick={onShowAllProducts} style={{ color: brand.primaryColor }}>
            <UtensilsCrossed className="h-[19px] w-[19px]" />
            <span>{isArabic ? "المنيو" : "Menu"}</span>
          </button>
          <button type="button" className="mobile-nav-item" disabled aria-disabled="true">
            <ShoppingBag className="h-[18px] w-[18px]" />
            <span>{isArabic ? "الطلبات" : "Orders"}</span>
          </button>
          <button type="button" className="mobile-nav-item" onClick={onToggleLanguage}>
            <MoreHorizontal className="h-[19px] w-[19px]" />
            <span>{isArabic ? "المزيد" : "More"}</span>
          </button>
        </nav>
      ) : null}
    </div>
  );
}

function MobileProductCard({
  product,
  language,
  currency,
  primaryColor,
  onOpen,
}: {
  product: PublicProduct;
  language: Language;
  currency: string;
  primaryColor: string;
  onOpen: () => void;
}) {
  const name = localize(language, product.nameAr, product.nameEn);
  const isArabic = language === "ar";

  return (
    <article className={`min-w-0 ${product.isAvailable ? "" : "opacity-60"}`}>
      <button type="button" onClick={onOpen} className="block w-full text-start" aria-label={`${copy[language].viewDetails}: ${name}`}>
        <div className="relative aspect-[1.04/1] overflow-hidden rounded-[13px] bg-[#e9e0d8] shadow-[0_2px_8px_rgba(52,39,31,.08)]">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={name} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#f0e7df] to-[#d8c5b6]">
              <ImageIcon className="h-8 w-8 text-[#9c897a]/55" />
            </div>
          )}
          {product.isFeatured ? (
            <span className="absolute start-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 shadow-sm" style={{ color: primaryColor }}>
              <Star className="h-3 w-3 fill-current" />
            </span>
          ) : null}
        </div>

        <div className="pt-2">
          <h3 className="line-clamp-1 text-[13px] font-bold leading-5 text-[#3a302a]">{name}</h3>
          <div className="mt-0.5 flex items-center justify-between gap-1.5">
            <span className="min-w-0 truncate text-[11px] font-extrabold" style={{ color: primaryColor }}>
              {formatPrice(product.price)} <span className="text-[9px] font-bold opacity-80">{currency}</span>
            </span>
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white shadow-sm" style={{ backgroundColor: primaryColor }} aria-hidden="true">
              <Plus className="h-3.5 w-3.5" />
            </span>
          </div>
          {!product.isAvailable ? (
            <p className="mt-1 text-[9px] font-bold text-[#9a4c42]">{isArabic ? "غير متوفر" : "Unavailable"}</p>
          ) : null}
        </div>
      </button>
    </article>
  );
}

function MobileCategoryChip({
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
      className="shrink-0 whitespace-nowrap rounded-[9px] border px-3 py-2 text-[11px] font-bold transition"
      style={{
        backgroundColor: selected ? primaryColor : "#f6f1ed",
        borderColor: selected ? primaryColor : "#eee5df",
        color: selected ? "#fff" : "#75665d",
      }}
    >
      {label}
    </button>
  );
}

function MobileSkeleton({ count, variant }: { count: number; variant: "category" | "product" }) {
  if (variant === "category") {
    return (
      <div className="space-y-2.5">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="h-[148px] animate-pulse rounded-[17px] bg-black/[.06]" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-2.5 gap-y-4 pt-1">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="animate-pulse">
          <div className="aspect-[1.04/1] rounded-[13px] bg-black/[.06]" />
          <div className="mt-2 h-3 w-4/5 rounded bg-black/[.06]" />
          <div className="mt-2 h-3 w-1/2 rounded bg-black/[.06]" />
        </div>
      ))}
    </div>
  );
}

function MobileEmpty({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[18px] border border-dashed border-black/10 bg-white/60 px-5 py-10 text-center">
      <MenuIcon className="mx-auto h-7 w-7 text-[#9a887c]" />
      <h2 className="mt-3 text-sm font-extrabold text-[#4b3b32]">{title}</h2>
      <p className="mt-1.5 text-[11px] leading-5 text-[#998a80]">{description}</p>
    </div>
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
