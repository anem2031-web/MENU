import "dotenv/config";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, pool, users } from "@almalqa/db";

async function main() {
  const username = process.env.OWNER_USERNAME?.trim();
  const password = process.env.OWNER_PASSWORD;

  if (!username || username.length < 3) {
    throw new Error("OWNER_USERNAME must be at least 3 characters");
  }
  if (!password || password.length < 8) {
    throw new Error("OWNER_PASSWORD must be at least 8 characters");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1);

  if (existing[0]) {
    await db
      .update(users)
      .set({ passwordHash, role: "owner", isActive: 1 })
      .where(eq(users.id, existing[0].id));
    console.log(`Owner account updated: ${username}`);
  } else {
    await db.insert(users).values({ username, passwordHash, role: "owner", isActive: 1 });
    console.log(`Owner account created: ${username}`);
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
