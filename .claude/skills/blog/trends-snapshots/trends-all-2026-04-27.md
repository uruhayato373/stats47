# 統合トレンド × stats47 マッチング結果

> 調査日時: 2026-04-27
> ソース: Google Trends + Google News + GSC (last28d / prev28d 比較)
> 注: はてブ・Yahoo!ニュース・note.com は stats47 マッチ率が低いため省略
> トレンド総数: 外部 11 件 + GSC 22 件 = 33 件
> 採用: 3 件 / 既存記事被りで除外: 4 件 / 関連性低で除外: 7 件

## サマリー: 自サイト需要 (GSC) > 外部トレンド

外部トレンド (Google Trends / News) は社会全般のテーマで stats47 のクロスマッチが弱い (大坂なおみ・幕張メッセ・AI・自動車産業・地震など)。最大の機会は **GSC で既に検索されている自サイト実需要**。前期比 +175-500% の急上昇クエリが多数あり、これらを中心に企画する。

## Top 候補 (採用)

### 候補 1: 「病床利用率ランキング47都道府県 — 医療需給のミスマッチを可視化」 ⭐ 最優先

- **GSC スコア**: Imp 計 **284** (4 クエリ集約)、Pos 4.3-6.0 (1 ページ目上位)
  - 「一般病床の病床利用率が最も高い都道府県」3 表現で計 284 Imp、すべて新規クエリ (前期 0 → 今期)
- **DB マッチ**: ranking_items 多数 — `general-hospital-bed-count-per-100k` (一般病院病床数), `avg-daily-inpatients-general-hospital-per-100k` (1日平均在院患者数), `inpatient-rate-per-100k` (入院受療率, B1+B3 強化済)
- **既存記事被り**: なし (既存は `pharma-medical-device-production-map` のみで生産側、需給は空白)
- **記事の切り口**:
  1. 病床数 ÷ 在院患者数 = 病床利用率 を 47 県で計算
  2. 高い県（高知・鹿児島）は何が違うか — 高齢化率・受療率との相関
  3. 低い県（神奈川・愛知）は供給過剰か需要不足か
- **内部リンク先**: `/ranking/inpatient-rate-per-100k` (B1+B3 強化済), `/ranking/general-hospital-bed-count-per-100k`, `/blog/health-life-expectancy-structure` (B1+B3 強化済)
- **キーワード辞書追加見込**: 5-10 個 (病床利用率 / 都道府県別 / 医療需給 / 病床稼働率 / 在院日数 等)

### 候補 2: 「47都道府県 食卓マップ — 豆腐・焼酎・昆布の急上昇 3 食材で見える食文化」

- **GSC スコア**: 豆腐 +500% (2→12)、焼酎 +400% (2→10)、昆布 計 51 Imp (新規) — 食材消費系が同時急上昇
- **DB マッチ**: `tofu-consumption-quantity`, `shochu-consumption-quantity`, `konbu-consumption-quantity` の 3 ranking が揃っている (各 ranking ページへの内部リンク集約記事として価値)
- **既存記事被り**: `food-consumption-prefecture-battle` (家計調査総合) と `food-spending-pattern` (食支出割合) あり。本候補は **3 食材ピンポイント** で被り回避
- **記事の切り口**:
  1. 「豆腐・焼酎・昆布」3 食材の 47 県ランキングを 1 ページに集約
  2. それぞれの 1 位県が示す食文化（沖縄の豆腐・鹿児島の焼酎・北海道の昆布）
  3. 内部リンクハブとして 3 ranking ページを束ねる
- **内部リンク先**: 上記 3 ranking ページ + 既存 `food-consumption-prefecture-battle`
- **キーワード辞書追加見込**: 8-15 個

### 候補 3: 「都道府県別 県債残高ランキング — 1 人あたり所得で割って見える地方財政の現実」

- **GSC スコア**: 県債 +175% (4→11)、地方債 +175% (実測値継続)、所得 +160% (5→13)
- **DB マッチ**: `local-debt-current-ratio` (地方債現在高の割合), `local-bonds-prefecture` (地方債), `per-capita-kenmin-shotoku-h23` (1人当たり県民所得)
- **既存記事被り**: `per-capita-income-gap`, `prefectural-income-gdp-ranking` あるが、いずれも「所得」側のみで「**負債側 (県債)**」は未カバー
- **記事の切り口** (独自性高):
  1. 県債残高を「1 人あたり県民所得」で割って **家計負担換算** (例: 1 人あたり 100 万円相当の県債) に変換
  2. 上位県と下位県の財政体力差を可視化
  3. 既存 `per-capita-income-gap` への内部リンクで読者導線
- **内部リンク先**: 上記 3 ranking + 既存記事 2 本
- **キーワード辞書追加見込**: 10-15 個

## 除外 (既存記事被り)

| トレンド | 既存記事 | 除外理由 |
|---|---|---|
| 公園が多い県 (GSC Imp 12) | `urban-parks-green-infrastructure`, `park-green-space-gap` | 既に深く扱っている |
| 道の駅 (GSC Imp 14) | なし、ただし候補 1-3 より優先度低 | 単独記事ではボリューム不足 |
| 健康寿命 2023 (GSC Imp 104) | `health-life-expectancy-structure` (B1+B3 強化済) | 既存記事の強化で対応済 |
| 高卒初任給 (GSC +190%) | ranking ページ強化済 (B1+B3) | DB 上のメタデータ更新で対応済 |
| 自動車産業 (Trends ヒット) | `automotive-industry-transformation-map` | 既存ブログあり |

## 除外 (関連性低)

| トレンド | ソース | 除外理由 |
|---|---|---|
| 大坂なおみ | Google Trends | 個人スポーツで地域統計と弱い |
| トイストーリー一番くじ | Google Trends | 単発イベント |
| AI 東大首席合格 | Google News | 教育格差データとは間接的 |
| 日経平均最高値 | Google News | マクロ経済で 47 都道府県粒度なし |
| 日産・大和証券 | Google News | 個別企業ニュース |
| 北海道地震 | Google News | 単発災害イベント |
| iPhone 新製品 | Google News | グローバル製品ニュース |

## 推奨実行順序

| 順 | 候補 | 想定執筆時間 | 期待 Imp 増 (3 ヶ月) |
|---|---|---|---|
| 1 | 病床利用率ランキング | 2-3h | +200-400 (Pos 上位の集約効果) |
| 2 | 食卓マップ (豆腐/焼酎/昆布) | 2-3h | +100-200 |
| 3 | 県債 × 所得分析 | 3-4h (独自指標計算あり) | +50-150 |

合計 7-10h で 3 本完了。1 本目（病床利用率）が最優先で、これだけでも GSC 既存 Imp 284 の Click 化が見込める。

## 次のアクション

- [ ] **B2-1**: `/plan-blog-articles` で病床利用率ランキング記事の企画書作成
- [ ] **B2-1**: `/fetch-article-data` で関連 ranking_data 取得
- [ ] **B2-1**: `/generate-article-charts` でチャート 3-5 個生成
- [ ] **B2-1**: 記事執筆 (mdx) → `/publish-article` で公開
- [ ] B2-2 (食卓マップ) と B2-3 (県債) は B2-1 の効果観測後に着手

## ソースデータ

- GSC last28d / prev28d 比較: `.claude/state/metrics/gsc/gsc-trending-2026-W17.csv`
- GSC ヒット URL マトリクス: `.claude/state/metrics/gsc/page2-targets-2026-W17.csv`
- GSC URL 集約: `.claude/state/metrics/gsc/page2-url-aggregated-2026-W17.csv`
