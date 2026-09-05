---
name: publish-note
description: browser-use CLI で note.com エディタを自動操作し記事を下書き保存または予約投稿する。Use when user says "note投稿", "note公開", "note予約投稿". テキスト・アイキャッチ・タグを自動設定.
disable-model-invocation: true
argument-hint: "<slug> <M/D> <HH:MM> [, <slug2> <M/D> <HH:MM> ...]"
primary_agent: note-manager
---

browser-use CLI（Chrome プロファイル経由）で note.com エディタを自動操作し、記事を下書き保存または予約投稿する。**確認プロンプトなし**で全ステップを自動実行する。

## 用途

- `/write-note-section` → `/edit-note-draft` 完了後の記事を note.com に自動投稿
- `/post-note-ranking` で生成した A シリーズ記事を投稿
- 複数記事をバッチで一括予約投稿

## 記事ディレクトリの運用ルール (2026-06-19 更新)

### 未公開ドラフト
`docs/31_note記事原稿/<vertical>/<slug>/` または `docs/31_note記事原稿/<slug>/` で管理。git が SSOT。

### 公開済み記事
**公開後は R2 (`note/<vertical>/<slug>/`) に同期し、docs/31 から削除する**（ローカル容量最適化）。

- **同期トリガー**: note.com 公開後に R2 `draft.md` の frontmatter を更新（下記「Phase 8 後」手順）→ develop push → `sync-note-r2.yml` が自動で R2 push + docs/31 削除 + commit-back する
- **公開状態の真実源**: **R2 `draft.md` の frontmatter**（`note_url` フィールド）。`note-published-urls.json` は `build-note-published-index.mjs` が再構築する派生インデックス
- **更新 (update モード) の前に復元が必要**:
  ```bash
  bash .Codex/scripts/note/restore-from-r2.sh <slug>
  # → docs/31 に draft.md + images/ を復元 (R2 公開 URL 経由・認証不要)
  # 更新完了後は次の develop push で自動的に再同期・削除される
  ```

**画像**: `--update` 時は restore 後に `.Codex/scripts/note/regenerate-svg-png.sh` で PNG を再生成してからアップロードする。SVG ソースを持たない旧記事は PNG が唯一のソース。

## 引数（バッチ対応）

カンマ区切りで複数記事を指定可能:

```
/publish-note a-population-density 3/30 08:00, a-maximum-temperature 3/30 12:00, a-university-count 3/30 18:00
```

各エントリのフォーマット: `<slug> [<M/D> <HH:MM>]`

- **slug**: 記事ディレクトリ名（必須）
- **M/D HH:MM**: 予約投稿日時（任意）。省略時は下書き保存のみ。年は当年を使用

### 既存記事の更新（update モード）

```
/publish-note --update <slug>[, <slug2> ...]
```

`--update` が付いたら **新規作成ではなく既存公開記事の更新**として処理する。
公開済み記事を修正済み draft.md で更新する（価格変更・誤字修正・記述更新の保守用）。
詳細手順は **[references/update-mode.md](references/update-mode.md)** を参照。

- 対象 slug が `.Codex/state/note-published-urls.json` の `articles` に無ければ
  「未公開のため更新不可」で中断
- 本文と本文中画像のみ差し替える。アイキャッチ・ハッシュタグ・価格は触らない
- 有料記事の更新は有料エリア境界の再設定が絡む。**公開更新の依頼がある場合だけ**、Phase 7-Boundaryで境界を設定し、エージェントがscreenshotを目視確認してから同じセッションで確定する。確認できなければ公開せずユーザーへ引き継ぐ（詳細は`references/scheduling.md`）。

## 投稿先アカウント（最重要）

**このスキルの投稿先は `note.com/stats47` 固定。** 専用 Chrome プロファイル **Profile 5**（表示名 `stats47` / `stats47jp@gmail.com`）にこの note アカウントをログインさせて運用する。

- 全 browser-use コマンドは `--profile "Profile 5"` で実行する（他プロファイルを使わない）
- Profile 5 は note 投稿専用。`stats47` 以外の note アカウントを後からログインさせない
- **Phase 1 でアカウント照合ゲートを必ず通す**（下記 Phase 1 参照）。プロファイル分離だけでは「セッション切れ → 別アカウントで再ログイン」のドリフトを防げないため、実行時照合を保険として併用する
- 過去事故: 2026-05-20 に Profile 1 から誤って `note.com/dobokunote` に 3 本公開した。この照合ゲートはその再発防止策

