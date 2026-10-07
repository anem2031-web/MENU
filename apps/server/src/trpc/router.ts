import { APP_NAME } from "@almalqa/shared";
import { cafeSettings, categories, db, products, users } from "@almalqa/db";
import { and, asc, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { clearSessionCookie, createSessionToken, setSessionCookie } from "../auth/session.js";
import { protectedProcedure, publicProcedure, router } from "./trpc.js";

const DEFAULT_SETTINGS = {
  nameAr: "كوفي الملقا",
  nameEn: "Al Malqa Cafe",
  descriptionAr: "تجربة راقية .. ببساطة",
  descriptionEn: "A refined experience in simple ways",
  logoKey: null,
  logoUrl: "",
  welcomeEnabled: 1,
  welcomeLogoKey: null,
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
  defaultLanguage: "ar" as const,
  publicSlug: "al-malqa",
  isPublished: 1,
};

async function getCafeSettings() {
  const rows = await db.select().from(cafeSettings).limit(1);
  if (rows[0]) return rows[0];

  try {
    await db.insert(cafeSettings).values(DEFAULT_SETTINGS);
  } catch {
    // A concurrent first request may have inserted the singleton row already.
  }

  const createdRows = await db.select().from(cafeSettings).limit(1);
  if (!createdRows[0]) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "تعذر تهيئة إعدادات الكوفي" });
  }

  return createdRows[0];
}

function serializeSettings(settings: Awaited<ReturnType<typeof getCafeSettings>>) {
  return {
    id: settings.id,
    nameAr: settings.nameAr,
    nameEn: settings.nameEn,
    descriptionAr: settings.descriptionAr ?? "",
    descriptionEn: settings.descriptionEn ?? "",
    logoKey: settings.logoKey ?? "",
    logoUrl: settings.logoUrl ?? "",
    welcomeEnabled: settings.welcomeEnabled === 1,
    welcomeLogoKey: settings.welcomeLogoKey ?? "",
    welcomeLogoUrl: settings.welcomeLogoUrl ?? "",
    welcomeTitleAr: settings.welcomeTitleAr,
    welcomeTitleEn: settings.welcomeTitleEn,
    welcomeSubtitleAr: settings.welcomeSubtitleAr,
    welcomeSubtitleEn: settings.welcomeSubtitleEn,
    welcomeDescriptionAr: settings.welcomeDescriptionAr ?? "",
    welcomeDescriptionEn: settings.welcomeDescriptionEn ?? "",
    welcomeButtonAr: settings.welcomeButtonAr,
    welcomeButtonEn: settings.welcomeButtonEn,
    primaryColor: settings.primaryColor,
    backgroundColor: settings.backgroundColor,
    currency: settings.currency,
    defaultLanguage: settings.defaultLanguage,
    publicSlug: settings.publicSlug,
    isPublished: settings.isPublished === 1,
  };
}

function serializeCategory(category: typeof categories.$inferSelect) {
  return {
    id: category.id,
    nameAr: category.nameAr,
    nameEn: category.nameEn ?? "",
    imageKey: category.imageKey ?? "",
    imageUrl: category.imageUrl ?? "",
    sortOrder: category.sortOrder,
    isVisible: category.isVisible === 1,
  };
}

function serializeProduct(product: typeof products.$inferSelect) {
  return {
    id: product.id,
    categoryId: product.categoryId,
    nameAr: product.nameAr,
    nameEn: product.nameEn ?? "",
    descriptionAr: product.descriptionAr ?? "",
    descriptionEn: product.descriptionEn ?? "",
    price: Number(product.price),
    imageKey: product.imageKey ?? "",
    imageUrl: product.imageUrl ?? "",
    sortOrder: product.sortOrder,
    isVisible: product.isVisible === 1,
    isAvailable: product.isAvailable === 1,
    isFeatured: product.isFeatured === 1,
  };
}

const systemRouter = router({
  health: publicProcedure.query(() => ({
    status: "ok" as const,
    service: APP_NAME,
    timestamp: new Date().toISOString(),
  })),
});

