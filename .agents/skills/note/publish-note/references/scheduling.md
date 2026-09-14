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
4. **「有料エリア設定」画面ではボディ上で有料境界（区切り線）を選択する必要がある**。**2026-06-16 に全工程を実機検証済（update 11 本 + 新規 2 本連続成功）**。robust 実装は `.claude/scripts/note/editor-helpers.sh` の `paid_setline`（要素ベース scroll + 空白/バッククォート/先頭`#` 非依存マッチ）。下記 Phase 7-Boundary 参照。
   - ★**有料ラジオは「有料」span（テキスト要素）を click する**。親 `<div>` を click しても選択されない事例があった（2026-06-16・cc#20）。価格は既定で value=300 が入るので ¥300 ならそのままでよい。
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

## Phase 7-Boundary: 試し読み／有料ライン設定（2026-06-15 実機検証済）

**実機で確定したフロー**（2026-06-15、`00-estat-claude-code-intro` の --update で全工程成功）:

1. **公開設定画面**（公開に進む後）右上の primary ボタンを押す → ライン設定画面へ。
   - ラベルは **無料記事=「試し読みエリアを設定」/ 有料記事=「有料エリア設定」**。どちらも同じライン設定画面。
2. ライン設定画面: 各ブロック境界に **「ラインをこの場所に変更」** ボタンが並ぶ。画面上部に警告
   「設定したラインより上が無料で読めるエリアになります。**ラインを設定しない場合は購入・購読した人だけが読める記事になります**」。
   - ⚠️ **ラインを置かずに更新すると全文ロック**される。必ずラインを置く。
   - **無料記事 → ラインを「記事末尾」に置く（=全文無料）**。`state` は**ビューポート内のボタンしか出さない**ので、
     先に eval で最下部までスクロール → 末尾の「ラインをこの場所に変更」を click（クリック後ボタンが黒反転＋×表示）。
   - **有料記事 → `segmentsPaid[0]` 先頭段落の直前の「ラインをこの場所に変更」を click**（その段落へスクロール→錨テキストで特定）。
3. 右上 **「更新する」（新規は「投稿する」）** を click → **「記事が公開されました」モーダル**（X/Facebook/LINE/リンクコピーの共有ボタン）が出れば成功。
4. 成功後 `.claude/state/note-published-urls.json` に `updated_at` を記録。

> ボタン index は state 上で**ラベル行の 1 つ前の `[NNN]<button>` 行**から取る（例: `grep -B1 "ラインをこの場所に変更" state.txt | grep -oE '\[[0-9]+\]' | tail -1`）。

```bash
# 前提: 「公開に進む」済 → 公開設定画面 → 記事タイプ(無料/有料)・価格(有料時 7-Pricing)設定済
export PATH="$HOME/.browser-use-env/bin:$PATH"
# B-1. ライン設定画面へ（無料=試し読みエリアを設定 / 有料=有料エリア設定）
browser-use --headed --profile "Profile 5" state 2>&1 > /tmp/note-state.txt
AREA_IDX=$(grep -B1 -E "(試し読みエリアを設定|有料エリア設定)" /tmp/note-state.txt | grep -oE '\[[0-9]+\]' | tail -1 | tr -d '[]')
browser-use --headed --profile "Profile 5" click "$AREA_IDX"; sleep 3

# B-2. 最下部までスクロール（state はビューポート内ボタンのみ列挙するため）
browser-use --headed --profile "Profile 5" eval "(function(){let n=0;document.querySelectorAll('*').forEach(el=>{if(el.scrollHeight>el.clientHeight+50){el.scrollTop=el.scrollHeight;n++;}});window.scrollTo(0,document.body.scrollHeight);return 'scrolled:'+n;})();"
sleep 2
browser-use --headed --profile "Profile 5" state 2>&1 > /tmp/note-line.txt
browser-use --headed --profile "Profile 5" screenshot /tmp/note-line-<slug>.png

if [ "$IS_PAID" = "true" ]; then
  # B-3paid. segmentsPaid[0] 先頭を錨に、その直前のラインボタンを click（要・該当段落へスクロール）
  PAID_HEAD=$(jq -r '.segmentsPaid[0].content' /tmp/note-data-<slug>.json | head -c 20)
  LINE_IDX=$(grep -B3 -F "$PAID_HEAD" /tmp/note-line.txt | grep -B1 "ラインをこの場所に変更" | grep -oE '\[[0-9]+\]' | tail -1 | tr -d '[]')
  [ -z "$LINE_IDX" ] && { echo "WARN: 有料境界ボタン未特定。/tmp/note-line-<slug>.png を確認。盲更新しない"; exit 1; }
else
  # B-3free. 末尾（最後の「ラインをこの場所に変更」）= 全文無料
  LINE_IDX=$(grep -B1 "ラインをこの場所に変更" /tmp/note-line.txt | grep -oE '\[[0-9]+\]' | tail -1 | tr -d '[]')
fi
browser-use --headed --profile "Profile 5" click "$LINE_IDX"; sleep 2
# B-4. ★更新前に screenshot 検証（ラインが意図位置=末尾/境界にあり黒反転しているか）
browser-use --headed --profile "Profile 5" screenshot /tmp/note-line-set-<slug>.png
# 検証OKなら更新（有料は特に、ラインが境界にあることを screenshot で確認してから）
browser-use --headed --profile "Profile 5" state 2>&1 > /tmp/note-upd.txt
UPD_IDX=$(grep -B1 -E "(更新する|投稿する)" /tmp/note-upd.txt | grep -oE '\[[0-9]+\]' | tail -1 | tr -d '[]')
browser-use --headed --profile "Profile 5" click "$UPD_IDX"; sleep 5
browser-use --headed --profile "Profile 5" screenshot /tmp/note-done-<slug>.png   # 「記事が公開されました」確認
```