## 前処理（ブラウザ操作より先に実行）

投稿前に **カバー SVG** と **ハッシュタグ** を生成する。どちらも欠けたまま投稿しない。

```bash
# 1. ドラフトが docs/31 に無ければ R2 から復元
bash .Codex/scripts/note/restore-from-r2.sh <slug>

# 2. カバーを生成 (images/cover-1280x670.{svg,png})
#    ★ koumuin-Codex / koumuin-estat-Codex シリーズは専用ジェネレータを使う
#      (共通のキャッチー背景 + カテゴリトーン + 中央ボックス。SVG+PNG を直接出力し sharp で合成):
node .Codex/scripts/note/generate-koumuin-covers.cjs --slug <slug>
#    それ以外 (stats47-note 等) は汎用版:
# node .Codex/scripts/note/generate-note-covers.mjs --slug <slug>

# 3. ハッシュタグ 90 個を生成 (hashtags.txt)
node .Codex/scripts/note/generate-note-hashtags.mjs --slug <slug>
```

- カバー: `docs/31_note記事原稿/[vertical/]<slug>/images/cover-1280x670.{svg,png}`
  **koumuin シリーズは `generate-koumuin-covers.cjs` が PNG まで生成する**（背景 bitmap は
  `.Codex/scripts/note/assets/koumuin-cover-bg.png`、無ければプログラム生成のダーク背景にフォールバック）。
  アップロードは PNG を使う。汎用版 (`generate-note-covers.mjs`) は SVG のみなので、その場合は
  `rsvg-convert`/`inkscape`/`svg-to-png.cjs` で PNG 化してからアップロードする（note は SVG を受け付けない場合がある）。
- ハッシュタグ: `docs/31_note記事原稿/[vertical/]<slug>/hashtags.txt` に 1 行 1 タグで 90 個。Phase 7 でタグ入力時に使う。

## 前提条件

1. browser-use CLI がインストール済み
2. 記事ファイルが存在する: `docs/31_note記事原稿/<vertical>/<slug>/draft.md` または `docs/31_note記事原稿/<slug>/draft.md`
   （存在しない場合は先に `bash .Codex/scripts/note/restore-from-r2.sh <slug>` で R2 から復元する）
3. Chrome **Profile 5** で `note.com/stats47` にログイン済み
4. **有料記事の場合**: frontmatter に `is_paid: true` と `price_jpy: <数値>` を必ず記載。本文には有料境界の目印として `ここから先は有料部分:` 行を入れる（Phase 0 が free/paid に分割するために必要）
5. **ダウンロード商品の場合**: `product_archive` に `.local/geo-products/` 配下の50MB以下のZIP、`product_attachment_after` に有料本文内の見出しを指定する。`prepare-article.cjs` はパス・拡張子・容量・有料設定をfail-closedで検証する
6. **予約投稿**: note プレミアム加入アカウントでのみ可能（通常アカウントでは「日時の設定」が押せない、2026-05-18 確認）

## browser-use 共通設定

```bash
export PATH="$HOME/.browser-use-env/bin:$HOME/.browser-use/bin:$HOME/.local/bin:$PATH"
```

**全コマンド**: `browser-use --headed --profile "Profile 5" <command>`

- `--session` 指定しない（デフォルトセッション）
- `$BU` 変数は使わない。毎回フルコマンドを書く
- バッチ実行中はブラウザを閉じない（最後に1回だけ `close`）

### ⚠️ 必須: 終了時クリーンアップ

`browser-use ... close` は page を閉じるが **daemon プロセス本体を停止しない**。さらに `--profile "Profile 5"` で起動した場合は **ユーザーの実 Chrome 内にタブを開く**ため、daemon を kill してもエディタタブが残ってしまう（2026-04-25 検証で daemon 6 個 + note エディタタブ 5 個残存を確認）。

**スキル完了時 / エラーで中断時に必ず以下 3 段すべてを実行**:

