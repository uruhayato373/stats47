/** 都道府県間 通勤フロー（常住地→従業地）: 型定義（移動フローと同型） */

export interface CommutePartner {
  /** 2 桁県コード */
  code: string;
  name: string;
  /** 相手県に常住し焦点県へ通勤する人数（焦点県への流入） */
  inflow: number;
  /** 焦点県に常住し相手県へ通勤する人数（焦点県からの流出） */
  outflow: number;
  /** inflow - outflow（正 = 昼間に人を集める） */
  net: number;
}

/** public/commute-flow/{NN}.json の構造 */
export interface CommuteFlowData {
  focusCode: string;
  focusName: string;
  year: number;
  source: string;
  partners: CommutePartner[];
  totals: { inflow: number; outflow: number; net: number };
}
