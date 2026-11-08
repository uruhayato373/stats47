/**
 * カテゴリ画像のコピペ用生成プロンプトを出力する (生成は Codex。経路の正本は
 * config/image-generation-routes.json の category-hero / category-card)。
 *
 *   npx tsx apps/web/scripts/print-category-hero-prompts.ts --all
 *   npx tsx apps/web/scripts/print-category-hero-prompts.ts --category population
 *   npx tsx apps/web/scripts/print-category-hero-prompts.ts --kind card --category ict
 *
 * hero (既定): 3:2 (1536x1024) で生成 → `assets/page-heroes/category-<key>-hero.jpg` に保存
 *   → webp 化して `apps/web/public/images/category-<key>-hero.webp` → page-heroes.ts に配線。
 * card: 3:2 で生成 → 768x512 の webp にして `apps/web/public/images/categories/<key>.webp`。
 *
 * 正典: `.claude/rules/ogp-image-standards.md` §5.6 / カタログ: apps/web/scripts/data/category-hero-catalog.ts
 */

import {
  CATEGORY_CARD_SUBJECTS,
  CATEGORY_HERO_SUBJECTS,
  buildCategoryCardPrompt,
  buildCategoryHeroPrompt,
} from "./data/category-hero-catalog";

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const kind = argValue("--kind") ?? "hero";
if (kind !== "hero" && kind !== "card") {
  console.error(`unknown --kind: ${kind} (hero | card)`);
  process.exit(1);
}
const subjects: Record<string, unknown> =
  kind === "card" ? CATEGORY_CARD_SUBJECTS : CATEGORY_HERO_SUBJECTS;

const all = process.argv.includes("--all");
const one = argValue("--category");
const keys = all ? Object.keys(subjects) : one ? [one] : [];

if (keys.length === 0) {
  console.error(
    "usage: [--kind hero|card] --all | --category <key>\nkeys: " +
      Object.keys(subjects).join(", "),
  );
  process.exit(1);
}

for (const key of keys) {
  if (!(key in subjects)) {
    console.error(`unknown key: ${key}`);
    process.exit(1);
  }
  if (kind === "card") {
    console.log(`\n===== ${key} — /ranking のカテゴリカード =====`);
    console.log(`save to: apps/web/public/images/categories/${key}.webp  (768x512 webp)`);
    console.log("---");
    console.log(buildCategoryCardPrompt(key));
  } else {
    const entry = CATEGORY_HERO_SUBJECTS[key];
    console.log(`\n===== ${key} (${entry.name}) — /category/${key} =====`);
    console.log(`save to: assets/page-heroes/category-${key}-hero.jpg  (3:2 / 1536x1024)`);
    console.log("---");
    console.log(buildCategoryHeroPrompt(key));
  }
}
console.log("");
