# アフィリエイト戦略メモ

詳細は `docs/90_課題管理/アフィリエイト戦略.md` に記載。

## 要点

- 2方式: インライン（frontmatter `affiliate` + `:::affiliate`）/ 自動配置（タグベース、記事末尾）
- 現行8カテゴリ: labor, housing, population, economy, health, energy, tourism, furusato
- ~~A8.net URL はすべて TODO 状態（2026-03-06時点）~~ → **訂正 (2026-06-13)**: STRATEGY CAREER(エンジニア転職)・転職サイトバナー(af_labor_banner_001)・AI Agent Camp は **本物の px.a8.net URL が稼働中**。A8.net アカウントは提携済。SSOT は `apps/web/scripts/affiliate-ads-data.ts`。医療専門職特化ASP(薬剤師/看護師/介護)は未提携 — 要申請
- economy カテゴリ（12記事）が広すぎるため分割推奨（investment / household / industry）
- ミスマッチ商材: socialsecurity→chocoZAP, energy→クリクラ, tourism→カーセンサー

## 推奨アフィリエイト（カテゴリ別）

| カテゴリ | 現行 | 推奨 |
|---------|------|------|
| labor | リクルートエージェント | そのまま（高マッチ） |
| housing | 引越し侍 | そのまま + リノベ見積り追加 |
| population | Pairs | そのまま（婚姻系に高マッチ） |
| economy→investment | SBI証券 | SBI証券 / 楽天証券（NISA） |
| economy→household | SBI証券 | マネーフォワード / 家計簿アプリ |
| economy→industry | SBI証券 | なし（無理に貼らない） |
| health | chocoZAP | 健康寿命系記事のみ残す |
| socialsecurity | chocoZAP | 見守りサービス / 介護施設検索 |
| energy | クリクラ | 電力比較サイト / 省エネ家電 |
| tourism | カーセンサー | 楽天トラベル / じゃらん |
| furusato | さとふる | そのまま（高マッチ） |
| safety | (未設定) | 自動車保険一括見積り |

## 記事別推奨（インライン方式、上位10件）

| 記事 | 推奨商材 |
|------|---------|
| real-wage-ranking | doda / ビズリーチ |
| marriage-unmarried-crisis | Pairs / with |
| vacant-house-rate-ranking | 空き家バンク / リノベ見積り |
| savings-balance-ranking | SBI証券 / 楽天証券（NISA） |
| consumer-price-regional-gap-ranking | 引越し見積り / マネーフォワード |
| unemployment-rate-ranking | リクルートエージェント |
| education-expenses-gap | 学資保険 / 教育ローン |
| fiscal-strength-ranking | さとふる / ふるなび |
| nursing-care-infrastructure-ranking | 見守りサービス / 介護施設検索 |
| population-migration-tokyo-concentration | 引越し侍 / 地方移住支援 |
