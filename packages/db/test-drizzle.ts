import { eq } from "drizzle-orm";
import { db, pool } from "./src/index";
import { categories } from "./src/schema";

async function main() {
  const inserted = await db
    .insert(categories)
    .values({
      nameAr: "اختبار Drizzle",
      nameEn: "Drizzle Test",
      sortOrder: 998,
      isVisible: 0,
    })
    .$returningId();

  const insertedId = inserted[0]?.id;

  const rows = await db
    .select({
      id: categories.id,
      nameAr: categories.nameAr,
      nameEn: categories.nameEn,
      sortOrder: categories.sortOrder,
      isVisible: categories.isVisible,
    })
    .from(categories)
    .where(eq(categories.id, insertedId));

  console.log(rows);

  await db
    .delete(categories)
    .where(eq(categories.id, insertedId));

  await pool.end();
}

main().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exit(1);
});