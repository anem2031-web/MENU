import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/mysql2";

dotenv.config({ path: "../../.env" });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not defined");
}

export const pool = mysql.createPool({
  uri: databaseUrl,
  ssl: {
    rejectUnauthorized: true,
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const db = drizzle(pool);

export async function testDatabaseConnection() {
  const [rows] = await pool.query("SELECT DATABASE() AS db, 1 AS ok");
  return rows;
}
export * from "./schema.js";
