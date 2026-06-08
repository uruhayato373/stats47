---
type: blog-winning-patterns
date: 2026-06-08
gscWeek: 2026-W23
status: draft
tags: [blog-quality, continuous-learning]
---

# ブログ勝ち要因分析 2026-06-08

**作業仮説**: アクセス数(検索流入)の多い記事 = 良い記事。主指標は **CTR**(同 impression 条件での魅力) + **掲載順位**。
生クリック数は検索需要に交絡するため補助、滞在(GA4)は将来統合。

- 評価対象: imp ≥ 15 の公開記事 **117 本** (winner/loser = CTR 三分位 各 39 本)
- winner 中央値: CTR **6.45%** / 順位 7.38
- loser 中央値: CTR 0.00% / 順位 8.08

> [!WARNING]
> N が小さい初期はシグナルが弱い (confidence: hi=N≥15 / mid=N≥8 / lo=弱い信号)。
> **lo の信号で blog-quality-standards を書き換えない**。blog-critic / NotebookLM の定性裏取りを伴うこと
> (.claude/rules/evidence-based-judgment.md)。

## 勝ち記事 TOP (CTR 上位)

- `assembly-answer-chatgpt-5steps` — CTR 17.86% / 順位 9.5 / archetype — / 図0
- `sake-consumption-prefecture-gap` — CTR 16.67% / 順位 6.92 / archetype — / 図0
- `foreign-population-growth-rate` — CTR 14.89% / 順位 6.3 / archetype — / 図6(地図含)
- `engel-coefficient-prefecture-ranking` — CTR 13.89% / 順位 4.81 / archetype — / 図3(地図含)
- `farmland-crisis-abandoned-land` — CTR 12.64% / 順位 6.4 / archetype — / 図6(地図含)
- `ai-claude-code-pref-analysis` — CTR 12.50% / 順位 3.96 / archetype — / 図0
- `workplace-accident-regional-map` — CTR 12.50% / 順位 5.83 / archetype — / 図7(地図含)
- `ict-media-consumption-gender-gap` — CTR 10.53% / 順位 6.26 / archetype — / 図5(地図含)

## 特徴シグナル (勝 vs 負、効きそうな順)

| 特徴 | 勝 / 負 | 差 | confidence |
|---|---|---|---|
| prosePerChart | 勝 550 / 負 914 | Δ -364 | hi |
| prose | 勝 2306 / 負 2413 | Δ -107 | hi |
| introChars | 勝 261 / 負 286 | Δ -25 | hi |
| hasLine | 勝 23.1% / 負 46.2% | lift -23.1pt | hi |
| curiosityGap | 勝 28.2% / 負 48.7% | lift -20.5pt | hi |
| titleLen | 勝 17 / 負 33 | Δ -16 | hi |
| hasMap | 勝 56.4% / 負 41% | lift +15.4pt | hi |
| hasScatter | 勝 48.7% / 負 33.3% | lift +15.4pt | hi |
| desumasu | 勝 69.2% / 負 56.4% | lift +12.8pt | hi |
| chartCount | 勝 3 / 負 2 | Δ +1 | hi |
| callouts | 勝 2 / 負 3 | Δ -1 | hi |
| internalLinks | 勝 6 / 負 6 | Δ 0 | hi |
| h2 | 勝 6 / 負 6 | Δ 0 | hi |

bool 特徴の lift = winner 群での出現率 − loser 群での出現率 (pt)。num 特徴の Δ = 中央値差。

## 交絡分析 (★順位統制後も残るシグナルだけが信頼できる)

CTR は **掲載順位 (position)** に強く依存する。winner が「単に上位表示なだけ」なら、その特徴は
順位の交絡であって因果ではない。順位を部分統制 (IQR 中央バンドで再計算) して頑健性を判定する。

- winner 中央順位 **7.38** vs loser **8.13**
  → 順位差は小さい。特徴差が CTR を説明しうる
- corr(CTR, 順位) = **-0.29** (通常は強い負相関)
- corr(タイトル長, 順位) = **0.04** → タイトル長と順位は弱相関
- winner 中央公開年 2026 vs loser 2026 

### 順位統制後の頑健性 (バンド n=59)

| 特徴 | 生 effect | 順位統制後 | 判定 |
|---|---|---|---|
| prosePerChart | -364 | -240 | ✅ robust |
| prose | -107 | -119 | ✅ robust |
| introChars | -25 | -26 | ✅ robust |
| hasLine | -23.1 | -24.2 | ✅ robust |
| curiosityGap | -20.5 | -6.9 | ⚠️ weakened |
| titleLen | -16 | -18 | ✅ robust |
| hasMap | +15.4 | +6.9 | ⚠️ weakened |
| hasScatter | +15.4 | +10.3 | ✅ robust |
| desumasu | +12.8 | +17.2 | ✅ robust |
| chartCount | +1 | +1 | ✅ robust |
| callouts | -1 | -1 | ✅ robust |
| internalLinks | 0 | 0 | ❌ confounded |
| h2 | 0 | -1 | ❌ confounded |

**robust** = 順位統制後も同符号で効果が半分以上残る → 因果候補。**confounded** = 統制で消える → 順位の交絡。
**書き戻してよいのは robust かつ confidence hi/mid のシグナルだけ**。

## 読み方と次アクション

1. **confidence hi/mid の正の lift** → 勝ちパターン候補。`blog-quality-standards.md` の archetype / チェックリストに
   反映を検討 (blog-critic で定性裏取り後)。
2. **conformance 低 × GSC 流入あり** の記事 → `/brushup-blog --target queue` の opportunity レーンで優先是正。
   低 conformance 上位: `library-books-prefecture-gap`(0), `local-debt-current-ratio-prefecture-gap`(0), `sake-consumption-prefecture-gap`(0), `train-commuters-prefecture-gap`(0), `cc-estat-20-publish`(0.2)
3. **地図(hasMap)/散布図(hasScatter) の lift** が正なら、該当テーマ記事に `tile-grid` / `scatter` チャートを標準化。
4. NotebookLM で winner 上位の "なぜ刺さるか" を定性深掘り → 仮説を本レポートに追記。

## 関連
- 仕組み正典: `docs/02_実装計画/blog-continuous-quality-loop.md`
- 床を上げる側: `docs/02_実装計画/blog-remediation-loop.md` (`build-remediation-queue.mjs`)
- 品質基準(書き戻し先): `.claude/rules/blog-quality-standards.md`
