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
/** 持家・民営借家・公営借家・給与住宅。住宅ローン返済世帯 (02) は持家の内数なので並べない */
const HOUSING_TENURES = ["01", "03", "04", "05"];
/** 34歳以下・35〜59歳・60歳以上。65歳以上 (565) は 60歳以上の内数なので並べない */
const SINGLE_AGE_GROUPS = ["435", "615", "560"];
/** 2025年の12か月。e-Stat の月次の時間コードは年4桁 + "00" + 月2桁 + 月2桁 */
const MONTHS_2025 = Array.from({ length: 12 }, (_, i) => {
  const month = String(i + 1).padStart(2, "0");
  return `202500${month}${month}`;
});

interface ChartSpec {
  id: string;
  themeSlug: string;
  title: string;
  description: string;
  axis: string;
  axisCodes: string[];
  /** 分析単位の絞り込み (KAKEI_ANALYSES の source.filters) に足す、この図だけの分類 (貯蓄と負債・男女など)。同じ分類を上書きしない */
  extraFilters?: Record<string, string>;
  expectedUnit: string;
  period: KakeiAxisChart["period"];
  /** 分析単位の id。図の id と違うときだけ書く */
  analysisId?: string;
  /** 比べる軸。既定は cat03。time は月次の表で使う */
  axisDim?: "cat03" | "time";
  /** 世帯の表記。既定は二人以上世帯 */
  household?: string;
}

