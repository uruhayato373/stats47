/**
 * リデザイン共通プリミティブ
 *
 * 2026-06-15 の全面ミニマル化で page-top ヒーロー（HeroShell / KpiGrid / KpiTile）は退役。
 * ページ見出しは `@/components/layout` の PageHeader に統一した。ここには本文内・サイドレール用の
 * 補助コンポーネントのみ残す。
 */

export {
  SectionEyebrow,
  InfeedAd,
  NativeAffiliateRow,
  DataPackCTA,
  CategoryNav,
  WidePageShell,
  RightRailWidgets,
  NextUpGrid,
} from "./components";
