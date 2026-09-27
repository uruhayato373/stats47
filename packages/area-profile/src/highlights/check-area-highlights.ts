/**
 * 県の「特徴」の生成時検査 (AREA-HIGHLIGHTS-SSOT-01 step 5)。
 *
 * databook.json を生成した直後に 47 県ぶん選定を実行し、結果そのものを検査する。
 * 選定関数の中の除外規則が壊れても (例: 年の下限を外す) ここで落ちるよう、判定は選定の
 * 出力と databook の生値から独立に行う。違反があれば exporter は R2 へ書かない。
 *
 * 検査項目:
 *  - fill: 上位・下位それぞれ requiredPerGroup 件が埋まる
 *  - old-year: 選ばれた値の年が MIN_HIGHLIGHT_YEAR より古い
 *  - duplicate-category: 上位・下位の片側リスト内で分野 (category) が重複する
 *  - duplicate-label: 1 カード内で表示ラベルが重複する
 *  - unpublished: 公開中ランキング (KNOWN_RANKING_KEYS) でない指標を選んだ
 *  - rank-band: 上位に下位側の順位、下位に上位側の順位が入った
 */
import type { AreaDatabookSnapshot } from "../types/databook-snapshot";
import {
  EDGE_BAND,
  MIN_HIGHLIGHT_YEAR,
  PREFECTURE_COUNT,
  parseHighlightYear,
  selectAreaHighlights,
  type AreaHighlights,
} from "./select-area-highlights";

/** Web の県カード (上位 4 / 下位 4) が埋まることを要求する。SNS は 5 件を求めるが 3 件で成立する。 */
export const AREA_HIGHLIGHT_REQUIRED_PER_GROUP = 4;

export type AreaHighlightViolationKind =
  | "fill"
  | "old-year"
  | "duplicate-category"
  | "duplicate-label"
  | "unpublished"
  | "rank-band";

export interface AreaHighlightViolation {
  areaCode: string;
  kind: AreaHighlightViolationKind;
  detail: string;
}

export interface AreaHighlightCheckOptions {
  publishedKeys: ReadonlySet<string>;
  requiredPerGroup?: number;
  /** 選定関数の差し替え (検査が違反を検出できることのテスト用) */
  select?: typeof selectAreaHighlights;
}

export interface AreaHighlightCheckResult {
  violations: AreaHighlightViolation[];
  /** 県ごとの選定件数 */
  filled: { areaCode: string; top: number; bottom: number }[];
}

/** 1 県ぶんの選定結果を databook の生値と突き合わせる。 */
export function validateAreaHighlights(
  databook: AreaDatabookSnapshot,
  highlights: AreaHighlights,
  options: { publishedKeys: ReadonlySet<string>; requiredPerGroup: number },
): AreaHighlightViolation[] {
  const violations: AreaHighlightViolation[] = [];
  const push = (kind: AreaHighlightViolationKind, detail: string) =>
    violations.push({ areaCode: databook.areaCode, kind, detail });

  for (const group of ["top", "bottom"] as const) {
    if (highlights[group].length < options.requiredPerGroup) {
      push("fill", `${group}: ${highlights[group].length}/${options.requiredPerGroup} 件`);
    }
  }

  const labels = new Set<string>();
  for (const group of ["top", "bottom"] as const) {
    const categories = new Set<string>();
    for (const item of highlights[group]) {
      const raw = databook.metrics[item.rankingKey];
      const year = raw ? parseHighlightYear(raw.year) : null;
      if (year === null || year < MIN_HIGHLIGHT_YEAR) {
        push("old-year", `${item.rankingKey}: ${raw?.year ?? "年なし"}`);
      }
      if (categories.has(item.category)) push("duplicate-category", `${item.rankingKey}: ${item.category}`);
      categories.add(item.category);
      if (labels.has(item.label)) push("duplicate-label", `${item.rankingKey}: ${item.label}`);
      labels.add(item.label);
      if (!options.publishedKeys.has(item.rankingKey)) push("unpublished", item.rankingKey);
      const rank = raw?.rank ?? item.rank;
      const inBand = group === "top" ? rank <= EDGE_BAND : rank > PREFECTURE_COUNT - EDGE_BAND;
      if (!inBand) push("rank-band", `${group}: ${item.rankingKey} ${rank}位`);
    }
  }
  return violations;
}

/** 全県の選定を実行して検査する。 */
export function checkAreaHighlights(
  snapshots: readonly AreaDatabookSnapshot[],
  options: AreaHighlightCheckOptions,
): AreaHighlightCheckResult {
  const requiredPerGroup = options.requiredPerGroup ?? AREA_HIGHLIGHT_REQUIRED_PER_GROUP;
  const select = options.select ?? selectAreaHighlights;
  const violations: AreaHighlightViolation[] = [];
  const filled: AreaHighlightCheckResult["filled"] = [];
  for (const databook of snapshots) {
    const highlights = select(databook, { perGroup: requiredPerGroup });
    filled.push({ areaCode: databook.areaCode, top: highlights.top.length, bottom: highlights.bottom.length });
    violations.push(
      ...validateAreaHighlights(databook, highlights, {
        publishedKeys: options.publishedKeys,
        requiredPerGroup,
      }),
    );
  }
  return { violations, filled };
}

/** exporter 用: 違反があれば例外にして R2 反映を止める。 */
export function assertAreaHighlightsHealthy(
  snapshots: readonly AreaDatabookSnapshot[],
  options: AreaHighlightCheckOptions,
): void {
  const { violations } = checkAreaHighlights(snapshots, options);
  if (violations.length === 0) return;
  const lines = violations.slice(0, 30).map((v) => `  - ${v.areaCode} [${v.kind}] ${v.detail}`);
  throw new Error(
    `県の「特徴」の生成時検査で ${violations.length} 件の違反。R2 へは書きません:\n${lines.join("\n")}`,
  );
}
