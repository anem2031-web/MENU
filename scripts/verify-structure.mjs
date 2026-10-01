import { access, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const required = [
  "package.json",
  "pnpm-workspace.yaml",
  ".env.example",
  "apps/web/package.json",
  "apps/web/src/main.tsx",
  "apps/web/src/lib/trpc.ts",
  "apps/server/package.json",
  "apps/server/src/index.ts",
  "apps/server/src/trpc/router.ts",
  "packages/shared/src/index.ts",
  "packages/db/src/index.ts",
  "PROJECT_PLAN.md",
];

for (const file of required) {
  await access(join(root, file));
}

for (const file of [
  "package.json",
  "apps/web/package.json",
  "apps/server/package.json",
  "packages/shared/package.json",
  "packages/db/package.json",
]) {
  JSON.parse(await readFile(join(root, file), "utf8"));
}

const env = await readFile(join(root, ".env.example"), "utf8");
if (!env.includes("/MENU")) {
  throw new Error(".env.example must reference TiDB database MENU");
}
if (/PASSWORD\s*=\s*[^<\n]+/i.test(env)) {
  throw new Error(".env.example appears to contain a real password");
}

const router = await readFile(join(root, "apps/server/src/trpc/router.ts"), "utf8");
if (!router.includes("health")) {
  throw new Error("tRPC health procedure is missing");
}

const client = await readFile(join(root, "apps/web/src/lib/trpc.ts"), "utf8");
if (!client.includes("createTRPCReact")) {
  throw new Error("tRPC React client is missing");
}

console.log(`Structure verification passed (${required.length} required files).`);
console.log("Package JSON files parsed successfully.");
console.log("TiDB database documented: MENU");
console.log("tRPC health procedure scaffolded: system.health");
