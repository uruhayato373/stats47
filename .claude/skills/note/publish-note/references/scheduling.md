# 予約投稿・公開設定の手順

> このファイルは `publish-note` スキルの詳細手順です。概要は [SKILL.md](../SKILL.md) を参照。

## Phase 7: 公開設定（タグ・有料設定・予約投稿）

## 実行順序

```
公開に進む クリック
  ↓
公開設定画面が開く
  ↓
[Phase 7-Pricing] is_paid=true なら 有料 ラジオを選択 + 価格入力
  ↓
[Phase 7-Tags] ハッシュタグ入力
  ↓
[Phase 7-Schedule] 予約日時設定 (プレミアム必須) / または「今すぐ公開」
  ↓
[Phase 7-Submit] 投稿する or 予約投稿 or 有料エリア設定 (有料時) ボタンをクリック
```

## Phase 7-Pricing: 有料記事の販売価格設定（is_paid=true のときだけ実行）

> 検証日: 2026-05-18。通常アカウント（プレミアム未加入）で確認。
> 主要 selector はランタイムで都度取得（index は毎回変わる）。

### 動作確定済みの仕様

1. **公開設定画面では「記事タイプ」セクションに 無料 / 有料 のラジオが横並びで配置されている**
   - state 上の表記:
     - 無料: 親 `<div>` (`[N1]`) + 子 `<span>無料</span>` (`[N1+1]`)
     - 有料: 親 `<div>` (`[N2]`) + 子 `<span>有料</span>` (`[N2+1]`)
2. **有料ラジオをクリックすると以下が同時に起こる**
   - 「価格」ヘッダ + Shadow DOM 内の `<input type=text id=price placeholder=300 value=300>` が現れる
   - 画面右上の「投稿する」ボタンの label が **「有料エリア設定」** に変わる（= ボディ側で有料境界を設定するモードへ遷移する次画面が起動するボタン）
3. **`#price` input は最初に value=300 が入っている**。`type` で追加すると "3001200" のように連結されるので、必ず JS で value を上書きしてから input/change イベントを dispatch する
4. **「有料エリア設定」画面ではボディ上で有料境界（区切り線）を選択する必要がある**。本検証では当該画面まで進んでいないため自動化未確定。下記「未確定領域」を参照
5. **予約投稿はプレミアム加入者のみ**（通常アカウントは「日時の設定」ボタンが押せない or プレミアム表示が出る）

### 自動操作 step

```bash
# 前提: 「公開に進む」を既にクリック済み、公開設定画面が開いている

PRICE=$(jq -r '.priceJpy' /tmp/note-data-<slug>.json)
IS_PAID=$(jq -r '.isPaid' /tmp/note-data-<slug>.json)

if [ "$IS_PAID" = "true" ] && [ "$PRICE" -gt 0 ]; then
  echo "[Phase 7-Pricing] 有料記事として price=$PRICE 円を設定"

  # 7P-1. state を取得して 有料 ラジオの index を見つける
  browser-use --headed --profile "Profile 5" state 2>&1 > /tmp/note-state.txt

  # "有料" span の親 div (1 つ上の行) の index を取る
  # state 上のパターン:
  #   [823]<div />
  #   [824]<span />
  #       有料
  # → 親 div の index ([823]) をクリック対象にする
  PAID_PARENT_IDX=$(grep -B2 '^[[:space:]]*有料$' /tmp/note-state.txt \
    | grep -oE '\[[0-9]+\]<div' | tail -1 | grep -oE '[0-9]+')
  if [ -z "$PAID_PARENT_IDX" ]; then
    echo "ERROR: 有料 ラジオが見つからない。販売価格設定を中断"
    exit 1
  fi
  browser-use --headed --profile "Profile 5" click "$PAID_PARENT_IDX"
  sleep 3

  # 7P-2. 価格 input (Shadow DOM 内 id=price) の value を JS で上書き
  #   理由: 既に value=300 が入っているため type すると連結される
  #         Shadow DOM 内のため CSS で querySelector できないので
  #         deep tree walk で id=price input を探す
  ESCAPED_PRICE=$(printf '%s' "$PRICE" | sed 's/"/\\"/g')
  browser-use --headed --profile "Profile 5" eval "
    function findPriceInput(root) {
      if (!root) return null;
      try {
        const el = root.querySelector && root.querySelector('input#price');
        if (el) return el;
      } catch(e) {}
      const all = root.querySelectorAll ? root.querySelectorAll('*') : [];
      for (const node of all) {
        if (node.shadowRoot) {
          const f = findPriceInput(node.shadowRoot);
          if (f) return f;
        }
      }
      return null;
    }
    const input = findPriceInput(document);
    if (!input) { 'price input not found'; }
    else {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, '$ESCAPED_PRICE');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.dispatchEvent(new Event('blur', { bubbles: true }));
      'set price to ' + input.value;
    }
  "
  sleep 2

  # 7P-3. 価格が反映されたか state で確認
  browser-use --headed --profile "Profile 5" state 2>&1 > /tmp/note-state.txt
  if grep -qE "input type=text id=price[^/]*value=$PRICE" /tmp/note-state.txt; then
    echo "[Phase 7-Pricing] 価格 $PRICE 円を反映済"
  else
    echo "WARN: 価格反映を state 上で確認できない。手動確認を推奨"
  fi
fi
```

