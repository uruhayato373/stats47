import { AffiliateItem } from "./AffiliateItem";
import { BlogBarChart } from "./charts/BlogBarChart";
import { BlogChoroplethMap } from "./charts/BlogChoroplethMap";
import { BlogLineChart } from "./charts/BlogLineChart";
import { BlogScatterPlot } from "./charts/BlogScatterPlot";
import { BlogStatsHighlight } from "./charts/BlogStatsHighlight";
import { BlogRankingTable } from "./tables/BlogRankingTable";

export const mdxComponents = {
  ChoroplethMap: BlogChoroplethMap,
  BarChart: BlogBarChart,
  LineChart: BlogLineChart,
  ScatterPlot: BlogScatterPlot,
  StatsHighlight: BlogStatsHighlight,
  AffiliateItem: AffiliateItem,
  RankingTable: BlogRankingTable,
};
