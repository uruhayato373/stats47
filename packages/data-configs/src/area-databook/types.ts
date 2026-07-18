/**
 * AreaDatabook — area ページ (`/areas/[code]`) の「県データブック」統合 SSOT 型
 *
 * 規約の正典: `.claude/rules/area-databook-standards.md`
 *
 * 47 県共通のセクション構成 (どの指標を・どのブロックで・どの順に見せるか) を
 * `template.ts` の 1 本で持ち、県ごとに変わる編集コンテンツ (特産品・県シンボル) は
 * `editorial/<code>.ts` に分離する。数値はすべて rankingKey 参照で県非依存。
 *
 * 生成物 (手編集禁止):
 *   - page-components JSON (`apps/web/scripts/data/page-components/area/<code>.json`)
 *     … chart ブロックのみを既存 PageComponent 行形式で出力 (R2 verbatim export 用)
 *
 * chart 以外のブロック (ranked-kpi-grid / gender-paired-kpi / agri-top10 /
 * specialty-list / symbol-card) は page-components を経由せず、app が template を
 * 直接 import + R2 `app/areas/<code>/databook.json` (exporter 焼き込み) で描画する。
 *
 * generator: `packages/data-configs/scripts/generate-area-databook.ts`
 * validator: `packages/data-configs/scripts/validate-area-databook.ts`
 */
import type { MetricSelection } from "../theme-catalog/types";

/**
 * area ページの chart ブロックで有効な componentType の文字列 union。
 *
 * area 系は stat-charts の `DashboardComponentRenderer`
 * (`apps/web/src/components/stat-charts/components/DashboardComponentRenderer.tsx`)
 * で描画される (テーマの ThemeDbChartRenderer とは別 renderer・別型集合)。
 * ここは area データブックとして許可する型のみに絞る (47 県横並び系は置かない)。
 */
export const AREA_DATABOOK_CHART_TYPES = [
  "stacked-area",
  "line-chart",
  "bar-chart",
  "mixed-chart",
  "composition-chart",
  "radar-chart",
  "sunburst",
  "stats-table",
] as const;

export type AreaDatabookChartType = (typeof AREA_DATABOOK_CHART_TYPES)[number];

/** データブックのセクション種別 (書籍「都道府県 Data Book」の章立てに対応)。 */
export const DATABOOK_SECTION_KINDS = [
  "symbols", // 県シンボル (木/花/鳥など)
  "specialties", // 特産品 (editorial)
  "agriculture", // 農業生産 (産出額内訳・上位品目)
  "food", // 県の食 (耕地/コメ/畜産/漁獲/自給率など)
  "civic-population", // 県民力: 人口
  "civic-living", // 県民力: 暮らし
  "civic-economy", // 県民力: 経済・労働
  "civic-industry", // 県民力: 産業
  "household", // 世帯
  "climate", // 気候
  "gender", // 男女
  "land-price", // 地価
  "tourism", // 旅行者
  "education-facility", // 学校・施設
  "consumption", // 消費 (家計調査・県庁所在市)
] as const;

export type DatabookSectionKind = (typeof DATABOOK_SECTION_KINDS)[number];

/** ranked-kpi-grid 内の 1 指標参照。値と全国順位は R2 databook.json (exporter 焼き込み) から解決する。 */
export interface DatabookMetricRef {
  /** METRICS_REGISTRY のキー (validator が実在照合) */
  rankingKey: string;
  /** KPI カードの短縮ラベル */
  shortLabel: string;
  /** 全国平均を併記する (所得・物価など水準対比が意味を持つ指標のみ) */
  compareNationalAvg?: boolean;
  /** 県庁所在市の値 (家計調査系)。UI が「※県庁所在市の値」注記を自動付与する */
  capitalCityValue?: boolean;
  /** 選定根拠 (theme-catalog と同型)。新規追加指標では記入する (validator warn) */
  selection?: MetricSelection;
}

/** gender-paired-kpi の 1 組 (男女の metric を左右対比)。 */
export interface DatabookGenderPair {
  /** 対比ラベル (例: "初婚年齢") */
  label: string;
  /** 男性側の rankingKey (validator が実在照合) */
  maleKey: string;
  /** 女性側の rankingKey (validator が実在照合) */
  femaleKey: string;
}