## Phase 7-Boundary: 有料エリア境界の設定（is_paid=true・自動／初回 live で DOM 確定）

価格設定（7-Pricing）の後、primary ボタン label が「有料エリア設定」に変わる。これをクリックすると
ボディ上で**有料ライン（ここから先が有料）を置く画面**になる。境界 = 有料本文の先頭段落
（`segmentsPaid[0]`）の直前。frontmatter の `ここから先は有料部分:` で Phase 0 が free/paid を分割済みなので、
**有料先頭段落の冒頭テキストを錨**にして境界を置く。

> **⚠️ 安全原則（誤露出防止）**: 境界を誤ると有料本文が無料露出する。本 Phase は **境界設定までで停止し、
> 最終「投稿/予約投稿」ボタンは自動で押さない**。境界が正しいか screenshot で確認してから人間が投稿を確定する。
>
> **⚠️ 初回 live 検証**: 「有料エリア設定」画面の DOM は stats47/doboku-note とも未観測。本手順は
> **初回実行で画面 state + screenshot を必ず捕捉**し、捕捉結果に基づいて B-3 の境界コントロール click を
> 確定させる（捕捉前にハードコードしたセレクタで盲打ちしない）。一度確定したら以降は同セレクタで自動運用する。

```bash
if [ "$IS_PAID" = "true" ] && [ "$PRICE" -gt 0 ]; then
  # B-1. 「有料エリア設定」ボタン → 境界設定画面へ
  browser-use --headed --profile "Profile 5" state 2>&1 > /tmp/note-state.txt
  AREA_IDX=$(find_idx "有料エリア設定")
  if [ -z "$AREA_IDX" ]; then echo "ERROR: 『有料エリア設定』ボタン未検出。価格設定の確認が必要"; exit 1; fi
  browser-use --headed --profile "Profile 5" click "$AREA_IDX"
  sleep 3

  # B-2. ★境界設定画面の DOM を必ず捕捉（未観測画面のため。初回はここで実構造を確定する）
  browser-use --headed --profile "Profile 5" state 2>&1 > /tmp/note-paidarea-state.txt
  browser-use --headed --profile "Profile 5" screenshot /tmp/note-paidarea-<slug>.png
  echo "[Phase 7-Boundary] 境界設定画面 DOM=/tmp/note-paidarea-state.txt 画面=/tmp/note-paidarea-<slug>.png に捕捉"

  # B-3. 有料先頭段落を錨に境界を置く
  #   PAID_HEAD = segmentsPaid[0] の冒頭。PAID_HEAD 段落の *直前* の境界コントロールを click する。
  PAID_HEAD=$(jq -r '.segmentsPaid[0].content' /tmp/note-data-<slug>.json | head -c 24)
  #   ↓ 実セレクタは B-2 捕捉で確定（初回確定後はこの grep を実 DOM パターンに置換して固定運用）:
  BOUNDARY_IDX=$(grep -B3 -F "$PAID_HEAD" /tmp/note-paidarea-state.txt \
    | grep -oiE '\[[0-9]+\]<[^>]*(有料|ここから|paid|line|区切)' | tail -1 | grep -oE '[0-9]+')
  if [ -n "$BOUNDARY_IDX" ]; then
    browser-use --headed --profile "Profile 5" click "$BOUNDARY_IDX"
    sleep 2
    echo "[Phase 7-Boundary] 境界(idx=$BOUNDARY_IDX)を PAID_HEAD='$PAID_HEAD' 直前に設定"
  else
    echo "WARN: 境界コントロール未特定。/tmp/note-paidarea-state.txt を確認し B-3 の grep を実 DOM に合わせ確定（初回のみ）。設定せず停止。"
    exit 1
  fi

  # B-4. 設定後 screenshot（PAID_HEAD 直前に有料ラインが入ったか目視確認用）
  browser-use --headed --profile "Profile 5" screenshot /tmp/note-paidarea-set-<slug>.png
  echo "[Phase 7-Boundary] 設定後=/tmp/note-paidarea-set-<slug>.png。PAID_HEAD 直前に有料ラインがあるか確認"

  # B-5. ★最終「投稿/予約投稿」は自動で押さない。境界を screenshot で確認してから人間が確定する（誤露出防止）。
fi
```

### 運用ルール（2026-06-15 更新: 半自動 → 自動／初回 live で DOM 確定）

- **無料記事（is_paid=false）**: Phase 7 全自動（従来どおり）。
- **有料記事（is_paid=true）**: 価格設定（7-Pricing）+ 有料境界設定（7-Boundary）まで自動。ただし
  **(1) 境界画面 DOM は初回 live で確定**（B-2 捕捉に基づき B-3 セレクタを固定）、
  **(2) 最終投稿ボタンは誤露出防止で人間が screenshot 確認後に確定**する。
