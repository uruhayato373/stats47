/**
 * カテゴリ page hero のコピペ用生成プロンプトを出力する。
 *
 *   npx tsx apps/web/scripts/print-category-hero-prompts.ts --all
 *   npx tsx apps/web/scripts/print-category-hero-prompts.ts --category population
 *
 * 出力プロンプトを Codex / Imagen 等に貼って 3:2 (1536x1024) で生成 →
 * `docs/assets/category-<key>-hero.png` に保存 → webp 化 → page-heroes.ts に配線。
 *
 * 正典: `.claude/rules/ogp-image-standards.md` §5.6 / カタログ: apps/web/scripts/data/category-hero-catalog.ts
 */

import {
  CATEGORY_HERO_SUBJECTS,
  buildCategoryHeroPrompt,
} from "./data/category-hero-catalog";

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const all = process.argv.includes("--all");
const one = argValue("--category");
const keys = all ? Object.keys(CATEGORY_HERO_SUBJECTS) : one ? [one] : [];

if (keys.length === 0) {
  console.error(
    "usage: --all | --category <key>\nkeys: " +
      Object.keys(CATEGORY_HERO_SUBJECTS).join(", "),
  );
  process.exit(1);
}

for (const key of keys) {
  const entry = CATEGORY_HERO_SUBJECTS[key];
  if (!entry) {
    console.error(`unknown key: ${key}`);
    process.exit(1);
  }
  console.log(`\n===== ${key} (${entry.name}) — /category/${key} =====`);
  console.log(`save to: docs/assets/category-${key}-hero.png  (3:2 / 1536x1024)`);
  console.log("---");
  console.log(buildCategoryHeroPrompt(key));
}
console.log("");
