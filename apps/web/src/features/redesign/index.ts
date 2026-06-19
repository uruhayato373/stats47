/**
 * リデザイン共通プリミティブ
 *
 * 2026-06-15 の全面ミニマル化で page-top ヒーロー（HeroShell / KpiGrid / KpiTile）は退役し、
 * 未使用化していた DataPackCTA / WidePageShell（PageShell エイリアス）/ NextUpGrid（home preview）も削除した。
 * ページ見出しは `@/components/layout` の PageHeader、横幅は同 PageShell に統一。
 * ここには本文内・サイドレール用の補助コンポーネントのみ残す。
 */

export {
  SectionEyebrow,
  InfeedAd,
  NativeAffiliateRow,
  RightRailWidgets,
} from "./components";
