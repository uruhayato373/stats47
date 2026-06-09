---
type: implementation-plan
date: 2026-06-08
status: active
tags: [blog-quality, continuous-learning, gsc]
---

# ブログ継続品質ループ (床を上げる × 天井を上げる)

「アクセス数の多い記事 = 良い記事」を作業仮説に、**共通化(基本形の統一)** の上で
**トップ記事の勝ち要因を実測から学び、執筆/是正基準へ書き戻して継続的に品質を底上げする**仕組みの正典。

> 関連正典:
> - 品質基準(書き戻し先): `.claude/rules/blog-quality-standards.md`
> - 床を上げる是正ループ: `docs/02_実装計画/blog-remediation-loop.md`
> - データ/wave 命名: `.claude/rules/blog-data-schema.md`

## 1. 全体像 — 2 つのループ

```
                      ┌──────────────── 床を上げる (決定的・既存) ────────────────┐
新規執筆 article-writer │  quality-gate.mjs (公開前 blocker)                        │
   → blog-critic       │  audit-published-blog.mjs → build-remediation-queue.mjs   │
   → publish           │  /brushup-blog --target queue で pending を順次是正        │
                      └──────────────────────────────────────────────────────────┘
                      ┌──────────────── 天井を上げる (学習・新規) ────────────────┐
   GSC/GA4 実測 ──────▶│  analyze-winning-patterns.mjs                              │
                      │   トップ記事の構造特徴 × CTR/順位 → featureSignals         │
                      │   → docs/04_レビュー/blog-quality/<date>-winning-patterns.md │
                      │   → .claude/state/blog/winning-patterns.json (conformance)  │
                      │  (任意) NotebookLM/blog-critic で "なぜ刺さるか" 定性裏取り  │
                      │   → blog-quality-standards.md / archetype に書き戻し         │
                      └──────────────────────────────────────────────────────────┘
                                  ↑                                   │
                                  └──── measure-gsc-impact で効果検証 ◀┘
```

- **床 (floor)**: 「やってはいけない欠陥」を決定的に弾く。判断不要。→ 全記事を一定品質以上に揃える。
- **天井 (ceiling)**: 「勝っている記事は何が違うか」を実測で学ぶ。判断が要る (定性裏取り必須)。→ 基準そのものを引き上げる。

この 2 つを分離するのが要点。床を上げるだけでは「欠陥はないが凡庸」で頭打ちになる。天井ループが基準を更新し、
更新された基準を床ループが全記事に展開する。

## 2. 共通化する「基本形」(全記事の不変フロア)

`blog-quality-standards.md` の決定的ルール。新規・既存問わず全記事がこれを満たす。

| 項目 | ルール | 強制 |
|---|---|---|
| 文体 | ですます調に統一 (である調 copula 文末を禁止) | `quality-gate.mjs` + `audit-published-blog.mjs` (2026-06-08 パリティ化) |
| ランキング可視化 | 上位5+下位5 (または上位10+下位10) の SVG。**上下対称**。表は全面禁止 | quality-gate / audit (非対称・表を blocker) |
| 地理分布 | 地理が意味を持つ指標は `tile-grid` (都道府県地図) SVG | `generate-article-charts.mjs` の `*-tile-grid.json` → tile-grid-map (2026-06-08 実装) |
| 図あたり字数 | prose/図 ≥ 350字 (解説が薄い図を禁止) | quality-gate / audit |
| callout / 内部リンク / H2 | callout≥2 / 内部リンク≥3 / H2≥4 | quality-gate / audit |
| source-link | 各図直下にインライン配置 (末尾集約禁止) | audit (WARN) |
| archetype | A–E のいずれかを frontmatter 宣言 | blog-critic |

> チャート本数 (5 vs 10) は **gate では強制しない**(上下対称のみ要求)。良記事の top10+bottom10 を誤爆しないため。
> 本数の最適値は天井ループ(featureSignals の chartCount)が示唆し、blog-critic が個別判断する。

## 3. 天井ループの指標設計

