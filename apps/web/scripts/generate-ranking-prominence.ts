/**
 * ranking-prominence.generated.ts の生成スクリプト
 *
 * 真実源: `@stats47/data-configs` の git TS metric config + git 管理下の GSC snapshot。
 * **ネットワークを使わない**ので、オフラインで `--check` でき PR CI の静的ゲートに載る。
 *
 * なぜ生成物を挟むか:
 * - `/ranking` は R2 非依存の純静的 SSG を維持する (home の featured がビルド時に空焼きされる
 *   問題を避けるため意図的にそうなっている)。索引が要る情報はビルド前に焼くしかない。
 * - 共通 Header と索引が runtime に `listAllMetrics()` を呼ぶと、METRICS_REGISTRY が
 *   ほぼ全 route の bundle に入る (`generate-runtime-metric-summaries.ts` 参照)。
 *
 * 何を決めるか:
 * - カテゴリごとの代表ランキング (索引 6 件。ヘッダーはその先頭 4 件を使う)
 * - ホーム注目 8 件 (カテゴリ分散制約つき)
 * - 各件の問いかけコピー (hook)
 *
 * 使い方:
 *   npm run generate:ranking-prominence --workspace apps/web
 *   npm run check:ranking-prominence    --workspace apps/web   # 差分があれば非0で終了
 *   npx tsx apps/web/scripts/generate-ranking-prominence.ts --audit  # 導出が怪しい hook を列挙
 *
 * 更新タイミング:
 * - metric config を追加・変更・isActive 切替した後 (`--check` が落ちるので気づける)
 * - GSC snapshot が更新された週 (需要は桁バケットなので、桁を跨いだときだけ差分が出る)
 *   → `fetch-metrics-weekly.yml` が自動で再生成して develop へ commit-back する
 */
import fs from "node:fs";
import path from "node:path";

import { listAllMetrics, listCategories } from "@stats47/data-configs";
import {
  auditDerivedHooks,
  computeProminenceScores,
  resolveRankingReaderLabel,
  resolveRankingHook,
  selectHomeFeatured,
  selectRepresentatives,
  type ProminenceInput,
  type ProminenceResult,
} from "@stats47/data-configs/prominence";

// 生成物は data-configs 側に置く。apps/web (索引・ヘッダー・カテゴリ) だけでなく
// packages/ranking の exporter も読むため、apps/web に置くと参照方向が逆流する。
const OUT_PATH = path.resolve(
  __dirname,
  "../../../packages/data-configs/src/prominence/ranking-prominence.generated.ts",
);
const GSC_SNAPSHOT_DIR = path.resolve(
  __dirname,
  "../../../.claude/skills/analytics/gsc-improvement/reference/snapshots",
);

/** 索引 (/ranking のカテゴリ別ブロック) が 1 カテゴリあたり出す代表数。 */
const REPRESENTATIVES_PER_CATEGORY = 6;
/** ホーム「注目のランキング」の枠数。 */
const HOME_FEATURED_LIMIT = 8;
/**
 * ホーム注目で 1 カテゴリから採れる上限。economy (817 件) の独占を防ぐ。
 *
 * 2 だと近縁の指標が対で入る (実測: 地方交付税 + 地方交付税割合、
 * 自然公園面積 + 都道府県立自然公園面積)。1 なら 8 枠が 8 カテゴリに散る。
 * 17 カテゴリあるので 1 でも枠は埋まる。
 */
const HOME_FEATURED_MAX_PER_CATEGORY = 1;

interface MetricLike {
  key: string;
  title: string;
  unit?: string;
  category: string;
  isActive?: boolean;
  entities?: readonly string[];
  years?: "all" | { from: number; to: number } | { years: number[] };
}

/** config の YearSpec から「観測年の本数」と「最新年」を取り出す。不明なら null。 */
function readYearSignals(years: MetricLike["years"]): {
  yearSpan: number | null;
  latestYear: number | null;
} {
  if (!years || years === "all") return { yearSpan: null, latestYear: null };
  if ("years" in years && Array.isArray(years.years)) {
    const list = years.years.filter((y) => Number.isFinite(y));
    if (list.length === 0) return { yearSpan: null, latestYear: null };
    return { yearSpan: list.length, latestYear: Math.max(...list) };
  }
  if ("from" in years && "to" in years) {
    const from = Number(years.from);
    const to = Number(years.to);
    if (!Number.isFinite(from) || !Number.isFinite(to)) {
      return { yearSpan: null, latestYear: null };
    }
    return { yearSpan: Math.max(1, to - from + 1), latestYear: to };
  }
  return { yearSpan: null, latestYear: null };
}

