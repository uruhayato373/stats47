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

### 2026-04-20 (YT-2026-W17-01): YouTube フィード復旧へ週3本BCR集中プラン

**施策 ID**: YT-2026-W17-01
**担当**: youtube-strategist
**デプロイ**: 2026-04-22 〜 2026-04-27（公開予約で投入、private + publishAt 方式）

#### 背景（4/20 実測）

- チャンネル: `UCdRiwDSX1aUd0dSd7Cs08Kg`（@stats47jp）、登録者 31 / 総再生 78,345 / 動画数 148
- 過去28日: 視聴 6,674 / 視聴時間 634分 / 平均視聴秒 27s（3/24 以降急落、ショートフィード露出がほぼ停止）
- トラフィックソース 28日: SHORTS 6,122（91.7%）/ YT_SEARCH 326 / YT_CHANNEL 80
- 直近30本（4/2〜4/18）平均再生: **Shorts 4.8 / 長尺 2.9 再生**。Top 30 の公開日は全て 2026-03 以前＝4月以降ヒットゼロ
- 週別投稿数（直近4週）: 11 → 5 → 3 → 3（W14 の大量投稿が推奨度低下の主因）
- 維持率（90日 Analytics）: 時系列 BCR 45-68% > 通常ランキング 25-35% → **BCR 圧勝**

#### 仮説

1. 週3本上限を遵守し、大量投稿時代と切り離すことで推奨度の回復を待つ
2. 維持率 45%+ の BCR 時系列フォーマットに 3 本とも集中し、フィード再露出の確率を最大化
3. 生活密着×社会問題テーマ（治安・救急・高齢化）に寄せる

#### 実施内容

| # | 公開予定 JST | Video ID / URL | テーマ | フォーマット | 尺 |
|---|---|---|---|---|---|
| 1 | 2026-04-22(水) 19:00 | `TetaXT1QUu0` https://www.youtube.com/watch?v=TetaXT1QUu0 | 刑法犯認知件数（人口千人当たり）49年 | BCR 通常動画 | 70s |
| 2 | 2026-04-25(土) 19:00 | `kuE5eNbxLZI` https://www.youtube.com/watch?v=kuE5eNbxLZI | 刑法犯検挙率 49年（島根72.7%） | BCR 通常動画 | 70s |
| 3 | 2026-04-27(月) 19:00 | `t-sSgDzRQUs` https://www.youtube.com/watch?v=t-sSgDzRQUs | 年間救急出動件数（人口千人当たり）49年 | BCR Shorts | 70s |

- #1 は既存在庫（4/11 時点でレンダリング済み、未公開の唯一の在庫）を活用
- #2・#3 は `/generate-bar-chart-race` + `/render-bar-chart-race` で新規制作（49 フレーム、1975-2023）
- 全動画とも `categoryId: 22`、タグ 10 個、説明欄 830〜932 文字、UTM 付き `stats47.jp/ranking/*` リンクを説明欄に含める
- アップロードは `.claude/scripts/youtube/upload.js` の `--schedule` オプション（YouTube API の `status.privacyStatus=private` + `status.publishAt` で予約公開）

#### 運用ルール（今週の遵守事項）

- 週投稿上限: **3 本**
- 公開間隔: 水→土→月（中2〜中1日）
- 公開時刻: 19:00 JST 統一
- 同一テーマ再投稿禁止 — 既存 BCR 在庫 8 件中「penal-code-offenses-recognized-per-1000」のみ未公開だったため、これで在庫消化

#### 付随改善

- `.env.local` の `GOOGLE_OAUTH_REFRESH_TOKEN` を再認証・更新（4/20、ユーザー実施）→ Analytics API / Upload API ともに復活
- 既存 BCR 在庫の公開履歴マトリクスを整理（1 件のみ未公開を特定）

#### 結果（後追い）

| チェック項目 | 目標 | 実測 |
|---|---|---|
| #1 初動 48h 再生（4/24 計測） | 100+ | _（後日追記）_ |
| #2 初動 48h 再生（4/27 計測） | 100+ | _（後日追記）_ |
| #3 初動 48h 再生（4/29 計測） | 100+ | _（後日追記）_ |
| 3本の平均維持率 | 45%+ | _（後日追記）_ |
| 週次登録者増 | +3 以上 | _（後日追記）_ |
| ショートフィードのインプ復活 | >0 | _（後日追記）_ |

#### 次週（W18）改善仮説

1. **維持率 45%+ × 再生 100+ が 1 本でも出れば**、犯罪・医療・高齢化系の時系列 BCR を継続。週3本体制は維持
2. **3 本とも再生 50 未満なら**、投稿ペースではなく「チャンネル単位の推奨度低下」が主因の可能性。1 週間の投稿停止（断食）を試す or 県対決（過去1,214再生実績）を週1投入
3. 再稼働した Analytics API で `/analyze-youtube retention <videoId>` を使い、10% 地点離脱の解消ポイントを特定する

#### 参照ファイル

- `/Users/minamidaisuke/stats47/.claude/agents/youtube-strategist.md`
- `/Users/minamidaisuke/stats47/.local/r2/sns/bar-chart-race/penal-code-offenses-recognized-per-1000/youtube-normal/caption.json`
- `/Users/minamidaisuke/stats47/.local/r2/sns/bar-chart-race/criminal-arrest-rate/{config.json,data.json,youtube-normal/caption.json,youtube-normal/video.mp4}`
- `/Users/minamidaisuke/stats47/.local/r2/sns/bar-chart-race/annual-emergency-dispatches-per-1000/{config.json,data.json,youtube/caption.json,youtube/shorts.mp4}`

---

## Observation Log

_（次回 `/update-sns-metrics` 実行後・週次レビュー時に追記）_

---

## Next Actions

- `/update-sns-metrics` を定期実行して時系列を厚くする
- `/sns-weekly-report` でプラットフォーム別エンゲージメント率の変動を観察
- 改善候補実験は `/nsm-experiment propose` → experiments.json に登録する
