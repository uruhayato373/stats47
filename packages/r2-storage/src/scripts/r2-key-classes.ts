/**
 * R2 の key ごとの区分表 (書き込みの止めが引く唯一の表)。
 *
 * - class: "regenerable" (git・観測値・原典から作り直せる生成物) / "authoritative" (R2 が唯一の正本)
 * - origin: "ci" (GitHub Actions の workflow が書く) / "mac" (オーナーの Mac で作って書く)
 *
 * 根拠は `.claude/rules/r2-storage-design.md` (URL→R2 キー対応表・ルート直下・保持ポリシー) と
 * `docs/01_技術設計/02_データアーキテクチャ.md`「データ分類」。文書に「作り直せる」と書いていない prefix は
 * 推測で regenerable にしない。表に無い key は未登録として authoritative と同じ扱い (安全側) にする。
 *
 * 削除の allowlist (RETENTION_TARGETS / PROTECTED_PREFIXES) は隣の `r2-retention.ts` が持つ。
 * この表は「上書き・削除してよいか」と「どこから書いてよいか」を引くための別の軸で、保持の判断はしない。
 */
import { SITE } from "@stats47/types";

export type R2DataClass = "regenerable" | "authoritative";
export type R2WriteOrigin = "ci" | "mac";

export const R2_PUBLIC_BUCKET: string = SITE.r2Bucket;
export const R2_PRIVATE_BUCKET: string = SITE.r2PrivateBucket;

export interface R2KeyClassRule {
  bucket: string;
  /** "/" 終端の prefix、または単独ファイルの exact key */
  prefix: string;
  /** prefix の中をさらに絞る条件 (key 全体に当てる)。同じ prefix の行より優先する */
  pattern?: RegExp;
  class: R2DataClass;
  origin: R2WriteOrigin;
  /** この prefix を書く workflow / script (grep で確かめたものだけ)。ローカル停止時の案内に使う */
  writers: readonly string[];
  /** 区分の根拠 (文書の節)。文書に無いものは「未記載 (安全側)」と書く */
  basis: string;
}

const DESIGN = "r2-storage-design.md";
const ARCH = "02_データアーキテクチャ.md「データ分類」";
const UNLISTED = "文書に作り直せるとの記載なし (安全側で authoritative)";

function row(
  bucket: string,
  prefix: string,
  cls: R2DataClass,
  origin: R2WriteOrigin,
  writers: readonly string[],
  basis: string,
  pattern?: RegExp,
): R2KeyClassRule {
  return { bucket, prefix, class: cls, origin, writers, basis, ...(pattern ? { pattern } : {}) };
}

const P = R2_PUBLIC_BUCKET;
const V = R2_PRIVATE_BUCKET;

