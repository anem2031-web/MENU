import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const files = {
  html: await readFile(resolve(root, "apps/web/index.html"), "utf8"),
  css: await readFile(resolve(root, "apps/web/src/index.css"), "utf8"),
  home: await readFile(resolve(root, "apps/web/src/pages/home-page.tsx"), "utf8"),
  admin: await readFile(resolve(root, "apps/web/src/pages/admin-page.tsx"), "utf8"),
  login: await readFile(resolve(root, "apps/web/src/pages/admin-login-page.tsx"), "utf8"),
};

const checks = [
  ["viewport-fit=cover", files.html.includes("viewport-fit=cover")],
  ["Safe Area CSS", files.css.includes("safe-area-inset-top") && files.css.includes("safe-area-inset-bottom")],
  ["dynamic viewport", files.css.includes("100dvh") && files.login.includes("min-h-dvh")],
  ["iOS input zoom guard", files.css.includes("font-size: 16px")],
  ["touch target", files.css.includes("min-height: 44px")],
  ["horizontal overflow guard", files.css.includes("overflow-x: clip")],
  ["customer responsive product grid", files.home.includes("min-[430px]:grid-cols-2")],
  ["customer horizontal category scroller", files.home.includes("horizontal-scroll")],
  ["admin mobile tabs", files.admin.includes("admin-tabs")],
  ["admin responsive product card", files.admin.includes("min-[480px]:flex-row")],
];

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? "✓" : "✗"} ${label}`);
  if (!ok) failed += 1;
}

if (failed) {
  console.error(`Responsive verification failed: ${failed} check(s).`);
  process.exit(1);
}

console.log(`Responsive verification passed (${checks.length} checks).`);
