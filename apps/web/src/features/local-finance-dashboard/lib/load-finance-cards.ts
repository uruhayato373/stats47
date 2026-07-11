/**
 * 都道府県 決算カード (総務省 地方財政状況調査) を読み込む。
 *
 * 完全DBレス: Reference データ。data/finance-cards.json は
 * apps/web/scripts/generate-finance-cards.py が総務省公開Excelから再生成する派生物。
 * 値は千円 (金額) / 比率(%) / 指数。年度は 2020〜2024 (令和2〜6年度)。
 */
import cardsJson from "../data/finance-cards.json";

export interface YearRecord {
  /** 歳入総額 (千円) */ revenue: number;
  /** 歳出総額 (千円) */ expenditure: number;
  /** 実質収支 (千円) */ realBalance: number;
  /** 標準財政規模 (千円) */ standardScale: number;
  /** 財政力指数 */ fiscalIndex: number;
  /** 経常収支比率 (%) */ currentBalanceRatio: number;
  /** 実質公債費比率 (%) */ debtServiceRatio: number;
  /** 将来負担比率 (%) */ futureBurdenRatio: number;
  /** 財政調整基金 現在高 (千円) */ fundAdjust: number;
  /** 減債基金 現在高 (千円) */ fundRedemption: number;
  /** その他特定目的基金 現在高 (千円) */ fundOther: number;
  /** 地方債現在高 (千円) */ localDebt: number;
}

export interface PrefCard {
  name: string;
  years: Record<string, YearRecord>;
}

interface FlowNode {
  name: string;
  value: number;
}

interface CityFlow {
  revenue: FlowNode[];
  expenditure: FlowNode[];
  totals: { revenue: number; expenditure: number };
}

export interface CityRecord {
  type?: string;
  years: Record<string, YearRecord>;
  flow?: CityFlow;
}

/** 市区町村 JSON: cityName -> CityRecord */
export type CityData = Record<string, CityRecord>;

export interface FinanceCardsData {
  /** 都道府県2桁コード → カード */
  cards: Record<string, PrefCard>;
  /** 昇順の年度一覧 */
  years: number[];
  /** 年度 → 全国(都道府県)平均レコード */
  averages: Record<number, YearRecord>;
  latestYear: number;
}

