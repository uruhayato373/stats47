---
type: theme-catalog-review
date: 2026-07-11
status: ready-after-content-audit
theme: consumer-prices
tags: [theme-catalog, consumer-prices, regional-price-index, charts]
---

# テーマレビュー: consumer-prices（物価・消費）

## 結論

主問は、**同じ年の全国平均と比べて、その都道府県では何が相対的に高い／低いか**とする。

このテーマの中心は小売物価統計調査（構造編）の「消費者物価地域差指数」である。全国CPIの前年同月比、家計の支出額、所得控除後の購買力は別概念として分離する。

読み順は次の3層にする。

1. **総合水準**: 総合、家賃を除く総合
2. **費目別構造**: 食料、住居、光熱・水道、交通・通信等
3. **家計への接続**: 所得との関係は `real-income`、家賃は `living-housing` へ誘導

## P0: 実装前コンテンツ監査

現行catalogの解説・FAQには2023〜2025年の時点値と政策目標が長文で固定されている。地域差指数の説明に、全国CPIの前年比、米類の上昇率、実質賃金、GX、物流、デジタル赤字まで混在しているため、ThemeCatalog是正前に次を行う。

- 地域差指数と全国CPI前年比を同じランキングの説明として扱わない
- 「現在」「足元」等の相対日付を、基準年月付き表現へ変更するか削除
- 数値・政策目標は一次資料、対象期間、定義が確認できるものだけ残す
- テーマの主問から外れるGX・物流・国際収支は関連記事へ移し、テーマ本文を短くする
- 東京都・鹿児島県等の具体値はsnapshot年と一致する場合だけ掲載する

## 公式根拠

### 総務省統計局「小売物価統計調査（構造編）」

- URL: https://www.stat.go.jp/data/kouri/kouzou/index.html
- 地域差指数は、同一年の地域間物価水準を全国平均=100として比較する
- 総合と10大費目等ではウエイトが異なるため、指数差を単純合算しない
- 年次・対象品目・家賃の扱いを表示時に明記する

### 総務省統計局「消費者物価指数（CPI）」

- URL: https://www.stat.go.jp/data/cpi/
- 全国CPIの前年同月比・前月比は時系列の価格変化であり、地域差指数とは別の問い
- 全国のインフレ動向を扱う場合は、地域ランキングとは別section・別chartにする

## テーマ境界

| テーマ | 責務 |
|---|---|
| `consumer-prices` | 同一年における地域間の総合・費目別物価水準 |
| `real-income` | 可処分所得を物価で補正した購買力 |
| `living-housing` | 家賃、住宅費、住宅ストック |
| `labor-wages` | 名目・実質賃金と労働条件 |

## 現行指標の提案

| rankingKey | 現行 role | 提案 | 理由 |
|---|---|---|---|
| `consumer-price-difference-index-overall` | primary | **primary keep** | テーマの基準。ただし全国=100と基準年を常時表示 |
| `consumer-price-difference-index-overall-excl-rent` | secondary | **primaryへ変更** | 住居費が総合順位へ与える影響を切り分ける対照軸 |
| `consumer-price-difference-index-food` | secondary | **secondary keep** | 必需費目の地域差 |
| `consumer-price-difference-index-housing` | secondary | **secondary keep** | 総合差の主要因を読む。家賃詳細はliving-housingへ |
| `consumer-price-difference-index-utilities` | secondary | **secondary keep** | 気候・料金体系の地域差を読む |
| その他7費目 | context | **context keep** | プロファイルと全指標で補完。primaryへ増やさない |

全12指標は必要だが、トップ画面で同格に並べない。総合2件と主要3費目を先に見せ、残りはプロファイルまたは全指標へ集約する。

## 現行チャートの提案

