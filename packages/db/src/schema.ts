import {
  mysqlTable,
  int,
  varchar,
  text,
  decimal,
  timestamp,
  mysqlEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/mysql-core";

/**
 * المستخدمون الإداريون
 * المرحلة 3 ستضيف تسجيل الدخول والصلاحيات.
 */
export const users = mysqlTable(
  "users",
  {
    id: int("id").autoincrement().primaryKey(),

    username: varchar("username", { length: 100 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),

    role: mysqlEnum("role", ["owner", "admin"])
      .notNull()
      .default("admin"),

    isActive: int("is_active").notNull().default(1),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .onUpdateNow(),
  },
  (table) => [
    uniqueIndex("users_username_unique").on(table.username),
  ],
);

/**
 * إعدادات وهوية الكوفي.
 * سيكون لدينا سجل رئيسي واحد في البداية.
 */
export const cafeSettings = mysqlTable(
  "cafe_settings",
  {
    id: int("id").autoincrement().primaryKey(),

    nameAr: varchar("name_ar", { length: 150 })
      .notNull()
      .default("كوفي الملقا"),

    nameEn: varchar("name_en", { length: 150 })
      .notNull()
      .default("Al Malqa Cafe"),

    descriptionAr: text("description_ar"),
    descriptionEn: text("description_en"),

    logoKey: varchar("logo_key", { length: 500 }),
    logoUrl: varchar("logo_url", { length: 1000 }),

    welcomeEnabled: int("welcome_enabled").notNull().default(1),
    welcomeLogoKey: varchar("welcome_logo_key", { length: 500 }),
    welcomeLogoUrl: varchar("welcome_logo_url", { length: 1000 }),
    welcomeTitleAr: varchar("welcome_title_ar", { length: 180 })
      .notNull()
      .default("أهلًا وسهلًا بكم"),
    welcomeTitleEn: varchar("welcome_title_en", { length: 180 })
      .notNull()
      .default("Welcome"),
    welcomeSubtitleAr: varchar("welcome_subtitle_ar", { length: 180 })
      .notNull()
      .default("في قهوة الملقا"),
    welcomeSubtitleEn: varchar("welcome_subtitle_en", { length: 180 })
      .notNull()
      .default("at Al Malqa Cafe"),
    welcomeDescriptionAr: text("welcome_description_ar"),
    welcomeDescriptionEn: text("welcome_description_en"),
    welcomeButtonAr: varchar("welcome_button_ar", { length: 120 })
      .notNull()
      .default("استعرض المنيو"),
    welcomeButtonEn: varchar("welcome_button_en", { length: 120 })
      .notNull()
      .default("View Menu"),

    primaryColor: varchar("primary_color", { length: 20 })
      .notNull()
      .default("#5A3825"),

    backgroundColor: varchar("background_color", { length: 20 })
      .notNull()
      .default("#F7F1EA"),

    currency: varchar("currency", { length: 10 })
      .notNull()
      .default("SAR"),

    defaultLanguage: mysqlEnum("default_language", ["ar", "en"])
      .notNull()
      .default("ar"),

    publicSlug: varchar("public_slug", { length: 120 })
      .notNull()
      .default("al-malqa"),

    isPublished: int("is_published").notNull().default(1),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .onUpdateNow(),
  },
  (table) => [
    uniqueIndex("cafe_settings_public_slug_unique").on(table.publicSlug),
  ],
);

/**
 * أقسام المنيو.
 */
export const categories = mysqlTable(
  "categories",
  {
    id: int("id").autoincrement().primaryKey(),

    nameAr: varchar("name_ar", { length: 150 }).notNull(),
    nameEn: varchar("name_en", { length: 150 }),

    imageKey: varchar("image_key", { length: 500 }),
    imageUrl: varchar("image_url", { length: 1000 }),

    sortOrder: int("sort_order").notNull().default(0),
    isVisible: int("is_visible").notNull().default(1),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .onUpdateNow(),
  },
  (table) => [
    index("categories_sort_order_idx").on(table.sortOrder),
    index("categories_visible_idx").on(table.isVisible),
  ],
);

/**
 * منتجات المنيو.
 *
 * الصور نفسها ستُخزن في IDrive S3/e2.
 * قاعدة البيانات تحتفظ فقط بمفتاح الملف والرابط.
 */
export const products = mysqlTable(
  "products",
  {
    id: int("id").autoincrement().primaryKey(),

    categoryId: int("category_id")
      .notNull()
      .references(() => categories.id),

    nameAr: varchar("name_ar", { length: 200 }).notNull(),
    nameEn: varchar("name_en", { length: 200 }),

    descriptionAr: text("description_ar"),
    descriptionEn: text("description_en"),

    price: decimal("price", {
      precision: 10,
      scale: 2,
    }).notNull(),

    imageKey: varchar("image_key", { length: 500 }),
    imageUrl: varchar("image_url", { length: 1000 }),

    sortOrder: int("sort_order").notNull().default(0),
    isVisible: int("is_visible").notNull().default(1),
    isAvailable: int("is_available").notNull().default(1),
    isFeatured: int("is_featured").notNull().default(0),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .onUpdateNow(),
  },
  (table) => [
    index("products_menu_lookup_idx").on(
      table.categoryId,
      table.isVisible,
      table.sortOrder,
    ),
    index("products_available_idx").on(table.isAvailable),
    index("products_featured_idx").on(table.isFeatured),
  ],
);