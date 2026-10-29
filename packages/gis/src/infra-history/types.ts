/**
 * 交通網の変遷 (高速道路・鉄道の時系列 GIS) の型。
 *
 * 台帳 (`networks.ts`) が「どの原典を・どの条件で・どこまで公開してよいか」を持ち、
 * 生成スクリプトが原典から R2 artifact (`app/geo/history/<network>/...`) を作る。
 * Web は artifact を `parse.ts` の厳格 parser で読む。
 */

import type { GisDatasetUsage, GisDatasetUsageTerms, KsjDataId } from "../mlit-ksj/datasets";
import type { KsjAttributeClass } from "../mlit-ksj/classifications";
import type { PrefectureSource } from "../mlit-ksj/prefecture-assign";

/** URL と R2 key に使う路線網の slug */
export type InfraNetworkKey = "expressway" | "railway" | "airport";

/**
 * 地図の描き方と集計の単位。
 * line = 区間の線を県境で分けて延長 (km) を集計する (高速道路・鉄道)
 * point = 施設の位置を点で描き、関係 ID (同じ施設) の数を集計する (空港)
 */
export type InfraGeometry = "line" | "point";

/** 集計値の名前と単位 (線は延長 km、点は施設数) */
export interface InfraMeasure {
  /** 「延長」「空港数」 */
  readonly label: string;
  /** 「km」「か所」 */
  readonly unit: string;
}

/** 表示範囲。全国 / 7 地方 (`@stats47/area` の REGIONS) / 都道府県 (2 桁) */
export type InfraHistoryScope =
  | { readonly kind: "national" }
  | { readonly kind: "region"; readonly regionCode: string }
  | { readonly kind: "prefecture"; readonly prefCode: string };

/**
 * このページの使い方に適用される原典の利用条件。台帳には書かず、GIS 台帳 (`datasets.ts`) の
 * `usageTerms` から `infraNetworkTerms` で引く (利用条件の判断を 1 か所に保つ)。manifest には生成時の写しを残す。
 */
export type InfraSourceTerms = GisDatasetUsageTerms & { readonly usage: GisDatasetUsage };

/**
 * 公開の状態。非商用データは書面確認が取れるまで `local-only` に留め、
 * R2 公開 (`assertKsjPublicKeysAllowed`) とサイトマップ掲載を止める。
 * 広告の有無はここに書かず、GIS 台帳の使い方ごとの利用条件から決める (`isInfraNetworkAdFree`)。
 */
/** 了承を得た使い方。公開 (R2 反映・検索掲載) には ad-free-page と processed-data-delivery の両方が要る */
export type InfraPermissionScope =
  /** 広告・アフィリエイトのないページでの表示 */
  | "ad-free-page"
  /** 加工した線・点データを閲覧者のブラウザへ配る */
  | "processed-data-delivery"
  /** 同じデータから作った画像・動画の SNS 投稿 */
  | "sns"
  /** 広告のあるページ (ブログ・テーマ) での表示 */
  | "ad-page";

/**
 * 公開を許す根拠。電話でも認めるが、あとから誰でも範囲を確かめられるよう、
 * 日付・相手・了承の範囲・要旨を必ず記録する (2026-10-29 オーナー決定。それ以前は書面のみ)
 */
export interface InfraPermissionEvidence {
  /** official-terms: 公式ページの利用条件そのもの / written: メール・書面 / phone: 電話 */
  readonly method: "official-terms" | "written" | "phone";
  /** 確認した日 (YYYY-MM-DD) */
  readonly date: string;
  /** 相手 (部署・担当者)。official-terms は確認したページの URL */
  readonly counterpart: string;
  readonly scope: readonly InfraPermissionScope[];
  /** 了承の内容の要旨 (相手の言葉に近い形で) */
  readonly summary: string;
  /** 記録した人 */
  readonly recordedBy: string;
}

/** 公開に要る了承の範囲 */
export const INFRA_PUBLICATION_REQUIRED_SCOPES: readonly InfraPermissionScope[] = ["ad-free-page", "processed-data-delivery"];

export interface InfraPublication {
  readonly status: "local-only" | "public-approved";
  /** 公開を許す根拠 (status=public-approved で必須。範囲に INFRA_PUBLICATION_REQUIRED_SCOPES を含む) */
  readonly permissionEvidence: InfraPermissionEvidence | null;
  /** local-only の理由 */
  readonly blockedReason: string | null;
}

export interface InfraSource {
  /** GIS 台帳の dataId。公式ページの URL と利用条件は台帳から引く */
  readonly dataId: KsjDataId;
  /** 国土数値情報の版 (2 桁)。GIS 台帳の latestVersion とは別に、この集計に使った版 */
  readonly version: string;
  readonly name: string;
  readonly provider: string;
  readonly archiveUrl: string;
  readonly archiveSha256: string;
  readonly archiveBytes: number;
  /** ZIP 内で使う GeoJSON */
  readonly entry: string;
  /** 実際にダウンロードした日時 (ISO 8601) */
  readonly retrievedAt: string;
}