const NUMERIC_KEYS: (keyof YearRecord)[] = [
  "revenue", "expenditure", "realBalance", "standardScale", "fiscalIndex",
  "currentBalanceRatio", "debtServiceRatio", "futureBurdenRatio",
  "fundAdjust", "fundRedemption", "fundOther", "localDebt",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseString(value: unknown, path: string): string {
  if (typeof value !== "string") {
    throw new Error(`${path} must be a string`);
  }
  return value;
}

function parseNumber(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${path} must be a finite number`);
  }
  return value;
}

function parseYearRecord(value: unknown, path: string): YearRecord {
  if (!isRecord(value)) {
    throw new Error(`${path} must be an object`);
  }

  return {
    revenue: parseNumber(value.revenue, `${path}.revenue`),
    expenditure: parseNumber(value.expenditure, `${path}.expenditure`),
    realBalance: parseNumber(value.realBalance, `${path}.realBalance`),
    standardScale: parseNumber(value.standardScale, `${path}.standardScale`),
    fiscalIndex: parseNumber(value.fiscalIndex, `${path}.fiscalIndex`),
    currentBalanceRatio: parseNumber(value.currentBalanceRatio, `${path}.currentBalanceRatio`),
    debtServiceRatio: parseNumber(value.debtServiceRatio, `${path}.debtServiceRatio`),
    futureBurdenRatio: parseNumber(value.futureBurdenRatio, `${path}.futureBurdenRatio`),
    fundAdjust: parseNumber(value.fundAdjust, `${path}.fundAdjust`),
    fundRedemption: parseNumber(value.fundRedemption, `${path}.fundRedemption`),
    fundOther: parseNumber(value.fundOther, `${path}.fundOther`),
    localDebt: parseNumber(value.localDebt, `${path}.localDebt`),
  };
}

function parsePrefCard(value: unknown, path: string): PrefCard {
  if (!isRecord(value)) {
    throw new Error(`${path} must be an object`);
  }

  return {
    name: parseString(value.name, `${path}.name`),
    years: parseYears(value.years, `${path}.years`),
  };
}

function parseYears(value: unknown, path: string): Record<string, YearRecord> {
  if (!isRecord(value)) {
    throw new Error(`${path} must be an object`);
  }

  const years: Record<string, YearRecord> = {};
  for (const [year, record] of Object.entries(value)) {
    if (!/^\d{4}$/.test(year)) {
      throw new Error(`${path} contains invalid year: ${year}`);
    }
    years[year] = parseYearRecord(record, `${path}.${year}`);
  }
  return years;
}

function parseFlowNode(value: unknown, path: string): FlowNode {
  if (!isRecord(value)) {
    throw new Error(`${path} must be an object`);
  }
  return {
    name: parseString(value.name, `${path}.name`),
    value: parseNumber(value.value, `${path}.value`),
  };
}

function parseFlowNodes(value: unknown, path: string): FlowNode[] {
  if (!Array.isArray(value)) {
    throw new Error(`${path} must be an array`);
  }
  return value.map((node, index) => parseFlowNode(node, `${path}.${index}`));
}

function parseCityFlow(value: unknown, path: string): CityFlow {
  if (!isRecord(value)) {
    throw new Error(`${path} must be an object`);
  }
  if (!isRecord(value.totals)) {
    throw new Error(`${path}.totals must be an object`);
  }

  return {
    revenue: parseFlowNodes(value.revenue, `${path}.revenue`),
    expenditure: parseFlowNodes(value.expenditure, `${path}.expenditure`),
    totals: {
      revenue: parseNumber(value.totals.revenue, `${path}.totals.revenue`),
      expenditure: parseNumber(value.totals.expenditure, `${path}.totals.expenditure`),
    },
  };
}

function parseCityRecord(value: unknown, path: string): CityRecord {
  if (!isRecord(value)) {
    throw new Error(`${path} must be an object`);
  }

  return {
    ...(value.type === undefined ? {} : { type: parseString(value.type, `${path}.type`) }),
    years: parseYears(value.years, `${path}.years`),
    ...(value.flow === undefined ? {} : { flow: parseCityFlow(value.flow, `${path}.flow`) }),
  };
}

export function parseFinanceCards(value: unknown): Record<string, PrefCard> {
  if (!isRecord(value)) {
    throw new Error("finance-cards data must be an object");
  }

  const cards: Record<string, PrefCard> = {};
  for (const [code, card] of Object.entries(value)) {
    if (!/^\d{2}$/.test(code)) {
      throw new Error(`finance-cards contains invalid prefecture code: ${code}`);
    }
    cards[code] = parsePrefCard(card, `finance-cards.${code}`);
  }
  return cards;
}

export function parseCityFinanceCards(value: unknown, path = "finance-cards.cities"): CityData {
  if (!isRecord(value)) {
    throw new Error(`${path} data must be an object`);
  }

  const cities: CityData = {};
  for (const [cityName, record] of Object.entries(value)) {
    if (cityName.trim() === "") {
      throw new Error(`${path} contains empty city name`);
    }
    cities[cityName] = parseCityRecord(record, `${path}.${cityName}`);
  }
  return cities;
}

function createEmptyYearRecord(): YearRecord {
  return {
    revenue: 0,
    expenditure: 0,
    realBalance: 0,
    standardScale: 0,
    fiscalIndex: 0,
    currentBalanceRatio: 0,
    debtServiceRatio: 0,
    futureBurdenRatio: 0,
    fundAdjust: 0,
    fundRedemption: 0,
    fundOther: 0,
    localDebt: 0,
  };
}

// NOTE: これは R2 data reader ではない (r2-storage-design.md の module-cache 禁止対象外)。
// 入力 cardsJson は build 時に bundle される immutable な静的 import であり、派生計算
// (年度一覧・47県平均) を warm isolate 内で 1 度だけ行うための pure compute memo。
// R2 fetch を伴わないため stale 化リスクがなく、データ更新は再ビルド (= isolate 再起動) で反映される。
// unstable_cache は async 関数専用でこの同期関数には適用できない。
let cached: FinanceCardsData | null = null;

export function loadFinanceCards(): FinanceCardsData {
  if (cached) return cached;
  const cards = parseFinanceCards(cardsJson);

  // 年度一覧
  const yearSet = new Set<number>();
  for (const code of Object.keys(cards)) {
    for (const y of Object.keys(cards[code].years)) yearSet.add(Number(y));
  }
  const years = [...yearSet].sort((a, b) => a - b);
  const latestYear = years[years.length - 1] ?? 0;

  // 都道府県平均 (年度ごと、47県平均)
  const averages: Record<number, YearRecord> = {};
  for (const year of years) {
    const acc = createEmptyYearRecord();
    let n = 0;
    for (const code of Object.keys(cards)) {
      const rec = cards[code].years[String(year)];
      if (!rec) continue;
      n += 1;
      for (const k of NUMERIC_KEYS) acc[k] += rec[k] ?? 0;
    }
    if (n > 0) for (const k of NUMERIC_KEYS) acc[k] = acc[k] / n;
    averages[year] = acc;
  }

  cached = { cards, years, averages, latestYear };
  return cached;
}