export const R2_KEY_CLASSES: readonly R2KeyClassRule[] = [
  // ── 観測値 (Observation)。R2 が唯一の正本 ──
  row(P, "app/stats/", "authoritative", "ci",
    ["data-refresh.yml", "sync-snapshots.yml (calculated-stats)", "ksj-aggregate-ingest.yml"],
    `${ARCH} Observation (真実源 R2) / ${DESIGN} 観測値ストア`),
  row(P, "app/commute-flow/", "authoritative", "ci", ["commute-flow-ingest.yml"], UNLISTED),

  // ── 配信 snapshot (Derived)。git と観測値から作り直せる ──
  row(P, "app/ranking/", "regenerable", "ci",
    ["sync-snapshots.yml", "data-refresh.yml"],
    `${DESIGN} URL→R2 キー対応表 (values.json は app/stats から決定的変換) / ${ARCH} Derived 集計済み ranking`),
  row(P, "app/ranking/", "authoritative", "ci", ["publish-ai-content.yml"],
    `${DESIGN} の ai-content.json は AI 生成の本文。${UNLISTED}`,
    /^app\/ranking\/[^/]+\/ai-content\.json$/),
  row(P, "app/ranking-items/", "regenerable", "ci", ["sync-snapshots.yml", "data-refresh.yml"],
    `${DESIGN} 既存キーの移行状態 (git TS から生成)`),
  row(P, "app/municipalities/", "regenerable", "ci", ["sync-snapshots.yml", "data-refresh.yml"],
    `${DESIGN} 市区町村ランキング (app/stats/<metric>/cities.json を決定的変換)`),
  row(P, "app/areas/", "regenerable", "ci", ["sync-snapshots.yml", "data-refresh.yml"],
    `${DESIGN} 県・市区町村データブック (generate-city-databooks.ts が生成)`),
  row(P, "app/category/", "regenerable", "ci", ["sync-snapshots.yml"], `${DESIGN} URL→R2 キー対応表`),
  row(P, "app/home/", "regenerable", "ci", ["sync-snapshots.yml"], `${DESIGN} URL→R2 キー対応表`),
  row(P, "app/survey/", "regenerable", "ci", ["sync-snapshots.yml", "kakei-axis-charts.yml"],
    `${DESIGN} URL→R2 キー対応表`),
  row(P, "app/page-components/", "regenerable", "ci", ["sync-snapshots.yml"], `${DESIGN} 保持の表 (snapshot)`),
  row(P, "app/correlation/", "regenerable", "ci", ["correlation-refresh.yml"], `${ARCH} Derived correlation`),
  row(P, "app/themes/", "regenerable", "ci", ["external-metric-ingest.yml", "deploy-workers.yml (--manifest)"],
    `${DESIGN} URL→R2 キー対応表 (原典 SHA を固定して生成)`),
  row(P, "app/geo/", "regenerable", "ci", ["infra-history-publish.yml", "geo-source-publish.yml"],
    `${DESIGN} Geo分析の最終集計と lineage (原典 SHA 照合で生成)`),
  row(P, "app/gis-cross/", "regenerable", "ci", ["sync-snapshots.yml"], `${DESIGN} URL→R2 キー対応表`),
  row(P, "app/affiliate-ads/", "regenerable", "ci", ["publish-affiliate-ads.yml"],
    `${ARCH} Authored/config (data/ から R2 snapshot)`),

  // ── ブログ。本文と data/*.json は公開後 R2 が正本、画像と索引は作り直せる ──
  row(P, "app/blog/", "authoritative", "ci", ["publish-blog.yml", "blog-auto-publish.yml"],
    `data-storage.md「公開した記事の正本は R2」/ ${DESIGN} stats47-private:blog-archive の節`),
  row(P, "app/blog/all.json", "regenerable", "ci",
    ["publish-blog.yml", "blog-auto-publish.yml", "regenerate-blog-svgs.yml"],
    "export-blog-snapshot.ts が R2 の記事集合から再生成する索引"),
  row(P, "app/blog/", "regenerable", "ci", ["publish-blog.yml", "blog-auto-publish.yml"],
    `${DESIGN} ブログ画像 bundle (generate-blog-thumbnails.ts)`,
    /^app\/blog\/[^/]+\/(thumbnail-(light|dark)\.webp|ogp\/.+)$/),
  row(P, "app/blog/", "regenerable", "ci", ["regenerate-blog-svgs.yml"],
    `${DESIGN} 生成画像の差分反映契約 (blog SVG は data/*.json から再描画)`,
    /^app\/blog\/[^/]+\/data\/[^/]+\.svg$/),

  // ── キャッシュ・再取得できるもの ──
  row(P, "incremental-cache/", "regenerable", "ci", ["deploy-workers.yml"], `${DESIGN} 削除ポリシー (ISR キャッシュ)`),
  row(P, "estat-api/", "regenerable", "ci", [], `${DESIGN}「e-Stat API キャッシュ」(再取得可能)`),
  row(P, "estat-catalog/", "regenerable", "ci", ["estat-catalog-monthly.yml"], `${DESIGN} ルート直下 (再取得可能なカタログ)`),
  row(P, "staging/image-cache/", "regenerable", "ci", [], `${DESIGN} 保持の表 (AI 背景の再課金防止 cache)`),
  row(P, "robots.txt", "regenerable", "ci", ["publish-storage-robots.yml"], `${DESIGN} ルート直下 (原本は git)`),
  row(P, "sns/pref-silhouette/", "regenerable", "ci", ["sync-snapshots.yml", "generate-ogp-images.yml"],
    `${DESIGN} 生成画像の差分反映契約`),

  // ── CI が書く観測 state。git には週次集約だけ ──
  row(P, "state/", "authoritative", "ci",
    ["affiliate-ga4-weekly.yml", "fetch-metrics-weekly.yml", "quality-suite-weekly.yml"],
    `${DESIGN} 削除ポリシー state/ (CI が書く観測 state の生 snapshot)`),
  // state-publish.mjs の規約の domain は latest.json が最新の日付 snapshot の写し、index.json が object 一覧。
  // 日付 snapshot から作り直せる。page-quality の latest.json は唯一の写しなのでここに入れない。
  row(P, "state/psi/", "regenerable", "ci", ["fetch-metrics-weekly.yml"],
    ".claude/scripts/lib/state-publish.mjs 冒頭 (latest.json・index.json は日付 snapshot から作る)",
    /^state\/psi\/(latest|index)\.json$/),
  row(P, "state/ads/ga4-affiliate/", "regenerable", "ci", ["affiliate-ga4-weekly.yml"],
    "affiliate-ga4-weekly.yml (latest.json は日付 snapshot の写し、index.json は一覧)",
    /^state\/ads\/ga4-affiliate\/(latest|index)\.json$/),

  // ── 原典ミラー・動画 (作り直せるとの記載なし) ──
  row(P, "gis/", "authoritative", "ci", ["ksj-aggregate-ingest.yml"], `${DESIGN} ルート直下 gis/。${UNLISTED}`),
  row(P, "ges/", "authoritative", "mac", [], `${DESIGN} ルート直下 ges/ (Google Earth Studio 出力)。${UNLISTED}`),
  row(P, "video/", "authoritative", "mac", [], `${DESIGN} 動画関連 (master 動画)。${UNLISTED}`),

  // ── Mac で作るもの ──
  row(P, "sns/", "regenerable", "mac", ["push-exact-r2-assets.ts (prepare-buzz-map-batch.ts)"],
    `${DESIGN} 保持の表 sns/ (投稿した素材の正本は Drive と private sns-assets/。ここは投稿用の作業コピー)`),
  row(P, "note/", "authoritative", "mac", [".claude/scripts/note/note-article.mjs"], `${DESIGN}「note 記事の本文」`),
  row(P, "media/note-backgrounds/", "authoritative", "mac", ["push-exact-r2-assets.ts (ingest-note-background.mjs)"],
    `${DESIGN} ルート直下 (作り直せない入力)`),
  row(P, "media/kindle-cover-assets/", "authoritative", "mac", [], `${DESIGN} ルート直下 (目視承認済み KDP 表紙)`),
  row(P, "archive/kindle-encrypted/", "authoritative", "mac", ["kindle-archive.ts"], `${DESIGN} 保持の表 (KDP 送信版)`),

  // ── private bucket ──
  row(V, "note/", "authoritative", "mac", [".claude/scripts/note/note-article.mjs"], `${DESIGN}「note 記事の本文」(有料記事)`),
  row(V, "note-archive/", "authoritative", "mac", [".claude/scripts/note/note-article.mjs"], `${DESIGN}「note 記事の本文」(不変保存)`),
  row(V, "blog-archive/", "authoritative", "ci", ["publish-blog.yml", "blog-auto-publish.yml"],
    `${DESIGN} 保持の表 stats47-private:blog-archive`),
  row(V, "sns-assets/", "authoritative", "mac", [".claude/scripts/sns/archive-sns-assets.mjs"],
    `${DESIGN} 保持の表 sns/ (画像の正本は private sns-assets/)`),
  row(V, "media-workspace/", "authoritative", "mac", ["apps/admin/scripts/publish-ranking-samples.ts"], UNLISTED),
  row(V, "operations/authenticated-measurement/", "authoritative", "mac", [".claude/scripts/measurement/vault.mjs"], UNLISTED),
];

