/**
 * known-ranking-keys.ts の生成スクリプト (2026-06-06 公開URL版)
 *
 * 真実源: `@stats47/data-configs` の isActive=true かつ prefecture 対応 metric
 * + R2 公開 URL での item.json 存在確認。
 * build-ranking-item-from-metric.ts で areaType は常に "prefecture" のため、
 * isActive・entities に prefecture を含む・R2 item.json が 200 を返すキーを
 * KNOWN として登録する。
 *
 * ローカル R2 ミラー依存を廃止し、R2_PUBLIC_FETCH_URL 経由で動作。
 * R2 item.json がまだ存在しないメトリクスは除外される（CI で generate-ranking-items を
 * 実行後に再生成すること）。
 *
 * 使い方: `cd apps/web && R2_PUBLIC_FETCH_URL=https://storage.stats47.jp \
 *          NODE_OPTIONS='--conditions react-server' npx tsx scripts/generate-known-ranking-keys.ts`
 * 更新タイミング: ranking item を追加/有効化 + CI で generate-ranking-items 実行後。
 *                 必ず git commit してからデプロイ。
 */

import fs from "node:fs";
import path from "node:path";
import { listAllMetrics } from "@stats47/data-configs";

import { checkPresence, type Presence } from "./lib/r2-presence";

const R2_PUBLIC = process.env.R2_PUBLIC_FETCH_URL ?? "https://storage.stats47.jp";
const OUT_PATH = path.resolve(
  __dirname,
  "../../../packages/ranking/src/config/known-ranking-keys.ts",
);

const activeMetrics = listAllMetrics()
  .filter((m) => m.isActive && m.entities.includes("prefecture"))
  .map((m) => m.key);
console.log(
  `[generate-known-ranking-keys] checking ${activeMetrics.length} active prefecture metrics...`,
);

// R2 item.json の存在を並列確認（CONCURRENCY=30）
const CONCURRENCY = 30;
/** ネットワーク由来の失敗をリトライする回数 (404 はリトライしない — 答えが出ているため) */
const HEAD_ATTEMPTS = 3;

/**
 * R2 に item.json があるか。判定ロジックは `lib/r2-presence.ts` に置いてテストで固定してある
 * (「判定できなかった」を「無い」に倒さない。ここが KNOWN / SITEMAP の真実源なので、
 * キーが落ちると middleware が 404 を返し sitemap からも消える = 生きているページの削除)。
 */
async function checkExists(key: string): Promise<Presence> {
  return checkPresence(`${R2_PUBLIC}/app/ranking/${key}/item.json`, {
    attempts: HEAD_ATTEMPTS,
  });
}

async function run() {
  const keys: string[] = [];
  const undetermined: string[] = [];
  for (let i = 0; i < activeMetrics.length; i += CONCURRENCY) {
    const batch = activeMetrics.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (k) => ({ k, presence: await checkExists(k) })),
    );
    for (const { k, presence } of results) {
      if (presence === "present") keys.push(k);
      else if (presence === "undetermined") undetermined.push(k);
    }
    process.stdout.write(`\r  ${Math.min(i + CONCURRENCY, activeMetrics.length)}/${activeMetrics.length}`);
  }
  console.log();

  // 1 件でも判定不能が残ったら書かない。部分的な結果で上書きすると、
  // 判定できなかったキーが黙って KNOWN から消える (= 本番 404)。
  if (undetermined.length > 0) {
    console.error(
      `[generate-known-ranking-keys] ❌ ${undetermined.length} 件が判定不能のため書き込みを中止する\n` +
        `  R2 への HEAD が ${HEAD_ATTEMPTS} 回とも失敗した (404 ではない = 一時障害の可能性)。\n` +
        `  そのまま書くと生きているページが KNOWN から消えて 404 になる。\n` +
        `  例: ${undetermined.slice(0, 10).join(", ")}`,
    );
    process.exit(1);
  }

  keys.sort();

  const today = new Date().toISOString().slice(0, 10);
  const header = `/**
 * 有効な ranking キー一覧（prefecture, isActive）— 完全DBレスの key SSOT
 *
 * **このファイルは自動生成されます。手動編集しないこと。**
 *
 * 用途:
 *  - middleware (url-policy) の 410 判定（apps/web は \`@stats47/ranking/config\` 経由で re-export）
 *  - 基盤1 \`listRankingItemsWithTagsFromR2\` の git 列挙フォールバック
 *    （公開URL環境では R2 を list できないため、本リストから item.json を列挙）
 *
 * 真実源: data-configs isActive=true・prefecture 対応かつ
 * R2 \`app/ranking/<key>/item.json\` が存在するキー。
 * 更新方法: \`cd apps/web && R2_PUBLIC_FETCH_URL=https://storage.stats47.jp \\
 *            NODE_OPTIONS='--conditions react-server' npx tsx scripts/generate-known-ranking-keys.ts\`
 * 更新タイミング: ranking item 追加/有効化 + CI generate-ranking-items 実行後。
 *                 必ず git commit してからデプロイ。
 *
 * 最終生成日: ${today}
 * 件数: ${keys.length}
 */
export const KNOWN_RANKING_KEYS: ReadonlySet<string> = new Set([
`;
  const body = keys.map((k) => `  ${JSON.stringify(k)},`).join("\n");
  const footer = `\n]);\n`;

  fs.writeFileSync(OUT_PATH, header + body + footer, "utf-8");
  console.log(`[generate-known-ranking-keys] wrote ${keys.length} keys to ${OUT_PATH}`);
}

run().catch((e) => { console.error(e); process.exit(1); });
