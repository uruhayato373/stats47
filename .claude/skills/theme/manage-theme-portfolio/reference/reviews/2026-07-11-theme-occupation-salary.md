---
type: theme-catalog-review
date: 2026-07-11
status: blocked-by-series-audit
theme: occupation-salary
tags: [theme-catalog, occupation, salary, annual-income]
---

# テーマレビュー: occupation-salary（職業別給与）

## 結論

主問は、**同じ職業の給与水準が都道府県によってどう異なり、その差に年齢・勤続年数・労働時間・企業規模がどう関係するか**とする。

職業を跨いだ単純な「高年収職ランキング」より、選択した職業の地域差と時系列を中心にする。現行39指標は削除せず、職業群別ナビゲーションと検索で扱い、primaryを1職種に固定しない。

## P0: 年収系列・重複監査

実装前に次を確定する。

- 各`*-annual-income`の式が `月例給与×12+年間賞与` か、それ以外か
- 月例給与が所定内給与か、超過労働給与を含む「きまって支給する現金給与額」か
- 一般労働者/短時間労働者、男女計/性別、企業規模、産業の抽出条件
- 都道府県×職種の標本数、標準誤差、欠測・秘匿値の扱い
- 2020年前後等の職種分類改定を跨いで同一系列として接続できるか
- `labor-wages`の`nurse-salary`と本テーマの`nurse-annual-income`が同一概念・同一データか
- catalog説明の「47職種」「2010〜2023年」と、登録39指標・実データ期間の不整合

P0が終わるまで「47職種」「2010〜2023年」を確定情報として表示しない。

## 公式根拠

### 厚生労働省「賃金構造基本統計調査」

- URL: https://www.mhlw.go.jp/toukei/list/chinginkouzou.html
- 職種別賃金、年齢、勤続年数、労働時間、賞与等の中心出典
- 調査年ごとの職種分類、表章区分、推計方法を確認する
- 都道府県×細職種では標本が小さくなり、前年差・順位差が不安定になり得る

## テーマ境界

| テーマ | 責務 |
|---|---|
| `occupation-salary` | 同一職業の地域別・時系列給与と関連属性 |
| `labor-wages` | 最低賃金、初任給、男女等の横断的賃金構造 |
| `labor-mobility` | 求人倍率、失業、転職・離職 |
| `real-income` | 世帯の可処分所得と物価補正後の購買力 |

## 指標構成の提案

単一の固定primaryではなく、職業群ごとに代表指標を設定する。

| 職業群 | 代表候補 | 扱い |
|---|---|---|
| 医療・福祉 | 看護師、介護職員、薬剤師 | 医師は外れ値になりやすく、既定primaryにしない |
| IT・専門 | SE、システムコンサル、会計士等 | 分類名が実際の統計職種と一致するか監査 |
| 教育 | 小中学校教員、保育士、大学教員 | 公務/民間、学校種の条件を区別 |
| 運輸・建設 | トラック、バス、タクシー、大工、電気工事 | 労働時間・歩合給の影響を併記 |
| サービス | 調理、理美容、販売、警備、清掃 | 短時間労働者の包含条件を確認 |

### 重複候補

| rankingKey | 判定 | 条件 |
|---|---|---|
| `nurse-salary` | **統合候補** | `nurse-annual-income`と出典表・式・対象が同一ならcanonical keyへ統合 |
| `nurse-annual-income` | **canonical候補** | 命名規則が他職種と一致するため優先。ただし既存URLのredirect/aliasが必要 |

## 現行チャートの提案

| componentKey | 提案 | 理由 / 実装 |
|---|---|---|
| `theme-occ-medical-trend` | **P0後keep/reframe** | 医師の桁が他職種を圧縮する場合は別panelまたは指数化 |
| `theme-occ-it-trend` | **P0後keep** | 職種分類名と表示ラベルを公式名称へ合わせる |
| `theme-occ-edu-trend` | **分割候補** | 小中学校教員と大学教授では雇用制度・年齢構成が大きく異なる |
| `theme-occ-transport-trend` | **keep** | 年収だけでなく労働時間をtooltip/補足で併読 |
| `theme-occ-service-trend` | **keep** | 一般/短時間の包含条件を表示 |

