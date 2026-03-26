# 賃金構造基本統計調査 — 職種別・都道府県別データ

statsDataId: `0003445758`（令和2年以降 一般_都道府県別_職種（特掲）DB）

厚生労働省の賃金構造基本統計調査から、**145職種 × 47都道府県 × 4年度（2020-2023）** の賃金データを取得できる。

## データ構造

通常の社人統（cdCat01 で指標を指定）とは異なる構造を持つ。

| パラメータ | 意味 | 値 |
|---|---|---|
| `cdCat01` | 性別 | `01`=男女計, `02`=男, `03`=女 |
| `cdCat02` | **職種コード** | `1163`=保育士, `1133`=看護師 等（後述の全一覧参照） |
| `cdTab` | 表章項目 | 下表参照 |
| `cdArea` | 地域 | `00000`=全国, `01000`〜`47000`=都道府県 |
| `cdTime` | 年度 | `2023000000`, `2022000000`, `2021000000`, `2020000000` |

### 表章項目（tab コード）

男女計（`cdCat01=01`）の場合は 30番台を使用:

| tab | 内容 | 単位 |
|---|---|---|
| `33` | 年齢 | 歳 |
| `34` | 勤続年数 | 年 |
| `36` | 所定内実労働時間数 | 時間 |
| `38` | 超過実労働時間数 | 時間 |
| `40` | **きまって支給する現金給与額** | 千円 |
| `42` | 所定内給与額 | 千円 |
| `44` | **年間賞与その他特別給与額** | 千円 |
| `45` | 労働者数 | 十人 |

男（`cdCat01=02`）・女（`cdCat01=03`）の場合は 01〜12 番台（同構造）。

### 年収計算式

```
年収（万円） = (tab:40 × 12 + tab:44) ÷ 10
```

## 登録済みランキングキー（39件）

### Batch 1（基本6職種）
| ranking_key | 職種コード | 職種名 |
|---|---|---|
| `nursery-teacher-annual-income` | 1163 | 保育士 |
| `nurse-annual-income` | 1133 | 看護師 |
| `care-worker-annual-income` | 1361 | 介護職員（医療・福祉施設等） |
| `cleaning-worker-annual-income` | 1712 | 清掃員（ビル・建物を除く），廃棄物処理従事者 |
| `software-engineer-annual-income` | 1104 | ソフトウェア作成者 |
| `doctor-annual-income` | 1121 | 医師 |

### Batch 2（追加25職種）
| ranking_key | 職種コード | 職種名 |
|---|---|---|
| `pharmacist-annual-income` | 1124 | 薬剤師 |
| `dentist-annual-income` | 1122 | 歯科医師 |
| `physical-therapist-annual-income` | 1144 | 理学療法士，作業療法士，言語聴覚士，視能訓練士 |
| `system-consultant-annual-income` | 1101 | システムコンサルタント・設計者 |
| `taxi-driver-annual-income` | 1612 | タクシー運転者 |
| `truck-driver-annual-income` | 1614 | 営業用大型貨物自動車運転者 |
| `carpenter-annual-income` | 1661 | 大工 |
| `electrician-annual-income` | 1671 | 電気工事従事者 |
| `cook-annual-income` | 1391 | 飲食物調理従事者 |
| `barber-beautician-annual-income` | 1381 | 理容・美容師 |
| `security-guard-annual-income` | 1453 | 警備員 |
| `school-teacher-annual-income` | 1192 | 小・中学校教員 |
| `university-professor-annual-income` | 1196 | 大学教授（高専含む） |
| `sales-clerk-annual-income` | 1321 | 販売店員 |
| `manager-annual-income` | 1031 | 管理的職業従事者 |
| `pilot-annual-income` | 1624 | 航空機操縦士 |
| `bus-driver-annual-income` | 1611 | バス運転者 |
| `designer-annual-income` | 1224 | デザイナー |
| `practical-nurse-annual-income` | 1134 | 准看護師 |
| `midwife-annual-income` | 1132 | 助産師 |
| `accountant-annual-income` | 1181 | 公認会計士，税理士 |
| `architect-annual-income` | 1091 | 建築技術者 |
| `dental-hygienist-annual-income` | 1146 | 歯科衛生士 |
| `auto-mechanic-annual-income` | 1553 | 自動車整備・修理従事者 |
| `dietitian-annual-income` | 1151 | 栄養士 |

### 既存登録（社人統・別テーブル経由）
| ranking_key | 内容 | statsDataId |
|---|---|---|
| `scheduled-salary-male` / `male-scheduled-earnings` | 所定内給与額（男） | 0000010106 |
| `female-scheduled-earnings` | 所定内給与額（女） | 0000010106 |
| `gender-wage-gap` | 男女間賃金格差 | 0000010106 |
| `nurse-salary` | 看護師の給与（所定内） | — |
| `starting-salary-highschool` | 高卒初任給 | 0003445959 |
| `starting-salary-university` | 大卒初任給 | 0003445959 |

## 未登録の主要職種（将来の候補）

以下は検索需要は中程度だが、テーマページやブログ記事で活用しうる職種:

