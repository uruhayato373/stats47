/**
 * 47 都道府県マスタ (Reference)。地図・データは**都道府県コードで結合**し、名称文字列をキーにしない。
 * データは @stats47/area (packages/area/src/data/prefectures.json) 由来。product-factory は tsx で単体実行するため、
 * `@stats47/*` パスエイリアスを実行時に解決できない → 静的 Reference として本ファイルに埋め込む (再生成可能)。
 */
export type RegionCode =
  | "hokkaido_tohoku"
  | "kanto"
  | "chubu"
  | "kinki"
  | "chugoku"
  | "shikoku"
  | "kyushu";

export interface Prefecture {
  /** 5 桁コード (estat-api.md 準拠。例 "01000")。 */
  readonly code5: string;
  /** 2 桁コード (topojson N03_007 と一致。例 "01")。 */
  readonly code2: string;
  readonly name: string;
  readonly region: RegionCode;
}

export interface RegionDef {
  readonly code: RegionCode;
  readonly name: string;
  readonly color: string;
  readonly prefCodes5: readonly string[];
}

/** 地方ブロック (A-04 地方ブロック別地図の色分け根拠)。 */
export const REGIONS: readonly RegionDef[] = [
  { code: "hokkaido_tohoku", name: "北海道・東北", color: "#3b82f6", prefCodes5: ["01000", "02000", "03000", "04000", "05000", "06000", "07000"] },
  { code: "kanto", name: "関東", color: "#10b981", prefCodes5: ["08000", "09000", "10000", "11000", "12000", "13000", "14000"] },
  { code: "chubu", name: "中部", color: "#6366f1", prefCodes5: ["15000", "16000", "17000", "18000", "19000", "20000", "21000", "22000", "23000"] },
  { code: "kinki", name: "近畿", color: "#f59e0b", prefCodes5: ["24000", "25000", "26000", "27000", "28000", "29000", "30000"] },
  { code: "chugoku", name: "中国", color: "#ef4444", prefCodes5: ["31000", "32000", "33000", "34000", "35000"] },
  { code: "shikoku", name: "四国", color: "#06b6d4", prefCodes5: ["36000", "37000", "38000", "39000"] },
  { code: "kyushu", name: "九州・沖縄", color: "#a855f7", prefCodes5: ["40000", "41000", "42000", "43000", "44000", "45000", "46000", "47000"] },
];

const RAW: readonly (readonly [string, string])[] = [
  ["01", "北海道"], ["02", "青森県"], ["03", "岩手県"], ["04", "宮城県"], ["05", "秋田県"],
  ["06", "山形県"], ["07", "福島県"], ["08", "茨城県"], ["09", "栃木県"], ["10", "群馬県"],
  ["11", "埼玉県"], ["12", "千葉県"], ["13", "東京都"], ["14", "神奈川県"], ["15", "新潟県"],
  ["16", "富山県"], ["17", "石川県"], ["18", "福井県"], ["19", "山梨県"], ["20", "長野県"],
  ["21", "岐阜県"], ["22", "静岡県"], ["23", "愛知県"], ["24", "三重県"], ["25", "滋賀県"],
  ["26", "京都府"], ["27", "大阪府"], ["28", "兵庫県"], ["29", "奈良県"], ["30", "和歌山県"],
  ["31", "鳥取県"], ["32", "島根県"], ["33", "岡山県"], ["34", "広島県"], ["35", "山口県"],
  ["36", "徳島県"], ["37", "香川県"], ["38", "愛媛県"], ["39", "高知県"], ["40", "福岡県"],
  ["41", "佐賀県"], ["42", "長崎県"], ["43", "熊本県"], ["44", "大分県"], ["45", "宮崎県"],
  ["46", "鹿児島県"], ["47", "沖縄県"],
];

function regionOf(code2: string): RegionCode {
  const n = Number(code2);
  if (n <= 7) return "hokkaido_tohoku";
  if (n <= 14) return "kanto";
  if (n <= 23) return "chubu";
  if (n <= 30) return "kinki";
  if (n <= 35) return "chugoku";
  if (n <= 39) return "shikoku";
  return "kyushu";
}

export const PREFECTURES: readonly Prefecture[] = RAW.map(([code2, name]) => ({
  code2,
  code5: `${code2}000`,
  name,
  region: regionOf(code2),
}));

/** 47 県の 5 桁コード (昇順)。データ整合検証の基準集合。 */
export const PREFECTURE_CODES5: readonly string[] = PREFECTURES.map((p) => p.code5);

export const PREFECTURE_BY_CODE5: ReadonlyMap<string, Prefecture> = new Map(
  PREFECTURES.map((p) => [p.code5, p]),
);

/** 任意のコード表記 ("1" / "01" / "01000") を 5 桁へ正規化する。範囲外は throw。 */
export function toCode5(input: string | number): string {
  const s = String(input).trim();
  if (/^\d{5}$/.test(s)) {
    if (!PREFECTURE_BY_CODE5.has(s)) throw new Error(`未知の都道府県コード: ${input}`);
    return s;
  }
  const n = Number.parseInt(s, 10);
  if (!Number.isFinite(n) || n < 1 || n > 47) throw new Error(`都道府県コードが不正: ${input}`);
  return `${String(n).padStart(2, "0")}000`;
}

/** 任意のコード表記を 2 桁 (topojson N03_007) へ正規化する。 */
export function toCode2(input: string | number): string {
  return toCode5(input).slice(0, 2);
}
