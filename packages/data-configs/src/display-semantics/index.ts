/**
 * display-semantics — 表示ラベルと指標定義の「意味」の食い違いを判定する純粋関数。
 *
 * 由来: SITE-DISPLAY-SEMANTICS-AUDIT-01 (2026-09-25 `/areas/13000` の全面確認)。
 * 県データブックで「医師数(10万人比)」が総数の指標・「年間支出」と説明した節に月額の指標・
 * 「人口当たり」と説明した節に総数の指標、が 47 ページに一斉に出ていた。
 *
 * 判定の入力は **指標の宣言** (unit を単位の正典 `../unit` の parseUnit で解釈 + title/subtitle/description の文言) だけ。
 * 指標キーの名前 (`-per-100k` / `-per-month` など) からは推定しない。宣言に無い性質は「不明」として扱い、
 * 断定する規則 (blocker) には使わない。
 */
import { parseUnit } from "../unit";

/** 判定に使う指標の宣言。METRICS_REGISTRY の要素はそのまま渡せる。 */
export interface MetricDeclaration {
  key: string;
  title?: string;
  subtitle?: string;
  description?: string;
  unit?: string;
  /** 出典。e-Stat の統計表 ID は「基礎データ (実数)」か「指標 (割った値)」かの宣言として使う。 */
  source?: { kind?: string; statsDataId?: string } | Record<string, unknown>;
}

/**
 * - rate: 単位の正典が割合/指数/分母つきと解釈した、または宣言文言に「◯当たり」「割合」等がある
 * - total: 単位の正典が次元を解釈でき (人・施設・円 など)、分母も割合の宣言も無く、かつ総数であることが
 *   **宣言されている** (subtitle が「総数」「実数」、または出典が社会・人口統計体系の基礎データ表)
 * - unknown: 上のどちらとも宣言から言えない (判定に使わない)。
 *   2026-09-27 実測: registry 2,603 指標の多くは分母を title/subtitle に書いておらず (例: 博物館数 = 100万人当たり)、
 *   「分母の宣言が無い = 総数」と扱うと ThemeCatalog で 14 件の誤検知が出た。
 */
export type MetricBasis = "rate" | "total" | "unknown";
export type MetricPeriod = "monthly" | "annual" | null;

export interface MetricSemantics {
  basis: MetricBasis;
  /** 宣言文言から読み取った期間。宣言が無ければ null (推定しない)。 */
  period: MetricPeriod;
}

/**
 * 社会・人口統計体系 (SSDS) の統計表 ID。0000010101〜0000010113 は「基礎データ」(実数)、
 * 0000010201〜0000010213 は「社会生活統計指標」(人口当たり・割合などに割った値)。
 * 出典: e-Stat 統計表一覧 (社会・人口統計体系 都道府県データ)。
 */
const SSDS_BASIC_DATA = /^00000101\d{2}$/;
const TOTAL_DECLARATION = /^(総数|実数|合計)$/;

const RATIO_DIMENSIONS = new Set(["percent", "permille", "index", "rate-per"]);

/** 宣言文言の「分母つき」表現。例: 人口10万人当たり / 1世帯当たり / 千人あたり / 人口千対。 */
const PER_DECLARATION = /(当たり|あたり|千対|万対|十万対|\d+\s*対)/;
/** 宣言文言の「割合」表現。 */
const SHARE_DECLARATION = /(割合|比率|率|構成比|シェア|倍率)/;
const MONTHLY_DECLARATION = /(1\s*[かカヶケ]月|一[かカヶケ]月|月額|月平均|月当たり|月あたり|月間)/;
const ANNUAL_DECLARATION = /(年間|年額|1\s*年当たり|1\s*年あたり|年計)/;

function declaredText(m: MetricDeclaration): string {
  return [m.title, m.subtitle, m.description].filter(Boolean).join(" ").normalize("NFKC");
}

function declaresTotal(m: MetricDeclaration): boolean {
  if (TOTAL_DECLARATION.test((m.subtitle ?? "").normalize("NFKC").trim())) return true;
  const statsDataId = (m.source as { statsDataId?: unknown } | undefined)?.statsDataId;
  return typeof statsDataId === "string" && SSDS_BASIC_DATA.test(statsDataId);
}

export function classifyMetric(m: MetricDeclaration): MetricSemantics {
  const unit = parseUnit(m.unit);
  const text = declaredText(m);
  const nameText = [m.title, m.subtitle].filter(Boolean).join(" ").normalize("NFKC");
  let basis: MetricBasis;
  if (unit.dimension === null) basis = "unknown";
  else if (unit.hasDenominator || RATIO_DIMENSIONS.has(unit.dimension)) basis = "rate";
  // 割合の語は title/subtitle だけで見る (description の「〜の割合で算出」等の説明文で誤判定しない)
  else if (PER_DECLARATION.test(text) || SHARE_DECLARATION.test(nameText)) basis = "rate";
  else if (declaresTotal(m)) basis = "total";
  else basis = "unknown";
  const period: MetricPeriod = MONTHLY_DECLARATION.test(text) ? "monthly" : ANNUAL_DECLARATION.test(text) ? "annual" : null;
  return { basis, period };
}

