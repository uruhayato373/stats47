/**
 * 問いの軸 (issues[].axes.*.data) が指すデータの実在と粒度を、正本から読む。
 *
 *   指標の粒度 … 指標の定義 (data/metrics/<key>.ts) の entities と、全国のテーマのページ (japan-theme) が持つ指標
 *   系列        … 家計調査の分析単位 (カタログの surveys.analysis-units。年収階級・世帯類型など属性別の値)
 *
 * 粒度の語彙は config/schema/common.schema.json の grain (prefecture / municipality / japan / capital-city)。
 * アプリの型は別の語で書くので、読み替えはここだけで行う:
 *   指標の entities の city → municipality
 *   家計調査の指標 (source.kind = kakei-chousa) → capital-city。entities は prefecture だが、値は県庁所在市の世帯
 *   全国のテーマのページ (japan-theme) が持つ指標 → japan を足す
 * 家計調査の分析単位の geography (capital-cities / national) と、テーマの系列参照の area (national) は問いの軸から指さないので読み替えない。
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { datasetPath } from "../../../config/datasets.mjs";
import { METRIC_DEFINITIONS_DIR } from "../../../config/paths.mjs";

const ENTITY_GRAIN = { prefecture: "prefecture", city: "municipality" };

/** 指標の定義の本文から粒度を読む (TS を import せず、entities の配列だけを見る) */
export function grainsOfMetricSource(text) {
  const m = /["']?entities["']?:\s*\[([^\]]*)\]/.exec(text);
  const entities = m ? m[1].split(",").map((s) => s.replace(/[\s"']/g, "")) : [];
  const grains = new Set(entities.map((e) => ENTITY_GRAIN[e]).filter(Boolean));
  // 家計調査の都道府県の値は県庁所在市の二人以上世帯の値で、県全体の値ではない
  if (/["']?kind["']?:\s*["']kakei-chousa["']/.test(text) && grains.delete("prefecture")) grains.add("capital-city");
  return grains;
}

/**
 * @param {string} root リポジトリの root
 * @param {Map<string, { kind: string, rankingKeys?: string[] }>} pages ページの索引 (indexPages の戻り値)
 * @returns {Map<string, Set<string>>} 指標キー → 値のある粒度
 */
export function readMetricGrains(root, pages) {
  const dir = join(root, METRIC_DEFINITIONS_DIR);
  const grains = new Map();
  for (const f of readdirSync(dir)) {
    if (f.endsWith(".ts")) grains.set(f.slice(0, -3), grainsOfMetricSource(readFileSync(join(dir, f), "utf8")));
  }
  for (const page of pages.values()) {
    if (page.kind !== "japan-theme") continue;
    for (const key of page.rankingKeys ?? []) grains.get(key)?.add("japan");
  }
  return grains;
}

/** @returns {Set<string>} 系列 (家計調査の分析単位) の ID */
export function readSeriesIds(root) {
  const { units } = JSON.parse(readFileSync(join(root, datasetPath("surveys.analysis-units")), "utf8"));
  return new Set(units.map((u) => u.id));
}
