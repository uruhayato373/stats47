/** 都道府県 財政フロー（財源 → 一般会計 → 目的別歳出）: 型定義 */

export interface FinanceNode {
  name: string;
  /** 金額（千円） */
  value: number;
}

/** public/finance-flow/{NN}.json の構造 */
export interface FinanceFlowData {
  focusCode: string;
  focusName: string;
  /** 年度 */
  year: number;
  source: string;
  /** 歳入の財源（金額・千円、降順） */
  revenue: FinanceNode[];
  /** 目的別歳出（金額・千円、降順） */
  expenditure: FinanceNode[];
  totals: { revenue: number; expenditure: number };
}