| componentKey | 提案 | 理由 / 実装 |
|---|---|---|
| `theme-cpi-profile` | **keep / 最優先** | 選択都道府県の費目別指数を全国=100の基準線付きで表示 |
| `theme-cpi-living-cost` | **audit / rename** | データが年次推移なら基準改定・系列接続を確認。単年比較なら「推移」を外す |
| `theme-cpi-heatmap` | **keep / rename候補** | 年軸がなければ「物価推移」ではなく「費目別物価ヒートマップ」 |
| `md-cpi-discussion` | **rewrite** | 地域差の読み方に限定し、時点依存の全国物価ニュースを分離 |
| `md-cpi-related-topics` | **関連記事へ移動** | GX・物流・デジタル赤字は主問から遠い |
| `md-cpi-faq` | **rewrite** | 定義・基準年・総合/家賃除く総合・インフレ率との違いを中心にする |

### 追加・改善チャート

1. **総合 vs 家賃除く総合**: 2系列比較。住居寄与の方向を読みやすくする。
2. **費目別プロファイル**: 全国=100の基準線を必須とし、指数差を金額差と誤認させない。
3. **費目別ヒートマップ**: 行=費目、列=都道府県または逆。色域は100を中心にした発散色とする。
4. **時系列**: 同一定義で比較可能な年だけ採用。基準改定を跨ぐ場合は注記または非連結表示。

## 推奨表示順

1. 総合と家賃除く総合
2. 費目別プロファイル
3. 食料・住居・光熱水道
4. 費目別ヒートマップ
5. 定義と読み方の短い解説
6. 関連テーマ導線
7. FAQ
8. 全指標

## 不採用・保留

| 候補 | 判定 | 理由 / 再検討条件 |
|---|---|---|
| 地域差指数をインフレ率と呼ぶ | 不採用 | 水準差と変化率は別概念 |
| 指数1ポイントを一律の円額へ換算 | 不採用 | 世帯構成・支出ウエイトなしでは換算できない |
| 高物価=暮らしにくいという単独評価 | 不採用 | 所得、住宅、サービス水準との併読が必要 |
| 時点依存の物価ニュースをcatalog本文へ固定 | 不採用 | 更新不能になりやすい。記事または年月付きデータへ分離 |
| 基準改定を跨いだ無注記line chart | 保留 | 接続可能性の検証後のみ採用 |

## Claude Code実装指示

### PR-0: 内容・データ意味監査

1. `theme-cpi-living-cost` と `theme-cpi-heatmap` の実データに年軸があるか確認
2. `statsDataId`、分類コード、表示年、基準年を公式メタデータと照合
3. markdown 3件の全数値・相対日付・因果表現を一次資料で監査
4. 主問外の段落を記事へ移すか削除し、結果を本文書へ追記

### PR-1: ThemeCatalog是正

編集SSOT: `packages/data-configs/src/theme-catalog/consumer-prices.ts`

1. 総合・家賃除く総合をprimary、主要3費目をsecondaryに整理
2. primary/secondaryへ公式根拠付き `selection` を追加
3. chartタイトルを実際の次元（単年/時系列）と一致させる
4. `sourceLink/rankingLink/relatedRankingKeys` を補完
5. `sortOrder`をsection内で一意化
6. 長文markdownを地域差指数の読み方中心に短縮
7. `.claude/skills/theme/manage-theme-portfolio/reference/theme-guidance-implementation.md` に従い `guidance` を追加

### 禁止

- 地域差指数と前年同月比を同じ意味で表示しない
- 基準年・対象年の異なる指数を無注記で線接続しない
- 指数差を家計の円額差と断定しない
- catalogに時点依存ニュースを長期固定しない
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

- 単年チャートに「推移」が残っていない
- 全chartで対象年・全国=100・出典を確認できる
- primary/secondaryの `no-selection / dup-sortorder / primary-orphan` が0
- 地域差指数とインフレ率の違いがcardとFAQで説明される
- markdown内の時点依存数値に年月と一次資料がある
- guidanceなしテーマの表示を壊さない
- R2 push / deployを行っていない

## 採用決定

**PR-0の内容・データ意味監査後に実装可能。指標自体の削除候補はなく、情報階層とチャート名称、長文コンテンツの整理が中心である。**