export const SPECS: ChartSpec[] = [
  { id: "food-income-quintile", themeSlug: "household-food-spending", title: "食費と年収五分位（1か月平均）", description: "二人以上世帯・全国。用途分類の食料費は1か月平均です。世帯人数や物価の差を調整した値ではありません。", axis: "年間収入五分位", axisCodes: QUINTILES, expectedUnit: "円", period: "monthly-average" },
  { id: "item-spending-income-quintile", themeSlug: "household-food-spending", title: "米への支出と年収五分位", description: "二人以上世帯・全国。品目分類の米への年間支出です。支出額には購入量と価格の両方が影響します。", axis: "年間収入五分位", axisCodes: QUINTILES, expectedUnit: "円", period: "annual-total" },
  { id: "item-quantity-income-quintile", themeSlug: "household-food-spending", title: "米の購入量と年収五分位", description: "二人以上世帯・全国。品目分類の米の年間購入量です。支出額とは単位が異なります。", axis: "年間収入五分位", axisCodes: QUINTILES, expectedUnit: "kg", period: "annual-total" },
  { id: "item-spending-age", themeSlug: "household-food-spending", title: "米への支出と世帯主年齢", description: "二人以上世帯・全国。重複しない年齢階級のみを比較します。世帯主の年齢であり、購入者の年齢ではありません。", axis: "世帯主の年齢階級", axisCodes: AGE_GROUPS, expectedUnit: "円", period: "annual-total" },
  { id: "food-household-size", themeSlug: "household-food-spending", title: "食費と世帯人数（1か月平均）", description: "二人以上世帯・全国。世帯全体の1か月平均食費です。人数あたりの値ではありません。", axis: "世帯人員", axisCodes: HOUSEHOLD_SIZES, expectedUnit: "円", period: "monthly-average" },
  { id: "savings-income-quintile", themeSlug: "household-assets-debt", title: "貯蓄と年収五分位", description: "二人以上世帯・全国・全世帯。年収五分位ごとの1世帯当たり貯蓄残高です。", axis: "年間収入五分位", axisCodes: QUINTILES, extraFilters: { cdCat01: "012" }, expectedUnit: "万円", period: "balance" },
  { id: "debt-income-quintile", analysisId: "savings-income-quintile", themeSlug: "household-assets-debt", title: "負債と年収五分位", description: "二人以上世帯・全国・全世帯。負債を持たない世帯を含む1世帯当たり負債残高です。", axis: "年間収入五分位", axisCodes: QUINTILES, extraFilters: { cdCat01: "028" }, expectedUnit: "万円", period: "balance" },
  { id: "savings-income-18-class", themeSlug: "household-assets-debt", title: "貯蓄と年間収入18階級", description: "二人以上世帯・全国。年間収入階級ごとの1世帯当たり貯蓄残高です。", axis: "年間収入階級", axisCodes: INCOME_CLASSES, extraFilters: { cdCat01: "012" }, expectedUnit: "万円", period: "balance" },
  { id: "debt-income-18-class", analysisId: "savings-income-18-class", themeSlug: "household-assets-debt", title: "負債と年間収入18階級", description: "二人以上世帯・全国。年間収入階級ごとの1世帯当たり負債残高です。", axis: "年間収入階級", axisCodes: INCOME_CLASSES, extraFilters: { cdCat01: "028" }, expectedUnit: "万円", period: "balance" },
  { id: "consumption-housing-tenure", themeSlug: "household-food-spending", title: "消費支出と住居の所有関係（1か月平均）", description: "二人以上世帯・全国。世帯全体の1か月平均の消費支出です。世帯主の年齢や世帯人数の差を調整した値ではありません。", axis: "住居の所有関係", axisCodes: HOUSING_TENURES, expectedUnit: "円", period: "monthly-average" },
  { id: "housing-cost-housing-tenure", themeSlug: "household-food-spending", title: "住居への支出と住居の所有関係（1か月平均）", description: "二人以上世帯・全国。家賃・地代と設備修繕・維持の1か月平均です。持家の住宅ローンの返済は消費支出に入りません。", axis: "住居の所有関係", axisCodes: HOUSING_TENURES, expectedUnit: "円", period: "monthly-average" },
  { id: "food-single-age-male", analysisId: "food-single-age-sex", themeSlug: "household-food-spending", title: "単身世帯の食費と年齢（男性・1か月平均）", description: "単身世帯・全国・男性。1か月平均の食費です。二人以上世帯の図とは対象が違うので並べて比べません。", axis: "年齢階級", axisCodes: SINGLE_AGE_GROUPS, extraFilters: { cdCat04: "1" }, expectedUnit: "円", period: "monthly-average", household: "単身世帯" },
  { id: "food-single-age-female", analysisId: "food-single-age-sex", themeSlug: "household-food-spending", title: "単身世帯の食費と年齢（女性・1か月平均）", description: "単身世帯・全国・女性。1か月平均の食費です。二人以上世帯の図とは対象が違うので並べて比べません。", axis: "年齢階級", axisCodes: SINGLE_AGE_GROUPS, extraFilters: { cdCat04: "2" }, expectedUnit: "円", period: "monthly-average", household: "単身世帯" },
  { id: "item-quantity-age", themeSlug: "household-food-spending", title: "米の購入量と世帯主年齢", description: "二人以上世帯・全国。重複しない年齢階級のみを比較します。世帯主の年齢であり、購入者の年齢ではありません。", axis: "世帯主の年齢階級", axisCodes: AGE_GROUPS, expectedUnit: "kg", period: "annual-total" },
  { id: "beer-monthly-spending", themeSlug: "household-food-spending", title: "ビールへの支出と月（2025年）", description: "二人以上世帯・全国。1世帯当たりの月ごとの支出額です。月は1年分がそろった2025年だけを示します。", axis: "月", axisCodes: MONTHS_2025, axisDim: "time", expectedUnit: "円", period: "month-total" },
  { id: "beer-monthly-quantity", themeSlug: "household-food-spending", title: "ビールの購入量と月（2025年）", description: "二人以上世帯・全国。1世帯当たりの月ごとの購入量です。支出額とは単位が異なります。", axis: "月", axisCodes: MONTHS_2025, axisDim: "time", expectedUnit: "l", period: "month-total" },
];

/** 分類名の末尾の年の注記を除く。「民営借家（2017年以前は設備共用及び借間を除く）」→「民営借家」 */
export function stripKakeiLabelNote(label: string): string {
  return label.replace(/（[^（）]*\d{4}年[^（）]*）$/, "");
}

