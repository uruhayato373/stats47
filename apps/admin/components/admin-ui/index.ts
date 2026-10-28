// 管理画面の組み立て部品 (公開サイトと同じ @stats47/components の部品を管理画面の形に束ねたもの)。ページはここと @stats47/components から組み立てる。
// 使い分け (公式 dashboard-01 の並べ方): 数値タイルは StatCard (Section Cards) / 推移は TrendChart / 並べ替え・検索したい一覧は DataGrid (TanStack) /
// 行の少ない静的な表は DataTable / 区画が並ぶ画面は PanelCard / 状態は StatusBadge。契約: .claude/rules/admin-ui.md
export { bodyCell, EmptyRow, headCell, numCol, TableBody, TableCell, TableFrame, TableHead, TableHeader, TableRow } from "./table-frame";
export { PanelCard } from "./panel-card";
export { StatusBadge, type Tone } from "./status-badge";
export { Cell, DataTable, Row } from "./data-table";
export { StatCard, type StatTone, type StatTrend } from "./stat-card";
export { TrendChart, type TrendRow, type TrendSeries, type ValueFormat } from "./trend-chart";
export { DataGrid, type GridColumn, type GridRow } from "./data-grid";
export { LinkCard } from "./link-card";
