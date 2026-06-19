---
name: LCP 改善の確定原則
description: EXP-002 ADVERSE と EXP-003 PARTIAL から導いた「LCP 要素の特定が先」原則
type: feedback
originSessionId: 931dd251-e8f5-4988-a5c5-a6306131c5ff
---
2026-04-25 検証で確定した LCP 改善の必須原則。

## 原則

**LCP 要素を PSI Lighthouse トレースで特定してから施策を立てる。仮説で動かない。**

PSI fetch script (`.claude/scripts/psi/fetch-psi-audit.mjs`) は `lcp-breakdown-insight` audit から LCP 要素 (selector, snippet) と breakdown (TTFB / resourceLoadDelay / resourceLoadDuration / elementRenderDelay) を抽出する。これを見てから対策を決める。

## 反証された仮説

### 「HTML 削減 = LCP 改善」は成り立たない（EXP-002, ADVERSE）
- PR #75 で TopoJSON を client fetch 化 → HTML 数百 KB 削減
- 結果: LCP 12.5s → 19-20s に **悪化**（4 回 PSI で確認）
- 理由: LCP 要素が Leaflet map tile（JS 描画依存）→ tile URL 発見が JS 実行後 → 余計な fetch round-trip 増えただけ
- → revert で baseline 復旧

### 「resource preload で LCP 改善」も成り立たない（EXP-003, PARTIAL）
- PR #102 で初期 4 タイルを `<link rel="preload" as="image" fetchpriority="high">` で SSR から hint
- 結果: resourceLoadDelay 4,347ms → 2,106ms（**▲ 半減 = preload は機能**）
- しかし elementRenderDelay 597ms → 3,072ms（**▼ 増加**）→ net LCP 不変（noise）
- 理由: tile が cache 済みでも Leaflet が DOM に配置・描画する時間が伸びるだけで net で打ち消し
- → 「LCP 要素が JS 生成画像」なら resource preload だけでは net LCP は動かない

## 残された有効な方向

**LCP 要素を SSR で確定的に出る要素に置き換える** = 案 B
- ヘッダー hero 画像 / 大きな見出し / OGP イメージなど、HTML パース直後に描画できるもの
- map / chart は LCP 要素から外れる（page 下部に置く or LCP より小さくする）
- これは UX デザイン変更を伴うため別 PR / レビュー必要

## 教訓記録先

- `/knowledge`: `.claude/skills/management/knowledge/SKILL.md` の「HTML 削減 = LCP 改善 は成り立たない」エントリ
- 関連 Issue: #74 (EXP-002 ADVERSE), #101 (EXP-003 案 A 結果)
