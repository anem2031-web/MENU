import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { getAuthenticatedUser } from "../auth/current-user.js";

export async function createContext({ req, res }: CreateExpressContextOptions) {
  const user = await getAuthenticatedUser(req.headers.cookie);
  return { req, res, user };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