- リンクカード化（本文 URL）は Phase 4-3 で自動（editor-operations.md 参照）。
- レポートには有料記事について「価格=自動／境界=自動設定（要目視確認）／最終投稿=手動確定」を明記する。

### 予約投稿との併用（is_paid=true + 予約）

価格 → 有料境界設定 → タグ → 日時設定 → 予約投稿、の順。境界が予約フローのどの段階で確定するかは
初回 live（B-2 捕捉）で順序を確認し、確定後に本節へ実順序を追記する。

---

## 即時公開フロー（日時指定なし）

予約投稿日時を指定しない場合でも、Phase 7 で即時公開できる。

### 7-0. 公開に進む → 「今すぐ公開」

```bash
browser-use --headed --profile "Profile 5" state 2>&1 > /tmp/note-state.txt
PUB_IDX=$(find_idx "公開に進む")
browser-use --headed --profile "Profile 5" click $PUB_IDX
sleep 3

# ハッシュタグ入力（hashtags.txt 優先・無ければ tags.txt、head -50）
browser-use --headed --profile "Profile 5" state 2>&1 > /tmp/note-state.txt
TAG_IDX=$(find_idx "ハッシュタグを追加する")
browser-use --headed --profile "Profile 5" click $TAG_IDX
# タグファイル | head -50 の各タグを入力（7-2 と同じ手順）

# 日時設定をスキップして「今すぐ公開」をクリック
browser-use --headed --profile "Profile 5" state 2>&1 > /tmp/note-state.txt
NOW_IDX=$(find_idx "今すぐ公開")
browser-use --headed --profile "Profile 5" click $NOW_IDX
sleep 3
```

---

## 予約投稿フロー（日時指定あり）

### 7-1. 公開に進む

```bash
browser-use --headed --profile "Profile 5" state 2>&1 > /tmp/note-state.txt
PUB_IDX=$(find_idx "公開に進む")
browser-use --headed --profile "Profile 5" click $PUB_IDX
sleep 3
```

### 7-2. ハッシュタグ入力

```bash
browser-use --headed --profile "Profile 5" state 2>&1 > /tmp/note-state.txt
TAG_IDX=$(find_idx "ハッシュタグを追加する")
browser-use --headed --profile "Profile 5" click $TAG_IDX
```

タグファイルの各タグについて入力する。タグファイルは **`hashtags.txt` を優先し、無ければ `tags.txt`** を使う（koumuin-claude-code シリーズは各記事に `hashtags.txt`（90 タグのプール）を持つ）。

note のハッシュタグ投稿上限の都合で **`head -50` で上位 50 個に絞る**（hashtags.txt の先頭ほど重要なタグ。実際の上限は投稿時に要確認、超過分は弾かれるだけで害はない）:

```bash
TAGFILE="<articleDir>/hashtags.txt"
[ -f "$TAGFILE" ] || TAGFILE="<articleDir>/tags.txt"
while IFS= read -r tag; do
  [ -z "$tag" ] && continue
  browser-use --headed --profile "Profile 5" type "$tag"
  browser-use --headed --profile "Profile 5" keys Enter
  sleep 0.5
done < <(head -50 "$TAGFILE")
```

### 7-3. 予約投稿の日時設定

```bash
browser-use --headed --profile "Profile 5" state 2>&1 > /tmp/note-state.txt
SCHED_IDX=$(find_idx "日時の設定")
browser-use --headed --profile "Profile 5" click $SCHED_IDX
sleep 2
```

カレンダーで日付を選択:

```bash
browser-use --headed --profile "Profile 5" state 2>&1 > /tmp/note-state.txt
# aria-label="Choose YYYY年M月D日..." の要素を検索
DATE_IDX=$(find_idx "Choose <YYYY>年<M>月<D>日")
browser-use --headed --profile "Profile 5" click $DATE_IDX
sleep 1
```

時刻リストから時間を選択:

```bash
browser-use --headed --profile "Profile 5" state 2>&1 > /tmp/note-state.txt
TIME_IDX=$(find_idx "<HH:MM>")
browser-use --headed --profile "Profile 5" click $TIME_IDX
sleep 1
```

### 7-4. 予約投稿を実行

```bash
browser-use --headed --profile "Profile 5" state 2>&1 > /tmp/note-state.txt
RESERVE_IDX=$(find_idx "予約投稿")
browser-use --headed --profile "Profile 5" click $RESERVE_IDX
sleep 3
```

完了ダイアログが表示されたら「閉じる」をクリック:

```bash
browser-use --headed --profile "Profile 5" state 2>&1 > /tmp/note-state.txt
CLOSE_IDX=$(find_idx "閉じる")
if [ -n "$CLOSE_IDX" ]; then
  browser-use --headed --profile "Profile 5" click $CLOSE_IDX
  sleep 1
fi
```