### 追加・改善チャート

1. **職業選択型の地域ランキング**: 1職業ずつ比較し、39系列を同時表示しない。
2. **年収・労働時間・年齢・勤続年数の概要カード**: 同じ調査セルの属性だけを表示。
3. **職業群別small multiples**: 共通Y軸が読める範囲の職業だけをまとめる。
4. **時系列**: 分類改定点を注記し、接続不能なら線を切る。

## 推奨表示順

1. 職業検索・職業群選択
2. 選択職業の都道府県ランキング
3. 選択職業の年収推移
4. 年齢・勤続年数・労働時間・標本情報
5. 同一職業群の比較
6. `labor-wages`への関連導線
7. 定義 / FAQ
8. 全職業一覧

## 不採用・保留

| 候補 | 判定 | 理由 / 再検討条件 |
|---|---|---|
| 医師を全職業の固定primaryにする | 不採用 | 外れ値であり、テーマ全体の典型ではない |
| 39職種を1chartへ表示 | 不採用 | 判読不能で比較目的が曖昧 |
| 平均年収を個人の期待年収と呼ぶ | 不採用 | 年齢・勤続・労働時間等の構成差がある |
| 標本数・欠測を無視した順位 | 不採用 | 細職種×都道府県は推計が不安定になり得る |
| 分類改定を跨いだ無注記line chart | 保留 | 同一系列として接続可能と確認後のみ |
| `nurse-salary`と`nurse-annual-income`の併存 | 保留 | P0で差がなければ統合 |

## Claude Code実装指示

### PR-0: 系列・重複監査

1. 全39指標のstatsDataId、職種コード、年、算出式、単位、雇用形態、性別、企業規模を一覧化
2. 年収を公式表の月例給与・賞与から再計算するfixtureを代表5職種×3県で作成
3. 欠測・秘匿・標本情報の取得可否とUI処理を確認
4. 職種分類改定の年とコード対応を確認
5. `nurse-salary`と`nurse-annual-income`を実値まで比較し、統合/別概念を決定
6. catalog説明の職種数・期間を実データから生成できるか確認し、結果を本文書へ追記

### PR-1: ThemeCatalog是正

編集SSOT: `packages/data-configs/src/theme-catalog/occupation-salary.ts`

1. 固定primaryを廃止または職業群代表へ変更
2. 職業群を明示し、primary/secondaryへ `selection`を追加
3. 看護師重複をcanonical keyとalias/redirectへ整理
4. chartを職業群ごとに整理し、外れ値で他系列を圧縮しない
5. `sourceLink/rankingLink/relatedRankingKeys`を補完
6. section内 `sortOrder`を一意化
7. guidanceと標本・分類改定の注意を追加

### 禁止

- 月例給与×12だけを年収と呼ばない
- 所定内給与と現金給与額を混同しない
- 欠測・秘匿値を0として順位化しない
- 職種分類改定を無視して線を接続しない
- 平均年収を中央値または個人の手取りと呼ばない
- 生成物TS/JSONを手編集しない
- R2 push / deployを行わない

## 検証と完了条件

```bash
npm run generate:catalog --workspace=@stats47/data-configs
npm run validate:catalog --workspace=@stats47/data-configs
npm run validate:config --workspace=@stats47/data-configs
npm run type-check --workspace=@stats47/data-configs
npm run type-check --workspace apps/web
npm run test:run --workspace apps/web
```

- 代表fixtureで年収再計算値と表示値が一致
- 職業数・対象期間が実データと一致
- 重複看護師指標の採否が確定
- 欠測・秘匿値がランキングから適切に除外される
- 分類改定点が注記または非連結表示される
- `no-selection / dup-sortorder / primary-orphan`が0
- R2 push / deployを行っていない

## 採用決定

**年収式・職種分類・看護師重複のP0監査が終わるまで実装をブロックする。39職種は削除せず、検索と職業群で段階表示する。**
