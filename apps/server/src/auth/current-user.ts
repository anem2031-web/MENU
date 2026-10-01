import { eq } from "drizzle-orm";
import { db, users } from "@almalqa/db";
import { readSessionToken, verifySessionToken } from "./session.js";

export type AuthenticatedUser = {
  id: number;
  username: string;
  role: "owner" | "admin";
};

export async function getAuthenticatedUser(cookieHeader: string | undefined): Promise<AuthenticatedUser | null> {
  const session = verifySessionToken(readSessionToken(cookieHeader));
  if (!session) return null;

  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      role: users.role,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  const found = rows[0];
  if (!found || found.isActive !== 1) return null;

  return {
    id: found.id,
    username: found.username,
    role: found.role,
  };
}
