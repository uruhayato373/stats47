---
type: theme-catalog-review
date: 2026-07-11
status: proposal-ready
theme: population-dynamics
tags: [theme-catalog, population, metrics, charts]
---

# テーマレビュー: population-dynamics（人口動態）

## 結論

主問は「人口がなぜ増減しているか」とする。読み順は次の4段階が最も自然である。

1. 総人口と人口増減率で「結果」を見る
2. 自然増減と社会増減で「要因」を分ける
3. 出生・死亡、転入・転出で「内訳」を見る
4. 年齢3区分と人口ピラミッドで「構造」を見る

現行 primary `crude-birth-rate`は要因の一部であり入口として狭い。既存の `population-growth-rate`を primary に追加し、`natural-increase-rate`と `social-increase-rate`を要因分解の中心にする。

ただし `social-increase-rate` は現行MetricConfigで2018〜2019年しか持たない。2024年の `natural-increase-rate` と同年のように比較してはいけない。データ更新または共通年への制限が前提となる。

## 公式根拠

### 総務省統計局「人口推計（2024年10月1日現在）」

- URL: https://www.stat.go.jp/data/jinsui/2024np/index.html
- 調査日: 2026-07-11
- 都道府県別人口増減率を掲載
- 増減要因を自然増減率と社会増減率で整理
- 2024年は全都道府県で自然減少、社会増加は24都道府県
- 都道府県×年齢3区分別人口割合を掲載

「人口増減率→自然/社会増減率→年齢構成」は公式統計の説明順と整合する。

### 厚生労働省「人口動態調査」

- URL: https://www.mhlw.go.jp/toukei/list/81-1.html
- 調査日: 2026-07-11
- 出生、死亡等の正式調査。`crude-birth-rate`、`crude-death-rate`、`natural-increase-rate`の出典

### 国立社会保障・人口問題研究所「日本の地域別将来推計人口（令和5年推計）」

- URL: https://www.ipss.go.jp/pp-shicyoson/j/shicyoson23/t-page.asp
- 調査日: 2026-07-11
- 2020年国勢調査を基に2050年まで5年ごとに推計
- 総人口、年齢3区分、75歳以上、男女×5歳階級、将来純移動率を掲載
- 将来値は観測値と視覚的に区別する必要がある

## 指標の提案

| rankingKey | 現行 role | 提案 | 理由 |
|---|---|---|---|
| `population-growth-rate` | 未登録 | **primary追加** | テーマの結果を直接表す。既存MetricConfig・2024年対応 |
| `natural-increase-rate` | secondary | **primaryへ変更** | 出生・死亡による要因分解。2024年まで利用可 |
| `social-increase-rate` | secondary | **鮮度解決後primary** | 転入・転出による要因分解。現行2019年まで |
| `crude-birth-rate` | primary | **secondaryへ変更** | 自然増減の内訳 |
| `crude-death-rate` | secondary | **keep** | 自然増減の内訳 |
| `total-fertility-rate` | secondary | **keep** | 出生動向の重要指標。粗出生率との定義差を説明 |
| `moving-in-excess-rate` | secondary | **keep** | 社会増減を理解しやすい |
| `ratio-65-plus` | secondary | **keep** | 年齢構成の主要結果 |
| `young-population-ratio` | secondary | **keep** | 高齢化率と対で構造を示す |
| `population-density-per-km2-inhabitable-area` | secondary | **contextへ変更** | 動態ではなく背景状態 |
| `day-time-population-ratio` | secondary | **contextへ変更** | 通勤・都市機能の背景指標 |
| `total-population` | context | **secondaryへ変更** | 増減率の母数・規模に必要 |

primary/secondaryの `selection` は上記公式資料を用い、指標ごとに `proposedBy/sourceUrl/surveyedAt/rationale` を記録する。

## チャートの提案

| componentKey | 提案 | 実装内容 |
|---|---|---|
| `birth-death-rate-trend` | **keep + metadata是正** | 率の単位、source、relatedRankingKeysを明示 |
| `natural-social-increase-trend` | **rename + metadata是正** | 実データは出生数・死亡数。`birth-death-count-trend`相当へ改名しsectionを「自然増減」へ |
| `theme-pop-migration-trend` | **keep + metadata是正** | 転入数・転出数。転入超過率への導線を付与 |
| `theme-age-composition` | **keep** | 年齢3区分の構成推移 |
| `theme-population-pyramid` | **keep** | 男女×年齢階級。3区分と粒度が異なる |
| `theme-pd-aging-young-crossover` | **keep** | 高齢化率と年少人口割合の長期変化 |
| `theme-pd-totalpop-aging-mix` | **revise** | 高齢化率ではなく、人口増減率との表現が主問に合うか共通年を検証 |
| markdown 3件 | **content review後keep** | チャートの後に置き、統計値と出典を再検証 |

