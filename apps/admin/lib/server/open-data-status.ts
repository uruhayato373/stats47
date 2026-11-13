import "server-only";

import fs from "node:fs";
import path from "node:path";

import { METRIC_DEFINITIONS_DIR } from "../../../../config/paths.mjs";
import { datasetPath } from "../../../../config/datasets.mjs";
import { projectRoot } from "./project-root";

/**
 * 外部データ台帳 (open-data.datasets) の「サイトへの反映状況」を導く。
 *
 * ★台帳に状態の欄を持たせない。手で書く状態欄は必ず実態とずれるので、反映状況は
 *   台帳の参照 (existingMetricKeys / existingGisDataIds) と、指標・GIS 側の正本を
 *   突き合わせて表示のたびに導く。ここが唯一の判定で、画面側は分岐を持たない。
 *
 * 指標の公開は data/metrics/<key>.ts の isActive、GIS の公開は台帳 geo.ksj-datasets の
 * isRankingTarget が正本。どちらも読み取りのみで、ここから書き戻さない。
 */

/** 採用候補とみなす使い道 (これが付いていれば「いずれ取り込む」対象) */
const ADOPTION_USES = ["ranking", "theme", "map", "area"] as const;

export type ReflectionStatus =
  | "published"
  | "ingested"
  | "todo"
  | "research"
  | "excluded";

export const REFLECTION_STATUS: Record<
  ReflectionStatus,
  { label: string; tone: "good" | "info" | "warn" | "neutral"; description: string }
> = {
  published: { label: "公開中", tone: "good", description: "参照先の指標か GIS がサイトに出ている" },
  ingested: { label: "取り込み済み", tone: "info", description: "指標・GIS はあるが、まだ公開されていない" },
  todo: { label: "未着手", tone: "warn", description: "採用候補だが、対応する指標も GIS もまだ無い" },
  research: { label: "調査のみ", tone: "neutral", description: "調べ物に使う。都道府県比較の指標にはしない" },
  excluded: { label: "対象外", tone: "neutral", description: "stats47 の用途に合わないと判断済み" },
};

/** 判定に使う、指標と GIS の正本の索引 */
export type ReflectionLookup = {
  /** data/metrics/<key>.ts が isActive: true の指標 */
  activeMetricKeys: ReadonlySet<string>;
  /** data/metrics/<key>.ts が存在する指標 (公開の有無は問わない) */
  knownMetricKeys: ReadonlySet<string>;
  /** geo.ksj-datasets が isRankingTarget: true の GIS */
  publishedGisIds: ReadonlySet<string>;
};

export type ReflectionInput = {
  stats47Uses: readonly string[];
  existingMetricKeys: readonly string[];
  existingGisDataIds: readonly string[];
};

export type Reflection = {
  status: ReflectionStatus;
  /** 公開されている参照先 (画面の「反映先」に出す) */
  publishedMetricKeys: string[];
  publishedGisIds: string[];
  /** 参照はあるが公開されていないもの */
  pendingMetricKeys: string[];
  pendingGisIds: string[];
};

/**
 * 1 データセットの反映状況を決める。判定の順は上から固定で、先に当たったものを返す。
 *
 * 1. 参照先のどれかが公開されている → 公開中
 * 2. 参照先はあるが公開されていない → 取り込み済み
 * 3. 参照先が無く、採用候補の使い道が付いている → 未着手
 * 4. 調査用途が付いている → 調査のみ
 * 5. それ以外 (not-suitable だけ) → 対象外
 *
 * 1 と 2 を使い道より先に見るのは、台帳の使い道が古いまま指標だけ公開された場合に
 * 「未着手」と嘘をつかないため。
 */
export function deriveReflection(
  dataset: ReflectionInput,
  lookup: ReflectionLookup,
): Reflection {
  const publishedMetricKeys = dataset.existingMetricKeys.filter((key) =>
    lookup.activeMetricKeys.has(key),
  );
  const pendingMetricKeys = dataset.existingMetricKeys.filter(
    (key) => !lookup.activeMetricKeys.has(key),
  );
  const publishedGisIds = dataset.existingGisDataIds.filter((id) =>
    lookup.publishedGisIds.has(id),
  );
  const pendingGisIds = dataset.existingGisDataIds.filter(
    (id) => !lookup.publishedGisIds.has(id),
  );
  const parts = { publishedMetricKeys, pendingMetricKeys, publishedGisIds, pendingGisIds };

  if (publishedMetricKeys.length > 0 || publishedGisIds.length > 0) {
    return { status: "published", ...parts };
  }
  if (pendingMetricKeys.length > 0 || pendingGisIds.length > 0) {
    return { status: "ingested", ...parts };
  }
  if (dataset.stats47Uses.some((use) => (ADOPTION_USES as readonly string[]).includes(use))) {
    return { status: "todo", ...parts };
  }
  if (dataset.stats47Uses.includes("research-only")) {
    return { status: "research", ...parts };
  }
  return { status: "excluded", ...parts };
}

/** 指標と GIS の正本を読んで索引を作る (ページの描画ごとに 1 回) */
export function loadReflectionLookup(): ReflectionLookup {
  const root = projectRoot();
  const activeMetricKeys = new Set<string>();
  const knownMetricKeys = new Set<string>();

  const metricsDir = path.join(root, METRIC_DEFINITIONS_DIR);
  if (fs.existsSync(metricsDir)) {
    for (const name of fs.readdirSync(metricsDir)) {
      if (!name.endsWith(".ts")) continue;
      const key = name.slice(0, -3);
      knownMetricKeys.add(key);
      const body = fs.readFileSync(path.join(metricsDir, name), "utf8");
      if (/["']?isActive["']?\s*:\s*true/.test(body)) activeMetricKeys.add(key);
    }
  }

  const publishedGisIds = new Set<string>();
  const ksjFile = path.join(root, datasetPath("geo.ksj-datasets"));
  if (fs.existsSync(ksjFile)) {
    const doc = JSON.parse(fs.readFileSync(ksjFile, "utf8")) as {
      datasets: Record<string, { isRankingTarget?: boolean }>;
    };
    for (const [id, entry] of Object.entries(doc.datasets)) {
      if (entry.isRankingTarget === true) publishedGisIds.add(id);
    }
  }

  return { activeMetricKeys, knownMetricKeys, publishedGisIds };
}
