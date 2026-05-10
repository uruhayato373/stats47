# 予約投稿・公開設定の手順

> このファイルは `publish-note` スキルの詳細手順です。概要は [SKILL.md](../SKILL.md) を参照。

## Phase 7: 公開設定（タグ・予約投稿）

## 即時公開フロー（日時指定なし）

予約投稿日時を指定しない場合でも、Phase 7 で即時公開できる。

### 7-0. 公開に進む → 「今すぐ公開」

```bash
browser-use --headed --profile "Profile 1" state 2>&1 > /tmp/note-state.txt
PUB_IDX=$(find_idx "公開に進む")
browser-use --headed --profile "Profile 1" click $PUB_IDX
sleep 3

# ハッシュタグ入力（tags.txt がある場合、上限50個）
browser-use --headed --profile "Profile 1" state 2>&1 > /tmp/note-state.txt
TAG_IDX=$(find_idx "ハッシュタグを追加する")
browser-use --headed --profile "Profile 1" click $TAG_IDX
# tags.txt | head -50 の各タグを入力（7-2 と同じ手順）

# 日時設定をスキップして「今すぐ公開」をクリック
browser-use --headed --profile "Profile 1" state 2>&1 > /tmp/note-state.txt
NOW_IDX=$(find_idx "今すぐ公開")
browser-use --headed --profile "Profile 1" click $NOW_IDX
sleep 3
```

---

## 予約投稿フロー（日時指定あり）

### 7-1. 公開に進む

```bash
browser-use --headed --profile "Profile 1" state 2>&1 > /tmp/note-state.txt
PUB_IDX=$(find_idx "公開に進む")
browser-use --headed --profile "Profile 1" click $PUB_IDX
sleep 3
```

### 7-2. ハッシュタグ入力

```bash
browser-use --headed --profile "Profile 1" state 2>&1 > /tmp/note-state.txt
TAG_IDX=$(find_idx "ハッシュタグを追加する")
browser-use --headed --profile "Profile 1" click $TAG_IDX
```

tags.txt の各タグについて（上限50個、`head -50` で超過を防ぐ）:

```bash
while IFS= read -r tag; do
  browser-use --headed --profile "Profile 1" type "$tag"
  browser-use --headed --profile "Profile 1" keys Enter
  sleep 0.5
done < <(head -50 <articleDir>/tags.txt)
```

### 7-3. 予約投稿の日時設定

```bash
browser-use --headed --profile "Profile 1" state 2>&1 > /tmp/note-state.txt
SCHED_IDX=$(find_idx "日時の設定")
browser-use --headed --profile "Profile 1" click $SCHED_IDX
sleep 2
```

カレンダーで日付を選択:

```bash
browser-use --headed --profile "Profile 1" state 2>&1 > /tmp/note-state.txt
# aria-label="Choose YYYY年M月D日..." の要素を検索
DATE_IDX=$(find_idx "Choose <YYYY>年<M>月<D>日")
browser-use --headed --profile "Profile 1" click $DATE_IDX
sleep 1
```

時刻リストから時間を選択:

```bash
browser-use --headed --profile "Profile 1" state 2>&1 > /tmp/note-state.txt
TIME_IDX=$(find_idx "<HH:MM>")
browser-use --headed --profile "Profile 1" click $TIME_IDX
sleep 1
```

### 7-4. 予約投稿を実行

```bash
browser-use --headed --profile "Profile 1" state 2>&1 > /tmp/note-state.txt
RESERVE_IDX=$(find_idx "予約投稿")
browser-use --headed --profile "Profile 1" click $RESERVE_IDX
sleep 3
```

完了ダイアログが表示されたら「閉じる」をクリック:

```bash
browser-use --headed --profile "Profile 1" state 2>&1 > /tmp/note-state.txt
CLOSE_IDX=$(find_idx "閉じる")
if [ -n "$CLOSE_IDX" ]; then
  browser-use --headed --profile "Profile 1" click $CLOSE_IDX
  sleep 1
fi
```
