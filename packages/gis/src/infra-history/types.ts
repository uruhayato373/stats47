/**
 * 交通網の変遷 (高速道路・鉄道の時系列 GIS) の型。
 *
 * 台帳 (`networks.ts`) が「どの原典を・どの条件で・どこまで公開してよいか」を持ち、
 * 生成スクリプトが原典から R2 artifact (`app/geo/history/<network>/...`) を作る。
 * Web は artifact を `parse.ts` の厳格 parser で読む。
 */

/** URL と R2 key に使う路線網の slug */
export type InfraNetworkKey = "expressway" | "railway";

/** 表示範囲。全国 / 7 地方 (`@stats47/area` の REGIONS) / 都道府県 (2 桁) */
export type InfraHistoryScope =
  | { readonly kind: "national" }
  | { readonly kind: "region"; readonly regionCode: string }
  | { readonly kind: "prefecture"; readonly prefCode: string };

/**
 * 原典の利用条件。国土数値情報は同じデータでも使い方で条件が変わる
 * (N06 は「最新年の現況」なら CC BY 4.0、「時系列」なら非商用)。
 * ここには**このページの使い方**に適用される条件を書く。
 */
export interface InfraSourceTerms {
  /** このページでの使い方 */
  readonly usage: "time-series";
  readonly terms: "non-commercial" | "cc-by-4.0";
  /** 公式ページで確認した日 (YYYY-MM-DD) */
  readonly verifiedAt: string;
  /** 公式ページの該当文言 (短い引用) */
  readonly evidence: string;
}

/**
 * 公開の状態。非商用データは書面確認が取れるまで `local-only` に留め、
 * R2 公開 (`assertKsjPublicKeysAllowed`) とサイトマップ掲載を止める。
 */
export interface InfraPublication {
  readonly status: "local-only" | "public-approved";
  /** 広告・アフィリエイトの扱い。非商用データのページは常に none */
  readonly adPolicy: "none";
  /** 事務局の書面回答など、公開を許す根拠 (status=public-approved で必須) */
  readonly permissionEvidence: string | null;
  /** local-only の理由 */
  readonly blockedReason: string | null;
}

export interface InfraSource {
  readonly dataId: "N05" | "N06";
  /** 国土数値情報の版 (2 桁) */
  readonly version: string;
  readonly name: string;
  readonly provider: string;
  readonly pageUrl: string;
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
  /** 関係備考 (主たる関係 ID 以外の関係 ID。"+" 区切り) */
  readonly relationNote: string;
}

export interface InfraCategory {
  /** 原典のコード値 */
  readonly code: string;
  readonly label: string;
  /** 地図の線色。`--color-chart-N` は Tailwind v4 が使われない限り出力しないので、トークン `--chart-N` を hsl() で包む */
  readonly color: string;
}

export interface InfraNetworkDefinition {
  readonly key: InfraNetworkKey;
  readonly label: string;
  /** ページの問い (見出し) */
  readonly question: string;
  readonly description: string;
  readonly source: InfraSource;
  readonly terms: InfraSourceTerms;
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
  readonly source: InfraSource;
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
    readonly segments: number;
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
