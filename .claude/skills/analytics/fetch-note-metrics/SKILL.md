---
name: fetch-note-metrics
description: note.com sitesettings/stats から記事別メトリクス (view / comment / like) を取得する。Use when user says "noteメトリクス", "note統計", "note ビュー数取得", "fetch-note-metrics". browser-use CLI で Chrome Profile 1 (note ログイン済) 経由で取得、.claude/state/metrics/note/ に JSON snapshot 保存。
disable-model-invocation: true
---

note.com の著者ダッシュボード `sitesettings/stats` から、全記事のメトリクスを取得するスキル。

`publish-note` 系と違い **読み取り専用**。週次で回して「どの記事が刺さっているか」を定量的に把握する。

## 用途

- 週次レビュー時の note 成績確認（Weekly Metrics Issue の note セクション元データ）
- 次の note 記事企画判断のデータ駆動化
- スキ / ビューの伸び記録によるトレンド把握

## 前提

- **Chrome の "Profile 1" に note.com のログインセッションが必要**
  - GUI で `chrome://version/` を開き「Profile Path」末尾が `Profile 1` のユーザーが note.com にログイン済みであること
  - 最初の 1 回は手動ログイン、以降は Chrome の persistent cookie で維持される（数週間〜数ヶ月）
  - sitesettings は sensitive なので稀に再認証が要求される可能性あり
- browser-use CLI が `~/.browser-use-env/bin/browser-use` に install 済み
- publish-note 用の Chrome Default プロファイルとは**別**（publish-note は Default、dashboard は Profile 1 / display 名「ユーザー 1」）

## 引数

```
/fetch-note-metrics
```

引数なし。単純に「今取得」するのみ。

## 実行

```bash
bash .claude/scripts/note/fetch-note-metrics.sh
```

スクリプトの動作:

1. `browser-use --profile "Profile 1"` で note.com/sitesettings/stats を開く
2. ログイン画面に reflect したら exit 2（手動再ログインを要請）
3. 「もっとみる」ボタンを全展開（記事数が 12 を超える場合にページング）
4. 全記事の DOM から `{url, noteId, title, views, comments, likes}` を抽出
5. URL で重複排除、totals 付与
6. `.claude/state/metrics/note/note-YYYY-MM-DD.json` に保存

## 出力

```json
{
  "fetched_at": "2026-04-24T13:00:00.000Z",
  "period_label": "月 (直近 30 日)",
  "source": "note.com/sitesettings/stats",
  "articles": [
    {
      "url": "https://note.com/stats47/n/nf962c6702b93",
      "noteId": "nf962c6702b93",
      "title": "【2023年版】都道府県「年間日照時間」ランキング！...",
      "views": 746,
      "comments": 0,
      "likes": 0
    },
    ...
  ],
  "totals": {
    "articles": 36,
    "views": 4734,
    "comments": 2,
    "likes": 104
  }
}
```

## Exit code

- `0`: 成功
- `2`: ログイン切れ（手動再ログインが必要）
- `3`: browser-use 実行エラー
- それ以外: python/bash のエラー

## ⚠️ 必須: 終了時クリーンアップ

`browser-use ... close` は page を閉じるが **daemon プロセス本体を停止しない**。さらに `--profile "Profile 1"` で起動した場合は **ユーザーの実 Chrome 内にタブを開く** ため、daemon を kill してもタブが残る。スクリプト末尾と `trap` で必ず以下 3 段すべてを実行する:

```bash
trap '
  browser-use --headed --profile "Profile 1" close 2>/dev/null || true
  pkill -KILL -f "browser_use.skill_cli.daemon" 2>/dev/null
  pkill -KILL -f "user-data-dir=.*ms-playwright/mcp-chrome" 2>/dev/null
  osascript -e "tell application \"Google Chrome\"
    repeat with w in windows
      repeat with t in tabs of w
        if URL of t contains \"note.com/sitesettings\" or URL of t contains \"note.com/login\" then
          close t
        end if
      end repeat
    end repeat
  end tell" 2>/dev/null || true
' EXIT INT TERM

# ... メイン処理 ...
```

trap を入れずに 1 日に何度も実行すると Chrome / Python daemon + note タブが累積する（2026-04-25 検証で daemon 6 個 + タブ 5 個残存を確認）。

## ログイン切れの対応

Exit 2 が出た場合:

1. 通常の Chrome を起動（**Chrome メニュー → ユーザー → 「ユーザー 1」を選択**）
2. https://note.com/login でログイン（「ログインしたままにする」チェック）
3. 試しに https://note.com/sitesettings/stats を開いてダッシュボードが見えることを確認
4. Chrome を閉じる（cookie は残る）
5. 本スクリプトを再実行

## 実行頻度

**週 1 回**（fetch-metrics-weekly の相乗り推奨、将来的に）。日次は note のビュー変動が小さくノイズが多い。

## トラブルシューティング

### Profile Path の特定
```bash
ls "/Users/$USER/Library/Application Support/Google/Chrome/" | grep -E "^(Default|Profile)"
# 各 profile の display 名
for d in "/Users/$USER/Library/Application Support/Google/Chrome/"*/; do
  name=$(basename "$d")
  display=$(python3 -c "import json; print(json.load(open('$d/Preferences')).get('profile', {}).get('name', ''))" 2>/dev/null)
  [[ -n "$display" ]] && echo "$name → $display"
done
```

note.com の cookie がどの profile にあるかは、各 profile で一度 browser-use open しないと確認できない（Chrome 実行中は Cookies DB ロックで直読不可）。

### browser-use eval で `result: None` が返る
複雑な multi-line スクリプトは eval で失敗することがある。**single-line / `JSON.stringify(...)` でラップ**して渡すと安定。

## 将来の拡張（本スキルスコープ外）

- L2 集約: `.claude/state/metrics/note/history.csv` に週次で append、前週比表示
- L3 統合: `generate-weekly-metrics-issue.mjs` に note セクション追加
- 期間切り替え: 週/年/全期間 の取得モード
- 記事個別ページの深い情報（公開日、マガジン、タグ）の追加取得
- `note-strategist` サブエージェント化

## 関連

- Issue #89（本スキルの親 Issue）
- `.claude/skills/note/publish-note/SKILL.md`（note 書き込み側、browser-use 共通パターン）
- `.claude/skills/management/knowledge/SKILL.md`（cookie persistence の学び）