```bash
# 1. Chrome ページを閉じる（best effort）
browser-use --headed --profile "Profile 5" close 2>/dev/null || true

# 2. daemon と紐付く chromium インスタンスを完全停止
pkill -TERM -f "browser_use.skill_cli.daemon" 2>/dev/null
sleep 2
pkill -KILL -f "browser_use.skill_cli.daemon" 2>/dev/null
pkill -KILL -f "user-data-dir=.*ms-playwright/mcp-chrome" 2>/dev/null
# browser-use が起動する使い捨て Chrome (一時 user-data-dir)。これを取りこぼすとドックに
# Chrome アイコンが大量に残る。ps 経由で確実に kill する (macOS の pkill -f は取りこぼすことがある)
ps -Axo pid,command | grep "browser-use-user-data-dir" | grep -v grep \
  | awk '{print $1}' | xargs -n1 kill -9 2>/dev/null
rm -rf "${TMPDIR:-/tmp}"browser-use-user-data-dir-* 2>/dev/null

# 3. ユーザーの実 Chrome から残存 note エディタタブを閉じる（macOS 限定）
osascript -e 'tell application "Google Chrome"
  repeat with w in windows
    repeat with t in tabs of w
      if URL of t contains "editor.note.com" or URL of t contains "note.com/notes/" then
        close t
      end if
    end repeat
  end repeat
end tell' 2>/dev/null || true
```

エラー / 中断時の自動クリーンアップ確実化のため、Node.js orchestrator では `process.on('exit')` / `process.on('SIGINT')` 等で上記 3 段を必ず叩くこと。bash スクリプトでは `trap` で同じ。

## 実行フロー概要

```
引数パース → 記事ごとにループ:
  Phase 0: データ読み込み（Node.js）
  Phase 1: ブラウザ起動 → ★アカウント照合ゲート★ → エディタ表示
  Phase 2: アイキャッチ画像（※必ず本文入力前に実行）
  Phase 3: タイトル入力
  Phase 4: 本文入力（一括 ClipboardEvent paste）→ Phase 4-3: URL カード化（自動）
  Phase 5: 挿絵の挿入（目次経由、画像が揃っている場合）
  Phase 5.5: 商品ZIPを指定見出し直後へ添付し、本文上のファイル名を検証
  Phase 6: 下書き保存
  Phase 7: 公開設定（有料価格→有料境界→タグ→予約/即時。有料は境界screenshot目視後に確定）
  Phase 8: 確認スクリーンショット
→ 全記事完了後にブラウザを閉じる + 必須クリーンアップ（pkill daemon）
```

### Phase 1: ブラウザ起動 & アカウント照合ゲート（投稿前に必ず実行）

エディタを開く前に、ログイン中の note アカウントが `stats47` であることを照合する。
**1 記事目の Phase 2 に進む前に 1 回だけ実行すれば足りる**（バッチ中はセッションが変わらないため）。

```bash
# note のアカウント設定ページを開く（ログイン中アカウントのハンドルが分かるページ）
browser-use --headed --profile "Profile 5" open "https://note.com/settings/account"
browser-use --headed --profile "Profile 5" state 2>&1 > /tmp/note-acct.txt
```

`state` の出力（または画面）から、ログイン中アカウントの URL ハンドル（`note.com/<handle>`）
またはアカウント名を読み取り、**`stats47` と文字列一致で照合する**。

- 一致 → Phase 2 以降に進む
- **不一致 or 未ログイン → 即座に中断**。1 記事も投稿しない。ユーザーに
  「Profile 5 が note.com/stats47 にログインしていません。投稿を中止しました」と報告して終了
- これはモデルの裁量判断ではなく**決定的な文字列照合**。曖昧なら必ず中断側に倒す

> アカウント設定ページの DOM 構造が変わっていてハンドルが読めない場合も、
> 「確認できなかった」= 中断とする（安全側）。憶測で続行しない。

### 既存記事の更新（update モード）

`--update` 指定時は新規作成フローの代わりに update モードで処理する。
既存記事の編集画面を開き、本文を全消去 → 修正済み本文を再 paste → 画像再挿入 → 「更新」。
詳細手順は **[references/update-mode.md](references/update-mode.md)** を参照。

### Phase 0-6, 8: エディタ操作

詳細手順は **[references/editor-operations.md](references/editor-operations.md)** を参照。

