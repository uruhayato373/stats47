---
type: critical-review
date: 2026-06-06
status: active
tags: [design, ui, melta-ui, accessibility, typography, regression]
---

# サイト全体デザインレビュー (2026-06-06)

17px 全体拡大 + 記事 h2/h3 の Zenn 完全準拠（同日実施）を踏まえた、視覚 / melta-ui 規約 / 回帰の包括レビュー。

## エグゼクティブサマリ

melta-ui 規約準拠は**良好**（主要禁止パターンの大半が 0 件）。17px 化の回帰は致命的なものなし（live 検証済）。要対応は **a11y 1 件（major）** + 視覚 / 一貫性の数点（minor）。

## 1. 視覚 / UX（home は実機スクショ確認、他はコードレベル）

- 良: hero「あなたの県は何位？」→ タイルマップ群 → カード → ブログ → フッターの階層・余白が整理。17px 化で本文が読みやすく拡大、破綻なし。
- 中段「主要ページ」プレビューの虹色グラデ（ピンク/緑/青/黄/紫）が彩度高く基調から浮く（※dev フォールバック表示の可能性、実機 avif と要確認）。
- OperatorPromo カード手前に空のグレーボックス（`min-h-[320px]` の mount 前プレースホルダ）→ CLS 面で要検討。
- ranking / category / blog / area 詳細は dev サーバー低速（1ルート 75〜90 秒超のコールドコンパイル + `--conditions react-server` 由来の不安定）で実機スクショ未取得。

## 2. melta-ui 規約準拠（apps/web/src 全走査）

**Clean（0 件）✓**: `text-black` / `shadow-lg・2xl` / `tracking-tight` / `rounded-xl・2xl` / `text-gray-400`(body) / `font-light` / `border-gray-100` / `CardContent pt-0`

| 重大度 | 箇所 | 内容 | 対応 | 状態 |
|---|---|---|---|---|
| major (a11y) | `HeaderClient.tsx:146` | メガメニュートリガが `outline-none` でフォーカスリング無し（WCAG 2.4.7 不適合） | `focus-visible:ring-2 focus-visible:ring-primary/50` 追加 | ✅ 修正済 |
| minor (装飾) | `TechSchoolPromoCard.tsx:26` (inline) | `border-l-4` + `bg-gradient-to-r` = AI 装飾カラーバー | 全周 `border border-slate-200 bg-card` に | ✅ 修正済 |
| minor (色) | 4 件 (AreaRelatedRankings / RankBadge / DefinitionsCard / MobileNavDrawer) | `bg-rose/yellow/green` → 規約は red/amber/emerald | 統一（RankBadge yellow=金メダルは意図なら許容） | 未対応 |
| minor (motion) | 5 件 (RankingSidebar skeleton/thumbnail / SlidePresentation) | `duration-500`（鈍い） | `duration-300` 以下 | 未対応 |
| 許容 | `text-blue-*` 18 件 | 相関/トレンド/コロプレスの**データ可視化セマンティック色**（リンクではない・アイコン併用済） | 規約上 OK | — |
| 許容 | md-content blockquote `border-l-4` | 引用の左ボーダーは慣習（Zenn も 3px） | OK | — |
| 許容 | `TechSchoolPromoCard.tsx:53` (sidebar) | purple→blue 全面グラデ ad カード | 意図的な ad デザイン（コンテンツと差別化） | — |

## 3. 一貫性（h1 規約 vs 実態）

規約「h1 = `text-2xl`」に対し hero h1 が `text-3xl`〜`5xl`（home/category/themes/survey/tag/not-found 計 10 件）。hero は意図的な大見出しだが規約は絶対値。→ **`ui-components.md` に「hero は例外」を明文化**（✅ 実施済）。本文コンテンツの h1 は `text-2xl` 厳守を維持。

## 4. 17px 化 回帰（live + code）

- ✅ live: 配信 CSS に `17px`、記事 h2=左寄せ+下線のみ、h3=bold（実 HTML 確認）。
- ✅ home 実機: レイアウト崩れなし。
- ⚠ 未確認: ranking/category のデータ表・カードグリッドの**モバイル 375px はみ出し**。dev クリーン再起動 → 実機確認が残課題。

## 残課題（未対応）

1. [minor] 色トークン統一（bg-rose/yellow/green → red/amber/emerald）4 件
2. [minor] motion `duration-500` → 300 以下 5 件
3. [polish] home 中段グラデプレビューの彩度抑制 / 空プレースホルダの CLS 対策
4. [verify] dev クリーン再起動 → ranking/blog/area のモバイル回帰を実機確認

## 補足: 並行セッション / git レース

別 Claude セッションが同 working copy で同時作業（離婚率記事をコミット）。未コミットだったフォント変更は `45256482` に巻き込まれてコミット済（develop/origin 両方に存在、データ消失なし）。今後の並行作業は **worktree 分離**推奨（memory `feedback_shared_working_copy_git_race`）。
