import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config({ path: "../../.env" });

async function main() {
  const connection = await mysql.createConnection({
    uri: process.env.DATABASE_URL!,
    ssl: {
      rejectUnauthorized: true,
    },
  });

  await connection.query(
    "INSERT INTO categories (name_ar, name_en, sort_order, is_visible) VALUES (?, ?, ?, ?)",
    ["اختبار", "Test", 999, 0],
  );

  const [rows] = await connection.query(
    "SELECT id, name_ar, name_en, sort_order, is_visible FROM categories WHERE name_ar = ? ORDER BY id DESC LIMIT 1",
    ["اختبار"],
  );

  console.log(rows);

  await connection.query(
    "DELETE FROM categories WHERE name_ar = ? AND sort_order = ?",
    ["اختبار", 999],
  );

  await connection.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});