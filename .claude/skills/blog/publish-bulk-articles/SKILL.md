---
name: publish-bulk-articles
description: 複数のブログ記事を一括 publish。article.md frontmatter 読み取り → D1 INSERT → R2 sync → HTTP 検証 → 404 リトライまで自動。Use when user says "記事一括公開", "publish bulk", "まとめて公開".
argument-hint: <slug1> <slug2> ... [--no-sync]
---

`.local/r2/app/blog/<slug>/article.md` が用意済みの記事を **複数まとめて publish** する。

`article-writer` agent で原稿を量産した後の最終工程。**ISR 404 cache 問題** ([[feedback_bulk_blog_publish_isr_404]]) を考慮した検証・リトライまで含む。

## 用途

- `article-writer` agent で 5-10 本書いた直後の一括公開
- 既存 D1 articles と被らない複数 slug を一気に R2 反映
- 公開後の本番動作 (HTTP 200 + 新タイトル表示) を自動検証
- 404 cache に引っかかった URL の連続 curl リトライ・手動 purge 指示

## 引数

```
$ARGUMENTS — <slug1> <slug2> ... [--no-sync] [--no-verify]
             slug: .local/r2/app/blog/<slug>/article.md が存在する slug を 1 つ以上
             --no-sync: R2 sync をスキップ (D1 INSERT のみ)
             --no-verify: 本番 URL の HTTP 検証をスキップ
```

## 前提

- 各 slug について `.local/r2/app/blog/<slug>/article.md` が frontmatter 付きで存在
- ローカル D1 SQLite が `.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite` にある
- frontmatter に少なくとも `title`, `seoTitle`, `description`, `category`, `tags`, `publishedAt` が記載

## 手順

### Phase 1: 事前検証

1. 各 slug について以下をチェック:
   - `.local/r2/app/blog/<slug>/article.md` が存在
   - `.local/r2/app/blog/<slug>/ogp/ogp.json` が存在 ★これが無いとサムネイル生成不可
   - frontmatter が parse 可能 (`---` で囲まれた YAML)
   - 必須キー (`title`, `seoTitle`, `description`, `category`, `tags`) が揃う
   - D1 articles テーブルに同 slug が **未登録** (重複時はエラー停止)
2. 全 slug の検証結果をテーブル形式で表示
3. エラーが 1 件でもあれば中断 (`--force` フラグは設けない、誤公開防止)

ogp.json が無い slug がある場合、`article-writer` agent の Phase 5.5 が抜けている可能性。article.md の frontmatter から title/subtitle を抜いて自動生成も可能だが、本スキルは **入力不備として停止** する方針 (上流の責務を曖昧にしない)。

### Phase 2: D1 INSERT (transaction)

4. 全 INSERT を **単一の transaction** で実行:

```sql
BEGIN TRANSACTION;
INSERT INTO articles (slug, title, description, file_path, format, has_charts, published, published_at, tags, seo_title)
VALUES (...);  -- slug 1
INSERT INTO articles (...) VALUES (...);  -- slug 2
...
COMMIT;
```

5. 各 slug について `tags` は JSON 文字列化 (`["tag1","tag2"]`)
6. `file_path` は `blog/<slug>/article.md` 形式
7. `has_charts` は frontmatter の `ogImage` または `<chart-placeholder>` の有無で判定 (デフォルト 1)
8. 失敗時は transaction rollback、エラー報告

### Phase 2.5: サムネイル / OGP 画像生成 (必須)

8a. 各 slug についてサムネイル生成スクリプトを実行:

```bash
for slug in <slug1> <slug2> ...; do
  npx tsx apps/web/scripts/generate-blog-thumbnails.ts --slug "$slug"
done
```

8b. 各 slug ディレクトリに以下 3 ファイルが生成されたことを確認:
- `.local/r2/app/blog/<slug>/thumbnail-light.webp`
- `.local/r2/app/blog/<slug>/thumbnail-dark.webp`
- `.local/r2/app/blog/<slug>/ogp/ogp.png`

8c. 生成スキップが発生した場合 (`ogp.json なし`) は Phase 1 の事前検証が漏れている → 修正してリトライ。

### Phase 3: R2 sync (`--no-sync` で省略)

9. `bash .claude/skills/db/sync-snapshots/run.sh --only blog` を実行
10. 出力から「アップロード成功: N」「エラー: M」を抽出して報告
11. 成功数が **slug 数 × 4 (article.md + thumbnail-light/dark + ogp.png) + 1 (all.json)** を概ね満たさない場合は警告

### Phase 4: 本番動作検証 (`--no-verify` で省略)

12. 各 slug について **記事 URL + thumbnail URL** の HTTP status を取得:

