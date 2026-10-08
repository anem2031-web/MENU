import { FormEvent, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Banknote,
  CheckCircle2,
  ChevronLeft,
  Eye,
  EyeOff,
  Globe2,
  Image as ImageIcon,
  ImagePlus,
  Languages,
  Layers3,
  Loader2,
  LogOut,
  PackageOpen,
  Palette,
  Pencil,
  Plus,
  QrCode,
  Copy,
  Download,
  ExternalLink,
  Save,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { trpc } from "../lib/trpc";
import { uploadAdminImage } from "../lib/upload";

type SettingsForm = {
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  logoKey: string;
  logoUrl: string;
  welcomeEnabled: boolean;
  welcomeLogoKey: string;
  welcomeLogoUrl: string;
  welcomeTitleAr: string;
  welcomeTitleEn: string;
  welcomeSubtitleAr: string;
  welcomeSubtitleEn: string;
  welcomeDescriptionAr: string;
  welcomeDescriptionEn: string;
  welcomeButtonAr: string;
  welcomeButtonEn: string;
  primaryColor: string;
  backgroundColor: string;
  currency: string;
  defaultLanguage: "ar" | "en";
  publicSlug: string;
  isPublished: boolean;
};

type MenuGroupForm = {
  id: number | null;
  nameAr: string;
  nameEn: string;
  imageKey: string;
  imageUrl: string;
  sortOrder: number;
  isVisible: boolean;
};

type CategoryForm = {
  id: number | null;
  menuGroupId: number;
  nameAr: string;
  nameEn: string;
  imageKey: string;
  imageUrl: string;
  sortOrder: number;
  isVisible: boolean;
};

type ProductForm = {
  id: number | null;
  categoryId: number;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  price: number;
  imageKey: string;
  imageUrl: string;
  sortOrder: number;
  isVisible: boolean;
  isAvailable: boolean;
  isFeatured: boolean;
};

type AdminSection = "settings" | "welcome" | "groups" | "categories" | "products" | "qr";

type AdminMenuGroup = {
  id: number;
  nameAr: string;
  nameEn: string;
  imageKey: string;
  imageUrl: string;
  sortOrder: number;
  isVisible: boolean;
};

type AdminCategory = {
  id: number;
  menuGroupId: number;
  nameAr: string;
  nameEn: string;
  imageKey: string;
  imageUrl: string;
  sortOrder: number;
  isVisible: boolean;
};

type AdminProduct = {
  id: number;
  categoryId: number;
  categoryNameAr: string;
  categoryNameEn: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  price: number;
  imageKey: string;
  imageUrl: string;
  sortOrder: number;
  isVisible: boolean;
  isAvailable: boolean;
  isFeatured: boolean;
};

const emptySettings: SettingsForm = {
  nameAr: "كوفي الملقا",
  nameEn: "Al Malqa Cafe",
  descriptionAr: "تجربة راقية .. ببساطة",
  descriptionEn: "A refined experience in simple ways",
  logoKey: "",
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
  defaultLanguage: "ar",
  publicSlug: "al-malqa",
  isPublished: true,
};

const emptyGroup: MenuGroupForm = {
  id: null,
  nameAr: "",
  nameEn: "",
  imageKey: "",
  imageUrl: "",
  sortOrder: 10,
  isVisible: true,
};

const emptyCategory: CategoryForm = {
  id: null,
  menuGroupId: 0,
  nameAr: "",
  nameEn: "",
  imageKey: "",
  imageUrl: "",
  sortOrder: 10,
  isVisible: true,
};

const emptyProduct: ProductForm = {
  id: null,
  categoryId: 0,
  nameAr: "",
  nameEn: "",
  descriptionAr: "",
  descriptionEn: "",
  price: 0,
  imageKey: "",
  imageUrl: "",
  sortOrder: 10,
  isVisible: true,
  isAvailable: true,
  isFeatured: false,
};

export function AdminPage() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const me = trpc.auth.me.useQuery(undefined, { retry: false });
  const settings = trpc.admin.settings.useQuery(undefined, {
    enabled: Boolean(me.data),
    retry: false,
  });
  const menuGroups = trpc.admin.menuGroups.useQuery(undefined, {
    enabled: Boolean(me.data),
    retry: false,
  });
  const categories = trpc.admin.categories.useQuery(undefined, {
    enabled: Boolean(me.data),
    retry: false,
  });
  const products = trpc.admin.products.useQuery(undefined, {
    enabled: Boolean(me.data),
    retry: false,
  });

  const [section, setSection] = useState<AdminSection>("settings");
  const [form, setForm] = useState<SettingsForm>(emptySettings);
  // Keep settings unsavable while any logo image is still being uploaded.
  const [settingsUploadCount, setSettingsUploadCount] = useState(0);
  const [groupForm, setGroupForm] = useState<MenuGroupForm>(emptyGroup);
  const [categoryForm, setCategoryForm] = useState<CategoryForm>(emptyCategory);
  const [productForm, setProductForm] = useState<ProductForm>(emptyProduct);
  const [productCategoryFilter, setProductCategoryFilter] = useState<number>(0);

  useEffect(() => {
    if (!me.isLoading && !me.data) navigate("/admin/login", { replace: true });
  }, [me.isLoading, me.data, navigate]);

  useEffect(() => {
    if (!settings.data) return;
    setForm({
      nameAr: settings.data.nameAr,
      nameEn: settings.data.nameEn,
      descriptionAr: settings.data.descriptionAr,
      descriptionEn: settings.data.descriptionEn,
      logoKey: settings.data.logoKey,
      logoUrl: settings.data.logoUrl,
      welcomeEnabled: settings.data.welcomeEnabled,
      welcomeLogoKey: settings.data.welcomeLogoKey,
      welcomeLogoUrl: settings.data.welcomeLogoUrl,
      welcomeTitleAr: settings.data.welcomeTitleAr,
      welcomeTitleEn: settings.data.welcomeTitleEn,
      welcomeSubtitleAr: settings.data.welcomeSubtitleAr,
      welcomeSubtitleEn: settings.data.welcomeSubtitleEn,
      welcomeDescriptionAr: settings.data.welcomeDescriptionAr,
      welcomeDescriptionEn: settings.data.welcomeDescriptionEn,
      welcomeButtonAr: settings.data.welcomeButtonAr,
      welcomeButtonEn: settings.data.welcomeButtonEn,
      primaryColor: settings.data.primaryColor,
      backgroundColor: settings.data.backgroundColor,
      currency: settings.data.currency,
      defaultLanguage: settings.data.defaultLanguage,
      publicSlug: settings.data.publicSlug,
      isPublished: settings.data.isPublished,
    });
  }, [settings.data]);

  const nextGroupSortOrder = useMemo(() => {
    if (!menuGroups.data?.length) return 10;
    return Math.max(...menuGroups.data.map((item) => item.sortOrder)) + 10;
  }, [menuGroups.data]);

  const nextCategorySortOrder = useMemo(() => {
    if (!categories.data?.length) return 10;
    return Math.max(...categories.data.map((item) => item.sortOrder)) + 10;
  }, [categories.data]);

  const nextProductSortOrder = useMemo(() => {
    const categoryId = productForm.categoryId || categories.data?.[0]?.id || 0;
    const categoryProducts = products.data?.filter((item) => item.categoryId === categoryId) ?? [];
    if (!categoryProducts.length) return 10;
    return Math.max(...categoryProducts.map((item) => item.sortOrder)) + 10;
  }, [products.data, productForm.categoryId, categories.data]);

  const filteredProducts = useMemo(() => {
    if (!products.data) return [];
    if (!productCategoryFilter) return products.data;
    return products.data.filter((item) => item.categoryId === productCategoryFilter);
  }, [products.data, productCategoryFilter]);

  const invalidateMenuGroups = async () => {
    await Promise.all([
      utils.admin.menuGroups.invalidate(),
      utils.cafe.publicMenuGroups.invalidate(),
      utils.admin.categories.invalidate(),
      utils.cafe.publicCategories.invalidate(),
      utils.cafe.publicProducts.invalidate(),
    ]);
  };

  const invalidateCategories = async () => {
    await Promise.all([
      utils.admin.categories.invalidate(),
      utils.cafe.publicCategories.invalidate(),
    ]);
  };

  const invalidateProducts = async () => {
    await Promise.all([
      utils.admin.products.invalidate(),
      utils.cafe.publicProducts.invalidate(),
    ]);
  };

  const updateSettings = trpc.admin.updateSettings.useMutation({
    onSuccess: async (data) => {
      setForm(data);
      await Promise.all([
        utils.admin.settings.invalidate(),
        utils.cafe.publicSettings.invalidate(),
      ]);
      toast.success("تم حفظ هوية الكوفي وإعداداته");
    },
    onError: (error) => toast.error(error.message || "تعذر حفظ الإعدادات"),
  });

  const createMenuGroup = trpc.admin.createMenuGroup.useMutation({
    onSuccess: async () => {
      await invalidateMenuGroups();
      setGroupForm({ ...emptyGroup, sortOrder: nextGroupSortOrder + 10 });
      toast.success("تمت إضافة الفئة");
    },
    onError: (error) => toast.error(error.message || "تعذر إضافة الفئة"),
  });
  const updateMenuGroup = trpc.admin.updateMenuGroup.useMutation({
    onSuccess: async () => {
      await invalidateMenuGroups();
      setGroupForm({ ...emptyGroup, sortOrder: nextGroupSortOrder });
      toast.success("تم تعديل الفئة");
    },
    onError: (error) => toast.error(error.message || "تعذر تعديل الفئة"),
  });
  const setMenuGroupVisibility = trpc.admin.setMenuGroupVisibility.useMutation({
    onSuccess: invalidateMenuGroups,
    onError: (error) => toast.error(error.message || "تعذر تغيير ظهور الفئة"),
  });
  const deleteMenuGroup = trpc.admin.deleteMenuGroup.useMutation({
    onSuccess: async () => {
      await invalidateMenuGroups();
      toast.success("تم حذف الفئة");
    },
    onError: (error) => toast.error(error.message || "تعذر حذف الفئة"),
  });

  const createCategory = trpc.admin.createCategory.useMutation({
    onSuccess: async () => {
      await invalidateCategories();
      setCategoryForm({ ...emptyCategory, sortOrder: nextCategorySortOrder + 10 });
      toast.success("تمت إضافة القسم");
    },
    onError: (error) => toast.error(error.message || "تعذر إضافة القسم"),
  });

  const updateCategory = trpc.admin.updateCategory.useMutation({
    onSuccess: async () => {
      await Promise.all([invalidateCategories(), invalidateProducts()]);
      setCategoryForm({ ...emptyCategory, sortOrder: nextCategorySortOrder });
      toast.success("تم تحديث القسم");
    },
    onError: (error) => toast.error(error.message || "تعذر تحديث القسم"),
  });

  const setCategoryVisibility = trpc.admin.setCategoryVisibility.useMutation({
    onSuccess: async () => {
      await Promise.all([invalidateCategories(), invalidateProducts()]);
    },
    onError: (error) => toast.error(error.message || "تعذر تغيير حالة القسم"),
  });

  const deleteCategory = trpc.admin.deleteCategory.useMutation({
    onSuccess: async () => {
      await invalidateCategories();
      toast.success("تم حذف القسم");
    },
    onError: (error) => toast.error(error.message || "تعذر حذف القسم"),
  });

  const createProduct = trpc.admin.createProduct.useMutation({
    onSuccess: async () => {
      await invalidateProducts();
      setProductForm({
        ...emptyProduct,
        categoryId: productForm.categoryId || categories.data?.[0]?.id || 0,
        sortOrder: nextProductSortOrder + 10,
      });
      toast.success("تمت إضافة الصنف");
    },
    onError: (error) => toast.error(error.message || "تعذر إضافة الصنف"),
  });

  const updateProduct = trpc.admin.updateProduct.useMutation({
    onSuccess: async () => {
      await invalidateProducts();
      setProductForm({
        ...emptyProduct,
        categoryId: categories.data?.[0]?.id || 0,
        sortOrder: 10,
      });
      toast.success("تم تحديث الصنف");
    },
    onError: (error) => toast.error(error.message || "تعذر تحديث الصنف"),
  });

  const setProductVisibility = trpc.admin.setProductVisibility.useMutation({
    onSuccess: invalidateProducts,
    onError: (error) => toast.error(error.message || "تعذر تغيير ظهور الصنف"),
  });

  const setProductAvailability = trpc.admin.setProductAvailability.useMutation({
    onSuccess: invalidateProducts,
    onError: (error) => toast.error(error.message || "تعذر تغيير توفر الصنف"),
  });

  const deleteProduct = trpc.admin.deleteProduct.useMutation({
    onSuccess: async () => {
      await invalidateProducts();
      toast.success("تم حذف الصنف");
    },
    onError: (error) => toast.error(error.message || "تعذر حذف الصنف"),
  });

  const logout = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      toast.success("تم تسجيل الخروج");
      navigate("/admin/login", { replace: true });
    },
  });

  useEffect(() => {
    if (categoryForm.id === null && categoryForm.nameAr === "" && categoryForm.sortOrder === 10 && nextCategorySortOrder !== 10) {
      setCategoryForm((current) => ({ ...current, sortOrder: nextCategorySortOrder }));
    }
  }, [nextCategorySortOrder, categoryForm.id, categoryForm.nameAr, categoryForm.sortOrder]);

  useEffect(() => {
    if (!menuGroups.data?.length) return;
    if (categoryForm.menuGroupId === 0) {
      setCategoryForm((current) => ({ ...current, menuGroupId: menuGroups.data![0]!.id }));
    }
  }, [menuGroups.data, categoryForm.menuGroupId]);

  useEffect(() => {
    if (!categories.data?.length) return;
    if (productForm.categoryId === 0) {
      setProductForm((current) => ({ ...current, categoryId: categories.data[0]!.id }));
    }
  }, [categories.data, productForm.categoryId]);

  if (me.isLoading || !me.data) return <AdminLoading />;

  function setField<K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function setBrandLogo(key: string, url: string) {
    // Changing the cafe identity logo applies the new logo to the welcome
    // page too. The owner can still select a different welcome logo later.
    setForm((current) => ({
      ...current,
      logoKey: key,
      logoUrl: url,
      welcomeLogoKey: key,
      welcomeLogoUrl: url,
    }));
  }

  function useBrandLogoForWelcome() {
    setForm((current) => ({
      ...current,
      welcomeLogoKey: current.logoKey,
      welcomeLogoUrl: current.logoUrl,
    }));
  }

  function onSettingsLogoUploadChange(uploading: boolean) {
    setSettingsUploadCount((count) => Math.max(0, count + (uploading ? 1 : -1)));
  }

  function setCategoryField<K extends keyof CategoryForm>(key: K, value: CategoryForm[K]) {
    setCategoryForm((current) => ({ ...current, [key]: value }));
  }

  function setProductField<K extends keyof ProductForm>(key: K, value: ProductForm[K]) {
    setProductForm((current) => ({ ...current, [key]: value }));
  }

  function handleSettingsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (settingsUploadCount > 0) {
      toast.error("انتظر اكتمال رفع الشعار قبل حفظ الإعدادات");
      return;
    }
    updateSettings.mutate(form);
  }

  function setGroupField<K extends keyof MenuGroupForm>(key: K, value: MenuGroupForm[K]) {
    setGroupForm((current) => ({ ...current, [key]: value }));
  }

  function handleGroupSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = {
      nameAr: groupForm.nameAr,
      nameEn: groupForm.nameEn,
      imageKey: groupForm.imageKey,
      imageUrl: groupForm.imageUrl,
      sortOrder: Number(groupForm.sortOrder),
      isVisible: groupForm.isVisible,
    };
    if (groupForm.id) updateMenuGroup.mutate({ id: groupForm.id, ...payload });
    else createMenuGroup.mutate(payload);
  }

  function handleCategorySubmit(event: FormEvent<HTMLFormElement>) {
    if (!categoryForm.menuGroupId) {
      event.preventDefault();
      toast.error("اختر الفئة الرئيسية أولًا");
      return;
    }
    event.preventDefault();
    const payload = {
      menuGroupId: categoryForm.menuGroupId,
      nameAr: categoryForm.nameAr,
      nameEn: categoryForm.nameEn,
      imageKey: categoryForm.imageKey,
      imageUrl: categoryForm.imageUrl,
      sortOrder: Number(categoryForm.sortOrder),
      isVisible: categoryForm.isVisible,
    };

    if (categoryForm.id) {
      updateCategory.mutate({ id: categoryForm.id, ...payload });
    } else {
      createCategory.mutate(payload);
    }
  }

  function handleProductSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!productForm.categoryId) {
      toast.error("أضف قسمًا أولًا ثم اختر القسم للصنف");
      return;
    }

    const payload = {
      categoryId: Number(productForm.categoryId),
      nameAr: productForm.nameAr,
      nameEn: productForm.nameEn,
      descriptionAr: productForm.descriptionAr,
      descriptionEn: productForm.descriptionEn,
      price: Number(productForm.price),
      imageKey: productForm.imageKey,
      imageUrl: productForm.imageUrl,
      sortOrder: Number(productForm.sortOrder),
      isVisible: productForm.isVisible,
      isAvailable: productForm.isAvailable,
      isFeatured: productForm.isFeatured,
    };

    if (productForm.id) {
      updateProduct.mutate({ id: productForm.id, ...payload });
    } else {
      createProduct.mutate(payload);
    }
  }

  function startNewGroup() {
    setGroupForm({ ...emptyGroup, sortOrder: nextGroupSortOrder });
  }

  function editGroup(group: AdminMenuGroup) {
    setSection("groups");
    setGroupForm({ ...group });
  }

  function requestDeleteGroup(id: number, nameAr: string) {
    if (window.confirm(`حذف الفئة «${nameAr}»؟ يجب نقل أقسامها أولًا.`)) deleteMenuGroup.mutate({ id });
  }

  function startNewCategory() {
    setCategoryForm({ ...emptyCategory, menuGroupId: menuGroups.data?.[0]?.id || 0, sortOrder: nextCategorySortOrder });
  }

  function startNewProduct() {
    setProductForm({
      ...emptyProduct,
      categoryId: categories.data?.[0]?.id || 0,
      sortOrder: 10,
    });
  }

  function editCategory(category: NonNullable<typeof categories.data>[number]) {
    setSection("categories");
    setCategoryForm({
      id: category.id,
      menuGroupId: category.menuGroupId,
      nameAr: category.nameAr,
      nameEn: category.nameEn,
      imageKey: category.imageKey,
      imageUrl: category.imageUrl,
      sortOrder: category.sortOrder,
      isVisible: category.isVisible,
    });
  }

  function editProduct(product: NonNullable<typeof products.data>[number]) {
    setSection("products");
    setProductForm({
      id: product.id,
      categoryId: product.categoryId,
      nameAr: product.nameAr,
      nameEn: product.nameEn,
      descriptionAr: product.descriptionAr,
      descriptionEn: product.descriptionEn,
      price: product.price,
      imageKey: product.imageKey,
      imageUrl: product.imageUrl,
      sortOrder: product.sortOrder,
      isVisible: product.isVisible,
      isAvailable: product.isAvailable,
      isFeatured: product.isFeatured,
    });
  }

  function requestDeleteCategory(id: number, nameAr: string) {
    if (!window.confirm(`حذف قسم «${nameAr}»؟ لا يمكن التراجع عن هذه العملية.`)) return;
    deleteCategory.mutate({ id });
  }

  function requestDeleteProduct(id: number, nameAr: string) {
    if (!window.confirm(`حذف الصنف «${nameAr}»؟ لا يمكن التراجع عن هذه العملية.`)) return;
    deleteProduct.mutate({ id });
  }

  return (
    <main dir="rtl" className="brand-shell safe-page min-h-screen min-h-dvh overflow-x-clip">
      <section className="mx-auto w-full max-w-7xl min-w-0">
        <header className="brand-panel flex min-w-0 flex-col gap-5 p-4 min-[390px]:p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex min-w-0 items-center gap-3 min-[390px]:gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg min-[390px]:h-14 min-[390px]:w-14" style={{ backgroundColor: form.primaryColor }}>
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div className="min-w-0">
              <p className="brand-kicker">OWNER CONSOLE</p>
              <h1 className="text-xl font-bold text-[#3d2b20] min-[390px]:text-2xl">لوحة المالك</h1>
              <p className="truncate mt-1 text-xs text-[#8e735f] min-[390px]:text-sm">{me.data.username} · {me.data.role === "owner" ? "مالك" : "مدير"}</p>
            </div>
          </div>

          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <a href={`/menu/${encodeURIComponent(form.publicSlug || "al-malqa")}`} target="_blank" rel="noreferrer" className="brand-secondary-button flex-1 sm:flex-none">
              <Eye className="h-4 w-4" />
              معاينة العميل
            </a>
            <button type="button" onClick={() => logout.mutate()} disabled={logout.isPending} className="brand-secondary-button flex-1 sm:flex-none">
              <LogOut className="h-4 w-4" />
              تسجيل الخروج
            </button>
          </div>
        </header>

        <div className="admin-tabs horizontal-scroll -mx-1 mt-5 px-1">
          <SectionButton active={section === "settings"} onClick={() => setSection("settings")} icon={<Palette className="h-4 w-4" />} label="الهوية والإعدادات" />
          <SectionButton active={section === "welcome"} onClick={() => setSection("welcome")} icon={<Sparkles className="h-4 w-4" />} label="صفحة الترحيب" />
          <SectionButton active={section === "groups"} onClick={() => setSection("groups")} icon={<Layers3 className="h-4 w-4" />} label="الفئات" count={menuGroups.data?.length ?? 0} />
          <SectionButton active={section === "categories"} onClick={() => setSection("categories")} icon={<Layers3 className="h-4 w-4" />} label="الأقسام" count={categories.data?.length ?? 0} />
          <SectionButton active={section === "products"} onClick={() => setSection("products")} icon={<PackageOpen className="h-4 w-4" />} label="الأصناف" count={products.data?.length ?? 0} />
          <SectionButton active={section === "qr"} onClick={() => setSection("qr")} icon={<QrCode className="h-4 w-4" />} label="QR العميل" />
        </div>

        {section === "settings" ? (
          <SettingsSection form={form} setField={setField} setBrandLogo={setBrandLogo} useBrandLogoForWelcome={useBrandLogoForWelcome} onLogoUploadChange={onSettingsLogoUploadChange} onSubmit={handleSettingsSubmit} isPending={updateSettings.isPending} isLoading={settings.isLoading} isUploadingLogo={settingsUploadCount > 0} />
        ) : section === "welcome" ? (
          <WelcomeSettingsSection form={form} setField={setField} onLogoUploadChange={onSettingsLogoUploadChange} onSubmit={handleSettingsSubmit} isPending={updateSettings.isPending} isLoading={settings.isLoading} isUploadingLogo={settingsUploadCount > 0} />
        ) : section === "groups" ? (
          <MenuGroupsSection
            form={form}
            groupForm={groupForm}
            groups={menuGroups.data ?? []}
            isLoading={menuGroups.isLoading}
            setGroupField={setGroupField}
            onSubmit={handleGroupSubmit}
            onNew={startNewGroup}
            onEdit={editGroup}
            onToggle={(id, isVisible) => setMenuGroupVisibility.mutate({ id, isVisible })}
            onDelete={requestDeleteGroup}
            isSaving={createMenuGroup.isPending || updateMenuGroup.isPending}
            isToggling={setMenuGroupVisibility.isPending}
            isDeleting={deleteMenuGroup.isPending}
          />
        ) : section === "categories" ? (
          <CategoriesSection
            form={form}
            categoryForm={categoryForm}
            menuGroups={menuGroups.data ?? []}
            categories={categories.data ?? []}
            isLoading={categories.isLoading}
            setCategoryField={setCategoryField}
            onSubmit={handleCategorySubmit}
            onNew={startNewCategory}
            onEdit={editCategory}
            onToggle={(id, isVisible) => setCategoryVisibility.mutate({ id, isVisible })}
            onDelete={requestDeleteCategory}
            isSaving={createCategory.isPending || updateCategory.isPending}
            isToggling={setCategoryVisibility.isPending}
            isDeleting={deleteCategory.isPending}
          />
        ) : section === "qr" ? (
          <CustomerQrSection form={form} setField={setField} onSave={() => updateSettings.mutate(form)} isSaving={updateSettings.isPending} />
        ) : (
          <ProductsSection
            form={form}
            productForm={productForm}
            categories={categories.data ?? []}
            products={filteredProducts}
            totalProducts={products.data?.length ?? 0}
            isLoading={products.isLoading}
            filterCategoryId={productCategoryFilter}
            setFilterCategoryId={setProductCategoryFilter}
            setProductField={setProductField}
            onSubmit={handleProductSubmit}
            onNew={startNewProduct}
            onEdit={editProduct}
            onToggleVisibility={(id, isVisible) => setProductVisibility.mutate({ id, isVisible })}
            onToggleAvailability={(id, isAvailable) => setProductAvailability.mutate({ id, isAvailable })}
            onDelete={requestDeleteProduct}
            isSaving={createProduct.isPending || updateProduct.isPending}
            isToggling={setProductVisibility.isPending || setProductAvailability.isPending}
            isDeleting={deleteProduct.isPending}
          />
        )}
      </section>
    </main>
  );
}

