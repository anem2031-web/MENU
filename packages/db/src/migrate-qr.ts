import { readFile } from "node:fs/promises";
import { pool } from "./index.js";

// Additive, idempotent migration only. Never creates or modifies a QR record.
// Existing hand-written migrations 0004/0005 are not in Drizzle's journal;
// keep this feature's migration explicitly scoped rather than replaying that journal.
try {
  const sql = await readFile(new URL("../drizzle/0006_customer_qr_archive.sql", import.meta.url), "utf8");
  for (const statement of sql.split("--> statement-breakpoint")) {
    if (statement.trim()) await pool.query(statement.trim());
  }
  console.log("Customer QR archive tables are ready. No QR was generated or changed.");
} finally { await pool.end(); }