/**
 * chart ブロックの 1 チャート。generator が page-components の PageComponent 1 行に変換する。
 * `section` は持たない (親 DatabookSection.title を generator が付与する)。
 */
export interface DatabookChart {
  /** 一意キー (テンプレ内で重複禁止。既存慣例: `area-ov-*`) */
  componentKey: string;
  componentType: AreaDatabookChartType;
  title: string;
  /** チャート固有 props (estatParams 等)。型は app 層 DashboardConfigMap で担保。 */
  componentProps: Record<string, unknown>;
  /** このチャートが扱う指標の rankingKey (validator の実在照合用・JSON には出力しない) */
  relatedRankingKeys?: string[];
  sourceName?: string | null;
  sourceLink?: string | null;
  rankingLink?: string | null;
  gridColumnSpan?: number;
  gridColumnSpanTablet?: number | null;
  gridColumnSpanSm?: number | null;
  dataSource?: string | null;
  sortOrder: number;
}

/** セクションを構成するブロック (縦に積む描画単位)。 */
export type DatabookBlock =
  | {
      blockType: "ranked-kpi-grid";
      /** テンプレ内一意 (アンカー・計測用) */
      blockKey: string;
      metrics: DatabookMetricRef[];
      /** PC 幅での列数 (既定 3) */
      columns?: 2 | 3 | 4;
    }
  | {
      blockType: "gender-paired-kpi";
      blockKey: string;
      pairs: DatabookGenderPair[];
    }
  | { blockType: "chart"; chart: DatabookChart }
  | {
      /** 農業産出額 上位品目 (databook.json の agriTop10 を描画) */
      blockType: "agri-top10";
      blockKey: string;
    }
  | {
      /** 特産品リスト (editorial/<code>.ts を描画) */
      blockType: "specialty-list";
      blockKey: string;
    }
  | {
      /** 県シンボルカード (editorial/<code>.ts の symbols を描画) */
      blockType: "symbol-card";
      blockKey: string;
    };

/** データブックの 1 セクション (ページ内目次の 1 項目)。 */
export interface DatabookSection {
  /** アンカー id (英小文字 kebab-case、テンプレ内一意) */
  sectionKey: string;
  kind: DatabookSectionKind;
  /** 表示見出し。chart ブロックの page-components `section` 値にもなる */
  title: string;
  /** 見出し下の 1 行説明 (任意) */
  description?: string;
  blocks: DatabookBlock[];
  sortOrder: number;
}

/** 47 県共通のデータブックテンプレート (単一 SSOT)。 */
export interface AreaDatabookTemplate {
  sections: DatabookSection[];
}

/* ------------------------------------------------------------------ */
/* editorial (県別・人手 authored)                                      */
/* ------------------------------------------------------------------ */

/** 県シンボル。値は県公式サイト等で裏取りし出典を付ける。 */
export interface PrefSymbols {
  tree: string;
  flower: string;
  bird: string;
  fish?: string;
  animal?: string;
  song?: string;
  /** 裏取りした出典 URL (県公式ページ) */
  sourceUrl: string;
  /** アクセス日 (ISO date) */
  accessedAt: string;
}

/**
 * 特産品 1 品。品名・産地は事実、解説は独自の書き起こし (書籍文言の複製禁止)。
 * 規約: `.claude/rules/area-databook-standards.md`
 */
export interface PrefSpecialty {
  /** 英小文字 kebab-case (R2 イラスト asset キー: `app/areas/<code>/specialty/<slug>.webp`) */
  slug: string;
  name: string;
  /** 主産地 (市町村名。県内広域なら「県内広域」) */
  municipality: string;
  /** 独自解説 60〜160 字 (validator error)。出典に基づき書き起こす */
  description: string;
  /** 解説の根拠 URL (県公式 / 市町村 / JA 等の一次情報) */
  sourceUrl: string;
  /** アクセス日 (ISO date) */
  accessedAt: string;
}

/** 県別の編集コンテンツ (area-curator が単一オーナー)。 */
export interface AreaEditorial {
  /** 5 桁県コード ("01000"〜"47000") */
  areaCode: string;
  symbols: PrefSymbols;
  /** 5〜9 件 (validator error) */
  specialties: PrefSpecialty[];
}
