#!/usr/bin/env node
/**
 * recurrence guard: R2 依存の動的 route に generateStaticParams を付けない
 *
 * 2026-06-22 障害: ranking/[rankingKey]・areas/[areaCode]・areas/[areaCode]/cities/[cityCode] が
 * generateStaticParams で静的キー列を返し ● SSG 化 → CI build (R2 不可) で notFound prerender →
 * ISR 再生成が効かず本番で「〜が見つかりません」が永久固着した。
 *
 * これらの route はランタイムに R2 を読んで描画する必要があるため、generateStaticParams を持たず
 * ƒ (オンデマンド ISR) でなければならない。本ガードは PR/pre-commit 時点 (build 前) に再混入を弾く。
 *
 * 正典: .claude/rules/nextjs-ssg-preservation.md §generateStaticParams 固着
 * memory: feedback_generatestaticparams_r2_notfound_stuck
 *
 * Usage: node .claude/scripts/lib/check-r2-route-ssg.cjs
 * Exit: generateStaticParams が混入していれば 1。
 */
const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "../../..");

// R2 を読んで描画するため ƒ (オンデマンド) でなければならない動的 route page。
// build 時に R2 を読めず notFound prerender になる → generateStaticParams 禁止。
const R2_DEPENDENT_ROUTES = [
  "apps/web/src/app/ranking/[rankingKey]/page.tsx",
  "apps/web/src/app/areas/[areaCode]/page.tsx",
  "apps/web/src/app/areas/[areaCode]/cities/[cityCode]/page.tsx",
  // 2026-07-06: /survey 一覧が build 時 R2 不可で空 prerender 固着した事故に伴い ƒ 化。
  // [surveyKey] も generateStaticParams (build 時 [] を返すだけ) を撤去済 → 再混入禁止。
  "apps/web/src/app/survey/[surveyKey]/page.tsx",
  // 2026-08-20: GEO-SCOPE-SEPARATION-01 WP4。readJapanSeries() で app/japan/<metric>/series.json を
  // ランタイムに読む。build 時に generateStaticParams を付けると同じ notFound 固着が再発する。
  "apps/web/src/app/japan/[themeSlug]/page.tsx",
];

let violations = 0;
for (const rel of R2_DEPENDENT_ROUTES) {
  const abs = path.join(PROJECT_ROOT, rel);
  if (!fs.existsSync(abs)) {
    // route が無ければスキップ (リネーム等)。ガードの偽陽性を避ける。
    continue;
  }
  const src = fs.readFileSync(abs, "utf8");
  // コメント (// や /* */ 内) ではなく実コードの generateStaticParams を検出。
  // 行頭〜の export / const / function 形を見る。
  const codeLines = src
    .split("\n")
    .filter((l) => !l.trim().startsWith("*") && !l.trim().startsWith("//"));
  const joined = codeLines.join("\n");
  if (/\bgenerateStaticParams\b/.test(joined)) {
    violations++;
    console.error(`❌ ${rel}`);
    console.error(
      "   R2 依存 route に generateStaticParams が混入。● SSG 化 → build 時 R2 不可 →",
    );
    console.error(
      "   notFound 固着の再発。generateStaticParams を撤去し revalidate のみ残して ƒ 化すること。",
    );
  }
}

if (violations > 0) {
  console.error("");
  console.error(
    `R2-route SSG guard: ${violations} 件違反。詳細: .claude/rules/nextjs-ssg-preservation.md §generateStaticParams 固着`,
  );
  process.exit(1);
}
console.log("✓ R2-route SSG guard: R2 依存 route は ƒ (オンデマンド) を維持");
