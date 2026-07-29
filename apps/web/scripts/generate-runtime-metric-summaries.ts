/**
 * runtime-metric-summaries.generated.ts の生成スクリプト
 *
 * 真実源: `@stats47/data-configs` の git TS metric config (SSOT は動かさない)。
 *
 * なぜ生成物を挟むか: 共通 Header と home ポータルがカテゴリ件数・代表ランキングを
 * runtime に `listAllMetrics()` から計算しており、その結果 372KB / 4,611 行の
 * METRICS_REGISTRY と 2,000 超の metric module が **ほぼ全 route の dev bundle** に
 * 取り込まれていた (実測: home/blog の route bundle に metric module 参照 18,364 件)。
 * 表示に必要なのは品目語だけなので、その導出結果だけを
 * ビルド前に焼き、runtime は registry を触らない。
 *
 * 使い方:
 *   npm run generate:runtime-summaries --workspace apps/web
 *   npm run check:runtime-summaries    --workspace apps/web   # 差分があれば非0で終了
 *
 * 更新タイミング: metric config を追加・変更・isActive 切替した後。必ず commit する。
 * 生成物は手編集しない (check が差分を検出して落ちる)。
 */

import fs from "node:fs";
import path from "node:path";

import { listAllMetrics } from "@stats47/data-configs";

import { deriveProductTermsFromTitles } from "../src/features/ads/constants/product-keyword-derivation";

const OUT_PATH = path.resolve(
  __dirname,
  "../src/config/runtime-metric-summaries.generated.ts",
);
function build(): string {
  const allMetrics = listAllMetrics();

  // 品目語は isActive で絞らない (実行時 listProductKeywords が全 metric を見ていたため)。
  const productKeywords = deriveProductTermsFromTitles(
    allMetrics.map((metric) => metric.title),
  );

  const json = (value: unknown) => JSON.stringify(value, null, 2);

  return `/**
 * AUTO-GENERATED — 手編集禁止
 *
 * 生成コマンド: npm run generate:runtime-summaries --workspace apps/web
 * 真実源: packages/data-configs/src/metrics/*.ts (git TS)
 *
 * 楽天商品カードが METRICS_REGISTRY を runtime import せずに済むよう、
 * 品目語の導出結果だけを焼いたもの。
 *
 * カテゴリ件数・代表ランキングは 2026-07-29 に ranking-prominence へ一本化した
 * (件数の真実源が 2 本あるとドリフトするため)。
 */

/** 記事・ランキングのタイトルから楽天商品を検出するための品目語。 */
export const RUNTIME_PRODUCT_KEYWORDS: ReadonlyArray<string> =
  ${json(productKeywords)};
`;
}

function main(): void {
  const isCheck = process.argv.includes("--check");
  const next = build();
  const current = fs.existsSync(OUT_PATH)
    ? fs.readFileSync(OUT_PATH, "utf8")
    : null;

  if (isCheck) {
    if (current === next) {
      console.log("[runtime-summaries] up to date");
      return;
    }
    console.error(
      `[runtime-summaries] ${current === null ? "生成物がありません" : "生成物が SSOT とずれています"}。\n` +
        "  npm run generate:runtime-summaries --workspace apps/web を実行して commit してください。",
    );
    process.exit(1);
  }

  // 内容が同じなら書かない (mtime を動かさず、hot reload と CI cache を無駄に壊さない)。
  if (current === next) {
    console.log("[runtime-summaries] no change");
    return;
  }
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, next);
  console.log(`[runtime-summaries] wrote ${path.relative(process.cwd(), OUT_PATH)}`);
}

main();