const authRouter = router({
  login: publicProcedure
    .input(
      z.object({
        username: z.string().trim().min(3).max(100),
        password: z.string().min(8).max(128),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const rows = await db
        .select({
          id: users.id,
          username: users.username,
          passwordHash: users.passwordHash,
          role: users.role,
          isActive: users.isActive,
        })
        .from(users)
        .where(eq(users.username, input.username))
        .limit(1);

      const user = rows[0];
      const passwordMatches = user ? await bcrypt.compare(input.password, user.passwordHash) : false;

      if (!user || user.isActive !== 1 || !passwordMatches) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "اسم المستخدم أو كلمة المرور غير صحيحة" });
      }

      setSessionCookie(ctx.res, createSessionToken(user.id, user.role));

      return {
        id: user.id,
        username: user.username,
        role: user.role,
      };
    }),

  logout: publicProcedure.mutation(({ ctx }) => {
    clearSessionCookie(ctx.res);
    return { success: true as const };
  }),

  me: publicProcedure.query(({ ctx }) => ctx.user),
});

const cafeRouter = router({
  publicSettings: publicProcedure.query(async () => {
    const settings = await getCafeSettings();
    return serializeSettings(settings);
  }),

  publicCategories: publicProcedure.query(async () => {
    const rows = await db
      .select()
      .from(categories)
      .where(eq(categories.isVisible, 1))
      .orderBy(asc(categories.sortOrder), asc(categories.id));

    return rows.map(serializeCategory);
  }),

  publicProducts: publicProcedure.query(async () => {
    const rows = await db
      .select({
        product: products,
        categoryNameAr: categories.nameAr,
        categoryNameEn: categories.nameEn,
        categorySortOrder: categories.sortOrder,
      })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(and(eq(products.isVisible, 1), eq(categories.isVisible, 1)))
      .orderBy(asc(categories.sortOrder), asc(products.sortOrder), asc(products.id));

    return rows.map(({ product, categoryNameAr, categoryNameEn }) => ({
      ...serializeProduct(product),
      categoryNameAr,
      categoryNameEn: categoryNameEn ?? "",
    }));
  }),
});

const settingsInput = z.object({
  nameAr: z.string().trim().min(2).max(150),
  nameEn: z.string().trim().min(2).max(150),
  descriptionAr: z.string().trim().max(500),
  descriptionEn: z.string().trim().max(500),
  logoKey: z.string().trim().max(500),
  logoUrl: z.string().trim().max(1000),
  welcomeEnabled: z.boolean(),
  welcomeLogoKey: z.string().trim().max(500),
  welcomeLogoUrl: z.string().trim().max(1000),
  welcomeTitleAr: z.string().trim().min(2).max(180),
  welcomeTitleEn: z.string().trim().max(180),
  welcomeSubtitleAr: z.string().trim().min(2).max(180),
  welcomeSubtitleEn: z.string().trim().max(180),
  welcomeDescriptionAr: z.string().trim().max(700),
  welcomeDescriptionEn: z.string().trim().max(700),
  welcomeButtonAr: z.string().trim().min(2).max(120),
  welcomeButtonEn: z.string().trim().max(120),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "اللون الرئيسي غير صالح"),
  backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "لون الخلفية غير صالح"),
  currency: z.string().trim().min(2).max(10),
  defaultLanguage: z.enum(["ar", "en"]),
  publicSlug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "الرابط المختصر يجب أن يكون أحرفًا إنجليزية صغيرة وأرقامًا وشرطات"),
  isPublished: z.boolean(),
});

const categoryInput = z.object({
  nameAr: z.string().trim().min(2, "اسم القسم بالعربي مطلوب").max(150),
  nameEn: z.string().trim().max(150),
  imageKey: z.string().trim().max(500),
  imageUrl: z.string().trim().max(1000),
  sortOrder: z.number().int().min(-9999).max(9999),
  isVisible: z.boolean(),
});

const productInput = z.object({
  categoryId: z.number().int().positive("اختر قسمًا صالحًا"),
  nameAr: z.string().trim().min(2, "اسم الصنف بالعربي مطلوب").max(200),
  nameEn: z.string().trim().max(200),
  descriptionAr: z.string().trim().max(1200),
  descriptionEn: z.string().trim().max(1200),
  price: z.number().min(0).max(999999.99),
  imageKey: z.string().trim().max(500),
  imageUrl: z.string().trim().max(1000),
  sortOrder: z.number().int().min(-9999).max(9999),
  isVisible: z.boolean(),
  isAvailable: z.boolean(),
  isFeatured: z.boolean(),
});

