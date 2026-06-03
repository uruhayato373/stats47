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

let cached: FinanceCardsData | null = null;

export function loadFinanceCards(): FinanceCardsData {
  if (cached) return cached;
  const cards = cardsJson as unknown as Record<string, PrefCard>;

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
    const acc = Object.fromEntries(NUMERIC_KEYS.map((k) => [k, 0])) as unknown as YearRecord;
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
