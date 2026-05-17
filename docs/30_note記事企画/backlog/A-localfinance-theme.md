---
type: note-plan
series: A
category: administrativefinancial
status: active
created: 2026-03-12
updated: 2026-05-17
tags: [localfinance, 公務員, 地方財政]
---

# 地方財政テーマ note 企画

> 2026 年 3 月発足。`/post-note-ranking` での量産対象 (A シリーズ) と読み物型企画 (B シリーズ) を管理。
> 元ファイル: `docs/30_note記事企画/地方財政テーマ企画_202603.md` (2026-05-17 削除、git log で参照可)

## 公開済み (4 本)

| 記事 | note URL |
|---|---|
| 経常収支比率ランキング | https://note.com/stats47/n/ne31a2574e231 |
| 実質公債費比率ランキング | https://note.com/stats47/n/n04d95ae14bc1 |
| 将来負担比率ランキング | https://note.com/stats47/n/n5f183fcf5b97 |
| 実質収支比率ランキング | https://note.com/stats47/n/n567416b632f6 |

## 原稿作成済み・未公開

| 記事 | フォルダ | 状態 |
|---|---|---|
| 財政健全化法の 4 指標 (ピラー記事) | `b-fiscal-health-4-indicators` | レビュー待ち |

## A シリーズ (量産型・DB 登録済み)

`/post-note-ranking` で記事生成可能。優先生成は **A-F17 / A-F18 / A-F10** から。

### 歳出構造系 (A-F1 〜 A-F9)

| # | ranking_key | 指標名 |
|---|---|---|
| A-F1 | `personnel-expenditure-ratio-pref-finance` | 人件費割合 |
| A-F2 | `welfare-expenditure-ratio-pref-finance` | 民生費割合 |
| A-F3 | `education-expenditure-ratio-pref-finance` | 教育費割合 |
| A-F4 | `public-works-expenditure-ratio-pref-finance` | 土木費割合 |
| A-F5 | `police-expenditure-ratio-pref-finance` | 警察費割合 |
| A-F6 | `commerce-industry-expenditure-ratio-pref-finance` | 商工費割合 |
| A-F7 | `agriculture-forestry-fisheries-expenditure-ratio-pref-finance` | 農林水産業費割合 |
| A-F8 | `sanitation-expenditure-ratio-pref-finance` | 衛生費割合 |
| A-F9 | `assistance-expenditure-ratio-pref-finance` | 扶助費割合 |

### 1 人当たり指標系 (A-F10 〜 A-F16)

| # | ranking_key | 指標名 |
|---|---|---|
| A-F10 | `per-capita-education-expenditure-pref-municipal` | 1 人当たり教育費 |
| A-F11 | `per-capita-child-welfare-expenditure-under17-pref-municipal` | 1 人当たり児童福祉費 |
| A-F12 | `per-capita-elderly-welfare-expenditure-65plus-pref-municipal` | 1 人当たり老人福祉費 |
| A-F13 | `per-capita-welfare-expenditure-pref-municipal` | 1 人当たり民生費 |
| A-F14 | `per-capita-total-expenditure-pref-municipal` | 1 人当たり歳出決算総額 |
| A-F15 | `per-capita-police-expenditure-pref-municipal` | 1 人当たり警察費 |
| A-F16 | `per-capita-public-works-expenditure-pref-municipal` | 1 人当たり土木費 |

### 歳入構造系 (A-F17 〜 A-F20)

| # | ranking_key | 指標名 |
|---|---|---|
| A-F17 | `local-tax-ratio-pref-finance` | 地方税割合 |
| A-F18 | `local-allocation-tax-ratio-pref-finance` | 地方交付税割合 |
| A-F19 | `per-taxpayer-taxable-income` | 課税対象所得 |
| A-F20 | `per-capita-inhabitant-tax-pref-municipal` | 1 人当たり住民税 |

### 職員数系 (A-F21)

| # | ranking_key | 指標名 |
|---|---|---|
| A-F21 | `prefectural-general-administration-staff` | 一般行政部門職員数 (都道府県) |