/** 図の分析単位と、表の絞り込み (分析単位の絞り込み + 図だけの分類)。分析単位は家計の分析単位の台帳だけから引く */
export function resolveKakeiAxisSource(spec: ChartSpec): { analysis: (typeof KAKEI_ANALYSES)[number]; filters: Record<string, string> } {
  const analysis = KAKEI_ANALYSES.find(item => item.id === (spec.analysisId ?? spec.id));
  if (!analysis || analysis.source.geography !== "national") throw new Error(`${spec.id}: analysis catalog mismatch`);
  const base = analysis.source.filters ?? {};
  const overlap = Object.keys(spec.extraFilters ?? {}).filter(key => key in base);
  if (overlap.length) throw new Error(`${spec.id}: extraFilters overrides the analysis filters (${overlap.join(", ")})`);
  return { analysis, filters: { ...base, ...spec.extraFilters } };
}

export function selectKakeiAxisRows(
  raw: unknown,
  spec: ChartSpec,
  filters: Record<string, string>,
): KakeiAxisChart["rows"] {
  const root = raw as { GET_STATS_DATA?: { STATISTICAL_DATA?: { DATA_INF?: { VALUE?: unknown }; CLASS_INF?: { CLASS_OBJ?: unknown } } } };
  const data = root.GET_STATS_DATA?.STATISTICAL_DATA;
  const values = data?.DATA_INF?.VALUE;
  const classes = data?.CLASS_INF?.CLASS_OBJ;
  if (!Array.isArray(values) || !Array.isArray(classes)) throw new Error(`${spec.id}: e-Stat response is incomplete`);
  const axisDim = spec.axisDim ?? "cat03";
  const axisClass = classes.find((entry: { "@id"?: string }) => entry["@id"] === axisDim) as { CLASS?: unknown } | undefined;
  const classRows = Array.isArray(axisClass?.CLASS) ? axisClass.CLASS : [];
  const labels = new Map(classRows.map((row: { "@code": string; "@name": string }) => [row["@code"], row["@name"]]));
  return spec.axisCodes.map(code => {
    const matches = values.filter((row: Record<string, string>) =>
      row["@area"] === "00000" && row[`@${axisDim}`] === code &&
      (axisDim === "time" || row["@time"] === "2025000000") &&
      Object.entries(filters).every(([key, val]) => row[`@${key.slice(2).toLowerCase()}`] === val));
    if (matches.length !== 1) throw new Error(`${spec.id}: ${code} has ${matches.length} matching 2025 rows`);
    const row = matches[0] as Record<string, string>;
    const unit = row["@unit"]?.normalize("NFKC").replace(/^1(?=[a-zA-Z])/, "");
    if (unit !== spec.expectedUnit) throw new Error(`${spec.id}: ${code} unit ${row["@unit"]} != ${spec.expectedUnit}`);
    const value = Number(row.$);
    if (!Number.isFinite(value)) throw new Error(`${spec.id}: ${code} is not numeric`);
    const label = labels.get(code);
    if (typeof label !== "string") throw new Error(`${spec.id}: ${code} has no metadata label`);
    return { code, label: stripKakeiLabelNote(label), value };
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
    const { analysis, filters } = resolveKakeiAxisSource(spec);
    const sourceId = analysis.source.statsDataId;
    const raw = await fetchEstatRaw(sourceId, filters);
    const rows = selectKakeiAxisRows(raw, spec, filters);
    charts.push({ id: spec.id, themeSlug: spec.themeSlug, title: spec.title, description: spec.description,
      sourceId, household: spec.household ?? "二人以上世帯", axis: spec.axis, period: spec.period, unit: spec.expectedUnit,
      filters: { ...filters, ...(spec.axisDim === "time" ? {} : { cdTime: "2025000000" }), cdArea: "00000" }, rows });
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