主なポイント:
- **Phase 0**: Node.js スクリプトで draft.md を読み込み、frontmatter から `title` / `is_paid` / `price_jpy` 抽出、本文を「ここから先は有料部分:」行で free/paid 分割、セグメント分割（URL vs テキスト）して `/tmp/note-data-<slug>.json` に出力
- **Phase 0 ガード（マガジン URL 未注入チェック）**: 本文に未注入プレースホルダー `{{MAGAZINE_URL}}` が残っていたら、その記事は**公開せず中断**する。回遊フッタの `{{MAGAZINE_URL}}` は公開前に `inject-magazine-url.cjs` で実 URL に置換しておく必要がある（未置換のまま公開するとプレースホルダー文字列がそのまま記事に出る）。バッチ中の 1 記事が該当した場合、その記事だけスキップし他は続行してよい
- **Phase 2**: アイキャッチは**必ず本文入力前**に実行（本文入力後はスクロール位置がずれてボタン検出に失敗する）
- **Phase 4**: 全セグメントを 1 つの文字列に連結し **1 回だけ** ClipboardEvent paste（`type` は markdown 変換しない。連続 paste 不可）。本文は `window.__nb` に**チャンク分割注入**してから paste 発火する（一括 eval は大きい本文で daemon ペイロード上限に当たりタイムアウト）。
- **Phase 4-3（URL カード化・自動）**: paste 後に plain text の URL 行を OGP リンクカードへ自動変換する。各 URL の text node を eval(Selection API) で発見 → 行末にキャレット → 実 Enter キー送出 → 4 秒待機（既知の手動レシピを自動再現）。詳細・フォールバックは [references/editor-operations.md](references/editor-operations.md) §4-3。**初回 live で 1 記事のカード化を検証**（DOM 変更時はカード要素セレクタを更新）
- **Phase 5**: 目次からセクションにジャンプし、見出し直後にメニューから画像挿入
- **Phase 5.5（商品添付）**: `product_archive` がある場合だけ`ins_file`を使う。指定見出し直後へZIPを置き、ファイル名・容量・本文表示を確認する。添付失敗時は有料記事を公開しない
- **Phase 8.5（有料原稿保全）**: 公開済み有料原稿はpublic Git/R2へcommitしない。catalog派生stateを生成後、`npx tsx .claude/scripts/note/publish-paid-note-private-r2.ts <slug> --commit`で完全原稿を`stats47-private`へ保存し、公開R2には販売メタ`public.json`だけを置く。private実体検証後にcatalogの`r2Body:true`へ進める
- **有料原稿の復元**: `bash .claude/scripts/note/restore-from-r2.sh <slug>`。派生stateの`r2_access:private`を検出し、private R2から全ファイルをSHA-256検証して復元する

### Phase 7: 公開設定（有料設定・タグ・予約投稿）

詳細手順は **[references/scheduling.md](references/scheduling.md)** を参照。

実行順序: 公開に進む → **Phase 7-Pricing**（有料時のみ）→ **Phase 7-Boundary**（有料時のみ）→ Phase 7-Tags（ハッシュタグ）→ Phase 7-Schedule（予約 or 即時）

主なポイント:
- **Phase 7-Pricing**: `is_paid=true` + `price_jpy>0` のときだけ実行。有料ラジオをクリック → Shadow DOM 内 `<input id=price>` に JS で価格を上書き（`type` 不可: 初期値 300 と連結される）
- **Phase 7-Boundary（有料境界・自動・2026-06-16 実機確定）**: 「有料エリア設定」ボタン → 境界設定画面で **`segmentsPaid[0]` の先頭見出しを錨**に有料ラインを自動設定。✅ **境界画面 DOM は確定済（update 11 本 + 新規 2 本連続成功）**。⚠️ **誤露出防止で最終「投稿/更新」前に境界を screenshot で目視確認**してから押す（エージェントが Read で screenshot 検証後に押下して可）。詳細は [references/scheduling.md](references/scheduling.md) Phase 7-Boundary
- **Phase 7-Tags**: ハッシュタグは `hashtags.txt` から読んで入力する（**1 個ずつ click→type→Enter**。まとめて type すると combobox の value に連結され失敗）。note は最大 99 タグまで設定可能。`hashtags.txt` に 90 個生成しているので全行を使う（99 未満に抑えてエラー回避）。
  ```bash
  cat docs/31_note記事原稿/[vertical/]<slug>/hashtags.txt
  ```
  `hashtags.txt` が無い場合は投稿を中断し `generate-note-hashtags.mjs` を先に実行する。
