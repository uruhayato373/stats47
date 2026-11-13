/**
 * 国土数値情報の属性の原典台帳の読み込み口。
 *
 * 記録の正本は台帳 `geo.ksj-attributes` (data/geo/attributes/<dataId>.json + Schema)。地物の種類 (原典のファイル名の語幹)
 * ごとに、属性の公式の名前・意味・型と、読む側が引く役割 (role) を持つ。読む側 (交通網の変遷・接合部の生成など) は
 * 属性名を書かず、ここから役割で引く。区分のまとめ方と色は区分の台帳 `geo.ksj-classifications` が正本で、
 * 属性はそのコード表を `codeTable` で指すだけ。ここは型を付けて引く関数を足すだけで、記録を持たない。
 * 台帳のファイルを足したら、下の import と一覧に足す (足し漏れは `__tests__/attributes.test.ts` が止める)。
 */
import N02 from "../../../../data/geo/attributes/N02.json";
import N05 from "../../../../data/geo/attributes/N05.json";
import N06 from "../../../../data/geo/attributes/N06.json";
import N08 from "../../../../data/geo/attributes/N08.json";
import type { PrefectureSource } from "./prefecture-assign";

export type KsjAttributeRole =
  | "name"
  | "startYear"
  | "endYear"
  | "category"
  | "relation"
  | "prefecture"
  | "identifier"
  | "measure"
  | "other";

/** 地物の種類ごとに 1 つまでの役割 (relation は relationKind ごとに 1 つまで) */
export const KSJ_UNIQUE_ROLES: readonly KsjAttributeRole[] = ["name", "startYear", "endYear", "prefecture"];

export interface KsjAttribute {
  /** 原典の属性名 (例: N06_008) */
  readonly name: string;
  /** 取り込みが付け替えて配る属性名 (property-map.ts)。付け替えないなら無い */
  readonly distributedName?: string;
  /** 公式の属性名 */
  readonly label: string;
  readonly role: KsjAttributeRole;
  readonly valueType: "code" | "string" | "integer" | "year" | "other";
  /** 公式の説明の要約。確かめていなければ "未確認" */
  readonly meaning: string;
  readonly codeList?: string;
  /** 区分の台帳のコード表のキー (role が category のときだけ) */
  readonly codeTable?: string;
  readonly relationKind?: "main" | "additional";
  readonly prefectureKind?: PrefectureSource["kind"];
  readonly unit?: string;
}

export interface KsjFeatureType {
  /** 原典のファイル名の語幹 (例: HighwaySection)。ZIP 内の <dataId>-<版>_<key>.geojson に当たる */
  readonly key: string;
  /** 公式の地物名 */
  readonly label: string;
  readonly attributes: readonly KsjAttribute[];
}

export interface KsjAttributeLedger {
  readonly dataId: string;
  readonly reference: {
    readonly pageUrl: string;
    readonly specification: string;
    readonly dataVersion: string;
    readonly checkedAt: string;
    readonly checkedScope: string;
  };
  readonly featureTypes: readonly KsjFeatureType[];
}

const LEDGERS = [N02, N05, N06, N08] as unknown as readonly KsjAttributeLedger[];

/** dataId → 属性の台帳 */
export const KSJ_ATTRIBUTE_LEDGERS: ReadonlyMap<string, KsjAttributeLedger> = new Map(
  LEDGERS.map((ledger) => [ledger.dataId, ledger]),
);

export function findKsjFeatureType(dataId: string, key: string): KsjFeatureType | null {
  return KSJ_ATTRIBUTE_LEDGERS.get(dataId)?.featureTypes.find((featureType) => featureType.key === key) ?? null;
}

/** ZIP 内のファイル (例: UTF-8/N08-21_Airport.geojson) が当たる地物の種類。語幹が台帳に無ければ null */
export function findKsjFeatureTypeForEntry(dataId: string, entry: string): KsjFeatureType | null {
  const stem = /_([A-Za-z][A-Za-z0-9]*)\.geojson$/.exec(entry)?.[1];
  return stem ? findKsjFeatureType(dataId, stem) : null;
}

/** 配るファイルでの属性名 (付け替えがあればその名前) */
export function ksjPropertyName(attribute: KsjAttribute): string {
  return attribute.distributedName ?? attribute.name;
}

/**
 * 役割で属性を 1 つ引く。無ければ null。同じ役割が 2 つ以上あって 1 つに決まらなければ止める
 * (推測で片方を選ばない)。relation は relationKind で絞る
 */
export function ksjAttributeByRole(
  featureType: KsjFeatureType,
  role: KsjAttributeRole,
  options: { readonly relationKind?: "main" | "additional" } = {},
): KsjAttribute | null {
  const matches = featureType.attributes.filter(
    (attribute) =>
      attribute.role === role && (options.relationKind === undefined || attribute.relationKind === options.relationKind),
  );
  if (matches.length > 1) {
    throw new Error(`${featureType.key} に役割 ${role} の属性が ${matches.length} 個あり、1 つに決まりません`);
  }
  return matches[0] ?? null;
}

/** 役割で属性を 1 つ引く。無ければ止める */
export function requireKsjAttributeByRole(
  featureType: KsjFeatureType,
  role: KsjAttributeRole,
  options: { readonly relationKind?: "main" | "additional" } = {},
): KsjAttribute {
  const attribute = ksjAttributeByRole(featureType, role, options);
  if (!attribute) throw new Error(`${featureType.key} に役割 ${role} の属性がありません`);
  return attribute;
}

/** 役割 prefecture の属性から、県の帰属の宣言 (prefecture-assign.ts の 1 段目) を作る。無ければ null */
export function ksjPrefectureSource(featureType: KsjFeatureType): PrefectureSource | null {
  const attribute = ksjAttributeByRole(featureType, "prefecture");
  if (!attribute?.prefectureKind) return null;
  return { kind: attribute.prefectureKind, field: ksjPropertyName(attribute) };
}
