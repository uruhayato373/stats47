// 管理画面の共通部品 (shadcn/ui の部品を管理画面の形に束ねたもの)。ページはここと components/ui/* から組み立てる。
// 使い分け: 表だけの画面は TableFrame を直に置く / 見出し行つきの一覧は DataTable / 区画が並ぶ画面は PanelCard / 数値タイルは StatCard / 状態は StatusBadge。契約: .claude/rules/admin-ui.md
export { EmptyRow, numCol, TableBody, TableCell, TableFrame, TableHead, TableHeader, TableRow } from "./table-frame";
export { PanelCard } from "./panel-card";
export { StatusBadge, type Tone } from "./status-badge";
export { Cell, DataTable, Row } from "./data-table";
export { StatCard, type StatTone } from "./stat-card";
export { LinkCard } from "./link-card";
