# 予約投稿・公開設定の手順

> このファイルは `publish-note` スキルの詳細手順です。概要は [SKILL.md](../SKILL.md) を参照。

## Phase 7: 公開設定（タグ・予約投稿）

### 7-1. 公開に進む

```bash
browser-use --headed --profile Default state 2>&1 > /tmp/note-state.txt
PUB_IDX=$(find_idx "公開に進む")
browser-use --headed --profile Default click $PUB_IDX
sleep 3
```

### 7-2. ハッシュタグ入力

```bash
browser-use --headed --profile Default state 2>&1 > /tmp/note-state.txt
TAG_IDX=$(find_idx "ハッシュタグを追加する")
browser-use --headed --profile Default click $TAG_IDX
```

tags.txt の各タグについて:

```bash
browser-use --headed --profile Default type "<タグ>"
browser-use --headed --profile Default keys Enter
sleep 0.5
```

### 7-3. 予約投稿の日時設定

```bash
browser-use --headed --profile Default state 2>&1 > /tmp/note-state.txt
SCHED_IDX=$(find_idx "日時の設定")
browser-use --headed --profile Default click $SCHED_IDX
sleep 2
```

カレンダーで日付を選択:

```bash
browser-use --headed --profile Default state 2>&1 > /tmp/note-state.txt
# aria-label="Choose YYYY年M月D日..." の要素を検索
DATE_IDX=$(find_idx "Choose <YYYY>年<M>月<D>日")
browser-use --headed --profile Default click $DATE_IDX
sleep 1
```

時刻リストから時間を選択:

```bash
browser-use --headed --profile Default state 2>&1 > /tmp/note-state.txt
TIME_IDX=$(find_idx "<HH:MM>")
browser-use --headed --profile Default click $TIME_IDX
sleep 1
```

### 7-4. 予約投稿を実行

```bash
browser-use --headed --profile Default state 2>&1 > /tmp/note-state.txt
RESERVE_IDX=$(find_idx "予約投稿")
browser-use --headed --profile Default click $RESERVE_IDX
sleep 3
```

完了ダイアログが表示されたら「閉じる」をクリック:

```bash
browser-use --headed --profile Default state 2>&1 > /tmp/note-state.txt
CLOSE_IDX=$(find_idx "閉じる")
if [ -n "$CLOSE_IDX" ]; then
  browser-use --headed --profile Default click $CLOSE_IDX
  sleep 1
fi
```
