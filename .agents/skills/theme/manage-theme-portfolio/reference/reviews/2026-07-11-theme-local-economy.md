---
type: theme-catalog-review
date: 2026-07-11
status: blocked-by-core-metric-audit
theme: local-economy
tags: [theme-catalog, regional-economy, prefectural-accounts, industry]
---

# テーマレビュー: local-economy（地域経済）

## 結論

主問は、**その都道府県の経済規模はどの程度で、何によって付加価値が生まれ、成長・所得へどうつながっているか**とする。

読み順は次の4層に分ける。

1. **経済規模**: 県内総生産（名目）
2. **成長**: 実質経済成長率、名目/実質の区別
3. **産業構造**: 産業別付加価値構成、就業者構成
4. **所得への接続**: 1人当たり県民所得、課税所得。ただし住民個人の給与とは区別

現行catalogは説明でGDPを掲げながら、主要指標に県内総生産がない。最低賃金・求人倍率・失業率・財政力指数が地域経済の代理になっているため、コア指標を確保してから実装する。

## P0: コア指標・基準系列監査

- 47都道府県で比較可能な県内総生産（名目）、実質成長率、産業別付加価値の最新系列を確認
- 県民経済計算の基準年、連鎖方式、遡及改定、各県公表値の比較可能性を確認
- `per-capita-prefectural-income-h27`のH27基準・2020年値を更新または旧系列として明示
- catalog説明のGDP・製造品出荷額と、実際のmetrics/chartsの不一致を解消
- `per-taxpayer-taxable-income`の分母が納税義務者であり全住民ではないことを確認
- 時点・基準の異なる県内総生産と県民所得を同じ年として表示しない

## 公式根拠

### 内閣府「県民経済計算」

- URL: https://www.esri.cao.go.jp/jp/sna/sonota/kenmin/kenmin_top.html
- 県内総生産、経済成長率、県民所得、産業別付加価値の中心出典
- 県内概念と県民概念、名目と実質、総額と1人当たりを区別する
- 基準改定・遡及改定があるため、異なる基準系列を無注記で接続しない

### 総務省・経済産業省「経済センサス」

- URL: https://www.stat.go.jp/data/e-census/2021/index.html
- 事業所数、従業者数、売上・付加価値等の構造把握に使用する
- 調査間隔が年次ではなく、事業所数だけで経済規模や生産性を評価しない

## テーマ境界

| テーマ | 責務 |
|---|---|
| `local-economy` | 県内総生産、成長、産業別付加価値、県民所得 |
| `local-finance` | 自治体の歳入・歳出、財政力、債務、交付税 |
| `labor-wages` | 最低賃金・給与 |
| `labor-mobility` | 求人・失業・就業 |
| `manufacturing` | 製造業の出荷・付加価値等の詳細 |
| `real-income` | 世帯可処分所得と購買力 |

## 現行指標の提案

| rankingKey | 現行 role | 提案 | 理由 |
|---|---|---|---|
| `per-taxpayer-taxable-income` | primary | **secondaryへ変更** | 納税義務者ベースで、地域全体の経済規模ではない |
| `per-capita-prefectural-income-h27` | secondary | **更新後secondary** | 企業所得等も含み、個人給与ではない。旧基準を更新 |
| 県内総生産（名目） | なし | **primary追加** | テーマ主問の中心 |
| 実質経済成長率 | なし | **primary追加** | 規模と変化を分離する中心指標 |
| 産業別付加価値構成 | なし | **secondary追加** | 産業構造を就業者数だけでなく付加価値で読む |
| `minimum-wage-by-region` | secondary | **削除/関連導線** | `labor-wages`の主責務 |
| `active-job-opening-ratio` | secondary | **削除/関連導線** | `labor-mobility`の主責務 |
| `unemployment-rate` | secondary | **削除/関連導線** | 同上 |
| `fiscal-strength-index-prefecture` | secondary | **削除/関連導線** | `local-finance`の主責務 |

## 現行チャートの提案

