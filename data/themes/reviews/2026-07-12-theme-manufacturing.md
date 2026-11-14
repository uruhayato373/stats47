---
type: theme-catalog-review
date: 2026-07-12
status: ready-after-series-and-definition-audit
theme: manufacturing
tags: [theme-catalog, manufacturing, shipment, value-added, productivity]
---

# テーマレビュー: manufacturing（製造業）

## 結論

主問は、**その都道府県の製造業はどの程度の規模を持ち、どれだけの付加価値を生み、どのような事業所・雇用構造で支えられているか**とする。

読み順は次の4層に分ける。

1. **生産規模**: 製造品出荷額等
2. **価値創出**: 付加価値額、可能なら従業者1人当たり付加価値額
3. **生産基盤**: 事業所数、従業者数、敷地面積
4. **効率・立地条件**: 従業者/事業所当たり出荷額、工業地価、工業用水。ただし効率と生産性を混同しない

現行catalogは主要な規模・付加価値・雇用指標を持ち、テーマの骨格は妥当である。一方、次の問題を実装前に解消する。

- 「従業者1人当たり出荷額」を「労働生産性」と呼んでいる
- 工業統計、経済センサス、経済構造実態調査を跨ぐ時系列の比較条件が未記載
- 「製造品出荷額等」と「売上金額」、「付加価値額」と「純付加価値額」の違いが説明されていない
- 事業所数・従業者数と経理事項で基準時点が異なる可能性がある
- 工業地価・工業用水が製造業の成果指標と同列に並び、主問がぼやけている

## P0: 系列・定義監査

実装前に次を確定する。

- 各rankingKeyの元表、表章項目、対象事業所、従業者規模、基準日、経理事項の対象年
- `0000010103` / `0000010203` がどの調査・加工系列を接続しているか
- 工業統計から経済構造実態調査への切替年と、経済センサス実施年の扱い
- 全事業所と従業者4人以上事業所が系列内で混在していないか
- 製造品出荷額等、売上金額、付加価値額、純付加価値額の定義と控除項目
- 2024年調査の事業所数・従業者数は2024年6月1日現在、出荷額等は2023年実績であることをUI上で区別できるか
- 2022〜2024年結果に訂正が公表されているため、R2観測値が訂正後データか
- 産業分類改定、消費税の扱い、個人経営を含む範囲による断層
- 従業者1人当たり出荷額の分子・分母が同じ対象範囲・時点か

## 公式根拠

### 経済産業省「経済構造実態調査（製造業事業所調査）」

- URL: https://www.meti.go.jp/statistics/tyo/kkj/seizo_result.html
- 2021年実績以降の製造業の事業所数、従業者数、製造品出荷額等、付加価値額等の中心出典
- 地域別統計表で都道府県比較が可能
- 結果の訂正情報があるため、取得日と訂正版を記録する

### 経済産業省「経済構造実態調査」

- URL: https://www.meti.go.jp/statistics/tyo/kkj/index.html
- 調査結果、訂正、調査体系の入口
- 製造業事業所調査と、企業等を対象とする一次集計を混同しない

### 経済産業省「工業統計調査」

- URL: https://www.meti.go.jp/statistics/tyo/kougyo/result-2.html
- 旧系列と経済センサス実施年の扱いを確認するための出典
- 2021年実績以降は経済構造実態調査へ移行している
- 過去の工業統計は主に従業者4人以上の製造事業所を対象としており、全事業所系列と無条件に接続しない

### 総務省・経済産業省「経済センサス‐活動調査」

- URL: https://www.stat.go.jp/data/e-census/2021/index.html
- 全産業を対象とする周期調査。製造業集計は旧工業統計の中止年を補う
- 調査年、対象範囲、産業分類、経理事項の対象期間を確認してから時系列へ含める

### 2024年経済構造実態調査 製造業事業所調査 結果概要

- URL: https://www.meti.go.jp/statistics/tyo/kkj/pdf/seizo_youyaku2024.pdf
- 2024年6月実施。2023年の製造品出荷額等・付加価値額と、調査時点の事業所・従業者を区別する根拠
- 都道府県別集計と産業中分類別集計がある

