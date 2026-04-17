# SNS メトリクス改善ログ

X / YouTube / Instagram / TikTok の投稿パフォーマンス（impressions / views / engagement）の継続追跡と改善施策の記録。

**運用ルール（gsc/ga4-improvement と同じ）:**
- Append-only。過去エントリは改変しない
- 日付は絶対日付（YYYY-MM-DD）
- 数値はソース明示（「snapshots/2026-04-10/metrics.csv より」）
- 施策とコミット hash をペアで記録
- snapshot ディレクトリは本ログと一緒にコミット

## データソース

- 時系列履歴: `.claude/skills/analytics/sns-metrics-improvement/snapshots/YYYY-MM-DD/metrics.csv`
- 最新値（cache）: D1 `sns_posts` テーブルの `impressions / likes / reposts / replies / bookmarks / metrics_updated_at` カラム
- 書き込みヘルパ: `.claude/scripts/lib/sns-metrics-store.cjs`
- 取得スキル: `/update-sns-metrics`

## 指標の意味（プラットフォーム別）

| 指標 | X | YouTube | Instagram | TikTok |
|---|---|---|---|---|
| impressions | 表示数 | — | — | — |
| views | — | 再生数 | — | 再生数 |
| likes | いいね | 高評価 | いいね | いいね |
| comments | リプライ | コメント | コメント | コメント |
| shares | リポスト | — | — | シェア |
| saves | ブックマーク | — | — | — |

---

## Baseline

**取得日**: 2026-03-29 / 2026-04-03 / 2026-04-10

| 取得日 | 合計行数 | 主要プラットフォーム |
|---|---:|---|
| 2026-03-29 | 139 | x, youtube |
| 2026-04-03 | 105 | x, youtube |
| 2026-04-10 | 31 | x, youtube |

（`snapshots/YYYY-MM-DD/metrics.csv` より、ヘッダ行含む wc -l カウント）

---

## Action Log

### 2026-04-17: D1 `sns_metrics` → ファイルへ移行

- 旧 D1 テーブル `sns_metrics` を `.claude/skills/analytics/sns-metrics-improvement/snapshots/YYYY-MM-DD/metrics.csv` に移行
- 理由: 「計測蓄積は .claude/ 配下のファイル」という記録先統一原則（CLAUDE.md §記録先の統一原則）を徹底。sns_metrics だけ D1 に残す例外を解消
- 書き込みヘルパ `.claude/scripts/lib/sns-metrics-store.cjs` を新設（`/update-sns-metrics` の各プラットフォーム reference から require）
- 最新値キャッシュ用の `sns_posts.impressions / likes / reposts / replies / bookmarks / metrics_updated_at` カラムはそのまま D1 に残す（運用データ）
- 既存 275 行のデータは日付別 CSV に移行済み
- コミット: (本コミットで確定)

---

## Observation Log

_（次回 `/update-sns-metrics` 実行後・週次レビュー時に追記）_

---

## Next Actions

- `/update-sns-metrics` を定期実行して時系列を厚くする
- `/sns-weekly-report` でプラットフォーム別エンゲージメント率の変動を観察
- 改善候補実験は `/nsm-experiment propose` → experiments.json に登録する