| componentKey | 提案 | 理由 / 実装 |
|---|---|---|
| `theme-industry-structure` | **keep/reframe** | 就業者構成であり付加価値構成ではないことを明記。可能なら両者を並置 |
| `theme-economy-income-wage` | **削除** | 課税所得と最低賃金は単位・分母・概念が異なる |
| `theme-economy-job-market` | **labor-mobilityへ移管/重複削除** | 雇用市場のchartで地域経済のコアではない |
| `theme-le-establishments-trend` | **context keep** | センサス実施年のみ点表示し、年次推移のように補間しない |
| markdown 3件 | **rewrite / 関連記事化** | 時点依存の政策・将来計画を削り、経済指標の読み方へ集中 |

### 追加チャート

1. **名目県内総生産と実質成長率**: 単位が異なるためsmall multiples。
2. **産業別付加価値構成**: stacked barまたはdonut。就業者構成と混同しない。
3. **県内総生産 vs 1人当たり県民所得**: 規模と所得水準を別panelで表示。
4. **経済センサス事業所数**: 調査年のみの点・棒。年次lineにしない。

## 推奨表示順

1. 県内総生産（名目）
2. 実質経済成長率
3. 産業別付加価値構成
4. 産業別就業者構成
5. 1人当たり県民所得・課税所得
6. 事業所数
7. 労働・財政・産業別テーマへの導線
8. 定義 / FAQ
9. 全指標

## 不採用・保留

| 候補 | 判定 | 理由 / 再検討条件 |
|---|---|---|
| 県内総生産が大きい=住民が豊か | 不採用 | 人口規模と域外への所得流出入を含まない評価になる |
| 1人当たり県民所得=個人の給与 | 不採用 | 企業所得・財産所得等を含む地域経済計算上の指標 |
| 課税所得/納税義務者=全住民の平均所得 | 不採用 | 非納税者を分母に含まない |
| 名目成長率と実質成長率の混同 | 不採用 | 価格変動の扱いが異なる |
| 異なる基準年の系列を無注記で接続 | 不採用 | 基準改定で水準・成長率が変わり得る |
| 最低賃金・求人・財政力をコア経済指標の代替にする | 不採用 | 各専門テーマの指標でGDPを代替できない |

## Claude Code実装指示

### PR-0: コア指標調達・系列監査

1. 最新の県民経済計算から名目県内総生産、実質成長率、産業別付加価値、県民所得の47県比較可能性を調査
2. 基準年、対象年度、公表日、遡及改定、単位を一覧化
3. `per-capita-prefectural-income-h27`更新候補と旧URL/キー互換方針を決定
4. 課税所得の分子・分母・対象者を公式表と照合
5. catalog説明と登録指標の差分を確定し、結果を本文書へ追記

### PR-1: ThemeCatalog再構成

編集SSOT: `packages/data-configs/src/theme-catalog/local-economy.ts`

1. コア3指標を追加し、専門テーマ指標を関連導線へ移す
2. 上表に従いroleを整理し、primary/secondaryへ`selection`を追加
3. 異単位chartを分割し、センサス非調査年を補間しない
4. `sourceLink/rankingLink/relatedRankingKeys`を補完
5. section内`sortOrder`を一意化
6. guidanceを追加し、長文markdownを指標解説中心に短縮

### 禁止

- 県民所得を個人の給与・手取りと呼ばない
- 納税義務者当たり値を全住民平均と呼ばない
- 名目値と実質値、総額と1人当たりを同じ尺度で順位化しない
- 基準改定を跨いで線を無条件に接続しない
- GDP不在のまま「GDP比較」と説明しない
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

- 説明に掲げるコア指標がmetrics/chartsに存在する
- 全コア指標で名目/実質、総額/1人当たり、基準年、対象年を確認できる
- 専門テーマとの重複primary/chartがない
- センサス非調査年を連続年データとして表示しない
- `no-selection / dup-sortorder / primary-orphan`が0
- R2 push / deployを行っていない

## 採用決定

**県内総生産等のコア指標が確保されるまで実装をブロックする。現行の雇用・賃金・財政指標による代用は解消する。**