function SectionButton({ active, onClick, icon, label, count }: { active: boolean; onClick: () => void; icon: ReactNode; label: string; count?: number }) {
  return (
    <button type="button" onClick={onClick} className={`${active ? "brand-primary-button" : "brand-secondary-button"} shrink-0 whitespace-nowrap`}>
      {icon}
      {label}
      {typeof count === "number" ? <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">{count}</span> : null}
    </button>
  );
}

function SettingsSection({
  form,
  setField,
  setBrandLogo,
  useBrandLogoForWelcome,
  onLogoUploadChange,
  onSubmit,
  isPending,
  isLoading,
  isUploadingLogo,
}: {
  form: SettingsForm;
  setField: <K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) => void;
  setBrandLogo: (key: string, url: string) => void;
  useBrandLogoForWelcome: () => void;
  onLogoUploadChange: (uploading: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isPending: boolean;
  isLoading: boolean;
  isUploadingLogo: boolean;
}) {
  return (
    <div className="mt-6 grid min-w-0 gap-5 lg:grid-cols-[1.35fr_0.65fr] xl:gap-6">
      <form className="brand-panel min-w-0 p-4 min-[390px]:p-5 sm:p-7" onSubmit={onSubmit}>
        <div className="flex min-w-0 items-start justify-between gap-3 border-b border-[#5A3825]/10 pb-5 sm:gap-4">
          <div>
            <p className="brand-kicker">BRAND & SETTINGS</p>
            <h2 className="mt-1 text-2xl font-bold text-[#3d2b20]">هوية الكوفي وإعداداته</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-[#8e735f]">هوية هادئة وفاخرة مستوحاة من المرجع المعتمد لكوفي الملقا.</p>
          </div>
          <Sparkles className="mt-1 h-6 w-6 text-[#9b7758]" />
        </div>

        <div className="mt-6 grid min-w-0 gap-5 md:grid-cols-2">
          <Field label="اسم الكوفي بالعربي">
            <input className="brand-input" value={form.nameAr} onChange={(e) => setField("nameAr", e.target.value)} required />
          </Field>
          <Field label="الاسم بالإنجليزي">
            <input className="brand-input text-left" dir="ltr" value={form.nameEn} onChange={(e) => setField("nameEn", e.target.value)} required />
          </Field>
          <Field label="العبارة التعريفية بالعربي">
            <textarea className="brand-input min-h-28 resize-y" value={form.descriptionAr} onChange={(e) => setField("descriptionAr", e.target.value)} />
          </Field>
          <Field label="العبارة التعريفية بالإنجليزي">
            <textarea className="brand-input min-h-28 resize-y text-left" dir="ltr" value={form.descriptionEn} onChange={(e) => setField("descriptionEn", e.target.value)} />
          </Field>
          <ImageUploadField
            label="شعار الكوفي"
            hint="عند تغيير شعار الهوية يُستخدم أيضًا في صفحة الترحيب. ويمكن لاحقًا تعيين شعار مستقل من تبويب «صفحة الترحيب». JPG / PNG / WebP / AVIF حتى 8MB."
            kind="logo"
            imageUrl={form.logoUrl}
            onUploadingChange={onLogoUploadChange}
            onUploaded={(image) => setBrandLogo(image.key, image.url)}
            onUrlChange={(url) => setBrandLogo("", url)}
            onClear={() => setBrandLogo("", "")}
          />
          {form.logoUrl && form.welcomeLogoUrl !== form.logoUrl ? (
            <div className="md:col-span-2 rounded-2xl border border-amber-700/15 bg-amber-50/70 p-3">
              <p className="mb-3 text-xs leading-6 text-[#80644d]">
                صفحة الترحيب تستخدم شعارًا مختلفًا. إذا أردت إظهار شعار الهوية الحالي فيها، اضغط الزر ثم احفظ الإعدادات.
              </p>
              <button
                type="button"
                className="brand-secondary-button w-full justify-center"
                disabled={isUploadingLogo || isPending}
                onClick={useBrandLogoForWelcome}
              >
                استخدام الشعار الجديد في صفحة الترحيب
              </button>
            </div>
          ) : null}
          <Field label="الرابط المختصر">
            <div className="relative">
              <Globe2 className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#a48670]" />
              <input className="brand-input pr-12 text-left" dir="ltr" value={form.publicSlug} onChange={(e) => setField("publicSlug", e.target.value.toLowerCase())} required />
            </div>
          </Field>
          <ColorField label="اللون الرئيسي" value={form.primaryColor} onChange={(value) => setField("primaryColor", value)} />
          <ColorField label="لون الخلفية" value={form.backgroundColor} onChange={(value) => setField("backgroundColor", value)} />
          <Field label="العملة">
            <div className="relative">
              <Banknote className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#a48670]" />
              <input className="brand-input pr-12 text-left uppercase" dir="ltr" value={form.currency} onChange={(e) => setField("currency", e.target.value.toUpperCase())} maxLength={10} required />
            </div>
          </Field>
          <Field label="اللغة الافتراضية">
            <div className="relative">
              <Languages className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#a48670]" />
              <select className="brand-input appearance-none pr-12" value={form.defaultLanguage} onChange={(e) => setField("defaultLanguage", e.target.value as "ar" | "en")}>
                <option value="ar">العربية</option>
                <option value="en">English</option>
              </select>
            </div>
          </Field>
        </div>

        <ToggleCard label="ظهور المنيو للعميل" hint="يمكن إخفاء المنيو مؤقتًا بدون حذف أي بيانات." checked={form.isPublished} onChange={(checked) => setField("isPublished", checked)} />

        <div className="mt-7 flex flex-col items-stretch gap-4 border-t border-[#5A3825]/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-6 text-[#9a806c]">الحفظ يحدّث TiDB مباشرة، وتظهر التغييرات في واجهة العميل بعد نجاح العملية.</p>
          <button type="submit" disabled={isPending || isLoading || isUploadingLogo} className="brand-primary-button w-full sm:w-auto">
            <Save className="h-5 w-5" />
            {isUploadingLogo ? "انتظر اكتمال رفع الشعار..." : isPending ? "جاري الحفظ..." : "حفظ الإعدادات"}
          </button>
        </div>
      </form>

      <aside className="min-w-0 lg:sticky lg:top-[max(1.5rem,var(--safe-top))] lg:self-start">
        <div className="brand-panel min-w-0 overflow-hidden p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="brand-kicker">LIVE PREVIEW</p>
              <h2 className="font-bold text-[#3d2b20]">معاينة الهوية</h2>
            </div>
            <Eye className="h-5 w-5 text-[#8f6c51]" />
          </div>
          <CustomerPreview form={form} />
        </div>
      </aside>
    </div>
  );
}

function WelcomeSettingsSection({
  form,
  setField,
  onLogoUploadChange,
  onSubmit,
  isPending,
  isLoading,
  isUploadingLogo,
}: {
  form: SettingsForm;
  setField: <K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) => void;
  onLogoUploadChange: (uploading: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isPending: boolean;
  isLoading: boolean;
  isUploadingLogo: boolean;
}) {
  return (
    <div className="mt-6 grid min-w-0 gap-5 lg:grid-cols-[1.35fr_0.65fr] xl:gap-6">
      <form className="brand-panel min-w-0 p-4 min-[390px]:p-5 sm:p-7" onSubmit={onSubmit}>
        <div className="flex min-w-0 items-start justify-between gap-3 border-b border-[#5A3825]/10 pb-5 sm:gap-4">
          <div>
            <p className="brand-kicker">WELCOME PAGE</p>
            <h2 className="mt-1 text-2xl font-bold text-[#3d2b20]">إعدادات صفحة الترحيب</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-[#8e735f]">أول شاشة يراها العميل قبل الدخول إلى الأقسام. الخلفية تعتمد هوية الكوفي الحالية بدون صورة مستقلة.</p>
          </div>
          <Sparkles className="mt-1 h-6 w-6 text-[#9b7758]" />
        </div>

        <ToggleCard
          label="تفعيل صفحة الترحيب"
          hint="عند إيقافها يدخل العميل مباشرة إلى صفحة الأقسام."
          checked={form.welcomeEnabled}
          onChange={(checked) => setField("welcomeEnabled", checked)}
        />

        <div className="mt-6 grid min-w-0 gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <ImageUploadField
              label="شعار صفحة الترحيب"
              hint="شعار صفحة الترحيب مستقل عن شعار الهوية؛ يمكنك رفع شعار خاص أو استخدام شعار الهوية. لا توجد صورة خلفية مستقلة."
              kind="logo"
              imageUrl={form.welcomeLogoUrl}
              onUploadingChange={onLogoUploadChange}
              onUploaded={(image) => { setField("welcomeLogoKey", image.key); setField("welcomeLogoUrl", image.url); }}
              onUrlChange={(url) => { setField("welcomeLogoKey", ""); setField("welcomeLogoUrl", url); }}
              onClear={() => { setField("welcomeLogoKey", ""); setField("welcomeLogoUrl", ""); }}
            />
            {form.logoUrl && form.welcomeLogoUrl !== form.logoUrl ? (
              <button
                type="button"
                className="brand-secondary-button w-full justify-center"
                disabled={isUploadingLogo}
                onClick={() => { setField("welcomeLogoKey", form.logoKey); setField("welcomeLogoUrl", form.logoUrl); }}
              >
                استخدام شعار الهوية في صفحة الترحيب (ثم اضغط حفظ)
              </button>
            ) : null}
          </div>

          <Field label="العنوان الرئيسي بالعربي">
            <input className="brand-input" value={form.welcomeTitleAr} onChange={(e) => setField("welcomeTitleAr", e.target.value)} required />
          </Field>
          <Field label="العنوان الرئيسي بالإنجليزي">
            <input className="brand-input text-left" dir="ltr" value={form.welcomeTitleEn} onChange={(e) => setField("welcomeTitleEn", e.target.value)} />
          </Field>

          <Field label="النص الفرعي بالعربي">
            <input className="brand-input" value={form.welcomeSubtitleAr} onChange={(e) => setField("welcomeSubtitleAr", e.target.value)} required />
          </Field>
          <Field label="النص الفرعي بالإنجليزي">
            <input className="brand-input text-left" dir="ltr" value={form.welcomeSubtitleEn} onChange={(e) => setField("welcomeSubtitleEn", e.target.value)} />
          </Field>

          <Field label="الوصف القصير بالعربي" hint="اختياري">
            <textarea className="brand-input min-h-24 resize-y" value={form.welcomeDescriptionAr} onChange={(e) => setField("welcomeDescriptionAr", e.target.value)} />
          </Field>
          <Field label="الوصف القصير بالإنجليزي" hint="اختياري">
            <textarea className="brand-input min-h-24 resize-y text-left" dir="ltr" value={form.welcomeDescriptionEn} onChange={(e) => setField("welcomeDescriptionEn", e.target.value)} />
          </Field>

          <Field label="نص زر الدخول بالعربي">
            <input className="brand-input" value={form.welcomeButtonAr} onChange={(e) => setField("welcomeButtonAr", e.target.value)} required />
          </Field>
          <Field label="نص زر الدخول بالإنجليزي">
            <input className="brand-input text-left" dir="ltr" value={form.welcomeButtonEn} onChange={(e) => setField("welcomeButtonEn", e.target.value)} />
          </Field>
        </div>

        <div className="mt-7 flex flex-col items-stretch gap-4 border-t border-[#5A3825]/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-6 text-[#9a806c]">بعد الحفظ ستظهر الإعدادات الجديدة للعميل عند فتح رابط المنيو من جديد.</p>
          <button type="submit" disabled={isPending || isLoading || isUploadingLogo} className="brand-primary-button w-full sm:w-auto">
            <Save className="h-5 w-5" />
            {isUploadingLogo ? "انتظر اكتمال رفع الشعار..." : isPending ? "جاري الحفظ..." : "حفظ صفحة الترحيب"}
          </button>
        </div>
      </form>

      <aside className="min-w-0 lg:sticky lg:top-[max(1.5rem,var(--safe-top))] lg:self-start">
        <div className="brand-panel min-w-0 overflow-hidden p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="brand-kicker">LIVE PREVIEW</p>
              <h2 className="font-bold text-[#3d2b20]">معاينة صفحة الترحيب</h2>
            </div>
            <Eye className="h-5 w-5 text-[#8f6c51]" />
          </div>
          <WelcomeCustomerPreview form={form} />
        </div>
      </aside>
    </div>
  );
}

function WelcomeCustomerPreview({ form }: { form: SettingsForm }) {
  return (
    <div
      className="relative flex min-h-[520px] overflow-hidden rounded-[30px] border border-black/5 px-5 py-8 shadow-inner"
      style={{ backgroundColor: form.backgroundColor }}
      dir="rtl"
    >
      <div className="pointer-events-none absolute -right-16 -top-12 h-56 w-56 rounded-full bg-white/60 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-white/35 blur-3xl" />
      <div className="relative z-[1] m-auto w-full max-w-sm text-center">
        {form.welcomeLogoUrl ? (
          <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border border-black/5 bg-white/55 p-3 shadow-[0_18px_45px_rgba(63,41,27,0.12)] backdrop-blur">
            <img src={form.welcomeLogoUrl} alt="شعار صفحة الترحيب" className="max-h-full max-w-full object-contain" />
          </div>
        ) : (
          <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border border-dashed bg-white/35" style={{ borderColor: `${form.primaryColor}44`, color: form.primaryColor }}>
            <ImageIcon className="h-8 w-8 opacity-55" />
          </div>
        )}

        <p className="brand-kicker mt-8" style={{ color: form.primaryColor }}>WELCOME</p>
        <h3 className="mt-2 text-3xl font-extrabold leading-tight" style={{ color: form.primaryColor }}>
          {form.welcomeTitleAr || "أهلًا وسهلًا بكم"}
        </h3>
        <p className="mt-2 text-base font-bold" style={{ color: form.primaryColor }}>
          {form.welcomeSubtitleAr || "في قهوة الملقا"}
        </p>
        {form.welcomeDescriptionAr ? (
          <p className="mx-auto mt-5 max-w-xs text-sm leading-7 text-[#7f6858]">{form.welcomeDescriptionAr}</p>
        ) : null}
        <div className="mx-auto mt-8 flex min-h-12 w-full max-w-xs items-center justify-center rounded-2xl px-5 py-3 text-sm font-extrabold text-white shadow-lg" style={{ backgroundColor: form.primaryColor }}>
          {form.welcomeButtonAr || "استعرض المنيو"}
          <ChevronLeft className="mr-2 h-4 w-4" />
        </div>
        {!form.welcomeEnabled ? <div className="mt-4 rounded-xl border border-amber-700/20 bg-amber-50/90 px-3 py-2 text-xs font-bold text-amber-900">صفحة الترحيب مخفية حاليًا</div> : null}
      </div>
    </div>
  );
}

async function renderQrToCanvas(svgElement: SVGSVGElement, size = 1600) {
  const svgCopy = svgElement.cloneNode(true) as SVGSVGElement;
  svgCopy.setAttribute("width", String(size));
  svgCopy.setAttribute("height", String(size));

  const svgText = new XMLSerializer().serializeToString(svgCopy);
  const svgBlob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("تعذر تجهيز QR للتنزيل"));
      image.src = svgUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");

    if (!context) throw new Error("تعذر تجهيز الصورة");

    context.fillStyle = "#FFFFFF";
    context.fillRect(0, 0, size, size);
    context.drawImage(image, 0, 0, size, size);
    return canvas;
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function canvasToPngBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("تعذر إنشاء ملف PNG"));
    }, "image/png");
  });
}

