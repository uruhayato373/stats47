/** 2025年家計調査の全国・分類軸別比較を公式 e-Stat 表から生成する。R2 push は行わない。 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { KAKEI_ANALYSES } from "@stats47/data-configs";

import { parseKakeiAxisArtifact } from "../schemas";
import { KAKEI_AXIS_R2_KEY, type KakeiAxisChart } from "../types";
import { R2_LOCAL_DIR } from "./_lib";
import { fetchEstatRaw } from "./generate-japan-series";

const QUINTILES = ["01", "02", "03", "04", "05"];
const HOUSEHOLD_SIZES = ["01", "02", "03", "04", "05"];
const AGE_GROUPS = ["430", "303", "304", "305", "306", "570"];
const INCOME_CLASSES = Array.from({ length: 18 }, (_, i) => String(i + 1).padStart(3, "0"));

interface ChartSpec {
  id: string;
  themeSlug: string;
  title: string;
  description: string;
  axis: string;
  axisCodes: string[];
  filters: Record<string, string>;
  expectedUnit: string;
  period: KakeiAxisChart["period"];
}

const SPECS: ChartSpec[] = [
  { id: "food-income-quintile", themeSlug: "household-food-spending", title: "食費と年収五分位（1か月平均）", description: "二人以上世帯・全国。用途分類の食料費は1か月平均です。世帯人数や物価の差を調整した値ではありません。", axis: "年間収入五分位", axisCodes: QUINTILES, filters: { cdCat01: "060", cdCat02: "03" }, expectedUnit: "円", period: "monthly-average" },
  { id: "item-spending-income-quintile", themeSlug: "household-food-spending", title: "米への支出と年収五分位", description: "二人以上世帯・全国。品目分類の米への年間支出です。支出額には購入量と価格の両方が影響します。", axis: "年間収入五分位", axisCodes: QUINTILES, filters: { cdCat01: "010110001", cdCat02: "03" }, expectedUnit: "円", period: "annual-total" },
  { id: "item-quantity-income-quintile", themeSlug: "household-food-spending", title: "米の購入量と年収五分位", description: "二人以上世帯・全国。品目分類の米の年間購入量です。支出額とは単位が異なります。", axis: "年間収入五分位", axisCodes: QUINTILES, filters: { cdCat01: "010110001", cdCat02: "03" }, expectedUnit: "kg", period: "annual-total" },
  { id: "item-spending-age", themeSlug: "household-food-spending", title: "米への支出と世帯主年齢", description: "二人以上世帯・全国。重複しない年齢階級のみを比較します。世帯主の年齢であり、購入者の年齢ではありません。", axis: "世帯主の年齢階級", axisCodes: AGE_GROUPS, filters: { cdCat01: "010110001", cdCat02: "03" }, expectedUnit: "円", period: "annual-total" },
  { id: "food-household-size", themeSlug: "household-food-spending", title: "食費と世帯人数（1か月平均）", description: "二人以上世帯・全国。世帯全体の1か月平均食費です。人数あたりの値ではありません。", axis: "世帯人員", axisCodes: HOUSEHOLD_SIZES, filters: { cdCat01: "060", cdCat02: "03" }, expectedUnit: "円", period: "monthly-average" },
  { id: "savings-income-quintile", themeSlug: "household-assets-debt", title: "貯蓄と年収五分位", description: "二人以上世帯・全国・全世帯。年収五分位ごとの1世帯当たり貯蓄残高です。", axis: "年間収入五分位", axisCodes: QUINTILES, filters: { cdCat01: "012", cdCat02: "03", cdCat04: "01" }, expectedUnit: "万円", period: "balance" },
  { id: "debt-income-quintile", themeSlug: "household-assets-debt", title: "負債と年収五分位", description: "二人以上世帯・全国・全世帯。負債を持たない世帯を含む1世帯当たり負債残高です。", axis: "年間収入五分位", axisCodes: QUINTILES, filters: { cdCat01: "028", cdCat02: "03", cdCat04: "01" }, expectedUnit: "万円", period: "balance" },
  { id: "savings-income-18-class", themeSlug: "household-assets-debt", title: "貯蓄と年間収入18階級", description: "二人以上世帯・全国。年間収入階級ごとの1世帯当たり貯蓄残高です。", axis: "年間収入階級", axisCodes: INCOME_CLASSES, filters: { cdCat01: "012", cdCat02: "03" }, expectedUnit: "万円", period: "balance" },
  { id: "debt-income-18-class", themeSlug: "household-assets-debt", title: "負債と年間収入18階級", description: "二人以上世帯・全国。年間収入階級ごとの1世帯当たり負債残高です。", axis: "年間収入階級", axisCodes: INCOME_CLASSES, filters: { cdCat01: "028", cdCat02: "03" }, expectedUnit: "万円", period: "balance" },
];

export function selectKakeiAxisRows(
  raw: unknown,
  spec: ChartSpec,
): KakeiAxisChart["rows"] {
  const root = raw as { GET_STATS_DATA?: { STATISTICAL_DATA?: { DATA_INF?: { VALUE?: unknown }; CLASS_INF?: { CLASS_OBJ?: unknown } } } };
  const data = root.GET_STATS_DATA?.STATISTICAL_DATA;
  const values = data?.DATA_INF?.VALUE;
  const classes = data?.CLASS_INF?.CLASS_OBJ;
  if (!Array.isArray(values) || !Array.isArray(classes)) throw new Error(`${spec.id}: e-Stat response is incomplete`);
  const cat03 = classes.find((entry: { "@id"?: string }) => entry["@id"] === "cat03") as { CLASS?: unknown } | undefined;
  const classRows = Array.isArray(cat03?.CLASS) ? cat03.CLASS : [];
  const labels = new Map(classRows.map((row: { "@code": string; "@name": string }) => [row["@code"], row["@name"]]));
  return spec.axisCodes.map(code => {
    const matches = values.filter((row: Record<string, string>) =>
      row["@area"] === "00000" && row["@time"] === "2025000000" && row["@cat03"] === code &&
      Object.entries(spec.filters).every(([key, val]) => row[`@${key.slice(2).toLowerCase()}`] === val));
    if (matches.length !== 1) throw new Error(`${spec.id}: ${code} has ${matches.length} matching 2025 rows`);
    const row = matches[0] as Record<string, string>;
    const unit = row["@unit"]?.normalize("NFKC").replace(/^1(?=[a-zA-Z])/, "");
    if (unit !== spec.expectedUnit) throw new Error(`${spec.id}: ${code} unit ${row["@unit"]} != ${spec.expectedUnit}`);
    const value = Number(row.$);
    if (!Number.isFinite(value)) throw new Error(`${spec.id}: ${code} is not numeric`);
    const label = labels.get(code);
    if (typeof label !== "string") throw new Error(`${spec.id}: ${code} has no metadata label`);
    return { code, label, value };
  });
}

async function householdComparison(): Promise<KakeiAxisChart> {
  const groups = [
    { analysisId: "rice-national-spending-trend", code: "03", label: "二人以上世帯" },
    { analysisId: "food-all-households", code: "11", label: "総世帯" },
    { analysisId: "food-single-households", code: "21", label: "単身世帯" },
  ];
  const sourceIds: string[] = [];
  const rows: KakeiAxisChart["rows"] = [];
  for (const group of groups) {
    const analysis = KAKEI_ANALYSES.find(item => item.id === group.analysisId);
    if (!analysis) throw new Error(`household comparison missing ${group.analysisId}`);
    const sourceId = analysis.source.statsDataId;
    const raw = await fetchEstatRaw(sourceId, { cdCat01: "010110001", cdCat02: group.code });
    const values = raw.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE;
    const matches = (Array.isArray(values) ? values : [values]).filter(row =>
      row?.["@area"] === "00000" && row?.["@time"] === "2025000000" &&
      row?.["@cat01"] === "010110001" && row?.["@cat02"] === group.code);
    if (matches.length !== 1 || matches[0]["@unit"] !== "円") throw new Error(`household comparison ${sourceId}: invalid 2025 rice row`);
    const value = Number(matches[0].$);
    if (!Number.isFinite(value)) throw new Error(`household comparison ${sourceId}: nonnumeric value`);
    rows.push({ code: group.code, label: group.label, value });
    sourceIds.push(sourceId);
  }
  return {
    id: "rice-household-type", themeSlug: "household-food-spending", title: "米への支出と世帯類型",
    description: "2025年・全国の1世帯当たり年間支出。総世帯には二人以上世帯と単身世帯が含まれます。人数当たりの比較ではありません。",
    sourceId: sourceIds[0], sourceIds, household: "総世帯・二人以上世帯・単身世帯", axis: "世帯区分",
    period: "annual-total", unit: "円", filters: { cdCat01: "010110001", cdArea: "00000", cdTime: "2025000000" }, rows,
  };
}

export async function generateKakeiAxisCharts(write = false) {
  const charts: KakeiAxisChart[] = [];
  for (const spec of SPECS) {
    const analysis = KAKEI_ANALYSES.find(item => item.id === spec.id ||
      (spec.id === "debt-income-quintile" && item.id === "savings-income-quintile") ||
      (spec.id === "debt-income-18-class" && item.id === "savings-income-18-class"));
    if (!analysis || analysis.source.geography !== "national") throw new Error(`${spec.id}: analysis catalog mismatch`);
    const sourceId = analysis.source.statsDataId;
    const raw = await fetchEstatRaw(sourceId, spec.filters);
    const rows = selectKakeiAxisRows(raw, spec);
    charts.push({ id: spec.id, themeSlug: spec.themeSlug, title: spec.title, description: spec.description,
      sourceId, household: "二人以上世帯", axis: spec.axis, period: spec.period, unit: spec.expectedUnit,
      filters: { ...spec.filters, cdTime: "2025000000", cdArea: "00000" }, rows });
    console.log(`${spec.id}: ${rows.length} rows, ${sourceId}`);
  }
  charts.push(await householdComparison());
  const artifact = parseKakeiAxisArtifact({ schemaVersion: 1, year: 2025, geographyScope: "japan", charts, meta: { generatedAt: new Date().toISOString() } });
  const path = resolve(R2_LOCAL_DIR, KAKEI_AXIS_R2_KEY);
  if (write) { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, JSON.stringify(artifact, null, 2) + "\n"); }
  return { artifact, path };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  generateKakeiAxisCharts(process.argv.includes("--write")).then(result => console.log(result.path)).catch(error => { console.error(error); process.exit(1); });
}
