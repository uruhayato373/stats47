export interface PrefMigration {
  /** 都道府県コード（2桁） */
  code: string;
  name: string;
  /** 2025年 純移動数（転入 − 転出）。負 = 転出超過 */
  net: number;
}

/**
 * 2025年「住民基本台帳人口移動報告」（総務省統計局 / e-Stat）の
 * 都道府県別 純移動数。
 *
 * 並びは純移動の昇順（転出超過が大きい県 → 転入超過が大きい県）で、
 * 47都道府県まとめ動画のカウントダウン順と一致する。
 */
export const PREF_MIGRATION_2025: PrefMigration[] = [
  { code: "34", name: "広島県", net: -9921 },
  { code: "07", name: "福島県", net: -7197 },
  { code: "22", name: "静岡県", net: -6711 },
  { code: "15", name: "新潟県", net: -6379 },
  { code: "24", name: "三重県", net: -5986 },
  { code: "08", name: "茨城県", net: -5960 },
  { code: "38", name: "愛媛県", net: -5694 },
  { code: "42", name: "長崎県", net: -5608 },
  { code: "33", name: "岡山県", net: -5594 },
  { code: "01", name: "北海道", net: -5162 },
  { code: "46", name: "鹿児島県", net: -5003 },
  { code: "35", name: "山口県", net: -4907 },
  { code: "02", name: "青森県", net: -4542 },
  { code: "21", name: "岐阜県", net: -4528 },
  { code: "06", name: "山形県", net: -4281 },
  { code: "03", name: "岩手県", net: -3967 },
  { code: "05", name: "秋田県", net: -3836 },
  { code: "26", name: "京都府", net: -3753 },
  { code: "18", name: "福井県", net: -3157 },
  { code: "45", name: "宮崎県", net: -3024 },
  { code: "44", name: "大分県", net: -2972 },
  { code: "39", name: "高知県", net: -2917 },
  { code: "30", name: "和歌山県", net: -2813 },
  { code: "17", name: "石川県", net: -2774 },
  { code: "36", name: "徳島県", net: -2447 },
  { code: "43", name: "熊本県", net: -2333 },
  { code: "16", name: "富山県", net: -2324 },
  { code: "37", name: "香川県", net: -2238 },
  { code: "23", name: "愛知県", net: -2181 },
  { code: "28", name: "兵庫県", net: -2102 },
  { code: "04", name: "宮城県", net: -2046 },
  { code: "31", name: "鳥取県", net: -2028 },
  { code: "09", name: "栃木県", net: -2011 },
  { code: "32", name: "島根県", net: -1721 },
  { code: "10", name: "群馬県", net: -1516 },
  { code: "20", name: "長野県", net: -1415 },
  { code: "41", name: "佐賀県", net: -1151 },
  { code: "29", name: "奈良県", net: -1070 },
  { code: "19", name: "山梨県", net: -862 },
  { code: "47", name: "沖縄県", net: -559 },
  { code: "25", name: "滋賀県", net: 353 },
  { code: "40", name: "福岡県", net: 5136 },
  { code: "12", name: "千葉県", net: 7836 },
  { code: "27", name: "大阪府", net: 15667 },
  { code: "11", name: "埼玉県", net: 22427 },
  { code: "14", name: "神奈川県", net: 28052 },
  { code: "13", name: "東京都", net: 65219 },
];