```bash
# 記事ページ
ART_URL="https://stats47.jp/blog/<slug>"
ART_HEAD=$(curl -sI -A "Googlebot..." "$ART_URL" | head -1 | awk '{print $2}')
ART_TITLE=$(curl -s -A "Googlebot..." "$ART_URL" | grep -oE '<title>[^<]+</title>')

# サムネイル (HEAD と GET の双方を確認、Cloudflare R2 edge cache の不整合を検出)
THUMB_URL="https://storage.stats47.jp/app/blog/<slug>/thumbnail-light.webp"
THUMB_HEAD=$(curl -sI "$THUMB_URL" | head -1 | awk '{print $2}')
THUMB_GET=$(curl -s -o /dev/null -w "%{http_code}" "$THUMB_URL")
```

13. 結果を以下のテーブルで報告:

| # | slug | 記事 HTTP | 記事 Title | thumb HEAD | thumb GET |
|---|---|---|---|---|---|
| 1 | foo | 200 | ✅ | 200 | 200 |
| 2 | bar | 200 | ❌ 記事が見つかりません | 200 | 404 |

14. 以下の異常を検出した URL を Phase 5 へ:
    - 記事 Title が「記事が見つかりません」(ISR 404 cache 問題)
    - thumb HEAD=200 / GET=404 (Cloudflare edge cache の negative cache)
    - thumb HEAD と GET いずれも 404 (R2 push 失敗 or ファイル無し)

### Phase 5: ISR 404 リトライ

ISR が 404 をキャッシュした可能性が高い。詳細: [[feedback_bulk_blog_publish_isr_404]]

15. 404 が返った各 URL に対し、連続 5 回 curl (revalidate trigger 狙い):

```bash
for i in 1 2 3 4 5; do
  curl -s -o /dev/null -A "Googlebot..." "$URL"
done
```

16. 5 回後の最終 title を再確認
17. **まだ「記事が見つかりません」が残っている URL** があれば、ユーザーに以下を指示:

```
⚠️ 以下の URL は ISR/CDN cache に stuck しています。
Cloudflare 手動パージが必要です。

手順:
1. https://dash.cloudflare.com → stats47.jp zone
2. Caching > Configuration > Purge Cache > Custom Purge
3. 以下の URL を入力:
   <URL1>
   <URL2>
4. Purge ボタン

(注: Cloudflare token に Cache Purge 権限が無いため `/purge-cdn` 自動実行は失敗します。
 token に Zone.Cache Purge 権限を追加すれば次回から自動化可能。)
```

### Phase 6: 完了報告

18. 最終サマリー:
    - 公開成功: N / M 件
    - HTTP 200 + 新タイトル確認: N 件
    - 手動パージ指示: N 件
    - 次のステップ (該当する場合): タイトル改修・チャート生成・効果計測

## エラー時の対応

| エラー | 原因 | 対応 |
|---|---|---|
| article.md not found | 原稿未配置 | article-writer agent でまず原稿を作成 |
| frontmatter invalid | YAML parse error | 原稿を修正 |
| slug already exists in D1 | 重複公開 | スキップするか UPDATE に切替 (本スキルは INSERT のみ、UPDATE は手動) |
| R2 sync error | manifest/CF API 問題 | `/sync-snapshots --only blog` 単独で再実行 |
| HTTP 500 | Worker エラー | Cloudflare Pages のデプロイログ確認 |

## 設計判断

- **transaction 採用**: 全 slug の INSERT を 1 transaction にまとめることで、途中失敗時の中途半端な状態を防ぐ
- **検証フェーズ強制**: --no-verify はデバッグ用。デフォルトでは公開後の動作確認まで責務に含める (publish-and-forget を防ぐ)
- **404 リトライは 5 回まで**: それ以上は CDN edge cache 問題と判断 → 手動パージ依頼
- **purge 自動化はスキル外**: Cloudflare token 権限の問題で自動化困難 ([[project_cloudflare_token_consolidated]] 参照)

## 量産フロー全体での位置

```
1. /fetch-gsc-data snapshot YYYY-Www
   ↓
2. /plan-blog-from-gsc 5 30 → backlog/gsc-driven-YYYY-MM-DD.md
   ↓
3. Agent(article-writer) × N 並列
      → .local/r2/app/blog/<slug>/article.md × N
      → .local/r2/app/blog/<slug>/ogp/ogp.json × N  ★Phase 5.5 で必ず作成
   ↓
4. /publish-bulk-articles <slug1> <slug2> ... ★本スキル
      a. 事前検証 (article.md + ogp.json 存在チェック)
      b. D1 INSERT (transaction)
      c. サムネイル生成 (generate-blog-thumbnails.ts --slug)
      d. R2 sync (sync-snapshots --only blog)
      e. 本番検証 (article URL + thumbnail URL の HEAD/GET)
      f. 404 リトライ + 手動 purge 指示
   ↓
5. 2-4 週後に CTR 実測
```

## 関連

- `Agent(article-writer)` — 本スキルの入力 (article.md) を生成する subagent
- `/sync-snapshots --only blog` — Phase 3 で内部呼び出し
- `/plan-blog-from-gsc` — 量産フローの上流
- `.claude/rules/branch-workflow.md` — sync 後にデプロイが必要な場合 (今回は不要、R2 反映のみで本番に出る)
- `.claude/rules/data-storage.md` — D1 vs R2 の使い分け