### 運用ルール（2026-06-16 更新: 境界 DOM 確定済・robust 実装は editor-helpers.sh）

- **無料記事（is_paid=false）**: Phase 7 全自動。新規は確定ボタン「投稿する」/ update は「更新する」。試し読みラインは**末尾**（全文無料）。
- **有料記事（is_paid=true）**: 価格設定（7-Pricing）+ 有料境界設定（7-Boundary）まで自動。**境界画面 DOM は 2026-06-16 に確定済**（11 本連続成功）。
  最終確定ボタンは**境界を screenshot で目視確認してから押す**（誤露出防止のゲートは維持。エージェントが Read で screenshot を検証してから押下して可）。
- ★**robust 実装は `.claude/scripts/note/editor-helpers.sh` の `paid_setline` / `process_article` を使う**。下記 B-3paid の素朴な `grep -B3 -F "$PAID_HEAD"` は **state がビューポート内しか出さない／`### `・バッククォート・全角空白で突合が外れる**ため脆い。`paid_setline` は要素ベース scroll で paidHead をビューに入れ、空白・バッククォート・先頭 `#` を除去して突合する（この差異で複数記事が「not-found」になった）。
- リンクカード化（本文 URL）は Phase 4-3 で自動（editor-operations.md 参照）。
- レポートには有料記事について「価格=自動／境界=自動設定（screenshot 目視）／最終投稿=screenshot 確認後に確定」を明記する。

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

# ハッシュタグ入力（hashtags.txt 優先・無ければ tags.txt、head -99）
browser-use --headed --profile "Profile 5" state 2>&1 > /tmp/note-state.txt
TAG_IDX=$(find_idx "ハッシュタグを追加する")
browser-use --headed --profile "Profile 5" click $TAG_IDX
# タグファイル | head -99 の各タグを入力（7-2 と同じ手順）

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

タグファイルの各タグについて入力する。タグファイルは **`hashtags.txt` を優先し、無ければ `tags.txt`** を使う（各記事に 99 タグのプールを持つ）。

note の実機上限に合わせ、**`head -99` で 99 個に絞る**（hashtags.txt の先頭ほど重要なタグ）:

```bash
TAGFILE="<articleDir>/hashtags.txt"
[ -f "$TAGFILE" ] || TAGFILE="<articleDir>/tags.txt"
while IFS= read -r tag; do
  [ -z "$tag" ] && continue
  browser-use --headed --profile "Profile 5" type "$tag"
  browser-use --headed --profile "Profile 5" keys Enter
  sleep 0.5
done < <(head -99 "$TAGFILE")
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
