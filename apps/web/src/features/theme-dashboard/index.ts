/**
 * theme-dashboard の client-safe な公開 API。
 *
 * feature の barrel 規約は `index.ts` = client-safe / `server.ts` = server-only の 2 枚構成
 * (ads / blog / ranking などと同じ)。`server.ts` は `import "server-only"` を持つため、
 * 他 feature の client component からは必ずこちらを経由する。
 *
 * ここから公開するのは、テーマページに埋め込まれる section (migration-flow / commute-flow) が
 * 「ページで選択中の都道府県」に追従するために要るものだけ。
 */
export {
  useThemePrefecture,
  ThemePrefectureProvider,
} from "./components/ThemePrefectureContext";

export {
  useFlowFocusPrefecture,
  resolveFlowFocus,
  toFlowCode,
  DEFAULT_FLOW_FOCUS,
} from "./lib/useFlowFocusPrefecture";
export type {
  FlowFocusPrefecture,
  ManualFocus,
} from "./lib/useFlowFocusPrefecture";