/** 原典の属性名 */
export interface InfraAttributeMap {
  /** 設置期間の開始年 */
  readonly start: string;
  /** 設置期間の終了年 (廃止・変更の 1 年前。継続中は 9999) */
  readonly end: string;
  readonly name: string;
  readonly category: string;
  /** 関係 ID (同じ区間の記録をつなぐ ID) */
  readonly relation: string;
  /** 関係備考 (主たる関係 ID 以外の関係 ID。"+" 区切り)。原典に無ければ省略 */
  readonly relationNote?: string;
  /**
   * 県を属性から決めるときの宣言 (prefecture-assign.ts の 3 段の 1 段目)。省略時は位置から決める。
   * 空港は所在地の 5 桁市区町村コードを持つので、人工島の空港も海岸線の許容距離に頼らず県が決まる
   */
  readonly prefectureSource?: PrefectureSource;
}

/** 表示の種別。区分の台帳 (`mlit-ksj/classifications.ts`) の区分をそのまま使う */
export type InfraCategory = KsjAttributeClass;

export interface InfraNetworkDefinition {
  readonly key: InfraNetworkKey;
  readonly label: string;
  /** ページの問い (見出し) */
  readonly question: string;
  readonly description: string;
  readonly source: InfraSource;
  /** このページの使い方。利用条件は GIS 台帳の `usageTerms[usage]` */
  readonly usage: GisDatasetUsage;
  readonly geometry: InfraGeometry;
  readonly measure: InfraMeasure;
  /** 同じものの現況を描く単体 GIS ページの dataId (`/geo/datasets/<dataId>`)。無ければ省略 */
  readonly currentDataId?: KsjDataId;
  readonly publication: InfraPublication;
  readonly attributes: InfraAttributeMap;
  readonly categories: readonly InfraCategory[];
  /** 年スライダーの範囲。first は原典の最小開始年 */
  readonly years: { readonly first: number; readonly last: number };
  /** 年の読み方の注意 (原典仕様に由来するもの) */
  readonly cautions: readonly string[];
}

// ─── 生成 artifact ────────────────────────────────────────────

/** 地図用 TopoJSON の 1 区間の属性 (キーを短くして容量を抑える) */
export interface InfraPieceProperties {
  /** 開始年 */
  readonly s: number;
  /** 終了年 (継続中は 9999) */
  readonly e: number;
  /** 種別コード */
  readonly c: string;
  /** 路線名 */
  readonly n: string;
}

/**
 * 地図で強調する開通・廃止の線 (TopoJSON の `events` オブジェクト) の属性。
 * 路線網の線 (`lines`) とは別に持ち、延長の集計には使わない。
 */
export interface InfraEventProperties {
  /** open=開通 / extend=延伸 / close=廃止 / shorten=短縮 */
  readonly k: "open" | "extend" | "close" | "shorten";
  /** 強調する年 (開通・延伸は開始年、廃止・短縮は無くなった年) */
  readonly y: number;
  readonly c: string;
  readonly n: string;
}

/** 年ごとの延長 (km)。`years[i]` に対応する配列 */
export interface InfraLengthSeries {
  readonly total: readonly number[];
  readonly byCategory: Readonly<Record<string, readonly number[]>>;
}

export interface InfraHistorySummary {
  readonly schemaVersion: 1;
  readonly network: InfraNetworkKey;
  readonly years: readonly number[];
  readonly national: InfraLengthSeries;
  /** 2 桁県コード → 系列。県境で区間を分割して計上する */
  readonly prefectures: Readonly<Record<string, InfraLengthSeries>>;
  /** regionCode → 系列 (県の合計) */
  readonly regions: Readonly<Record<string, InfraLengthSeries>>;
  /** どの県にも帰属できなかった延長 (海上の橋梁・トンネル等) */
  readonly unassigned: InfraLengthSeries;
}

export interface InfraArtifactRecord {
  readonly key: string;
  readonly bytes: number;
  readonly sha256: string;
  readonly features?: number;
}

export interface InfraHistoryManifest {
  readonly schemaVersion: 1;
  readonly network: InfraNetworkKey;
  readonly generatedAt: string;
  /** 生成時の出典 (公式ページの URL は GIS 台帳から写す) */
  readonly source: InfraSource & { readonly pageUrl: string };
  readonly terms: InfraSourceTerms;
  readonly publication: InfraPublication;
  /** 生成コード (core.ts + 生成スクリプト) の SHA-256 */
  readonly definitionSha256: string;
  readonly input: {
    readonly features: number;
    /** 原典の全区間を年ごとに合計した延長 (分割前) */
    readonly sourceLengthKmLastYear: number;
    /** 原典で年が「不明 (999)」のため時系列から外した記録 */
    readonly excludedUnknownYear: ReadonlyArray<{
      readonly sourceIndex: number;
      readonly name: string;
      readonly start: number | null;
      readonly end: number | null;
      readonly km: number;
    }>;
  };
  readonly assignment: {
    /** 県を判定した単位の数 (線は線分、点は記録) */
    readonly segments: number;
    /** 属性 (市区町村コード等) で決まった数。点の網だけ */
    readonly attribute: number;
    readonly polygon: number;
    readonly coastline: number;
    readonly unassigned: number;
    readonly coastlineToleranceKm: number;
  };
  /** 開通・延伸・廃止・短縮の件数と延長 (属性だけの変更は数えない) */
  readonly transitions: Readonly<Record<"open" | "extend" | "close" | "shorten", { readonly count: number; readonly km: number }>>;
  /** 保存則: 県の合計 + 未帰属 = 全国 = 原典 (全年) */
  readonly conservation: {
    readonly maxAbsDiffKm: number;
    readonly toleranceKm: number;
    readonly passed: boolean;
  };
  readonly outputs: readonly InfraArtifactRecord[];
}