- 「公開に進む」→ タグ入力（上記 Phase 7-Tags）→ マガジン追加 → 日時設定 → 投稿
- ★**エディタ操作の実体は関数ライブラリ `.Codex/scripts/note/editor-helpers.sh`**（`source` して `process_article`（update）/ `new_post_cover_title`+`ins_img`+`ins_file`+`new_post_tags`+`new_post_magazine`+`paid_setline_from_settings`（新規）/ `do_update`）。新規有料記事は`publish-new-note.sh ... --prepare-publish`で境界 screenshot まで進め、エージェントが目視してから同じセッションで`--commit-publish`を実行する。手書きせずこれを使う
- 予約日時が指定されていない場合でも Phase 7 で**即時公開**が可能（「今すぐ公開」ボタンをクリック）。日時設定をスキップして直接「今すぐ公開」を選ぶ
- 日時も即時公開も有料設定も不要な場合（下書き保存のみ）は Phase 7 全体をスキップ

### Phase 8 後: 公開 URL をフロントマターに記録（★真実源への書き込み）

記事を公開（即時公開 or 予約投稿）したら、**R2 `draft.md` の frontmatter に `note_url` を追加**する。
これが doboku-note と同じ方式の SSOT 管理。

```bash
# 1. 公開 URL を取得（Phase 8 のブラウザ URL バー or 確認画面から）
NOTE_URL="https://note.com/stats47/n/nXXXXX"
SLUG="<slug>"

# 2. docs/31 の draft.md が存在しない場合は R2 から復元
bash .Codex/scripts/note/restore-from-r2.sh "$SLUG"

# 3. frontmatter に note_url / published / published_at を追加（migrate スクリプト転用）
NOTE_URL="$NOTE_URL" DRY_RUN=false \
  node .Codex/scripts/note/migrate-note-frontmatter.mjs --slug "$SLUG"
# ↑ note-published-urls.json に URL が入っていれば自動取得。
#   新規公開で未登録の場合は下記の手動追記を先に行う。

# 4. note-published-urls.json に追記（派生インデックスの仮登録）
# → migrate 実行後に build-note-published-index.mjs で再構築する方が正確
node .Codex/scripts/note/build-note-published-index.mjs

# 5. R2 に反映（S3 API 経由 or develop push → sync-note-r2.yml）
# ローカルに S3 creds があれば:
node .Codex/scripts/note/sync-note-r2.mjs  # または develop push でCIに委ねる
```

**新規公開時の追加手順** (note-published-urls.json にまだ存在しない場合):
```javascript
// .Codex/state/note-published-urls.json の articles に手動追記
"<slug>": {
  "vertical": "<vertical>",
  "title": "<title>",
  "url": "<NOTE_URL>",
  "is_paid": false,
  "published_at": "YYYY-MM-DD",
  "r2_path": "note/<vertical>/<slug>",
  "status": "r2_ready"
}
```
追記後に `migrate-note-frontmatter.mjs --slug <slug>` → `build-note-published-index.mjs` を実行する。

- **下書き保存のみ**（公開していない）の場合は上記不要
- **ドラフト管理中だった場合**: `.Codex/state/note-draft-index.json` の `drafts` から同 slug を削除する
  （公開後は frontmatter の `note_url` が真実源になるため）

- **ClipboardEvent 制約**: 最初の1セグメントのみ ClipboardEvent でペースト可能。2回目以降は `type` コマンドを使う
- **URL カード変換待機**: URL 入力後は **4秒待機**必須。カード変換完了前に次の入力をするとレイアウトが壊れる
- **要素インデックスは毎回変わる**: state で都度確認。ハードコードしない
- **state 呼び出し最小化**: 1回の state で複数要素を検索する。`type`/`keys` の後は state 不要

## トラブルシューティング

要素検索ヘルパー（`find_idx` / `find_idx_retry`）、実証済みの要素パターン、state 最小化ガイドライン、エラーハンドリングの詳細は **[references/troubleshooting.md](references/troubleshooting.md)** を参照。

## 参照

- browser-use CLI: `browser-use --help`
- note 記事テンプレート: `/post-note-ranking` スキル
- note 記事執筆: `/write-note-section` スキル
- note 記事編集: `/edit-note-draft` スキル
- 自動化パターン: `.Codex/agents/browser-publisher.md` の note.com セクション
