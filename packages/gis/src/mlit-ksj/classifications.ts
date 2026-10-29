/**
 * 国土数値情報の属性で地物を色分けする区分の台帳 (SSOT)。
 *
 * 交通網の変遷 (`infra-history/networks.ts`) と単体 GIS ページ (`/geo/datasets/<id>`) の地図・凡例が同じ定義を読み、
 * 同じものを同じ色・同じ名前で描く。区分の定義 (原典のコード → 表示の区分) はコード表ごとに 1 つだけ書き、
 * データごとに「どの属性で引くか」を持つ (鉄道は時系列 N05 と現況 N02 で属性名が違うがコード表は同じ)。
 */
import type { KsjDataId } from "./datasets";

/**
 * 地図・凡例の色。チャートのトークンだけを使う。
 * `--color-chart-N` は Tailwind v4 が使われない限り出力しないので、トークン `--chart-N` を hsl() で包む
 */
export type KsjClassColor =
  | "hsl(var(--chart-1))"
  | "hsl(var(--chart-2))"
  | "hsl(var(--chart-3))"
  | "hsl(var(--chart-4))"
  | "hsl(var(--chart-5))"
  | "hsl(var(--muted-foreground))";

/** 区分に入らない地物 (別の種類の地物・属性の欠け) の色 */
export const KSJ_UNCLASSIFIED_COLOR: KsjClassColor = "hsl(var(--muted-foreground))";

/** 凡例で「区分のない地物」を切り替えるときの key (区分コードと衝突しない) */
export const KSJ_UNCLASSIFIED_KEY = "__unclassified";

export interface KsjAttributeClass {
  /** 表示の区分コード (凡例・集計のキー) */
  readonly code: string;
  readonly label: string;
  /**
   * この区分にまとめる原典のコード値 (文字列で比較する)。原典の区分が制度改正で変わった
   * (空港法の第一種〜第三種 → 拠点・地方管理) ときに、時代をまたいで同じ色で追えるようにまとめる
   */
  readonly sourceCodes: readonly string[];
  readonly color: KsjClassColor;
}

export interface KsjAttributeClassification {
  readonly dataId: KsjDataId;
  /** 区分の値を持つ属性名 (原典の版で名前が変わったものは、その版の名前) */
  readonly field: string;
  /** 凡例の題 */
  readonly label: string;
  readonly classes: readonly KsjAttributeClass[];
}

/** 高速道路の道路種別 (N06 高速道路時系列データ) */
const EXPRESSWAY_ROAD_CLASSES = [
  { code: "1", label: "高速自動車国道", sourceCodes: ["1"], color: "hsl(var(--chart-3))" },
  { code: "2", label: "並行する自動車専用道路", sourceCodes: ["2"], color: "hsl(var(--chart-2))" },
  { code: "3", label: "一般国道の自動車専用道路", sourceCodes: ["3"], color: "hsl(var(--chart-4))" },
  { code: "4", label: "本州四国連絡高速道路", sourceCodes: ["4"], color: "hsl(var(--chart-1))" },
  { code: "5", label: "指定都市高速道路", sourceCodes: ["5"], color: "hsl(var(--muted-foreground))" },
  { code: "6", label: "その他の道路", sourceCodes: ["6"], color: "hsl(var(--muted-foreground))" },
] as const satisfies readonly KsjAttributeClass[];

/** 鉄道の事業者種別コード (N05 鉄道時系列・N02 鉄道で共通) */
const RAILWAY_OPERATOR_CLASSES = [
  { code: "1", label: "JR新幹線", sourceCodes: ["1"], color: "hsl(var(--chart-3))" },
  { code: "2", label: "JR在来線", sourceCodes: ["2"], color: "hsl(var(--chart-2))" },
  { code: "3", label: "公営鉄道", sourceCodes: ["3"], color: "hsl(var(--chart-4))" },
  { code: "4", label: "民営鉄道", sourceCodes: ["4"], color: "hsl(var(--chart-1))" },
  { code: "5", label: "第三セクター", sourceCodes: ["5"], color: "hsl(var(--muted-foreground))" },
] as const satisfies readonly KsjAttributeClass[];

/** 空港の種別 (N08 空港時系列データ)。2008年の空港法改正の前後の区分を近いものどうしでまとめる */
const AIRPORT_CLASSES = [
  { code: "hub", label: "拠点空港 (旧第一種・会社管理)", sourceCodes: ["1", "6"], color: "hsl(var(--chart-3))" },
  { code: "national", label: "国管理空港 (旧第二種・国管理)", sourceCodes: ["2", "7"], color: "hsl(var(--chart-2))" },
  { code: "local", label: "地方管理空港 (旧第三種・特定地方管理)", sourceCodes: ["3", "8", "9"], color: "hsl(var(--chart-4))" },
  { code: "other", label: "共用・その他の空港", sourceCodes: ["4", "5", "10", "11"], color: "hsl(var(--muted-foreground))" },
] as const satisfies readonly KsjAttributeClass[];

const KSJ_CLASSIFICATION_LIST = [
  { dataId: "N06", field: "N06_008", label: "道路の種別", classes: EXPRESSWAY_ROAD_CLASSES },
  { dataId: "N05", field: "N05_001", label: "事業者の種別", classes: RAILWAY_OPERATOR_CLASSES },
  { dataId: "N02", field: "serviceProviderType", label: "事業者の種別", classes: RAILWAY_OPERATOR_CLASSES },
  { dataId: "N08", field: "N08_002", label: "空港の種別", classes: AIRPORT_CLASSES },
] as const satisfies readonly KsjAttributeClassification[];

/** 区分を持つデータの dataId */
export type KsjClassifiedDataId = (typeof KSJ_CLASSIFICATION_LIST)[number]["dataId"];

export const KSJ_CLASSIFICATIONS: ReadonlyMap<string, KsjAttributeClassification> = new Map(
  KSJ_CLASSIFICATION_LIST.map((classification) => [classification.dataId, classification]),
);

/** 区分を持たないデータは null (地図は 1 色で描く) */
export function findKsjClassification(dataId: string): KsjAttributeClassification | null {
  return KSJ_CLASSIFICATIONS.get(dataId) ?? null;
}

/** 台帳にあると型で分かっているデータの区分 (交通網の台帳など、静的に参照するところ用) */
export function ksjClassification(dataId: KsjClassifiedDataId): KsjAttributeClassification {
  const classification = KSJ_CLASSIFICATIONS.get(dataId);
  if (!classification) throw new Error(`区分の台帳に ${dataId} がありません`);
  return classification;
}

/** 地物の属性から区分を引く。属性が無い・どの区分にも入らないときは null */
export function classifyKsjFeature(
  classification: KsjAttributeClassification,
  properties: Readonly<Record<string, unknown>> | null | undefined,
): KsjAttributeClass | null {
  const value = properties?.[classification.field];
  if (value === undefined || value === null || value === "") return null;
  const code = String(value);
  return classification.classes.find((item) => item.sourceCodes.includes(code)) ?? null;
}
