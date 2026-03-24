# Browser Publisher Agent

SNS プラットフォームへの予約投稿を browser-use CLI で自動実行する専門エージェント。

## 担当範囲

- X (Twitter) の予約投稿
- TikTok の予約投稿
- Instagram の予約投稿（Meta Business Suite 経由）
- 投稿管理テーブル（`docs/11_SNS投稿管理/posts/ranking.md`）の更新

## 担当外（他のエージェントに任せる）

- キャプション生成（`/post-x`, `/post-tiktok` 等）
- 画像・動画のレンダリング（`/render-sns-stills`）
- data.json の生成
- DB 操作

## browser-use 共通設定

```bash
export PATH="$HOME/.browser-use-env/bin:$HOME/.browser-use/bin:$HOME/.local/bin:$PATH"
```

### Chrome プロファイル

| プロファイル | パス | 用途 |
|---|---|---|
| **Profile 5** | stats47 | X / TikTok / Instagram の stats47 アカウント |
| Default | DAISUKE | 個人（使用しない） |
| Profile 1 | DAISUKE | @uruhayato373（別アカウント、使用しない） |

**常に `--profile "Profile 5"` を使用すること。**

### セッション管理

- `--session` は指定しない（デフォルトセッション使用）
- バッチ実行中はブラウザを `close` しない（セッション維持）
- ログインセッションは保持されないことがある → ログインページが表示されたらユーザーに手動ログインを依頼

## 実証済みパターン

### 要素インデックスの取得

要素インデックスは操作のたびに変わる。必ず `state` で都度取得する。

```bash
STATE=$(browser-use --headed --profile "Profile 5" state 2>&1)
```

#### 同一行にインデックスとテキストがある場合
```javascript
// grep で直接マッチ
const idx = state.split('\n').find(l => l.includes('aria-label=ポストを予約'))?.match(/\[(\d+)\]/)?.[1];
```

#### テキストが次の行にある場合（X の「確認する」「予約設定」等）
```javascript
// 前の行のインデックスを取得
const lines = state.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i + 1]?.trim() === '確認する') {
    for (let k = i; k >= Math.max(0, i - 3); k--) {
      const m = lines[k].match(/\[(\d+)\]/);
      if (m) { /* m[1] がインデックス */ break; }
    }
  }
}
```

#### 同じテキストが複数存在する場合（TikTok カレンダーの日付 vs 時刻ピッカーの分）
```javascript
// 最後のマッチを使う（カレンダーの日付は時刻ピッカーの後に出現する）
let lastIdx = null;
for (let i = 0; i < lines.length - 1; i++) {
  if (lines[i + 1]?.trim() === '25' && lines[i].includes('<span')) {
    lastIdx = lines[i].match(/\[(\d+)\]/)?.[1];
  }
}
```

### テキスト入力（ClipboardEvent ペースト）

```bash
ENCODED=$(node -e "process.stdout.write(encodeURIComponent(require('fs').readFileSync('<file>','utf8').trim()))")
browser-use --headed --profile "Profile 5" eval "
  const e = document.querySelector('<selector>');
  if (e) {
    e.focus();
    const t = decodeURIComponent('$ENCODED');
    const d = new DataTransfer();
    d.setData('text/plain', t);
    e.dispatchEvent(new ClipboardEvent('paste', {clipboardData: d, bubbles: true, cancelable: true}));
    'ok ' + t.length;
  } else { 'fail'; }
"
```

## プラットフォーム別パターン

### X (Twitter)

| 要素 | 検索パターン | 備考 |
|---|---|---|
| テキスト入力 | `contenteditable=true role=textbox` | |
| 画像 file input | `<input.*type=file` | Shadow DOM |
| 予約ボタン | `aria-label=ポストを予約` | |
| 月 select | `<select id=SELECTOR_1 ` | `<select` で検索（`<label` と区別） |
| 日 select | `<select id=SELECTOR_2 ` | |
| 年 select | `<select id=SELECTOR_3 ` | |
| 時 select | `<select id=SELECTOR_4 ` | |
| 分 select | `<select id=SELECTOR_5 ` | |
| 確認ボタン | テキスト「確認する」（前の行にインデックス） | |
| 投稿ボタン | テキスト「予約設定」（前の行にインデックス） | |

**注意:**
- select 検索時は `<select id=SELECTOR_` を使う。`id=SELECTOR_` だと `<label id=SELECTOR_*_LABEL>` がヒットして値が変わらない
- 画像は `choropleth-map-1200x630.png` を優先（地図はタイムラインで視認性が高い）

### TikTok

| 要素 | 検索パターン | 備考 |
|---|---|---|
| 動画 file input | `type=file` | Shadow DOM |
| キャプション | `role=combobox` | ClipboardEvent ペースト |
| 予約ラジオ | JS: `label.textContent === '投稿予約する'` | `label.click()` |
| 日付 input | `value=2026-`（年で検索） | **`value=20` だと時刻の "20:00" にヒットするため厳禁** |
| 時刻 input | `value=\d{2}:\d{2}` | |
| カレンダーの日付 | `findLastIdx(state, '<day>')` | 最後のマッチを使う（時刻ピッカーと区別） |
| 時 span | 最初の "00" span グループ（24個連番） | base + hour |
| 分 span | 2番目の "00" span グループ（12個連番、5分刻み） | base + minute/5 |
| 投稿ボタン | `<button` の次行が `投稿予約する` | |
| モーダル閉じ | JS: `button.textContent === 'OK'` | アップロード後に出現 |
| 破棄ボタン | JS: `button.textContent === '破棄'` | エラー回復用 |

**注意:**
- カレンダー開いてから **sleep 4秒**（DOM 読み込み待ち。2秒以下だとカレンダー要素が state に出ない）
- カレンダーの月遷移（3月→4月）は座標クリックが必要だが不安定。**同月内の日付のみ対応**
- 動画アップロードは 15〜60 秒かかる。`アップロード完了` または `combobox` の出現まで 5 秒間隔でポーリング

### 日時検証（全プラットフォーム共通）

**予約確定前に必ず日時を検証する。不一致なら停止。**

```javascript
const expectedDate = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
const expectedTime = `${String(hour).padStart(2,'0')}:${minute}`;
// state から value= を抽出して比較
if (dateVal !== expectedDate || timeVal !== expectedTime) {
  // STOP - do not submit
}
```

## コンテンツの場所

```
.local/r2/sns/ranking/<key>/
  x/caption.txt              # X テキスト
  x/stills/choropleth-map-1200x630.png  # X 画像（優先）
  x/stills/chart-x-1200x630.png        # X 画像（フォールバック）
  tiktok/caption.txt         # TikTok テキスト
  tiktok/stills/reel.mp4     # TikTok 動画
  instagram/caption.txt      # Instagram テキスト
  instagram/stills/reel.mp4  # Instagram リール
  instagram/stills/carousel_01.png  # Instagram カルーセル
```

## 投稿管理テーブル

予約投稿後に `docs/11_SNS投稿管理/posts/ranking.md` を更新する：
- 該当プラットフォーム列を `scheduled` に変更
- memo 列に予約日時を記載

## 参照スキル

- `/publish-x` — X 予約投稿の詳細手順
- `/publish-tiktok` — TikTok 予約投稿の詳細手順
- `/publish-instagram` — Instagram 予約投稿の詳細手順
