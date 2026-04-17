# GSC 手動エクスポート ガイド（週次）

本 guide は `.claude/skills/analytics/gsc-improvement/SKILL.md` を補完する。GSC Search Analytics API では取得できないインデックス系データを、ユーザーが GSC UI から手動 export する手順を定義する。

## 毎週の作業（10 分）

月曜の週次レビュー前に以下を実施。`/weekly-review` 実行時に自動取り込まれる。

### Step 1: GSC にログイン

1. [Google Search Console](https://search.google.com/search-console) にログイン
2. プロパティ `sc-domain:stats47.jp` を選択

### Step 2: 集計 CSV を export（既存フロー、必須）

左メニュー → 「インデックス作成」 → 「ページ」

1. 画面上部の「エクスポート」ボタン → CSV ダウンロード
2. zip ファイルを `~/Downloads/` で解凍
3. `stats47.jp-Coverage-YYYY-MM-DD/` ディレクトリができる。中に以下が入る:
   - `重大な問題.csv`（カテゴリ別件数集計）
   - `平均読み込み時間のチャート.csv`（登録済み/未登録の日次推移）
   - `重大ではない問題.csv`（集計、情報量低いので取り込まれない）
   - `メタデータ.csv`（プロパティ情報、取り込まれない）

### Step 3: URL 単位の詳細 CSV を export（T0 施策のために追加、推奨）

Step 2 の画面で、各エラーカテゴリを **クリックして開く** → 右上「エクスポート」→ CSV ダウンロード。

URL 単位のサンプル（最大 1,000 件）を取得できる。Tier 0 施策で「具体的にどの URL を 410 化するか」を決めるのに必須。

export 対象（優先度順）:

| カテゴリ | 目的 | 推奨ファイル名 |
|---|---|---|
| **見つかりませんでした（404）** | T0-404-01 の対象 URL 特定 | `404.csv` |
| **サーバーエラー（5xx）** | T0-5xx-01 の対象 URL 特定 | `5xx.csv` |
| **ページにリダイレクトがあります** | T0-RDR-01 の対象 URL 特定 | `redirect.csv` |
| **クロール済み - インデックス未登録** | T0-CRAWL-02 の対象 URL 特定 | `crawl-not-indexed.csv` |
| **ソフト 404** | T0-SRC-02（将来）の対象 URL 特定 | `soft-404.csv` |
| **重複 (user canonical 無し)** | T0-CANON-01 の対象 URL 特定 | `dup-no-canonical.csv` |

配置先: zip 解凍済みディレクトリと同じ場所（`~/Downloads/stats47.jp-Coverage-YYYY-MM-DD/`）にリネームして配置。既に解凍済みの ZIP 内に追加する形で OK。

## Step 4: 自動取り込みを起動

```
/weekly-review
```

Phase 1 Agent C が自動実行:
- `/fetch-gsc-data snapshot <YYYY-Www>` → Downloads 検出 → `gcsエラー/` へコピー
- 集計 CSV（重大な問題.csv 等）は既存フローで `snapshots/<YYYY-Www>/index-coverage.csv` / `index-trend.csv` に正規化
- URL 単位 CSV（404.csv 等）は `snapshots/<YYYY-Www>/` に同名で配置
- `/gsc-improvement observe` が Observation Log 追記 + 施策効果サマリ自動生成
- `node .claude/skills/analytics/gsc-improvement/scripts/analyze-url-space.cjs` で sitemap 外 URL を特定（`url-space-diff.csv` 生成）

## トラブルシューティング

### GSC 画面でカテゴリが見つからない

「未登録」タブで全カテゴリが出る。「すべての既知のページ」タブだと登録済みのみ表示されるので切替忘れに注意。

### URL 件数が 1,000 未満しか export されない

GSC の制限。大規模サイトでは詳細 URL は最大 1,000 件までしか取得できない。stats47.jp の 404 は 5,727 件あるので、全量は取れないがサンプルとして十分。

### ファイル名が日本語で文字化け

macOS Safari でダウンロードすると NFD 形式になる場合がある。`/fetch-gsc-data` の取り込みロジックは `.normalize('NFC')` で正規化しているので問題なく動く。

### Downloads に複数日付の zip が残っている

`/fetch-gsc-data snapshot` は **日付降順で最新 1 件のみ** 取り込む。古い zip は削除しなくても動作に影響はないが、管理上削除推奨。

## 参照

- スキル: `.claude/skills/analytics/gsc-improvement/SKILL.md`
- 改善ログ: `.claude/skills/analytics/gsc-improvement/reference/improvement-log.md`
- 取り込みロジック: `.claude/skills/analytics/fetch-gsc-data/SKILL.md`
- URL 空間差分スクリプト: `.claude/skills/analytics/gsc-improvement/scripts/analyze-url-space.cjs`
- 週次フロー: `.claude/skills/management/weekly-review/SKILL.md`
