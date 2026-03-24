// Layouts
export { FullScreen } from "./components/layouts/FullScreen";
export { Landscape } from "./components/layouts/Landscape";
export { OgpSafeZone } from "./components/layouts/OgpSafeZone";
export { SafeZone } from "./components/layouts/SafeZone";

// Tables
export { RankingTable } from "./components/tables/RankingTable";
export { RankingTableSlide } from "./components/tables/RankingTableSlide";

// Maps
export { ChoroplethMapStill } from "./components/maps/ChoroplethMapStill";
export { ChoroplethMapSvg } from "./components/maps/ChoroplethMapSvg";
export { TileGridMapScene } from "./components/maps/TileGridMapScene";
export type { TileGridMapSceneProps } from "./components/maps/TileGridMapScene";
export { computeChoroplethPaths, computePrefectureSilhouette } from "./utils/choropleth";
export type {
    ChoroplethDataItem,
    ChoroplethOptions, ChoroplethPathInfo,
    PrefectureSilhouette
} from "./utils/choropleth";

// Charts
export { BarChartRaceScene } from "./components/charts";
export type { BarChartRaceSceneProps } from "./components/charts/BarChartRaceScene";

// CTA
export { CTASlide } from "./components/cta/CTASlide";
export { ReelLastPage } from "./components/cta/ReelLastPage";

// Utils
export { SafetyZoneOverlay } from "./components/utils/SafetyZoneOverlay";
export { resolveRankingData, type ResolvedRankingData } from "./utils/mock-data";
export { toBarChartRaceFrames, interpolateRaceFrame } from "./utils/bar-chart-race";
export type { InterpolatedBarItem, EventLabel } from "./utils/bar-chart-race";

// Themes
export {
    BRAND,
    CANVAS,
    COLOR_SCHEMES,
    FONT,
    RADIUS,
    RANK_COLORS,
    SPACING,
    type CanvasPreset,
    type ColorScheme,
    type ThemeName
} from "./themes/brand";

// Shorts
export { RankCard } from "./components/shorts/RankCard";
export { RankingShort, getShortTimeline } from "./components/shorts/RankingShort";
export type { RankingShortProps } from "./components/shorts/RankingShort";
export { RankingTitle } from "./components/shorts/RankingTitle";
export { BarChartRaceShort, getBarChartRaceTimeline } from "./components/shorts/BarChartRaceShort";
export type { BarChartRaceShortProps } from "./components/shorts/BarChartRaceShort";

// Types
export type {
    RankingEntry,
    RankingInput,
    RankingMeta
} from "./types/ranking";

export type { ComparisonIndicator } from "./types/comparison";
export type { AreaProfileIndicator } from "./types/area-profile";
