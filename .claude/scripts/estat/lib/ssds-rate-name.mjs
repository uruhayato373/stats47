/**
 * 社会・人口統計体系 (SSDS) の `#` 項目のうち、e-Stat の公式の項目名が末尾の括弧で「…当たり」と分母を名乗るものは、
 * 算式で割り終えた率である。そこへ人口・面積の換算 (normalizationOptions) を付けると率をさらに割る二重換算になる。
 *
 * 分母の根拠は題名や key の接尾辞ではなく、e-Stat が公表する項目名 (data/estat/meta の控え) だけを使う
 * (memory feedback_ssds_denominator_evidence、METRIC-CLINIC-PER-100K-UNIT-01)。
 * 検査 (packages/data-configs/src/__tests__/ssds-rate-no-double-normalization.test.ts) と同じ判定を、
 * 指標の生成器 gen-ssds-configs.mjs でも使うために切り出した (METRIC-GATE-FOLLOWUP-01)。
 */
import fs from "node:fs";
import path from "node:path";
import { datasetDir } from "../../../../config/datasets.mjs";

/** 項目名の末尾の括弧が「…当たり」(「あたり」も) なら、その項目は SSDS が算式で割り終えた率である */
export const RATE_NAME = /[（(][^（）()]*(?:当たり|あたり)[^（）()]*[）)]\s*$/;

/**
 * 統計表の cat01 コードと公式の項目名の対応を、data/estat/meta の控えから読む。
 * 控えが無い・全件が揃っていない (一部だけの標本) ときは空の Map。一部では「無い」を証拠にできない。
 * @param {string} projectRoot
 * @param {string} statsDataId
 * @returns {Map<string, string>}
 */
export function readOfficialNames(projectRoot, statsDataId) {
  const names = new Map();
  const file = path.join(projectRoot, datasetDir("estat.meta"), `${statsDataId}.json`);
  if (!fs.existsSync(file)) return names;
  const meta = JSON.parse(fs.readFileSync(file, "utf8"));
  const dim = meta.dimensions?.find((d) => d.id === "cat01");
  if (dim && dim.sampleValues?.length === dim.valueCount) {
    for (const { code, name } of dim.sampleValues) names.set(code, name);
  }
  return names;
}

/**
 * その項目が、公式の項目名で分母を名乗る率か。`#` 付きの項目だけが対象 (基礎項目の実数は対象外)。
 * @param {Map<string, Map<string, string>>} cache statsDataId ごとの読み込み結果の置き場
 */
export function isOfficialRate(projectRoot, { statsDataId, cdCat01 }, cache = new Map()) {
  if (typeof cdCat01 !== "string" || !cdCat01.startsWith("#")) return false;
  if (!cache.has(statsDataId)) cache.set(statsDataId, readOfficialNames(projectRoot, statsDataId));
  const name = cache.get(statsDataId).get(cdCat01);
  return Boolean(name) && RATE_NAME.test(name);
}
