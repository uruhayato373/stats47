/**
 * known-ranking-keys.ts の生成スクリプト (完全DBレス版 / 2026-05-29)
 *
 * 完全DBレス (docs/01_技術設計/19_完全DBレス設計.md) に伴い、D1 を読まず R2 の
 * ranking item snapshot (`app/ranking/<key>/item.json`) を真実源にする。
 * 旧版は Phase 6 で DROP 済の `stats_prefecture` を引いており既に壊れていた。
 *
 * known key = R2 に item.json が存在し、`areaType === "prefecture"` かつ `isActive` な ranking。
 * これは ranking ページの `generateStaticParams` (readActiveRankingKeysFromR2) /
 * `cachedFindRankingItem` → notFound と同一の有効性判定であり、middleware Fix 6 の
 * 410 ゲートを SSG と完全一致させる。
 *
 * ローカル R2 ミラー (`.local/r2`、dual-mode で外付け SSD) を直接読む。生成物は git commit
 * する設計 (CI ビルド環境は R2 binding が無いため)。
 *
 * 使い方: SSD 接続 (`scripts/dev/local-r2-mode.sh ssd`) のうえ
 *   `cd apps/web && npx tsx scripts/generate-known-ranking-keys.ts`
 * 更新タイミング: ranking item を追加/有効化した後。必ず git commit してからデプロイ。
 */

import fs from "node:fs";
import path from "node:path";

const RANKING_DIR = path.resolve(__dirname, "../../../.local/r2/app/ranking");
// 完全DBレスの key SSOT は packages/ranking に移設済 (basic-1 の git 列挙フォールバックと共有)。
// apps/web 側は @stats47/ranking/config への re-export。
const OUT_PATH = path.resolve(
  __dirname,
  "../../../packages/ranking/src/config/known-ranking-keys.ts",
);

if (!fs.existsSync(RANKING_DIR)) {
  console.error(`[generate-known-ranking-keys] R2 ranking snapshot not found at ${RANKING_DIR}`);
  console.error("ローカル R2 を有効化してください: `scripts/dev/local-r2-mode.sh ssd` (SSD 接続)。");
  process.exit(1);
}

interface RankingItem {
  rankingKey?: string;
  areaType?: string;
  isActive?: boolean;
}

const keys: string[] = [];
for (const entry of fs.readdirSync(RANKING_DIR, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const itemPath = path.join(RANKING_DIR, entry.name, "item.json");
  if (!fs.existsSync(itemPath)) continue;

  let parsed: { item?: RankingItem } & RankingItem;
  try {
    parsed = JSON.parse(fs.readFileSync(itemPath, "utf-8"));
  } catch {
    console.warn(`[generate-known-ranking-keys] skip unparsable ${itemPath}`);
    continue;
  }

  // item.json は { generatedAt, item: {...} } 形式。後方互換で直書きも許容。
  const item = parsed.item ?? parsed;
  if (item.areaType === "prefecture" && item.isActive) {
    keys.push(item.rankingKey ?? entry.name);
  }
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
 *    （SSD/S3 が無い公開URL専用環境では R2 を list できないため、本リストから item.json を列挙）
 *
 * 真実源: R2 \`app/ranking/<key>/item.json\` (areaType=prefecture & isActive)。
 * 更新方法: \`cd apps/web && npx tsx scripts/generate-known-ranking-keys.ts\`
 *           （R2 list が要るため SSD 接続 or S3 認証が必要。公開URLは list 不可）
 * 更新タイミング: ranking item 追加/有効化後。必ず git commit してからデプロイ。
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