function canvasToPdfBlob(canvas: HTMLCanvasElement) {
  const dataUrl = canvas.toDataURL("image/jpeg", 1);
  const base64 = dataUrl.split(",")[1] ?? "";
  const binary = atob(base64);
  const jpegBytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    jpegBytes[index] = binary.charCodeAt(index);
  }

  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [0];
  let byteLength = 0;

  const appendBytes = (bytes: Uint8Array) => {
    chunks.push(bytes);
    byteLength += bytes.length;
  };

  const appendText = (value: string) => appendBytes(encoder.encode(value));

  const startObject = (objectNumber: number) => {
    offsets[objectNumber] = byteLength;
    appendText(`${objectNumber} 0 obj\n`);
  };

  appendText("%PDF-1.4\n");

  startObject(1);
  appendText("<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

  startObject(2);
  appendText("<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");

  startObject(3);
  appendText(
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n",
  );

  startObject(4);
  appendText(
    `<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`,
  );
  appendBytes(jpegBytes);
  appendText("\nendstream\nendobj\n");

  const qrSize = 360;
  const x = (595 - qrSize) / 2;
  const y = (842 - qrSize) / 2;
  const content = `q\n${qrSize} 0 0 ${qrSize} ${x} ${y} cm\n/Im0 Do\nQ\n`;
  const contentBytes = encoder.encode(content);

  startObject(5);
  appendText(`<< /Length ${contentBytes.length} >>\nstream\n`);
  appendBytes(contentBytes);
  appendText("endstream\nendobj\n");

  const xrefOffset = byteLength;
  appendText("xref\n0 6\n");
  appendText("0000000000 65535 f \n");
  for (let objectNumber = 1; objectNumber <= 5; objectNumber += 1) {
    appendText(`${String(offsets[objectNumber]).padStart(10, "0")} 00000 n \n`);
  }
  appendText(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  const pdfBytes = new Uint8Array(byteLength);
  let writeOffset = 0;

  for (const chunk of chunks) {
    pdfBytes.set(chunk, writeOffset);
    writeOffset += chunk.length;
  }

  return new Blob([pdfBytes.buffer], { type: "application/pdf" });
}

function CustomerQrSection({
  form,
  setField,
  onSave,
  isSaving,
}: {
  form: SettingsForm;
  setField: <K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) => void;
  onSave: () => void;
  isSaving: boolean;
}) {
  const slug = form.publicSlug.trim() || "al-malqa";
  const defaultMenuUrl = `${window.location.origin}/menu/${encodeURIComponent(slug)}`;
  const [menuUrl, setMenuUrl] = useState(() => localStorage.getItem("customer-menu-url") || defaultMenuUrl);
  const [isEditingMenuUrl, setIsEditingMenuUrl] = useState(false);

  function saveMenuUrl() {
    const value = menuUrl.trim();
    if (!/^https?:\/\//i.test(value)) {
      toast.error("اكتب رابطًا كاملًا يبدأ بـ http:// أو https://");
      return;
    }
    localStorage.setItem("customer-menu-url", value);
    setMenuUrl(value);
    setIsEditingMenuUrl(false);
    toast.success("تم حفظ رابط المنيو وتحديث QR");
  }

  async function copyMenuUrl() {
    try {
      await navigator.clipboard.writeText(menuUrl);
      toast.success("تم نسخ رابط منيو العميل");
    } catch {
      toast.error("تعذر نسخ الرابط تلقائيًا");
    }
  }

  async function downloadQr(format: "png" | "pdf") {
    try {
      const svgElement = document.getElementById("customer-menu-qr") as SVGSVGElement | null;
      if (!svgElement) throw new Error("تعذر العثور على QR");

      const canvas = await renderQrToCanvas(svgElement);

      if (format === "png") {
        const pngBlob = await canvasToPngBlob(canvas);
        downloadBlob(pngBlob, "al-malqa-menu-qr.png");
        toast.success("تم تنزيل QR كصورة PNG");
        return;
      }

      const pdfBlob = canvasToPdfBlob(canvas);
      downloadBlob(pdfBlob, "al-malqa-menu-qr.pdf");
      toast.success("تم تنزيل QR كملف PDF");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر تنزيل QR");
    }
  }

  return (
    <section className="mt-6 grid min-w-0 gap-5 lg:grid-cols-[0.8fr_1.2fr] xl:gap-6">
      <div className="brand-panel min-w-0 p-5 text-center sm:p-7">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg" style={{ backgroundColor: form.primaryColor }}>
          <QrCode className="h-6 w-6" />
        </div>
        <p className="brand-kicker mt-5">CUSTOMER QR</p>
        <h2 className="mt-1 text-2xl font-bold text-[#3d2b20]">QR منيو العميل</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-[#8e735f]">
          عند تغيير رابط المنيو وحفظه يتحدث QR تلقائيًا للرابط الجديد.
        </p>
        <div className="mx-auto mt-6 w-fit rounded-[28px] border border-[#5A3825]/10 bg-white p-5 shadow-[0_18px_55px_rgba(65,39,24,.10)]">
          <QRCodeSVG id="customer-menu-qr" value={menuUrl} size={250} bgColor="#FFFFFF" fgColor={form.primaryColor} level="H" />
        </div>
        <p className="mt-4 break-all text-xs leading-6 text-[#9a806c]">QR الحالي يشير إلى: {menuUrl}</p>

        <div className="mx-auto mt-4 grid max-w-sm grid-cols-1 gap-3 min-[420px]:grid-cols-2">
          <button type="button" onClick={() => void downloadQr("png")} className="brand-secondary-button w-full justify-center">
            <Download className="h-4 w-4" />
            تنزيل صورة PNG
          </button>
          <button type="button" onClick={() => void downloadQr("pdf")} className="brand-secondary-button w-full justify-center">
            <Download className="h-4 w-4" />
            تنزيل PDF
          </button>
        </div>
      </div>

      <div className="brand-panel min-w-0 p-5 sm:p-7">
        <div className="flex min-w-0 items-start justify-between gap-4 border-b border-[#5A3825]/10 pb-5">
          <div className="min-w-0">
            <p className="brand-kicker">PUBLIC MENU LINK</p>
            <h2 className="mt-1 text-2xl font-bold text-[#3d2b20]">رابط المنيو العام</h2>
            <p className="mt-2 text-sm leading-7 text-[#8e735f]">
              اكتب أي رابط كامل تريده ثم اضغط حفظ. بعد الحفظ يصبح هو رابط QR مباشرة.
            </p>
          </div>
          <ExternalLink className="mt-1 h-6 w-6 shrink-0 text-[#9b7758]" />
        </div>

        <div className="mt-6">
          <label className="mb-2 block text-sm font-bold text-[#5a4232]">رابط المنيو</label>
          <div className="flex min-w-0 items-center gap-2" dir="ltr">
            <input
              className="brand-input min-w-0 flex-1 text-left disabled:cursor-default disabled:opacity-100"
              dir="ltr"
              value={menuUrl}
              onChange={(e) => setMenuUrl(e.target.value)}
              placeholder="https://example.com/menu"
              disabled={!isEditingMenuUrl}
            />
            <button
              type="button"
              onClick={() => setIsEditingMenuUrl(true)}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#5A3825]/15 bg-white text-[#5A3825] transition hover:bg-[#f7efe7]"
              aria-label="تعديل رابط المنيو"
              title="تعديل الرابط"
            >
              <Pencil className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-xs leading-6 text-[#9a806c]">
            {isEditingMenuUrl
              ? "عدّل الرابط ثم اضغط حفظ. بعد الحفظ سيتم قفل الحقل تلقائيًا."
              : "الرابط محفوظ ومقفل. اضغط أيقونة التعديل لتغييره."}
          </p>
        </div>

        <button
          type="button"
          onClick={saveMenuUrl}
          className="brand-primary-button mt-4 w-full justify-center disabled:cursor-not-allowed disabled:opacity-60"
        >
          حفظ رابط المنيو وتحديث QR
        </button>

        <div className="mt-6 rounded-2xl border border-[#5A3825]/10 bg-[#fbf7f2] p-4">
          <span className="mb-2 block text-xs font-bold text-[#90735e]">الرابط الحالي</span>
          <div dir="ltr" className="break-all rounded-xl bg-white px-4 py-3 text-left text-sm text-[#5a4232] shadow-sm">
            {menuUrl}
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={() => void copyMenuUrl()} className="brand-secondary-button w-full justify-center">
            <Copy className="h-4 w-4" />
            نسخ الرابط
          </button>
          <a href={menuUrl} target="_blank" rel="noreferrer" className="brand-primary-button w-full justify-center">
            <ExternalLink className="h-4 w-4" />
            فتح منيو العميل
          </a>
        </div>

        <div className="mt-6 rounded-2xl border border-amber-700/15 bg-amber-50 p-4 text-sm leading-7 text-amber-900">
          أثناء التطوير المحلي سيحتوي QR على عنوان هذا الجهاز الحالي. اختبار المسح من جوال حقيقي يحتاج رابطًا يمكن للجوال الوصول إليه.
        </div>
      </div>
    </section>
  );
}

function MenuGroupsSection({
  form, groupForm, groups, isLoading, setGroupField, onSubmit, onNew, onEdit,
  onToggle, onDelete, isSaving, isToggling, isDeleting,
}: {
  form: SettingsForm;
  groupForm: MenuGroupForm;
  groups: AdminMenuGroup[];
  isLoading: boolean;
  setGroupField: <K extends keyof MenuGroupForm>(key: K, value: MenuGroupForm[K]) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onNew: () => void;
  onEdit: (group: AdminMenuGroup) => void;
  onToggle: (id: number, isVisible: boolean) => void;
  onDelete: (id: number, nameAr: string) => void;
  isSaving: boolean;
  isToggling: boolean;
  isDeleting: boolean;
}) {
  return (
    <section className="mt-6 grid min-w-0 gap-5 lg:grid-cols-[0.72fr_1.28fr] xl:gap-6">
      <form className="brand-panel min-w-0 p-4 min-[390px]:p-5 sm:p-7 lg:sticky lg:top-6 lg:self-start" onSubmit={onSubmit}>
        <EditorHeader kicker="MAIN MENU CATEGORIES" title={groupForm.id ? "تعديل الفئة" : "فئة جديدة"} editing={Boolean(groupForm.id)} onNew={onNew} />
        <div className="mt-6 space-y-5">
          <Field label="اسم الفئة بالعربي"><input className="brand-input" required value={groupForm.nameAr} onChange={(e) => setGroupField("nameAr", e.target.value)} placeholder="مثل: المشروبات" /></Field>
          <Field label="اسم الفئة بالإنجليزي"><input className="brand-input text-left" dir="ltr" value={groupForm.nameEn} onChange={(e) => setGroupField("nameEn", e.target.value)} placeholder="Drinks" /></Field>
          <Field label="ترتيب الظهور"><input className="brand-input text-left" type="number" min={-9999} max={9999} value={groupForm.sortOrder} onChange={(e) => setGroupField("sortOrder", Number(e.target.value))} /></Field>
          <ImageUploadField label="صورة الفئة" hint="هذه الصورة تظهر كبطاقة كبيرة في الصفحة الثانية." kind="category" imageUrl={groupForm.imageUrl}
            onUploaded={(image) => { setGroupField("imageKey", image.key); setGroupField("imageUrl", image.url); }}
            onUrlChange={(url) => { setGroupField("imageKey", ""); setGroupField("imageUrl", url); }}
            onClear={() => { setGroupField("imageKey", ""); setGroupField("imageUrl", ""); }} />
          <ToggleCard label="الفئة ظاهرة" hint="إخفاء الفئة يخفي أقسامها وأصنافها عن العميل دون حذفها." checked={groupForm.isVisible} onChange={(value) => setGroupField("isVisible", value)} compact />
          <button type="submit" disabled={isSaving} className="brand-primary-button w-full"><Save className="h-5 w-5" />{isSaving ? "جاري الحفظ..." : groupForm.id ? "حفظ الفئة" : "إضافة الفئة"}</button>
        </div>
      </form>
      <div className="brand-panel min-w-0 p-4 min-[390px]:p-5 sm:p-7">
        <ListHeader kicker="MAIN CATEGORIES" title="إدارة الفئات الرئيسية" description="أنشئ المشروبات، الحلويات، الطعام والمياه، ثم اربط كل قسم بالفئة المناسبة." buttonLabel="فئة جديدة" onNew={onNew} />
        {isLoading ? <LoadingText text="جاري تحميل الفئات..." /> : groups.length ? (
          <div className="mt-5 grid min-w-0 gap-3">
            {groups.map((group) => (
              <article key={group.id} className="flex min-w-0 flex-col gap-4 rounded-[22px] border border-[#5A3825]/10 bg-white/65 p-4 min-[480px]:flex-row min-[480px]:items-center min-[480px]:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  {group.imageUrl ? <img src={group.imageUrl} alt={group.nameAr} className="h-16 w-16 shrink-0 rounded-2xl object-cover" /> : <div className="flex h-16 w-16 items-center justify-center rounded-2xl text-white" style={{ backgroundColor: form.primaryColor }}><Layers3 className="h-5 w-5" /></div>}
                  <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold">{group.nameAr}</h3><Badge text={`ترتيب ${group.sortOrder}`} /><StateBadge active={group.isVisible} activeText="ظاهرة" inactiveText="مخفية" /></div><p className="mt-1 truncate text-xs text-[#9b806b]">{group.nameEn}</p></div>
                </div>
                <div className="flex gap-2">
                  <IconButton title={group.isVisible ? "إخفاء" : "إظهار"} onClick={() => onToggle(group.id, !group.isVisible)} disabled={isToggling}>{group.isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</IconButton>
                  <IconButton title="تعديل" onClick={() => onEdit(group)}><Pencil className="h-4 w-4" /></IconButton>
                  <IconButton title="حذف" danger onClick={() => onDelete(group.id, group.nameAr)} disabled={isDeleting}><Trash2 className="h-4 w-4" /></IconButton>
                </div>
              </article>
            ))}
          </div>
        ) : <EmptyState icon={<Layers3 className="h-9 w-9" />} title="لا توجد فئات بعد" description="أضف فئة أولًا، ثم أنشئ أقسامها وأصنافها." />}
      </div>
    </section>
  );
}

function CategoriesSection({
  form,
  categoryForm,
  menuGroups,
  categories,
  isLoading,
  setCategoryField,
  onSubmit,
  onNew,
  onEdit,
  onToggle,
  onDelete,
  isSaving,
  isToggling,
  isDeleting,
}: {
  form: SettingsForm;
  categoryForm: CategoryForm;
  menuGroups: AdminMenuGroup[];
  categories: AdminCategory[];
  isLoading: boolean;
  setCategoryField: <K extends keyof CategoryForm>(key: K, value: CategoryForm[K]) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onNew: () => void;
  onEdit: (category: AdminCategory) => void;
  onToggle: (id: number, isVisible: boolean) => void;
  onDelete: (id: number, nameAr: string) => void;
  isSaving: boolean;
  isToggling: boolean;
  isDeleting: boolean;
}) {
  return (
    <section className="mt-6 grid min-w-0 gap-5 lg:grid-cols-[0.72fr_1.28fr] xl:gap-6">
      <form className="brand-panel min-w-0 p-4 min-[390px]:p-5 sm:p-7 lg:sticky lg:top-[max(1.5rem,var(--safe-top))] lg:self-start" onSubmit={onSubmit}>
        <EditorHeader kicker="CATEGORY EDITOR" title={categoryForm.id ? "تعديل القسم" : "قسم جديد"} editing={Boolean(categoryForm.id)} onNew={onNew} />
        <div className="mt-6 space-y-5">
          <Field label="الفئة الرئيسية">
            <select className="brand-input" required value={categoryForm.menuGroupId} onChange={(e) => setCategoryField("menuGroupId", Number(e.target.value))}>
              <option value={0} disabled>اختر الفئة</option>
              {menuGroups.map((group) => <option key={group.id} value={group.id}>{group.nameAr}</option>)}
            </select>
          </Field>
          <Field label="اسم القسم بالعربي"><input className="brand-input" value={categoryForm.nameAr} onChange={(e) => setCategoryField("nameAr", e.target.value)} placeholder="مثال: المشروبات الساخنة" required /></Field>
          <Field label="اسم القسم بالإنجليزي"><input className="brand-input text-left" dir="ltr" value={categoryForm.nameEn} onChange={(e) => setCategoryField("nameEn", e.target.value)} placeholder="Hot Drinks" /></Field>
          <Field label="ترتيب الظهور" hint="الأرقام الأقل تظهر أولًا للعميل."><input className="brand-input text-left" dir="ltr" type="number" min={-9999} max={9999} value={categoryForm.sortOrder} onChange={(e) => setCategoryField("sortOrder", Number(e.target.value))} required /></Field>
          <ImageUploadField
            label="صورة القسم"
            hint="تُصغّر الصورة وتُضغط تلقائيًا إلى WebP قبل رفعها إلى IDrive e2."
            kind="category"
            imageUrl={categoryForm.imageUrl}
            onUploaded={(image) => { setCategoryField("imageKey", image.key); setCategoryField("imageUrl", image.url); }}
            onUrlChange={(url) => { setCategoryField("imageKey", ""); setCategoryField("imageUrl", url); }}
            onClear={() => { setCategoryField("imageKey", ""); setCategoryField("imageUrl", ""); }}
          />
          <ToggleCard label="ظاهر في المنيو" hint="يمكن إخفاؤه بدون حذف القسم." checked={categoryForm.isVisible} onChange={(checked) => setCategoryField("isVisible", checked)} compact />
          <button type="submit" disabled={isSaving} className="brand-primary-button w-full"><Save className="h-5 w-5" />{isSaving ? "جاري الحفظ..." : categoryForm.id ? "حفظ التعديل" : "إضافة القسم"}</button>
        </div>
      </form>

      <div className="brand-panel min-w-0 p-4 min-[390px]:p-5 sm:p-7">
        <ListHeader kicker="MENU CATEGORIES" title="إدارة الأقسام" description="الترتيب والظهور هنا ينعكسان مباشرة في واجهة العميل." buttonLabel="قسم جديد" onNew={onNew} />
        {isLoading ? <LoadingText text="جاري تحميل الأقسام..." /> : categories.length ? (
          <div className="mt-5 space-y-3">
            {categories.map((category) => (
              <article key={category.id} className="flex min-w-0 flex-col gap-4 rounded-[22px] border border-[#5A3825]/10 bg-white/65 p-4 min-[480px]:flex-row min-[480px]:items-center min-[480px]:justify-between sm:rounded-[24px]">
                <div className="flex min-w-0 items-center gap-4">
                  {category.imageUrl ? (
                    <img src={category.imageUrl} alt={category.nameAr} className="h-14 w-14 shrink-0 rounded-2xl object-cover shadow-sm" loading="lazy" />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm" style={{ backgroundColor: category.isVisible ? form.primaryColor : "#b7a495" }}><Layers3 className="h-5 w-5" /></div>
                  )}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-[#463225]">{category.nameAr}</h3>
                      <Badge text={menuGroups.find((group) => group.id === category.menuGroupId)?.nameAr || "بدون فئة"} />
                      <Badge text={`ترتيب ${category.sortOrder}`} />
                      <StateBadge active={category.isVisible} activeText="ظاهر" inactiveText="مخفي" />
                    </div>
                    <p className="brand-english mt-1 truncate text-[10px] text-[#9b806b]">{category.nameEn || "NO ENGLISH NAME"}</p>
                  </div>
                </div>
                <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                  <IconButton title={category.isVisible ? "إخفاء القسم" : "إظهار القسم"} onClick={() => onToggle(category.id, !category.isVisible)} disabled={isToggling}>{category.isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</IconButton>
                  <IconButton title="تعديل" onClick={() => onEdit(category)}><Pencil className="h-4 w-4" /></IconButton>
                  <IconButton title="حذف" danger onClick={() => onDelete(category.id, category.nameAr)} disabled={isDeleting}><Trash2 className="h-4 w-4" /></IconButton>
                </div>
              </article>
            ))}
          </div>
        ) : <EmptyState icon={<Layers3 className="h-9 w-9" />} title="لا توجد أقسام بعد" description="أضف أول قسم ليظهر في منيو العميل." />}
      </div>
    </section>
  );
}

function ProductsSection({
  form,
  productForm,
  categories,
  products,
  totalProducts,
  isLoading,
  filterCategoryId,
  setFilterCategoryId,
  setProductField,
  onSubmit,
  onNew,
  onEdit,
  onToggleVisibility,
  onToggleAvailability,
  onDelete,
  isSaving,
  isToggling,
  isDeleting,
}: {
  form: SettingsForm;
  productForm: ProductForm;
  categories: AdminCategory[];
  products: AdminProduct[];
  totalProducts: number;
  isLoading: boolean;
  filterCategoryId: number;
  setFilterCategoryId: (value: number) => void;
  setProductField: <K extends keyof ProductForm>(key: K, value: ProductForm[K]) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onNew: () => void;
  onEdit: (product: AdminProduct) => void;
  onToggleVisibility: (id: number, isVisible: boolean) => void;
  onToggleAvailability: (id: number, isAvailable: boolean) => void;
  onDelete: (id: number, nameAr: string) => void;
  isSaving: boolean;
  isToggling: boolean;
  isDeleting: boolean;
}) {
  return (
    <section className="mt-6 grid min-w-0 gap-5 lg:grid-cols-[0.78fr_1.22fr] xl:gap-6">
      <form className="brand-panel min-w-0 p-4 min-[390px]:p-5 sm:p-7 lg:sticky lg:top-[max(1.5rem,var(--safe-top))] lg:self-start" onSubmit={onSubmit}>
        <EditorHeader kicker="PRODUCT EDITOR" title={productForm.id ? "تعديل الصنف" : "صنف جديد"} editing={Boolean(productForm.id)} onNew={onNew} />

        {!categories.length ? (
          <div className="mt-6 rounded-2xl border border-amber-700/15 bg-amber-50 p-4 text-sm leading-7 text-amber-900">يجب إضافة قسم واحد على الأقل قبل إضافة الأصناف.</div>
        ) : (
          <div className="mt-6 space-y-5">
            <Field label="القسم">
              <select className="brand-input" value={productForm.categoryId} onChange={(e) => setProductField("categoryId", Number(e.target.value))} required>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.nameAr}</option>)}
              </select>
            </Field>
            <Field label="اسم الصنف بالعربي"><input className="brand-input" value={productForm.nameAr} onChange={(e) => setProductField("nameAr", e.target.value)} placeholder="مثال: لاتيه الملقا" required /></Field>
            <Field label="اسم الصنف بالإنجليزي"><input className="brand-input text-left" dir="ltr" value={productForm.nameEn} onChange={(e) => setProductField("nameEn", e.target.value)} placeholder="Al Malqa Latte" /></Field>
            <Field label="الوصف بالعربي"><textarea className="brand-input min-h-24 resize-y" value={productForm.descriptionAr} onChange={(e) => setProductField("descriptionAr", e.target.value)} placeholder="وصف مختصر وواضح للصنف" /></Field>
            <Field label="الوصف بالإنجليزي"><textarea className="brand-input min-h-24 resize-y text-left" dir="ltr" value={productForm.descriptionEn} onChange={(e) => setProductField("descriptionEn", e.target.value)} placeholder="Short product description" /></Field>
            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              <Field label={`السعر (${form.currency})`}><input className="brand-input text-left" dir="ltr" type="number" min="0" step="0.01" value={productForm.price} onChange={(e) => setProductField("price", Number(e.target.value))} required /></Field>
              <Field label="ترتيب الظهور"><input className="brand-input text-left" dir="ltr" type="number" min={-9999} max={9999} value={productForm.sortOrder} onChange={(e) => setProductField("sortOrder", Number(e.target.value))} required /></Field>
            </div>
            <ImageUploadField
              label="صورة الصنف"
              hint="تُصغّر الصورة وتُضغط تلقائيًا قبل رفعها إلى IDrive e2."
              kind="product"
              imageUrl={productForm.imageUrl}
              onUploaded={(image) => { setProductField("imageKey", image.key); setProductField("imageUrl", image.url); }}
              onUrlChange={(url) => { setProductField("imageKey", ""); setProductField("imageUrl", url); }}
              onClear={() => { setProductField("imageKey", ""); setProductField("imageUrl", ""); }}
            />
            <div className="grid min-w-0 gap-3 min-[480px]:grid-cols-3">
              <MiniToggle label="ظاهر" checked={productForm.isVisible} onChange={(checked) => setProductField("isVisible", checked)} />
              <MiniToggle label="متوفر" checked={productForm.isAvailable} onChange={(checked) => setProductField("isAvailable", checked)} />
              <MiniToggle label="مميز" checked={productForm.isFeatured} onChange={(checked) => setProductField("isFeatured", checked)} icon={<Star className="h-4 w-4" />} />
            </div>
            <button type="submit" disabled={isSaving} className="brand-primary-button w-full"><Save className="h-5 w-5" />{isSaving ? "جاري الحفظ..." : productForm.id ? "حفظ التعديل" : "إضافة الصنف"}</button>
          </div>
        )}
      </form>

      <div className="brand-panel min-w-0 p-4 min-[390px]:p-5 sm:p-7">
        <ListHeader kicker="MENU PRODUCTS" title="إدارة الأصناف" description="الاسم والسعر والتوفر والظهور هنا ينعكس مباشرة في منيو العميل." buttonLabel="صنف جديد" onNew={onNew} />

        <div className="mt-5 flex min-w-0 flex-col gap-3 rounded-2xl border border-[#5A3825]/10 bg-[#fbf7f2] p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-[#806754]">إجمالي الأصناف: <strong>{totalProducts}</strong></div>
          <select className="brand-input !w-full sm:!w-auto sm:min-w-48" value={filterCategoryId} onChange={(e) => setFilterCategoryId(Number(e.target.value))}>
            <option value={0}>كل الأقسام</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.nameAr}</option>)}
          </select>
        </div>

        {isLoading ? <LoadingText text="جاري تحميل الأصناف..." /> : products.length ? (
          <div className="mt-5 grid min-w-0 gap-4 xl:grid-cols-2">
            {products.map((product) => (
              <article key={product.id} className="min-w-0 overflow-hidden rounded-[22px] border border-[#5A3825]/10 bg-white/70 shadow-sm sm:rounded-[24px]">
                <div className="flex min-w-0 flex-col gap-4 p-4 min-[480px]:flex-row">
                  <ProductThumb imageUrl={product.imageUrl} primaryColor={form.primaryColor} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-[#463225]">{product.nameAr}</h3>
                      {product.isFeatured ? <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700"><Star className="h-3 w-3 fill-current" />مميز</span> : null}
                    </div>
                    <p className="brand-english mt-1 truncate text-[9px] text-[#9b806b]">{product.nameEn || "NO ENGLISH NAME"}</p>
                    <p className="mt-2 line-clamp-2 text-xs leading-6 text-[#8c705b]">{product.descriptionAr || "بدون وصف"}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge text={product.categoryNameAr} />
                      <Badge text={`ترتيب ${product.sortOrder}`} />
                      <StateBadge active={product.isVisible} activeText="ظاهر" inactiveText="مخفي" />
                      <StateBadge active={product.isAvailable} activeText="متوفر" inactiveText="غير متوفر" />
                    </div>
                  </div>
                  <div className="flex shrink-0 items-baseline justify-between gap-2 text-left min-[480px]:block">
                    <div className="text-lg font-bold" style={{ color: form.primaryColor }}>{formatPrice(product.price)}</div>
                    <div className="text-[10px] text-[#9b806b]">{form.currency}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 border-t border-[#5A3825]/8 bg-[#fbf7f2]/65 p-3 min-[560px]:flex min-[560px]:flex-wrap">
                  <button type="button" className="brand-secondary-button w-full !px-3 !py-2 text-xs min-[560px]:w-auto" onClick={() => onToggleVisibility(product.id, !product.isVisible)} disabled={isToggling}>{product.isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}{product.isVisible ? "إخفاء" : "إظهار"}</button>
                  <button type="button" className="brand-secondary-button w-full !px-3 !py-2 text-xs min-[560px]:w-auto" onClick={() => onToggleAvailability(product.id, !product.isAvailable)} disabled={isToggling}><CheckCircle2 className="h-4 w-4" />{product.isAvailable ? "إيقاف التوفر" : "إتاحة"}</button>
                  <IconButton title="تعديل" onClick={() => onEdit(product)}><Pencil className="h-4 w-4" /></IconButton>
                  <IconButton title="حذف" danger onClick={() => onDelete(product.id, product.nameAr)} disabled={isDeleting}><Trash2 className="h-4 w-4" /></IconButton>
                </div>
              </article>
            ))}
          </div>
        ) : <EmptyState icon={<PackageOpen className="h-9 w-9" />} title="لا توجد أصناف في هذا العرض" description="أضف أول صنف أو غيّر فلتر القسم." />}
      </div>
    </section>
  );
}

function ImageUploadField({
  label,
  hint,
  kind,
  imageUrl,
  onUploaded,
  onUrlChange,
  onClear,
  onUploadingChange,
}: {
  label: string;
  hint: string;
  kind: "logo" | "category" | "product";
  imageUrl: string;
  onUploaded: (image: { key: string; url: string }) => void;
  onUrlChange: (url: string) => void;
  onClear: () => void;
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    onUploadingChange?.(true);
    try {
      const uploaded = await uploadAdminImage(kind, file);
      onUploaded(uploaded);
      const successMessage =
        kind === "logo"
          ? "تم رفع الشعار إلى IDrive e2"
          : kind === "category"
            ? "تم رفع صورة القسم إلى IDrive e2"
            : "تم رفع صورة الصنف إلى IDrive e2";
      toast.success(successMessage);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر رفع الصورة");
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
    }
  }

  return (
    <div className="block">
      <span className="mb-2 block text-sm font-bold text-[#5a4232]">{label}</span>
      <div className="space-y-3 rounded-2xl border border-[#5A3825]/10 bg-[#fbf7f2] p-3">
        {imageUrl ? (
          <div className={`overflow-hidden rounded-2xl bg-white ${kind === "logo" ? "flex min-h-36 items-center justify-center p-4" : "aspect-[4/3]"}`}>
            <img src={imageUrl} alt="" className={kind === "logo" ? "max-h-32 max-w-full object-contain" : "h-full w-full object-cover"} />
          </div>
        ) : (
          <div className="flex min-h-32 items-center justify-center rounded-2xl border border-dashed border-[#5A3825]/15 bg-white/70 text-[#a48670]">
            <ImageIcon className="h-8 w-8" />
          </div>
        )}

        <div className="grid gap-2 min-[420px]:grid-cols-2">
          <label className={`brand-primary-button w-full cursor-pointer justify-center ${uploading ? "pointer-events-none opacity-70" : ""}`}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
            {uploading ? "جاري الرفع..." : imageUrl ? "استبدال الصورة" : "رفع صورة"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="sr-only"
              disabled={uploading}
              onChange={(event) => {
                void handleFile(event.target.files?.[0]);
                event.currentTarget.value = "";
              }}
            />
          </label>
          <button type="button" className="brand-secondary-button w-full justify-center" disabled={!imageUrl || uploading} onClick={onClear}>
            <Trash2 className="h-4 w-4" /> إزالة
          </button>
        </div>

        <div>
          <span className="mb-1 block text-[11px] font-bold text-[#90735e]">أو رابط خارجي</span>
          <input className="brand-input text-left text-xs" dir="ltr" value={imageUrl} onChange={(e) => onUrlChange(e.target.value)} placeholder="https://..." />
        </div>
      </div>
      {hint ? <span className="mt-2 block text-xs leading-5 text-[#a08672]">{hint}</span> : null}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return <label className="block"><span className="mb-2 block text-sm font-bold text-[#5a4232]">{label}</span>{children}{hint ? <span className="mt-2 block text-xs leading-5 text-[#a08672]">{hint}</span> : null}</label>;
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <Field label={label}>
      <div className="flex min-w-0 items-center gap-3">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value.toUpperCase())} className="h-12 w-14 cursor-pointer rounded-xl border border-[#5A3825]/10 bg-white p-1" />
        <input className="brand-input flex-1 text-left uppercase" dir="ltr" value={value} onChange={(e) => onChange(e.target.value.toUpperCase())} maxLength={7} required />
      </div>
    </Field>
  );
}

function ToggleCard({ label, hint, checked, onChange, compact = false }: { label: string; hint: string; checked: boolean; onChange: (checked: boolean) => void; compact?: boolean }) {
  return (
    <div className={`${compact ? "" : "mt-7"} flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-[#5A3825]/10 bg-[#fbf7f2] p-4`}>
      <div><p className="font-bold text-[#4c3426]">{label}</p><p className="mt-1 text-xs text-[#937661]">{hint}</p></div>
      <label className="inline-flex cursor-pointer items-center gap-3"><input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} /><span className="relative h-7 w-12 rounded-full bg-[#d9c8b8] transition peer-checked:bg-[#5A3825] after:absolute after:right-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:-translate-x-5" /></label>
    </div>
  );
}

function MiniToggle({ label, checked, onChange, icon }: { label: string; checked: boolean; onChange: (checked: boolean) => void; icon?: ReactNode }) {
  return (
    <label className="touch-target flex cursor-pointer items-center justify-between gap-2 rounded-2xl border border-[#5A3825]/10 bg-[#fbf7f2] p-3 text-sm font-bold text-[#5a4232]">
      <span className="inline-flex items-center gap-1.5">{icon}{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[#5A3825]" />
    </label>
  );
}

function EditorHeader({ kicker, title, editing, onNew }: { kicker: string; title: string; editing: boolean; onNew: () => void }) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-3 border-b border-[#5A3825]/10 pb-5 sm:gap-4">
      <div><p className="brand-kicker">{kicker}</p><h2 className="mt-1 text-2xl font-bold text-[#3d2b20]">{title}</h2></div>
      {editing ? <button type="button" onClick={onNew} className="brand-secondary-button !px-3" title="إلغاء التعديل"><X className="h-4 w-4" /></button> : <Plus className="mt-1 h-6 w-6 text-[#9b7758]" />}
    </div>
  );
}

function ListHeader({ kicker, title, description, buttonLabel, onNew }: { kicker: string; title: string; description: string; buttonLabel: string; onNew: () => void }) {
  return (
    <div className="flex min-w-0 flex-col gap-4 border-b border-[#5A3825]/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
      <div><p className="brand-kicker">{kicker}</p><h2 className="mt-1 text-2xl font-bold text-[#3d2b20]">{title}</h2><p className="mt-2 text-sm leading-7 text-[#8e735f]">{description}</p></div>
      <button type="button" onClick={onNew} className="brand-secondary-button"><Plus className="h-4 w-4" />{buttonLabel}</button>
    </div>
  );
}

function IconButton({ title, onClick, disabled, danger = false, children }: { title: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: ReactNode }) {
  return <button type="button" className={`brand-secondary-button !px-3 !py-2 ${danger ? "!text-red-700" : ""}`} onClick={onClick} disabled={disabled} title={title}>{children}</button>;
}

function Badge({ text }: { text: string }) {
  return <span className="rounded-full bg-[#f1e5da] px-2 py-1 text-[10px] font-bold text-[#866953]">{text}</span>;
}

function StateBadge({ active, activeText, inactiveText }: { active: boolean; activeText: string; inactiveText: string }) {
  return <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${active ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-500"}`}>{active ? activeText : inactiveText}</span>;
}

function ProductThumb({ imageUrl, primaryColor }: { imageUrl: string; primaryColor: string }) {
  if (imageUrl) return <img src={imageUrl} alt="" className="h-40 w-full shrink-0 rounded-2xl object-cover min-[480px]:h-24 min-[480px]:w-24" />;
  return <div className="flex h-40 w-full shrink-0 items-center justify-center rounded-2xl bg-[#f1e5da] min-[480px]:h-24 min-[480px]:w-24" style={{ color: primaryColor }}><ImageIcon className="h-7 w-7" /></div>;
}

function LoadingText({ text }: { text: string }) {
  return <p className="py-10 text-center text-[#8e735f]">{text}</p>;
}

function EmptyState({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return <div className="mt-5 rounded-[26px] border border-dashed border-[#5A3825]/15 bg-[#fbf7f2] px-5 py-12 text-center text-[#aa8d76]">{icon}<h3 className="mt-4 font-bold text-[#4a3427]">{title}</h3><p className="mt-2 text-sm text-[#947762]">{description}</p></div>;
}

function CustomerPreview({ form }: { form: SettingsForm }) {
  return (
    <div className="relative overflow-hidden rounded-[26px] border border-black/5 px-4 py-6 shadow-inner min-[390px]:rounded-[30px] min-[390px]:px-5 min-[390px]:py-8 sm:rounded-[34px]" style={{ backgroundColor: form.backgroundColor }}>
      <div className="pointer-events-none absolute -left-10 -top-12 h-40 w-40 rounded-full bg-white/45 blur-3xl" />
      <div className="relative mx-auto max-w-sm text-center">
        <LogoPreview logoUrl={form.logoUrl} primaryColor={form.primaryColor} />
        <h3 className="mt-5 text-3xl font-bold" style={{ color: form.primaryColor }}>{form.nameAr || "كوفي الملقا"}</h3>
        <p className="brand-english mt-1 text-xs" style={{ color: form.primaryColor }}>{form.nameEn || "Al Malqa Cafe"}</p>
        <div className="mx-auto my-5 h-px w-14 opacity-30" style={{ backgroundColor: form.primaryColor }} />
        <p className="text-lg font-semibold leading-8" style={{ color: form.primaryColor }}>{form.descriptionAr || "تجربة راقية .. ببساطة"}</p>
        <p className="brand-english mt-2 text-[10px] leading-5 opacity-70" style={{ color: form.primaryColor }}>{form.descriptionEn || "A refined experience in simple ways"}</p>
        <div className="mt-7 grid grid-cols-1 gap-2 min-[390px]:grid-cols-3">{["المشروبات", "الحلويات", "الطعام"].map((item) => <div key={item} className="rounded-2xl bg-white/65 px-2 py-3 text-xs font-semibold shadow-sm" style={{ color: form.primaryColor }}>{item}</div>)}</div>
        <div className="mt-5 rounded-2xl px-4 py-3 text-sm font-bold text-white shadow-lg" style={{ backgroundColor: form.primaryColor }}>تصفح المنيو</div>
        {!form.isPublished ? <div className="mt-4 rounded-xl border border-amber-700/20 bg-amber-50/90 px-3 py-2 text-xs font-bold text-amber-900">المنيو مخفي حاليًا عن العملاء</div> : null}
      </div>
    </div>
  );
}

function LogoPreview({ logoUrl, primaryColor }: { logoUrl: string; primaryColor: string }) {
  if (logoUrl) return <img src={logoUrl} alt="شعار الكوفي" className="mx-auto h-24 w-24 rounded-full object-contain" />;
  return <div className="mx-auto flex h-24 w-24 flex-col items-center justify-center rounded-full border-2 bg-white/45" style={{ borderColor: `${primaryColor}55`, color: primaryColor }}><span className="text-3xl">☕</span><span className="mt-1 text-[10px] font-bold">الملقا</span></div>;
}

function formatPrice(price: number) {
  return Number.isInteger(price) ? String(price) : price.toFixed(2);
}

function AdminLoading() {
  return <main dir="rtl" className="brand-shell safe-page flex min-h-screen min-h-dvh items-center justify-center text-center text-[#6d4a34]">جاري تحميل لوحة الإدارة...</main>;
}