### 追加候補

1. **人口増減率の時系列**: `line-chart`。不連続年を連続年次と誤認させない。
2. **自然増減率と社会増減率**: 2系列 `line-chart`。共通Y軸・零基準。鮮度ゲートを通るまで追加禁止。
3. **将来推計**: 実績/推計の線種と境界年を表現できる別設計が必要。本PRに混ぜない。

## 不採用・保留

| 候補 | 判定 | 理由 / 再検討条件 |
|---|---|---|
| 人口密度の主要チャート | 不採用 | 人口動態の直接の要因分解ではない |
| 昼夜間人口比の主要チャート | 不採用 | 都市・通勤テーマがより適合 |
| 社会増減率の最新値チャート | 保留 | configが2019年まで。更新または共通年明示後に再検討 |
| 将来推計を通常折れ線に追加 | 不採用 | 実績と予測の区別なしは誤解を招く |
| 一般散布図 | 保留 | theme rendererにcomponentTypeがない。明確な問いが決まった場合のみ別設計 |

## 推奨表示順

1. 人口増減率
2. 自然増減率 / 社会増減率（鮮度解決後）
3. 出生率・死亡率
4. 出生数・死亡数
5. 転入数・転出数
6. 年齢3区分構成
7. 人口ピラミッド
8. 年少人口割合・高齢化率
9. 解説 / 関連トピック / FAQ
10. 全指標（context含む）

## Claude Code実装指示

### PR-1: 鮮度に依存しないカタログ是正

編集SSOT: `packages/data-configs/src/theme-catalog/population-dynamics.ts`

1. 上表の role 変更と `population-growth-rate` 追加を反映
2. primary/secondaryの `selection` を本文書の公式根拠で記入
3. `natural-social-increase-trend` を `birth-death-count-trend` 相当へ改名し、section/source/relatedRankingKeysを実データに合わせる
4. 全chartの `relatedRankingKeys/sourceLink/rankingLink` を明示
5. `sortOrder` を推奨表示順に合わせて一意にする
6. rankingKeyの不採用候補を `rejectedCandidates` に記録

### PR-2: 社会増減率の鮮度解決

1. e-Stat/統計局で都道府県別社会増減率の現行系列を特定
2. MetricConfigとR2観測値を別フローで更新
3. 47都道府県、単位、年、欠損を検証
4. `social-increase-rate` を primary へ変更
5. 自然/社会増減率の比較チャートを追加

PR-2はデータパイプラインとR2反映を含むためPR-1に混ぜない。

### 禁止

- 生成物 `packages/types/src/indicator-sets/population-dynamics.ts` を手編集しない
- 生成物 `apps/web/scripts/data/page-components/theme/population-dynamics.json` を手編集しない
- 2019年の社会増減率を2024年と表示しない
- 将来推計を実績線と同じ表現で追加しない
- R2 push / deployを行わない

## 検証と完了条件

```bash
npm run generate:catalog --workspace=@stats47/data-configs
npm run validate:catalog --workspace=@stats47/data-configs
npm run validate:years --workspace=@stats47/data-configs
npm run validate:config --workspace=@stats47/data-configs
npm run type-check --workspace=@stats47/data-configs
npm run type-check --workspace apps/web
npm run test:run --workspace apps/web
```

- `population-dynamics` の `no-selection / dup-sortorder / primary-orphan` が0
- 全体warnがベースライン230件から増えない
- 生成物がSSOTと一致
- localhostの375 / 768 / 1024 / 1280 / 1700pxで軸、凡例、単位、出典、年度を確認
- empty/error stateが0値と区別できる
- 人口増減→要因分解→内訳→年齢構成の順に読める

## 採用決定

**現状: ユーザー承認待ち。**

Claude Codeはユーザーが本提案を承認するまでcatalogを編集しない。承認後はまずPR-1のみ実装する。