export interface R2KeyClassification {
  bucket: string;
  key: string;
  class: R2DataClass;
  /** 未登録の key は null (どこから書くのが正規かを決められない) */
  origin: R2WriteOrigin | null;
  registered: boolean;
  rule: R2KeyClassRule | null;
}

function ruleMatches(rule: R2KeyClassRule, bucket: string, key: string): boolean {
  if (rule.bucket !== bucket) return false;
  const inPrefix = rule.prefix.endsWith("/") ? key.startsWith(rule.prefix) : key === rule.prefix;
  return inPrefix && (!rule.pattern || rule.pattern.test(key));
}

/** 長い prefix ほど、同じ長さなら pattern 付きの行ほど優先する */
function specificity(rule: R2KeyClassRule): number {
  return rule.prefix.length * 2 + (rule.pattern ? 1 : 0);
}

/** bucket と key から区分を引く。表に無ければ authoritative (安全側)・origin null を返す */
export function classifyR2Key(bucket: string, key: string): R2KeyClassification {
  let best: R2KeyClassRule | null = null;
  for (const rule of R2_KEY_CLASSES) {
    if (!ruleMatches(rule, bucket, key)) continue;
    if (!best || specificity(rule) > specificity(best)) best = rule;
  }
  if (!best) return { bucket, key, class: "authoritative", origin: null, registered: false, rule: null };
  return { bucket, key, class: best.class, origin: best.origin, registered: true, rule: best };
}
