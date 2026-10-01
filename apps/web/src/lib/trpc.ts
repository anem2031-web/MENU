import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@almalqa/server/trpc";

export const trpc = createTRPCReact<AppRouter>();
