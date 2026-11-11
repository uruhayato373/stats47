/**
 * 国土数値情報の属性で地物を色分けする区分の読み込み口。
 *
 * 記録の正本は台帳 `geo.ksj-classifications` (data/geo/ksj/classifications.json + Schema)。
 * 交通網の変遷 (`infra-history/networks.ts`) と単体 GIS ページ (`/geo/datasets/<id>`) の地図・凡例が同じ定義を読み、
 * 同じものを同じ色・同じ名前で描く。区分の定義 (原典のコード → 表示の区分) はコード表ごとに 1 つだけ書き、
 * データごとに「どの属性で引くか」とコード表を持つ。ここはコード表を結んで型を付けるだけで、記録を持たない。
 */
import data from "../../../../data/geo/ksj/classifications.json";
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

/** 区分を持つデータの dataId (台帳のキー) */
export type KsjClassifiedDataId = keyof typeof data.classifications;

const CODE_TABLES = data.codeTables as Record<string, readonly KsjAttributeClass[]>;

/** dataId → 区分。同じコード表を指すデータ (鉄道の N05・N02) は同じ配列を共有する。並びは台帳のキーの順 */
export const KSJ_CLASSIFICATIONS: ReadonlyMap<string, KsjAttributeClassification> = new Map(
  Object.entries(data.classifications).map(([dataId, { field, label, codeTable }]) => {
    const classes = CODE_TABLES[codeTable];
    if (!classes) throw new Error(`区分の台帳の ${dataId} が指すコード表 ${codeTable} がありません`);
    return [dataId, { dataId: dataId as KsjDataId, field, label, classes }];
  }),
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