- **主指標 = CTR** (同 impression 条件での "魅力" の代理) + **掲載順位 position**。
- **補助 = 生クリック数 / impressions** (検索需要=キーワード母数に交絡するため主指標にしない)。
- **将来統合 = 滞在 (GA4 averageSessionDuration) / engagementRate** (中身の質。per-page snapshot が要る)。
- winner/loser = 評価対象(imp≥15)の **CTR 三分位** 上位/下位。

抽出する構造特徴 (決定的):
`titleLen` / `curiosityGap` / `archetype` / `chartCount` / `hasMap` / `hasScatter` / `hasLine` /
`callouts` / `internalLinks` / `h2` / `prose` / `prosePerChart` / `introChars` / `desumasu`。

各 featureSignal に **confidence** (hi=N≥15 / mid=N≥8 / lo=弱い信号) を付ける。

## 4. 実証ベースの歯止め (★最重要)

`.claude/rules/evidence-based-judgment.md` 準拠。**シグナル ≠ 効果確定**。

- N が小さい初期は相関が弱い。**confidence lo の信号で基準を書き換えない**。
- featureSignal が反直感的でも (例: 2026-06-08 初回で「短いタイトルが勝つ」「curiosity gap マーカーは loser に多い」)、
  **交絡 (古い記事/ブランド/キーワード難易度) を排除できるまで仮説扱い**。blog-critic / NotebookLM の定性裏取りを伴う。
- 基準書き戻しは「仮説 → 数記事で A/B 的に試す → measure-gsc-impact で 4 週後検証 → effect/* 判定」の順。

## 5. 運用サイクル (週次)

```bash
# ① 床: 是正キュー更新 → pending 上位を順次是正
node .claude/scripts/blog/build-remediation-queue.mjs
/brushup-blog --target queue --next 5

# ② 天井: 勝ち要因を再解析 (GSC 更新後)
node .claude/scripts/blog/analyze-winning-patterns.mjs
#   → docs/04_レビュー/blog-quality/<date>-winning-patterns.md を読む
#   → confidence hi/mid の正シグナルを blog-quality-standards に反映 (critic 裏取り後)

# ③ (任意) winner 上位を NotebookLM で定性深掘り
/notebooklm-research   # "なぜ刺さるか" を仮説化しレポートに追記

# ④ 効果検証 (書き戻した基準で書いた/直した記事を 4 週後)
node .claude/scripts/blog/measure-gsc-impact.mjs
```

`build-remediation-queue.mjs` は `winning-patterns.json` があれば各記事に `conformance` を付け、
opportunity レーンの tiebreaker (適合度が低い=改善余地が大きい記事を先に) に使う。

## 6. 担い手 (エージェント / スキル)

| 役割 | 担い手 |
|---|---|
| 新規執筆 (基本形で書く) | `article-writer` agent + `/generate-article-charts` |
| 公開前 床ゲート | `quality-gate.mjs` (pre-commit / publish-blog.yml) |
| 既存是正 (床) | `/brushup-blog --target queue` (engine: `article-writer`) |
| 意味レビュー / archetype 審査 | `blog-critic` agent |
| 勝ち要因解析 (天井) | `/analyze-winning-patterns` (本ループの新規スキル) |
| 定性深掘り | `/notebooklm-research` (`trend-scout`) |
| 効果計測 | `measure-gsc-impact.mjs` / `gsc-analyst` |

## 7. 未実装・今後

- [x] `tile-grid` (都道府県地図) / `line` (時系列・多系列) / `scatter` (group色分け) generator 実装 (2026-06-08)
- [ ] `stacked` / `summary(findings)` generator 実装 (現状 stub)
- [ ] GA4 per-page 滞在/engagement を analyze-winning-patterns に統合 (中身の質を主指標化)
- [ ] featureSignal の時系列追跡 (週次で signal が安定する特徴を "確定勝ちパターン" に昇格)
- [ ] 書き戻しの A/B 検証を wave_id で紐付け (blog-data-schema.md の wave 命名)