## テーマ境界

| テーマ | 責務 |
|---|---|
| `manufacturing` | 製造業の出荷、付加価値、事業所、従業者、製造業内の構造 |
| `local-economy` | 県内総生産、経済成長、全産業の付加価値構成 |
| `labor-wages` | 製造業を含む賃金・最低賃金。製造業の雇用人数とは分ける |
| `roads` / `ports` | 物流インフラ。製造業の成果をインフラだけで説明しない |
| `local-finance` | 企業立地支援を含む自治体財政。製造出荷額とは別責務 |

## 現行指標の提案

| rankingKey | 現行 role | 提案 | 理由 |
|---|---|---|---|
| `manufacturing-shipment-amount` | primary | **primary keep** | 製造業の生産・販売規模を表す中心指標。ただし「生産額」そのものとは呼ばない |
| `manufacturing-industry-added-value` | secondary | **primaryへ変更** | 中間投入を含む出荷額とは別に、地域で生み出した価値を示す中心指標 |
| `manufacturing-establishments` | secondary | **secondary keep** | 生産基盤の広がり。ただし対象事業所範囲を明記 |
| `manufacturing-employees` | secondary | **secondary keep** | 雇用規模。賃金や雇用品質の指標ではない |
| `manufacturing-shipment-amount-per-employee` | secondary | **secondary keep / 改名** | 「従業者1人当たり出荷額」。労働生産性とは呼ばない |
| `manufacturing-shipment-amount-per-establishment` | secondary | **contextへ変更** | 大規模工場の比率に強く左右され、事業所の典型値ではない |
| `manufacturing-sales-private` | context | **定義監査後、重複なら削除** | 出荷額等との対象・企業/事業所単位の違いを説明できなければ混乱を増やす |
| `manufacturing-net-value-added-private` | context | **定義監査後context** | 付加価値額との控除項目・対象範囲を比較表示できる場合のみ残す |
| `manufacturing-establishment-site-area` | context | **context keep** | 立地・設備規模の補助指標。敷地が広いほど高効率とは限らない |
| `industrial-land-price` | context | **関連導線へ移動** | 工業地の地価であり、製造業の成果指標ではない |
| `industrial-land-price-change-rate` | context | **関連導線へ移動** | 同上。地価変動を製造業成長と断定しない |
| `industrial-water-usage` | context | **関連導線 / 要更新** | 2015年値なら鮮度不足。業種構成と再利用率の影響が大きい |
| 従業者1人当たり付加価値額 | なし | **追加候補** | 労働生産性を扱うなら出荷額ではなく付加価値ベースを優先 |
| 産業中分類別出荷・付加価値構成 | なし | **追加候補** | 自動車、化学、食品等の産業構成が地域差の主要因 |

## 現行チャートの提案

| componentKey | 提案 | 理由 / 実装 |
|---|---|---|
| `manufacturing-shipment-value-trend` | **keep / 系列監査** | 出荷額と付加価値額は同じ金額単位でも概念が異なる。凡例・年度・調査断層を表示 |
| `manufacturing-establishments-employees-trend` | **small multiplesへ変更候補** | 事業所と人で単位・桁が異なる。同一Y軸lineなら不適切 |
| `theme-manufacturing-labor-productivity` | **改名・分割** | 「労働生産性」を削除。1人当たりと1事業所当たりは分母と桁が異なり、同一Y軸に置かない |

### 追加チャート

1. **製造品出荷額等と付加価値額**: 同一金額単位でも別panelまたは明確な2系列。付加価値率を自動推論しない。
2. **従業者1人当たり付加価値額**: 同一対象範囲の分子・分母が確保できる場合のみ。
3. **産業中分類別構成**: 最新年のstacked bar。カテゴリ数を絞り「その他」を明示。
4. **事業所数・従業者数**: 単位別small multiples。二軸グラフより分離を優先。
5. **出荷額総額と1人当たり出荷額**: 規模と集約度を別panelで並べ、効率や収益性と断定しない。