### 公務員給与系 (A-F22 〜 A-F31、総務省 地方公務員給与実態調査)

DB 登録済み (13 年分: 2012-2024)。`data_source: soumu`、団体コード付き 47 行構造。

| # | ranking_key | 指標名 |
|---|---|---|
| A-F22 | `laspeyres-index-prefecture` | ラスパイレス指数 (14 年分) |
| A-F23 | `avg-salary-admin-prefecture` | 一般行政職 平均給与月額 |
| A-F24 | `avg-age-admin-prefecture` | 一般行政職 平均年齢 |
| A-F25 | `avg-salary-police-prefecture` | 警察職 平均給与月額 |
| A-F26 | `avg-salary-education-prefecture` | 教育公務員 平均給与月額 |
| A-F27 | `avg-salary-all-prefecture` | 全職種 平均給与月額 |
| A-F28 | `governor-salary-prefecture` | 知事 給料月額 |
| A-F29 | `retirement-allowance-admin-prefecture` | 一般行政職 定年退職者平均退職手当 |
| A-F30 | `bonus-admin-prefecture` | 一般行政職 期末・勤勉手当 (ボーナス) |
| A-F31 | `overtime-pay-admin-prefecture` | 一般行政職 時間外勤務手当 |

## B シリーズ (読み物型)

| # | テーマ | 使用指標 | 切り口 |
|---|---|---|---|
| B-F1 | 自力で稼ぐ県 vs 交付税頼みの県 | 地方税割合 × 交付税割合 | 「財政の自立度」を可視化 |
| B-F2 | 教育にお金を使う県は学力も高いのか？ | 1 人当たり教育費 × 学力テスト | 投資と成果の関係 |
| B-F3 | 民生費の急増が財政を圧迫する構造 | 民生費割合の時系列変化 | 高齢化 × 福祉費の構造問題 |
| B-F4 | 財政健全化法の 4 指標 (作成済み) | 4 指標クロス分析 | ピラー記事 |

## 優先順位

1. ~~ラスパイレス指数を DB 登録~~ ✅ 完了 (14 年分: H24 〜 R7)
2. `b-fiscal-health-4-indicators` を `/edit-note-draft` でレビュー → 公開
3. A シリーズ: A-F17 (地方税割合) / A-F18 (交付税割合) / A-F10 (1 人当たり教育費) を優先生成
4. B シリーズ: B-F1 (自力で稼ぐ県 vs 交付税頼みの県) を企画・執筆
5. SNS コンテンツ生成・投稿 → [`docs/10_SNS戦略/04_地方財政テーマSNS展開.md`](../../10_SNS戦略/04_地方財政テーマSNS展開.md) 参照

## ラスパイレス指数 データ取得手順 (年次更新用)

- ranking_key: `laspeyres-index-prefecture`
- data_source: `soumu` (総務省報道発表、adapter_type: manual)
- ソース URL:
  - 最新年度 (R7〜): 総務省報道発表 PDF — https://www.soumu.go.jp/iken/kyuyo.html
  - 過去年度 (〜R6): 地方公務員給与実態調査 Excel — https://www.soumu.go.jp/main_sosiki/jichi_gyousei/c-gyousei/teiin-kyuuyo02.html
- Excel 構造: シート名 `都道府県(47)` (または類似)、C 列 = 団体コード、E 列 = ラスパイレス指数
- H24 (2012) は `.xls`、H25 (2013) 以降は `.xlsx`
- 団体コード → area_code 変換: 先頭 2 桁 (例: `010006` → `01`)
- **注意**: H24-H25 の値 (100〜112) は異常値ではない。国家公務員給与が東日本大震災復興のため臨時削減された結果の相対変動
- 更新手順: 総務省ページから PDF/Excel 取得 → Python パース (`openpyxl` / `xlrd`) → 47 県分 JSON 生成 → `better-sqlite3` でローカル D1 へ INSERT → `indicators` の `available_years`・`latest_year` を UPDATE → `/sync-snapshots` で R2 反映
