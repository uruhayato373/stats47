---
name: テーマダッシュボード強化完了
description: 全15テーマの panelTabs + チャート + SEO 最適化の実施状況と optimize-themes スキル
type: project
---

テーマダッシュボード強化を完了（2026-03-27）。

**実施内容:**
- 全15テーマに panelTabs を定義済み
- 全テーマにチャートをセクション配置済み（合計46件、全て ThemeDbChartRenderer 対応タイプ）
- 非対応タイプ（ranking-chart 8件, kpi-card 34件）を削除・変換
- デスクトップ pageCharts 渡し漏れバグ修正（ThemeDashboardTabbed.tsx）
- PV 上位3テーマの description を SEO 最適化

**チャート数:**
aging-society:6, occupation-salary:5, population-dynamics:5, safety:4, consumer-prices:3, foreign-residents:3, healthcare:3, labor-wages:3, education-culture:2, labor-mobility:2, living-housing:2, local-economy:3, manufacturing:2, real-income:2, tourism:2

**エージェント・スキル:**
- `.claude/agents/theme-enhancer.md` — 4スキル担当
- `/optimize-themes` — GSC/GA4 + 競合調査 + ギャップ分析で優先度付きアクション出力
- `/audit-theme-components` — page_components vs IndicatorSet のギャップ分析
- `/design-theme-charts` — チャート設計（componentProps JSON 生成）
- `/insert-theme-components` — DB 投入

**Why:** テーマページのチャートが safety 以外ほぼ空だった。ranking-chart/kpi-card がテーマページ非対応だった。

**How to apply:** 定期的に `/optimize-themes --all` でデータ駆動の改善サイクルを回す。新テーマ追加時は theme-designer → theme-enhancer の連携で。
