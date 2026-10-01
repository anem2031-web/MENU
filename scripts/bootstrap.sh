#!/usr/bin/env bash
set -euo pipefail

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm غير موجود. سيتم تفعيله عبر Corepack..."
  corepack enable
  corepack prepare pnpm@10.17.1 --activate
fi

if [ ! -f .env ]; then
  cp .env.example .env
  echo "تم إنشاء .env من .env.example. عدّل القيم المحلية عند الحاجة."
fi

pnpm install
pnpm verify:structure
pnpm typecheck

echo "اكتمل إعداد المشروع. شغّل: pnpm dev"
