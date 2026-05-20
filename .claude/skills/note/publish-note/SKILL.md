---
name: publish-note
description: browser-use CLI で note.com エディタを自動操作し記事を下書き保存または予約投稿する。Use when user says "note投稿", "note公開", "note予約投稿". テキスト・アイキャッチ・タグを自動設定.
disable-model-invocation: true
argument-hint: "<slug> <M/D> <HH:MM> [, <slug2> <M/D> <HH:MM> ...]"
---

browser-use CLI（Chrome プロファイル経由）で note.com エディタを自動操作し、記事を下書き保存または予約投稿する。**確認プロンプトなし**で全ステップを自動実行する。

## 用途

- `/write-note-section` → `/edit-note-draft` 完了後の記事を note.com に自動投稿
- `/post-note-ranking` で生成した A シリーズ記事を投稿
- 複数記事をバッチで一括予約投稿

## 記事ディレクトリの運用ルール

| 状態 | 置き場所 |
|---|---|
| 下書き（未公開） | `docs/31_note記事原稿/<slug>/` |
| 公開済み | `.local/r2/note/<slug>/` |

**公開後は `docs/31_note記事原稿/<slug>/` を `.local/r2/note/<slug>/` に移動すること。**
Phase 0 のデータ読み込みは両方のパスを検索するため、移動後も `/publish-note` の参照は正常に動作する。

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

- 対象 slug が `.claude/state/note-published-urls.json` の `articles` に無ければ
  「未公開のため更新不可」で中断
- 本文と本文中画像のみ差し替える。アイキャッチ・ハッシュタグ・価格は触らない
- 有料記事の更新は有料エリア境界の再設定が絡むため半自動（要ユーザー告知）

## 投稿先アカウント（最重要）

**このスキルの投稿先は `note.com/stats47` 固定。** 専用 Chrome プロファイル **Profile 5**（表示名 `stats47` / `stats47jp@gmail.com`）にこの note アカウントをログインさせて運用する。

- 全 browser-use コマンドは `--profile "Profile 5"` で実行する（他プロファイルを使わない）
- Profile 5 は note 投稿専用。`stats47` 以外の note アカウントを後からログインさせない
- **Phase 1 でアカウント照合ゲートを必ず通す**（下記 Phase 1 参照）。プロファイル分離だけでは「セッション切れ → 別アカウントで再ログイン」のドリフトを防げないため、実行時照合を保険として併用する
- 過去事故: 2026-05-20 に Profile 1 から誤って `note.com/dobokunote` に 3 本公開した。この照合ゲートはその再発防止策

## 前提条件

1. browser-use CLI がインストール済み
2. 記事ファイルが存在する: `docs/31_note記事原稿/<slug>/{note.md,draft.md}` / `docs/31_note記事原稿/<vertical>/<slug>/{note.md,draft.md}` / `.local/r2/note/<slug>/{note.md,draft.md}` のいずれか
3. Chrome **Profile 5** で `note.com/stats47` にログイン済み
4. **有料記事の場合**: frontmatter に `is_paid: true` と `price_jpy: <数値>` を必ず記載。本文には有料境界の目印として `ここから先は有料部分:` 行を入れる（Phase 0 が free/paid に分割するために必要）
5. **予約投稿**: note プレミアム加入アカウントでのみ可能（通常アカウントでは「日時の設定」が押せない、2026-05-18 確認）

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
  Phase 4: 本文入力（一括 ClipboardEvent paste、URL は plain text）
  Phase 5: 挿絵の挿入（目次経由、画像が揃っている場合）
  Phase 6: 下書き保存
  Phase 7: 公開設定（タグ・予約投稿）
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
- **Phase 0**: Node.js スクリプトで note.md / draft.md を読み込み、frontmatter から `title` / `is_paid` / `price_jpy` 抽出、本文を「ここから先は有料部分:」行で free/paid 分割、セグメント分割（URL vs テキスト）して `/tmp/note-data-<slug>.json` に出力
- **Phase 0 ガード（マガジン URL 未注入チェック）**: 本文に未注入プレースホルダー `{{MAGAZINE_URL}}` が残っていたら、その記事は**公開せず中断**する。回遊フッタの `{{MAGAZINE_URL}}` は公開前に `inject-magazine-url.cjs` で実 URL に置換しておく必要がある（未置換のまま公開するとプレースホルダー文字列がそのまま記事に出る）。バッチ中の 1 記事が該当した場合、その記事だけスキップし他は続行してよい
- **Phase 2**: アイキャッチは**必ず本文入力前**に実行（本文入力後はスクロール位置がずれてボタン検出に失敗する）
- **Phase 4**: 全セグメントを 1 つの文字列に連結し **1 回だけ** ClipboardEvent paste（`type` は markdown 変換しない。連続 paste 不可）。本文は `window.__nb` に**チャンク分割注入**してから paste 発火する（一括 eval は大きい本文で daemon ペイロード上限に当たりタイムアウト）。URL は plain text のまま貼られる（カード化は手動）
- **Phase 5**: 目次からセクションにジャンプし、見出し直後にメニューから画像挿入

### Phase 7: 公開設定（有料設定・タグ・予約投稿）

詳細手順は **[references/scheduling.md](references/scheduling.md)** を参照。

実行順序: 公開に進む → **Phase 7-Pricing**（有料時のみ）→ Phase 7-Tags（ハッシュタグ）→ Phase 7-Schedule（予約 or 即時）

主なポイント:
- **Phase 7-Pricing**: `is_paid=true` + `price_jpy>0` のときだけ実行。有料ラジオをクリック → Shadow DOM 内 `<input id=price>` に JS で価格を上書き（`type` 不可: 初期値 300 と連結される）
- 有料記事は最後のボタン label が「投稿する」→「有料エリア設定」に変化。**有料エリア境界選択画面は本検証では未到達 → 半自動（価格までは自動、境界設定以降は手動）が当面の運用**
- 「公開に進む」→ ハッシュタグ入力 → 日時設定 → 予約投稿
- 予約日時が指定されていない場合でも Phase 7 で**即時公開**が可能（「今すぐ公開」ボタンをクリック）。日時設定をスキップして直接「今すぐ公開」を選ぶ
- 日時も即時公開も有料設定も不要な場合（下書き保存のみ）は Phase 7 全体をスキップ

### Phase 8 後: 公開 URL の自動記録

記事を公開（即時公開 or 予約投稿）したら、その note 記事 URL を
`.claude/state/note-published-urls.json` の `articles` に追記する。

- 公開直後、ブラウザの URL バー（`note.com/stats47/n/<id>`）または Phase 8 の確認画面から URL を取得
- `articles` に `"<slug>": { "vertical": "...", "title": "...", "url": "...", "is_paid": ..., "published_at": "YYYY-MM-DD" }` を追記
- 既に同じ slug があれば URL を上書き更新（再公開時）
- 下書き保存のみ（公開していない）の場合は記録しない

この記録は、シリーズの公開状況の真実源であり、マガジンへの記事追加・将来のリンク修正の参照元になる。

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
- 自動化パターン: `.claude/agents/browser-publisher.md` の note.com セクション