| コード | 職種名 | 活用シナリオ |
|---|---|---|
| 1051 | 研究者 | 研究者の処遇テーマ |
| 1073 | 機械技術者 | 製造業テーマ |
| 1092 | 土木技術者 | 建設業テーマ |
| 1109 | その他の情報処理・通信技術者 | IT人材テーマ |
| 1131 | 保健師 | 公衆衛生テーマ |
| 1168 | 介護支援専門員（ケアマネージャー） | 介護テーマ |
| 1191 | 幼稚園教員，保育教諭 | 保育テーマ |
| 1194 | 高等学校教員 | 教育テーマ |
| 1197 | 大学准教授 | 研究者テーマ |
| 1362 | 訪問介護従事者 | 介護テーマ |
| 1371 | 看護助手 | 医療テーマ |
| 1613 | 乗用自動車運転者 | 運輸テーマ |
| 1615 | 営業用貨物自動車運転者（大型除く） | 物流テーマ |
| 1616 | 自家用貨物自動車運転者 | 物流テーマ |
| 1681 | 土木従事者，鉄道線路工事従事者 | インフラテーマ |

## 登録スクリプトのパターン

新しい職種を追加する場合は、以下のパターンで年収を計算して INSERT する:

```javascript
// e-Stat API から全都道府県データを取得（cdCat01=01: 男女計）
const url = `https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData?appId=${KEY}&statsDataId=0003445758&cdCat01=01&cdCat02=${code}&limit=100000`;

// tab:40（月給）と tab:44（賞与）をグルーピングして年収計算
// 年収（万円）= (monthly * 12 + bonus) / 10
```

survey_id は `wage-structure-survey`（surveys テーブル登録済み）を設定すること。

## 年次推移データ（旧テーブル: 2009-2019）

statsDataId: `0003084962`（令和元年以前 都道府県×職種DB）で **2009-2019年** のデータが取得可能。
現在登録済みの `0003445758`（2020-2023）と合わせると **最大15年間の推移** が描ける。

### 旧テーブルのデータ構造の違い

| 項目 | 新テーブル(0003445758) | 旧テーブル(0003084962) |
|---|---|---|
| 性別指定 | `cdCat01` で分離 (01=男女計) | **職種コードに性別が含まれる** (例: 0134=医師男女計) |
| 職種指定 | `cdCat02` | `cdCat01` |
| 職種コード体系 | 1031〜9999 | 0001〜0228 |
| time コード | `2023000000` (10桁) | `20190000000` (11桁、2019年のみ)、他は10桁 |
| 表章項目(tab) | 同じ (40=月給, 44=賞与) | 同じ |

### 旧 → 新 職種コード対応表（男女計）

| 旧コード | 新コード | 職種名 | ranking_key |
|---|---|---|---|
| 0134 | 1121 | 医師 | `doctor-annual-income` |
| 0135 | 1122 | 歯科医師 | `dentist-annual-income` |
| 0137 | 1124 | 薬剤師 | `pharmacist-annual-income` |
| 0138 | 1133 | 看護師 | `nurse-annual-income` |
| 0139 | 1134 | 准看護師 | `practical-nurse-annual-income` |
| 0144 | 1163 | 保育士 | `nursery-teacher-annual-income` |
| 0228 | 1361 | 福祉施設介護員 → 介護職員 | `care-worker-annual-income` |
| 0226 | 1168 | 介護支援専門員 | （未登録） |
| 0133 | 1104 | プログラマー → ソフトウェア作成者 | `software-engineer-annual-income` |
| 0151 | 1196 | 大学教授 | `university-professor-annual-income` |
| 0150 | 1194 | 高等学校教員 | （未登録） |
| 0155 | 1224 | デザイナー | `designer-annual-income` |
| 0165 | 1391 | 調理士 → 飲食物調理従事者 | `cook-annual-income` |
| 0168 | 1453 | 警備員 | `security-guard-annual-income` |
| 0172 | 1612 | タクシー運転者 | `taxi-driver-annual-income` |
| 0213 | 1661 | 大工 | `carpenter-annual-income` |

**注意:** 旧テーブルの職種名と新テーブルの職種名が微妙に異なる場合がある（例: 「福祉施設介護員」→「介護職員（医療・福祉施設等）」）。時系列の連続性は担保されるが、厳密な同一母集団ではない点に留意。

### マージ手順

```javascript
// 1. 旧テーブルからデータ取得（cat01 に旧職種コードを指定）
const url = `https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData?appId=${KEY}&statsDataId=0003084962&cdCat01=0134&limit=100000`;
// 2. tab:40(月給) × 12 + tab:44(賞与) で年収計算（計算式は新テーブルと同じ）
// 3. 既存の ranking_data に INSERT（category_code は同じ ranking_key を使用）
// 4. ranking_items の available_years を更新
```

### テーマページへの活用案

「職業別年収」テーマページを作成する場合、15年推移チャートが最大の差別化要素になる:
- 医師年収の推移（2009-2023）— コロナ前後の変化
- 看護師 vs 介護職員の年収格差推移 — 処遇改善の効果検証
- IT人材（SE）の年収推移 — DX需要との相関
- トラック運転手の年収推移 — 2024年問題の文脈
- 保育士年収の推移 — 処遇改善加算の効果

## 活用シーン

| シーン | 使い方 |
|---|---|
| **引用RT** | バズツイートの職業別年収をファクトチェック |
| **ブログ記事** | 「都道府県別○○の年収ランキング」記事 |
| **テーマページ** | laborwage テーマに職業別年収セクションを追加 |
| **比較ページ** | 2県の職業別年収を比較 |
| **SNS投稿** | 職業別年収の棒グラフ画像で話題化 |