/** 最新週の GSC pages.csv を探す。無ければ null (需要 0 として扱い、生成自体は成立させる)。 */
function findLatestGscPagesCsv(): { week: string; filePath: string } | null {
  if (!fs.existsSync(GSC_SNAPSHOT_DIR)) return null;
  const weeks = fs
    .readdirSync(GSC_SNAPSHOT_DIR)
    .filter((dir) => /^\d{4}-W\d{2}$/.test(dir))
    .sort()
    .reverse();
  for (const week of weeks) {
    const filePath = path.join(GSC_SNAPSHOT_DIR, week, "pages.csv");
    if (fs.existsSync(filePath)) return { week, filePath };
  }
  return null;
}

/**
 * GSC pages.csv から rankingKey 別の表示回数を集計する。
 * 抽出規則は `build-ai-content-queue.mjs` と揃える (末尾スラッシュ違いは合算)。
 */
function readImpressionsByRankingKey(filePath: string): Map<string, number> {
  const impressions = new Map<string, number>();
  const lines = fs.readFileSync(filePath, "utf8").trim().split("\n");
  for (let i = 1; i < lines.length; i++) {
    const columns = lines[i].split(",");
    const matched = (columns[0] ?? "").match(/\/ranking\/([^/?#]+)/);
    if (!matched) continue;
    const key = matched[1];
    const value = Number(columns[2] ?? 0);
    if (!Number.isFinite(value)) continue;
    impressions.set(key, (impressions.get(key) ?? 0) + value);
  }
  return impressions;
}

function buildInputs(impressions: Map<string, number>): ProminenceInput[] {
  return (listAllMetrics() as unknown as MetricLike[])
    .filter((metric) => metric.isActive)
    .map((metric) => {
      const { yearSpan, latestYear } = readYearSignals(metric.years);
      return {
        rankingKey: metric.key,
        title: metric.title,
        categoryKey: metric.category,
        yearSpan,
        latestYear,
        impressions: impressions.get(metric.key) ?? 0,
      };
    });
}

/** hook 解決に必要な unit を引くための索引。 */
function buildUnitIndex(): Map<string, string> {
  return new Map(
    (listAllMetrics() as unknown as MetricLike[]).map((metric) => [
      metric.key,
      metric.unit ?? "",
    ]),
  );
}

/**
 * freshness の基準年を決める。
 *
 * 単純な最大値は使えない。`future-population-change-rate-2050` のような**将来推計は
 * 対象年 2050 を宣言している**ため、最大値を取ると基準年が 2050 になり、
 * 実在する観測 (2024) が「26 年前」扱いで全件 freshness 0 に落ちる (実測で発生した)。
 *
 * 実行時刻も使わない (生成物が年替わりで勝手に変わり `--check` が落ちるため)。
 * 少数の将来推計に引きずられない p95 を基準年とする。
 */
function resolveReferenceYear(inputs: readonly ProminenceInput[]): number {
  const years = inputs
    .map((input) => input.latestYear)
    .filter((year): year is number => year !== null)
    .sort((a, b) => a - b);
  if (years.length === 0) return 0;
  return years[Math.min(years.length - 1, Math.floor(years.length * 0.95))];
}

function toRepresentative(
  result: ProminenceResult,
  units: Map<string, string>,
): { rankingKey: string; title: string; readerLabel: string; hook: string } {
  return {
    rankingKey: result.rankingKey,
    title: result.title,
    readerLabel: resolveRankingReaderLabel({
      rankingKey: result.rankingKey,
      title: result.title,
    }),
    hook: resolveRankingHook({
      rankingKey: result.rankingKey,
      title: result.title,
      unit: units.get(result.rankingKey) ?? "",
    }),
  };
}

function build(): string {
  const snapshot = findLatestGscPagesCsv();
  const impressions = snapshot
    ? readImpressionsByRankingKey(snapshot.filePath)
    : new Map<string, number>();

  const inputs = buildInputs(impressions);
  const units = buildUnitIndex();
  const results = computeProminenceScores(inputs, {
    currentYear: resolveReferenceYear(inputs),
  });

  const byCategory = new Map<string, ProminenceResult[]>();
  for (const result of results) {
    const list = byCategory.get(result.categoryKey);
    if (list) list.push(result);
    else byCategory.set(result.categoryKey, [result]);
  }

  const categories = listCategories().map((category) => {
    const inCategory = byCategory.get(category.categoryKey) ?? [];
    return {
      categoryKey: category.categoryKey,
      categoryName: category.categoryName,
      count: inCategory.length,
      representatives: selectRepresentatives(
        inCategory,
        REPRESENTATIVES_PER_CATEGORY,
      ).map((result) => toRepresentative(result, units)),
    };
  });

  const homeFeatured = selectHomeFeatured(results, {
    limit: HOME_FEATURED_LIMIT,
    maxPerCategory: HOME_FEATURED_MAX_PER_CATEGORY,
  }).map((result, index) => ({
    ...toRepresentative(result, units),
    categoryKey: result.categoryKey,
    order: index + 1,
  }));

  const representativeKeys = categories.flatMap((category) =>
    category.representatives.map((representative) => representative.rankingKey),
  );

  const json = (value: unknown) => JSON.stringify(value, null, 2);

  return `/**
 * AUTO-GENERATED — 手編集禁止
 *
 * 生成コマンド: npm run generate:ranking-prominence --workspace apps/web
 * 真実源: packages/data-configs/src/metrics/*.ts (git TS) + GSC snapshot (git 管理下)
 *
 * 索引面 (/ranking・ヘッダー・カテゴリ・関連ランキング) とホーム注目が
 * 共通で引く掲載価値スコアの確定結果。スコア式は
 * packages/data-configs/src/prominence/compute-prominence.ts を参照。
 *
 * 需要は桁バケットで量子化してあるため、GSC の週次の揺れではこのファイルは変わらない。
 */

export interface RankingRepresentative {
  rankingKey: string;
  /** 正準な統計名 */
  title: string;
  /** 読者向けの平易な指標名。正準名から決定規則で導出 */
  readerLabel?: string;
  /** 問いかけコピー。導出規則 + override で確定したもの */
  hook: string;
}

export interface CategoryProminence {
  categoryKey: string;
  categoryName: string;
  /** isActive な metric 件数 */
  count: number;
  /** 索引に出す代表 (${REPRESENTATIVES_PER_CATEGORY} 件)。ヘッダーはこの先頭 4 件を使う */
  representatives: ReadonlyArray<RankingRepresentative>;
}

export interface HomeFeaturedProminence extends RankingRepresentative {
  categoryKey: string;
  /** 1 始まりの表示順 */
  order: number;
}

export const RANKING_PROMINENCE_CATEGORIES: ReadonlyArray<CategoryProminence> =
  ${json(categories)};

export const HOME_FEATURED_PROMINENCE: ReadonlyArray<HomeFeaturedProminence> =
  ${json(homeFeatured)};

/**
 * 索引が代表として出すキーの平坦な一覧。
 *
 * カテゴリを跨ぐ面 (survey ページ・items.json の並び順) が「代表かどうか」を
 * 判定するのに使う。各所で RANKING_PROMINENCE_CATEGORIES を flatMap し直すと
 * 構築規則が分散するので、ここで 1 度だけ出す。
 */
export const REPRESENTATIVE_RANKING_KEYS: ReadonlyArray<string> =
  ${json(representativeKeys)};
`;
}

function runAudit(): void {
  const units = buildUnitIndex();
  const inputs = (listAllMetrics() as unknown as MetricLike[])
    .filter((metric) => metric.isActive)
    .map((metric) => ({
      rankingKey: metric.key,
      title: metric.title,
      unit: units.get(metric.key) ?? "",
    }));

  const findings = auditDerivedHooks(inputs);
  const rate = ((findings.length / inputs.length) * 100).toFixed(1);
  console.log(
    `[ranking-prominence] hook 監査: ${inputs.length} 件中 ${findings.length} 件 (${rate}%) が要確認`,
  );
  if (findings.length === 0) return;

  const byReason = new Map<string, number>();
  for (const finding of findings) {
    for (const reason of finding.reasons) {
      byReason.set(reason, (byReason.get(reason) ?? 0) + 1);
    }
  }
  for (const [reason, count] of [...byReason].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${reason}: ${count}`);
  }
  for (const finding of findings) {
    console.log(
      `  - ${finding.rankingKey} [${finding.reasons.join(",")}] ${finding.hook}`,
    );
  }
}

function main(): void {
  if (process.argv.includes("--audit")) {
    runAudit();
    return;
  }

  const isCheck = process.argv.includes("--check");
  const next = build();
  const current = fs.existsSync(OUT_PATH) ? fs.readFileSync(OUT_PATH, "utf8") : null;

  if (isCheck) {
    if (current === next) {
      console.log("[ranking-prominence] up to date");
      return;
    }
    console.error(
      `[ranking-prominence] ${current === null ? "生成物がありません" : "生成物が SSOT とずれています"}。\n` +
        "  npm run generate:ranking-prominence --workspace apps/web を実行して commit してください。",
    );
    process.exit(1);
  }

  // 内容が同じなら書かない (mtime を動かさず、hot reload と CI cache を無駄に壊さない)。
  if (current === next) {
    console.log("[ranking-prominence] no change");
    return;
  }
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, next);
  console.log(
    `[ranking-prominence] wrote ${path.relative(process.cwd(), OUT_PATH)}`,
  );
}

main();
