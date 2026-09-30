// 管理画面の共通部品 (shadcn/ui の部品を管理画面の形に束ねたもの)。ページはここと components/ui/* から組み立てる。
// 使い分け: 表だけの画面は TableFrame を直に置く / 区画が並ぶ画面は PanelCard / 状態は StatusBadge。契約: .claude/rules/admin-ui.md
export { EmptyRow, numCol, TableBody, TableCell, TableFrame, TableHead, TableHeader, TableRow } from "./table-frame";
export { PanelCard } from "./panel-card";
export { StatusBadge, type Tone } from "./status-badge";
