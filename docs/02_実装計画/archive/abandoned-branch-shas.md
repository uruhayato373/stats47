---
type: branch-archive
date: 2026-05-27
status: archived
tags: [branch-management, archive]
---

# 放棄ブランチの SHA アーカイブ

2026-05-27 のブランチ整理で削除した未マージ commit の記録。
**`git reflog` の 90 日保証期間中** は SHA から直接取り出せる。それ以降も SHA が分かれば
GitHub のコミット URL (`https://github.com/uruhayato373/stats47/commit/<SHA>`) から復元可能。

## 復元手順

```bash
# 単発 commit を develop に取り込む
git cherry-pick <SHA>

# ブランチとして復活させる
git branch <new-branch-name> <SHA>

# 内容だけ見る
git show <SHA>
```

## 放棄した commit

### feature/station-passengers (D-system 全面 redesign)

| SHA | 日付 | 概要 |
|---|---|---|
| `f5c43814` | 2026-05-23 | feat(redesign): D-system 全 8 ページ実装 + デザイン最適化 |

**規模**: 113 ファイル変更、+13,993 / -535 行

**含む変更**:
- 共通プリミティブ (HeroShell / KpiTile / KpiGrid / NativeAffiliateRow / DataPackCTA / InfeedAd / SectionEyebrow / CategoryNav)
- ranking Phase 2: NativeAffiliateRow を AI 考察上に追加
- home D 破壊的置換: 暗色 hero + 4 KPI + Featured + 3 切り口 discovery + 統計ブログ + ふるさと納税 1 行バナー
- area D: AreaProfilePageClient を暗色ヒーロー化、CitiesNavCard を主カラムに移動
- category/themes-index/survey/tag/theme: 暗色 hero → 軽量明色 hero、filler KPI 削除
- mega footer: 全カテゴリ + 全 17 テーマ + nav + サイト情報 + データ提供注釈 + SNS
- サイドバー: isOpen デフォルト false (デスクトップ最適化)、AdSense を上部に移設
- CitiesNavCard: 共通 Server Component、activeCityCode ハイライト対応
- 全プロトタイプ取込: `.claude/design-system/redesign/` (11 ページ × 4 案)
- マスタープラン: `docs/02_実装計画/d-redesign-master-plan.md`

**放棄理由**:
- develop が theme-dashboard 方向 (Phase 1A → 3a → 3a'') に進化したため、`ThemePageLayout.tsx` と `d-redesign-master-plan.md` で衝突
- 設計方針が乖離しており、現在の theme-dashboard を優先する判断
- 必要に応じて部分的な要素 (共通プリミティブ等) のみ将来取り込む可能性

### feature/psi-cycle-1-a1-b1-b5 (PSI Cycle 1)

| SHA | 日付 | 概要 |
|---|---|---|
| `d1a4acb4` | ~2026-05-15 | perf(lcp): PSI Cycle 1 — A1 banner SSR + B1 adsense chunk + B5 density 削減 |
| `476665dc` | ~2026-05-15 | docs(psi): record EXP-004/004b effect/partial + Cycle 1 goal doc |
| `de968eec` | ~2026-05-16 | docs(psi): record 2026-05-16 investigation of 5/15 regressed URLs |
| `36f323c8` | ~2026-05-16 | docs(psi-goal): 2026-05-16 状態を反映 — ステータス・Next Actions・Observation 結論 |

**含む変更**:
- A1: banner の SSR 化 (LCP 改善)
- B1: adsense chunk 分離 (初期 JS 削減)
- B5: 密度削減 (UI breathing room)
- 5/15 PSI 回帰調査ログ
- Cycle 1 goal document

**放棄理由**:
- 12 日経過しており PSI 改善は別系統で進行 (auto-memory `feedback_lcp_optimization.md` の EXP-002 ADVERSE / EXP-003 PARTIAL 等で別アプローチ検証中)
- `CLAUDE.md` 等で develop と衝突
- 個別の perf 案が必要なら今後の PSI cycle 計画に組み込む

## メタ情報

ブランチ削除日: 2026-05-27
削除コマンド:
```bash
git branch -D feature/station-passengers feature/phase-2-prep-complete
git push origin --delete feature/station-passengers \
  feature/cwv-auto-2026-05-25-themes-population-dynamics \
  feature/psi-cycle-1-a1-b1-b5
```

reflog 保証期限: 2026-08-25 (90 日後)
