---
name: competitor-scan
description: SNS 競合アカウントをテーマ別の名乗り (統計/リスク/格差/ご当地 等) で巡回し、skill referenceへ差分レポートを生成する。Use when user says "競合スキャン", "SNS競合調査", "競合分析", "competitor scan".
disable-model-invocation: true
argument-hint: "[--platform x|instagram|all] [--deep]"
primary_agent: trend-scout
---

# /competitor-scan — SNS 競合の定点観測

stats47 の SNS 競合を**テーマ別の名乗りで巡回**し、フォロワー・投稿頻度・伸びた投稿・差別化余地を
差分レポートにまとめる。`feedback_sns_competitor_search` の教訓 (「統計/ランキング」だけで検索すると
@riskmap.jp のような感情系競合を取りこぼす) を機械化したもの。

> **SSOT**: SNS競合のアカウント単位定点観測は本スキルを運用正典とする。Xの投稿単位調査は
> `.Codex/skills/sns/x-viral-research/SKILL.md`、自社実測は`update-sns-metrics`へ分離する。
> Instagram専用の投稿単位Playwright collectorは未採択・未実装であり、その存在を前提にしない。
> 必要になった場合は、新しい効果仮説と予算を示して本スキルの拡張として再提案する。

> **設計判断**: 競合は「統計アカウント」だけではない。**同じ都道府県ネタを扱う感情喚起系** (治安/災害/格差/
> ご当地自虐) が最大の SNS 競合。名乗りの軸を複数走らせて取りこぼしを防ぐ。結果は判断材料であり、
> **煽り路線への追随はしない** (`.Codex/rules/sns-content-standards.md` §0 差別化軸)。

## 既知の競合 (memory から)

| 競合 | 特徴 | memory |
|---|---|---|
| **@riskmap.jp** | 治安/心霊系・IG+TikTok 同 handle・1 リール 1-2 万いいね | `project_competitor_riskmap_jp` |
| **todo-ran / uub** | Web 指標網羅 (todo-ran 1,501 / uub 1,843 vs stats47 ~533) | `project_competitor_indicator_benchmark` |

## 検索の名乗り軸 (複数走らせる)

1. **統計・ランキング系**: 「都道府県 ランキング」「統計 都道府県」「47都道府県」
2. **リスク・治安系**: 「治安 悪い 県」「危険 都道府県」「事件 ランキング」
3. **格差・怒り系**: 「格差 都道府県」「年収 格差 県」「田舎 都会」
4. **ご当地・自虐系**: 「あるある 県民」「ご当地 disり」「田舎あるある」
5. **子育て・生活系**: 「住みやすさ 県」「子育て 都道府県」

## 手順

1. **プラットフォーム別に検索** (`--platform` で絞る、既定 all):
   - 社会系検索は `agent-reach` skill (小紅書/Twitter/等) または WebSearch を使う
   - X: アカウント検索 + 上記名乗り軸でハッシュタグ/キーワード検索
   - Instagram: business_discovery は不可 (memory `project_instagram_graph_api_setup`)。ハッシュタグ・手動巡回
2. **各競合について記録**: handle / フォロワー数 (取得日) / 直近投稿頻度 / 直近で伸びた投稿 (テーマ・エンゲージ) / フォーマット
3. **前回スキャンとの差分**: `reference/reports/*.md` の最新とフォロワー増減・新規競合をdiff
4. **stats47 への示唆**: 取りこぼしている題材・フォーマット・名乗り軸を 3-5 個 (煽り追随ではなく信頼性×網羅性で差別化できる切り口)
5. **レポート出力**: `.Codex/skills/sns/competitor-scan/reference/reports/YYYY-MM-DD.md`
6. **TODO化**: 採択した未完了策だけを `.Codex/todo/improvements.md` へID付きで追加

## 出力フォーマット

```markdown
---
type: competitor-scan
date: YYYY-MM-DD
platforms: [x, instagram]
tags: [competitor]
---
## サマリ
<3-4 行: 競合状況の変化・注目点>
## 競合テーブル
| 競合 | PF | フォロワー (取得日) | 投稿頻度 | 直近ヒット投稿 | フォーマット |
## 前回比 差分
<フォロワー増減・新規競合・消えた競合>
## stats47 への示唆 (3-5)
- <取りこぼし題材 / 差別化余地。煽り追随はしない>
```

## 実行頻度

- **月次**で定点観測する (フォロワー・投稿頻度は月単位の変化が有意)。週次に混ぜて空振りさせない。

## カタログ (§2) への反映 (★人間承認ゲート)

競合の示唆を X 投稿カタログ (`sns-content-standards.md` §2-0 template / §2-8 相性 / §2-9 画像) に
反映するときは、**§2-10 の承認手順に従う** (思いつきで rules を書き換えない):

1. 本スキルのレポート「stats47 への示唆」から、カタログのどの行をどう変えるかを具体化する
   (例:「competitor が『◯◯県あるある』で伸びている → §2-8 で population×体験を ○→◎ に上げる」)。
2. x-strategist が **diff 提案**として提示する (どのテーブルのどのセルを変えるか)。
3. **ユーザーが承認してから** rules を編集し、`node .Codex/scripts/lib/x-catalog.cjs --check` を通す。
4. 反映後は `analyze-x-winning-patterns` の実測で効果を検証する (`evidence-based-judgment.md`)。

## やらないこと (意図的)

- **競合の煽り路線を真似ない** — stats47 は信頼性×網羅性×Web 送客で差別化 (rules §0)
- **競合の投稿を丸写ししない** — 題材の当たり所を学ぶだけ
- **自動投稿はしない** — 本スキルは調査のみ。投稿は各チャネル skill
- **カタログを勝手に書き換えない** — §2 への反映は上記の人間承認ゲート経由のみ

## 関連

- チャネル戦略・差別化軸: `.Codex/rules/sns-content-standards.md` §0
- 競合 memory: `project_competitor_riskmap_jp` / `feedback_sns_competitor_search` / `project_competitor_indicator_benchmark` / `reference_competitor_research_label`
- 週次運用への組み込み: `/sns-weekly-plan` Step 2
