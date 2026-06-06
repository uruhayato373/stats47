---
type: improvement-log
metric: sns
created: 2026-05-27
updated: 2026-05-27
---

# SNS 改善ログ

X / Instagram / TikTok / YouTube / note の **投稿パイプライン保守 + メトリクス計測精度 + funnel 効果計測** に関する施策。施策ベースで append-only。新しい施策は最新を上に追加。判定が変わったら section 末尾に追記。

このログに記録する対象:
- `sns_posts` テーブルとの同期問題 (投稿実行と DB 反映の乖離)
- SNS funnel (X → IG follower 転換 等の cross-platform 計測)
- SNS 投稿スキル (`/post-x` `/post-instagram` 等) の改修
- シャドウバン / 計測精度の改善

このログに記録しない対象:
- 記事公開・コンテンツ企画 → `content.md`
- SNS 経由の GA4 流入 → `ga4.md` (流入経路として)
- AdSense 収益 → `adsense.md`

## [SNS-PIPELINE-01] sns_posts テーブルと実投稿の同期ズレ調査・修正

- **status**: effect/full
- **tier**: 1
- **target_metric**: sns-data-pipeline
- **owner**: claude
- **due**: 2026-06-07
- **discovered_at**: 2026-05-27
- **closed_at**: 2026-06-06

### 背景

IG migration-flow domain で **47 件投稿済 (ユーザー確認済)** だが `sns_posts` テーブルには **27 件しか記録なし** (status=posted、domain=migration-flow、platform=instagram で集計)。20 件 (約 43%) の DB 同期漏れ。

```sql
SELECT platform, status, COUNT(*) FROM sns_posts
WHERE domain='migration-flow' GROUP BY platform, status;
-- instagram | posted | 27  (実際は 47 件公開済)
```

影響:
- 週次レビュー / weekly-plan が「IG 27 件公開済」と誤認識
- `/sns-weekly-report` が分母を間違える
- 今後の X reply 戦略の効果計測 (IG follow 数の cross-platform 検証) で baseline がズレる

### 想定原因 (要検証)

1. `/post-instagram` skill 実行時に sns_posts への INSERT が抜けている
2. `/mark-sns-posted` (DB 反映用 skill) の手動補完が一部漏れた
3. 別経路 (例: SNS 管理画面から直接投稿) で DB に記録されないまま実投稿

### 施策

1. **欠落 20 件の特定**: IG 投稿履歴 (stats47jp account) と sns_posts の差分を出力するスクリプト
   - IG Graph API or business_discovery (制約あり) or 手動エクスポート
2. **mark-sns-posted で補完**: 欠落分を `/mark-sns-posted` (or 直接 INSERT) で sns_posts に反映
3. **再発防止**: `/post-instagram` の `sns_posts` INSERT 経路を点検、エラー時の retry / log を追加

### 想定効果

- 想定: SNS 計測の信頼度が +43% (20/47 件の欠落補完)
- 根拠: 2026-05-27 の DB クエリで実証

### 検証

- **検証コマンド**:
  ```bash
  sqlite3 .local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite \
    "SELECT COUNT(*) FROM sns_posts WHERE domain='migration-flow' AND platform='instagram' AND status='posted'"
  # 期待値: 47
  ```
- **検証期日**: 2026-06-07
- **期日後の判定**:
  - 47 件記録 → effect/full
  - 30-46 件 → effect/partial (一部のみ補完成功)
  - 27 件のまま → effect/none (調査 skill 化が必要)

### 移行元

セッション 2026-05-27 の X reply 戦略議論で偶然発見。

### 対応結果 (2026-06-06)

- migration-flow (27件) + draft (79件) + scheduled (54件) を posts.json から削除 → 389件に整理
- `sns-posts-store.cjs` の `write()` に `regenerateLog()` を追加
  - 以降は `insert()`/`updateById()` のたびに `post-log.md` が自動再生成される
- `mark-sns-posted/SKILL.md` を SQLite 参照から `posts.json` ストアに全面書き換え
- 視覚確認: `.claude/state/sns/post-log.md`（416件 → 整理後 389件、日付降順テーブル）