async function ensureCategoryExists(categoryId: number) {
  const rows = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.id, categoryId))
    .limit(1);

  if (!rows[0]) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "القسم المحدد غير موجود" });
  }
}

const adminRouter = router({
  status: protectedProcedure.query(({ ctx }) => ({
    authenticated: true as const,
    user: ctx.user,
  })),

  settings: protectedProcedure.query(async () => {
    const settings = await getCafeSettings();
    return serializeSettings(settings);
  }),

  updateSettings: protectedProcedure
    .input(settingsInput)
    .mutation(async ({ input }) => {
      const current = await getCafeSettings();

      await db
        .update(cafeSettings)
        .set({
          nameAr: input.nameAr,
          nameEn: input.nameEn,
          descriptionAr: input.descriptionAr || null,
          descriptionEn: input.descriptionEn || null,
          logoKey: input.logoKey || null,
          logoUrl: input.logoUrl || null,
          welcomeEnabled: input.welcomeEnabled ? 1 : 0,
          welcomeLogoKey: input.welcomeLogoKey || null,
          welcomeLogoUrl: input.welcomeLogoUrl || null,
          welcomeTitleAr: input.welcomeTitleAr,
          welcomeTitleEn: input.welcomeTitleEn || "Welcome",
          welcomeSubtitleAr: input.welcomeSubtitleAr,
          welcomeSubtitleEn: input.welcomeSubtitleEn || "at Al Malqa Cafe",
          welcomeDescriptionAr: input.welcomeDescriptionAr || null,
          welcomeDescriptionEn: input.welcomeDescriptionEn || null,
          welcomeButtonAr: input.welcomeButtonAr,
          welcomeButtonEn: input.welcomeButtonEn || "View Menu",
          primaryColor: input.primaryColor.toUpperCase(),
          backgroundColor: input.backgroundColor.toUpperCase(),
          currency: input.currency.toUpperCase(),
          defaultLanguage: input.defaultLanguage,
          publicSlug: input.publicSlug,
          isPublished: input.isPublished ? 1 : 0,
        })
        .where(eq(cafeSettings.id, current.id));

      const updated = await getCafeSettings();
      return serializeSettings(updated);
    }),

  categories: protectedProcedure.query(async () => {
    const rows = await db
      .select()
      .from(categories)
      .orderBy(asc(categories.sortOrder), asc(categories.id));

    return rows.map(serializeCategory);
  }),

  createCategory: protectedProcedure
    .input(categoryInput)
    .mutation(async ({ input }) => {
      const result = await db
        .insert(categories)
        .values({
          nameAr: input.nameAr,
          nameEn: input.nameEn || null,
          imageKey: input.imageKey || null,
          imageUrl: input.imageUrl || null,
          sortOrder: input.sortOrder,
          isVisible: input.isVisible ? 1 : 0,
        })
        .$returningId();

      const id = result[0]?.id;
      if (!id) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "تعذر إنشاء القسم" });
      }

      const rows = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
      if (!rows[0]) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "تم الإنشاء لكن تعذر قراءة القسم" });
      }

      return serializeCategory(rows[0]);
    }),

  updateCategory: protectedProcedure
    .input(categoryInput.extend({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const existing = await db.select({ id: categories.id }).from(categories).where(eq(categories.id, input.id)).limit(1);
      if (!existing[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "القسم غير موجود" });
      }

      await db
        .update(categories)
        .set({
          nameAr: input.nameAr,
          nameEn: input.nameEn || null,
          imageKey: input.imageKey || null,
          imageUrl: input.imageUrl || null,
          sortOrder: input.sortOrder,
          isVisible: input.isVisible ? 1 : 0,
        })
        .where(eq(categories.id, input.id));

      const rows = await db.select().from(categories).where(eq(categories.id, input.id)).limit(1);
      if (!rows[0]) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "تعذر قراءة القسم بعد التعديل" });
      }

      return serializeCategory(rows[0]);
    }),

  setCategoryVisibility: protectedProcedure
    .input(z.object({ id: z.number().int().positive(), isVisible: z.boolean() }))
    .mutation(async ({ input }) => {
      const existing = await db.select({ id: categories.id }).from(categories).where(eq(categories.id, input.id)).limit(1);
      if (!existing[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "القسم غير موجود" });
      }

      await db
        .update(categories)
        .set({ isVisible: input.isVisible ? 1 : 0 })
        .where(eq(categories.id, input.id));

      return { success: true as const };
    }),

  deleteCategory: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const existing = await db.select({ id: categories.id }).from(categories).where(eq(categories.id, input.id)).limit(1);
      if (!existing[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "القسم غير موجود" });
      }

      const linkedProduct = await db
        .select({ id: products.id })
        .from(products)
        .where(eq(products.categoryId, input.id))
        .limit(1);

      if (linkedProduct[0]) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "لا يمكن حذف القسم لأنه يحتوي على أصناف. انقل أو احذف الأصناف أولًا.",
        });
      }

      await db.delete(categories).where(eq(categories.id, input.id));
      return { success: true as const };
    }),

  products: protectedProcedure.query(async () => {
    const rows = await db
      .select({
        product: products,
        categoryNameAr: categories.nameAr,
        categoryNameEn: categories.nameEn,
      })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .orderBy(asc(categories.sortOrder), asc(products.sortOrder), asc(products.id));

    return rows.map(({ product, categoryNameAr, categoryNameEn }) => ({
      ...serializeProduct(product),
      categoryNameAr,
      categoryNameEn: categoryNameEn ?? "",
    }));
  }),

  createProduct: protectedProcedure
    .input(productInput)
    .mutation(async ({ input }) => {
      await ensureCategoryExists(input.categoryId);

      const result = await db
        .insert(products)
        .values({
          categoryId: input.categoryId,
          nameAr: input.nameAr,
          nameEn: input.nameEn || null,
          descriptionAr: input.descriptionAr || null,
          descriptionEn: input.descriptionEn || null,
          price: input.price.toFixed(2),
          imageKey: input.imageKey || null,
          imageUrl: input.imageUrl || null,
          sortOrder: input.sortOrder,
          isVisible: input.isVisible ? 1 : 0,
          isAvailable: input.isAvailable ? 1 : 0,
          isFeatured: input.isFeatured ? 1 : 0,
        })
        .$returningId();

      const id = result[0]?.id;
      if (!id) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "تعذر إنشاء الصنف" });
      }

      const rows = await db.select().from(products).where(eq(products.id, id)).limit(1);
      if (!rows[0]) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "تم الإنشاء لكن تعذر قراءة الصنف" });
      }

      return serializeProduct(rows[0]);
    }),

  updateProduct: protectedProcedure
    .input(productInput.extend({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      await ensureCategoryExists(input.categoryId);
      const existing = await db.select({ id: products.id }).from(products).where(eq(products.id, input.id)).limit(1);
      if (!existing[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "الصنف غير موجود" });
      }

      await db
        .update(products)
        .set({
          categoryId: input.categoryId,
          nameAr: input.nameAr,
          nameEn: input.nameEn || null,
          descriptionAr: input.descriptionAr || null,
          descriptionEn: input.descriptionEn || null,
          price: input.price.toFixed(2),
          imageKey: input.imageKey || null,
          imageUrl: input.imageUrl || null,
          sortOrder: input.sortOrder,
          isVisible: input.isVisible ? 1 : 0,
          isAvailable: input.isAvailable ? 1 : 0,
          isFeatured: input.isFeatured ? 1 : 0,
        })
        .where(eq(products.id, input.id));

      const rows = await db.select().from(products).where(eq(products.id, input.id)).limit(1);
      if (!rows[0]) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "تعذر قراءة الصنف بعد التعديل" });
      }

      return serializeProduct(rows[0]);
    }),

  setProductVisibility: protectedProcedure
    .input(z.object({ id: z.number().int().positive(), isVisible: z.boolean() }))
    .mutation(async ({ input }) => {
      await db.update(products).set({ isVisible: input.isVisible ? 1 : 0 }).where(eq(products.id, input.id));
      return { success: true as const };
    }),

  setProductAvailability: protectedProcedure
    .input(z.object({ id: z.number().int().positive(), isAvailable: z.boolean() }))
    .mutation(async ({ input }) => {
      await db.update(products).set({ isAvailable: input.isAvailable ? 1 : 0 }).where(eq(products.id, input.id));
      return { success: true as const };
    }),

  deleteProduct: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const existing = await db.select({ id: products.id }).from(products).where(eq(products.id, input.id)).limit(1);
      if (!existing[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "الصنف غير موجود" });
      }

      await db.delete(products).where(eq(products.id, input.id));
      return { success: true as const };
    }),
});

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  cafe: cafeRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