## 推奨表示順

1. 製造品出荷額等
2. 付加価値額
3. 産業中分類別の出荷・付加価値構成
4. 事業所数・従業者数
5. 従業者1人当たり付加価値額（確保できる場合）
6. 従業者/事業所当たり出荷額
7. 敷地・工業地・工業用水等の立地条件
8. 定義 / FAQ
9. 全指標

## 不採用・保留

| 候補 | 判定 | 理由 / 再検討条件 |
|---|---|---|
| 出荷額が大きい=収益性が高い | 不採用 | 原材料費、在庫、利益を直接表さない |
| 1人当たり出荷額=労働生産性 | 不採用 | 中間投入や資本集約度の影響を含み、付加価値ベースの生産性と異なる |
| 1事業所当たり出荷額=典型的工場の規模 | 不採用 | 少数の巨大事業所に平均が左右される |
| 製造品出荷額等=県内総生産の製造業 | 不採用 | 出荷額は中間投入を含み、付加価値概念の県内総生産と異なる |
| 地価上昇=製造業成長 | 不採用 | 物流需要、土地需給、用途転換等の交絡がある |
| 工業用水使用量が多い=製造業が強い | 不採用 | 業種構成、循環利用、取水源、設備効率に左右される |
| 工業統計から現行調査までを一本の連続線で表示 | 保留 | 対象範囲・調査時点・分類の比較可能性確認後のみ |

## Claude Code実装指示

### PR-0: 系列・定義監査

1. 12指標すべてについて元表、表章項目、調査名、対象事業所、基準日、実績年、単位を一覧化
2. `0000010103` / `0000010203` の年別provenanceを確認し、工業統計・経済センサス・経済構造実態調査の境界を記録
3. 2022〜2024年結果が経産省の訂正後データと一致するか確認
4. 出荷額/売上、付加価値/純付加価値の定義差を公式表と照合
5. 従業者当たり・事業所当たり指標の分子分母が同一対象範囲かfixtureで検証
6. 結果を本文書へ追記し、比較不能な系列は「採用」にしない

### PR-1: ThemeCatalog是正

編集SSOT: `packages/data-configs/src/theme-catalog/manufacturing.ts`

1. 付加価値額をprimaryへ昇格し、primary/secondaryへ公式根拠付き`selection`を追加
2. `theme-manufacturing-labor-productivity`から「労働生産性」を外し、1人当たり/事業所当たりを分割
3. 事業所数と従業者数を単位別panelへ分ける
4. 重複概念のsales/net-value-addedは定義を説明できる場合のみcontextで残す
5. 工業地価・工業用水を立地条件sectionまたは関連導線へ移動
6. `sourceLink/rankingLink/relatedRankingKeys`を補完
7. section内`sortOrder`を一意化
8. guidanceに調査時点、実績年、対象事業所、調査切替を表示

### 禁止

- 出荷額を付加価値、利益、県内総生産と呼ばない
- 従業者1人当たり出荷額を労働生産性と呼ばない
- 人と事業所、万円と百万円を同一Y軸に載せない
- 異なる対象範囲・調査体系を無注記で時系列接続しない
- 2024年調査をすべて「2024年実績」と表示しない
- 訂正前データを最新値として再配信しない
- 生成物TS/JSONを手編集しない
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

- primary/secondary全指標で調査名、対象範囲、基準日/実績年、単位を確認できる
- 出荷額と付加価値、付加価値と純付加価値の違いを説明できる
- 「労働生産性」という誤ラベルがない
- 異単位を同一Y軸に置くchartがない
- 調査体系の切替点が注記されるか、比較不能年が線で接続されない
- 対象テーマの`no-selection / dup-sortorder / primary-orphan`が0
- R2 push / deployを行っていない

## 採用決定

**PR-0の系列・定義監査後に実装可能。現行の中心指標は維持するが、「1人当たり出荷額=労働生産性」という表現と、調査体系を跨ぐ無注記の時系列接続は解消する。**