/** 表示ラベル・節の説明が主張している意味。 */
export interface LabelClaims {
  /** 人口当たり・比・率・割合など、規模を割った値だと読める */
  rate: boolean;
  period: MetricPeriod;
}

/** 「比」「率」を含むが割合ではない語 (比較・効率 等)。 */
const RATE_FALSE_FRIENDS = /(比較|対比|効率|確率論|税率区分)/g;
const LABEL_RATE = /(\d+\s*万人比|万人比|人口当たり|人口あたり|当たり|あたり|割合|比率|構成比|[^\s]率|比\)|比）|比$)/;

export function labelClaims(label: string | null | undefined): LabelClaims {
  const text = (label ?? "").normalize("NFKC").replace(RATE_FALSE_FRIENDS, "");
  return {
    rate: LABEL_RATE.test(text),
    period: MONTHLY_DECLARATION.test(text) ? "monthly" : ANNUAL_DECLARATION.test(text) ? "annual" : null,
  };
}

/** 節の説明が「人口当たりの値を並べる」と主張しているか。 */
export function sectionClaimsPerPopulation(description: string | null | undefined): boolean {
  return /(人口[\d十百千万\s]*人?\s*(当たり|あたり)|人口比|\d+\s*万人比)/.test((description ?? "").normalize("NFKC"));
}

export type SemanticRule =
  | "label-rate-on-total"
  | "section-per-population-on-total"
  | "period-mismatch"
  | "period-undeclared"
  | "trend-chart-type"
  | "card-year-missing";

export type SemanticSeverity = "error" | "warning";

export interface SemanticFinding {
  rule: SemanticRule;
  severity: SemanticSeverity;
  where: string;
  rankingKey?: string;
  detail: string;
}

/**
 * 規則ごとの重さ。全コーパスの該当率を測ってから決める (誤検知の出る規則は blocker にしない)。
 * 2026-09-27 の初回測定: 下記「error」の規則は該当 0 件 (直した 4 件の再注入でのみ発火)。
 */
export const RULE_SEVERITY: Record<SemanticRule, SemanticSeverity> = {
  "label-rate-on-total": "error",
  "section-per-population-on-total": "error",
  "period-mismatch": "error",
  // 指標側に期間の宣言が無いだけ (表示は正しい可能性がある) → 指標定義の補記を促す warning
  "period-undeclared": "warning",
  "trend-chart-type": "warning",
  "card-year-missing": "error",
};

function finding(rule: SemanticRule, where: string, detail: string, rankingKey?: string): SemanticFinding {
  return { rule, severity: RULE_SEVERITY[rule], where, detail, ...(rankingKey ? { rankingKey } : {}) };
}

/** 1 つの表示ラベル (と所属する節の説明) を指標の宣言と突き合わせる。 */
export function checkLabelAgainstMetric(input: {
  where: string;
  label: string;
  sectionDescription?: string | null;
  metric: MetricDeclaration;
}): SemanticFinding[] {
  const out: SemanticFinding[] = [];
  const sem = classifyMetric(input.metric);
  const claims = labelClaims(input.label);
  const key = input.metric.key;

  if (claims.rate && sem.basis === "total") {
    out.push(finding("label-rate-on-total", input.where, `ラベル「${input.label}」は割った値に読めるが、指標 ${key} は総数 (unit=${input.metric.unit ?? "?"})`, key));
  }
  if (sectionClaimsPerPopulation(input.sectionDescription) && sem.basis === "total") {
    out.push(finding("section-per-population-on-total", input.where, `節の説明「${input.sectionDescription}」は人口当たりだが、指標 ${key} は総数`, key));
  }

  // 期間 (年間/月額) は金額の指標だけで見る。割合・人数 (「月平均の被保護人員」等) は期間で値の意味が変わらない
  if (parseUnit(input.metric.unit).dimension !== "currency") return out;
  const sectionPeriod = labelClaims(input.sectionDescription).period;
  const claimed = claims.period ?? sectionPeriod;
  const claimedFrom = claims.period ? `ラベル「${input.label}」` : `節の説明「${input.sectionDescription}」`;
  if (claimed && sem.period && claimed !== sem.period) {
    out.push(finding("period-mismatch", input.where, `${claimedFrom}は${claimed === "annual" ? "年間" : "月額"}だが、指標 ${key} は${sem.period === "annual" ? "年間" : "月額"}と宣言`, key));
  } else if (claimed && !sem.period) {
    out.push(finding("period-undeclared", input.where, `${claimedFrom}は${claimed === "annual" ? "年間" : "月額"}だが、指標 ${key} の title/subtitle/description に期間の宣言が無い (定義に補記すると検査できる)`, key));
  }
  return out;
}

/** 「推移」と題したチャートは時系列を描ける型でなければならない。 */
const TREND_CAPABLE = /(line|area|mixed|bar|trend|time-?series|pyramid|^ranking-chart$)/;
export function checkTrendChart(input: { where: string; title: string; componentType: string }): SemanticFinding[] {
  if (!/推移/.test(input.title) || TREND_CAPABLE.test(input.componentType)) return [];
  return [finding("trend-chart-type", input.where, `「${input.title}」は推移と題しているが componentType=${input.componentType} は時系列を描かない`)];
}
