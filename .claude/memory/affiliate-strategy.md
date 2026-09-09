# アフィリエイト戦略メモ

現行の運用正典は `.claude/rules/affiliate-ads-standards.md`、収益戦略は `docs/00_プロジェクト管理/02_収益化戦略.md`。

## 楽天返礼品の検索分類 (2026-09-08)

- **問題**: 日次同期が成功していても北海道・兵庫・沖縄等の返礼品が食事券に偏っていた。
- **原因**: `553283` をふるさと納税共通ジャンルと誤認して固定。実際は楽天のギフト券分類。
- **対策**: ギフト券genreの固定を食品genre `100227` へ変更し、返礼品キーワードと自治体ショップの県名一致で採用する。
  旧データは共有品質関数で再検証し、ショップ根拠と商品名だけの地域根拠を区別する。
  フォールバック検索も呼び出し間隔を守る。`rakuten-api.test.ts` で分類・地域除外・待機を固定する。
- **証拠**: [楽天の分類](https://www.rakuten.co.jp/category/553283/)、
  `apps/web/src/features/ads/lib/rakuten-api.ts`、正典ルール §12。

## 表示と配信のガード (2026-09-08)

- **問題**: 同一案件が本文・レールで繰り返され、画面の10%にしか入っていない広告も表示回数に入った。
- **原因**: IDだけではサイズ違い・配置違いの同一案件を識別できず、IntersectionObserverのthresholdを表示条件そのものと誤認していた。
- **対策**: `affiliate-delivery-policy.ts` で停止・対象key・programRef/URL重複を共通判定する。
  `AdImpressionTracker` は交差率とタブ可視性を確認し、退出時に待機と再試行を破棄する。
  旧snapshotの停止広告、人口/医療の文脈漏れ、連続1秒未満を回帰テストで検出する。
- **証拠**: adsの `affiliate-ad-snapshot.test.ts` / `affiliate-placement-safety.test.tsx` /
  `ad-impression-tracker.test.tsx`。計測境界は `analytics-event-standards.md` を参照し、前後CTRを単純比較しない。

以下は過去の戦略メモ。現行の軸・提携状態・採用条件は上記SSOTと運用台帳を優先する。

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
