---
name: publish-tiktok
description: browser-use CLI で TikTok Studio の予約投稿を自動設定する（動画・キャプション・予約日時）
disable-model-invocation: true
argument-hint: "<rankingKey> --schedule YYYY-MM-DD HH:MM [--domain ranking]"
---

browser-use CLI（Chrome Profile 5 / stats47）で TikTok Studio を自動操作し、予約投稿を設定する。

## 用途

- `/post-tiktok` でキャプション生成済み、`/render-sns-stills` で動画生成済みのコンテンツを TikTok に予約投稿したいとき

## 引数

| パラメータ | 必須 | デフォルト | 説明 |
|---|---|---|---|
| **contentKey** | 必須 | - | ランキングキー等 |
| **--schedule** | 必須 | - | 予約投稿日時（JST）— 例: `2026-03-25 12:00`。**分は5分刻み**（00,05,10,...,55） |
| **--domain** | - | `ranking` | `ranking` / `compare` / `correlation` |

## 前提条件（ハードブロック）

1. browser-use CLI がインストール済み
2. 動画ファイルが存在する: `<baseDir>/tiktok/stills/reel.mp4`
3. キャプションファイルが存在する: `<baseDir>/tiktok/caption.txt`
4. Chrome Profile 5（stats47）で TikTok にログイン済み

### ベースディレクトリ

| ドメイン | baseDir |
|---|---|
| ranking | `.local/r2/sns/ranking/<contentKey>/` |

## browser-use 共通設定

```bash
export PATH="$HOME/.browser-use-env/bin:$HOME/.browser-use/bin:$HOME/.local/bin:$PATH"
BU="browser-use --headed --profile 'Profile 5'"
```

## 実証済みの要素パターン

| 要素 | 検索方法 | 備考 |
|---|---|---|
| 動画 file input | `<input type=file accept=video/*>` | Shadow DOM 内 |
| キャプション入力 | `contenteditable=true role=combobox` | ClipboardEvent ペースト |
| ハッシュタグボタン | `aria-label=ハッシュタグ` | |
| 予約ラジオ | `label` with text `投稿予約する` | JS `label.click()` で切替 |
| 日付 input | `<input type=text value=YYYY-MM-DD>` | Shadow DOM、クリックでカレンダー展開 |
| 時刻 input | `<input type=text value=HH:MM>` | Shadow DOM、クリックで時刻ピッカー展開 |
| 時（hour）リスト | span 要素群（00〜23、連番インデックス） | 最初の span=00 のインデックス + hour で計算 |
| 分（minute）リスト | span 要素群（00,05,10,...,55、連番インデックス） | 最初の分 span のインデックス + minute/5 で計算 |
| 日付セル | カレンダー内の日付テキスト | JS `eval` で日付テキスト一致する要素を click |
| 投稿予約ボタン | `<button>投稿予約する` | 予約ラジオ ON 時に表示 |

## 手順

### Phase 0: データ読み込み

1. `<baseDir>/tiktok/caption.txt` を読み込む
2. `<baseDir>/tiktok/stills/reel.mp4` の存在を確認
3. `--schedule` の日時をパース（年・月・日・時・分）
4. **分が5分刻みであることを確認**（0,5,10,...,55）。端数は最も近い5分に丸める

### Phase 1: ブラウザ起動 & アップロードページ

```bash
$BU open "https://www.tiktok.com/tiktokstudio/upload"
```

`sleep 5` で読み込みを待ち、`$BU state` で確認:
- `input type=file accept=video/*` があればログイン済み → Phase 2 へ
- 「ログイン」が見える場合 → 未ログイン、手動ログインを案内して停止

### Phase 2: 動画アップロード

```bash
$BU state  # <input type=file accept=video/*> のインデックスを特定
$BU upload <file_inputのindex> <動画ファイルの絶対パス>
sleep 10  # 動画アップロードは時間がかかる（サイズによる）
```

`$BU state` で「アップロード完了」またはキャプション入力欄の出現を確認。
アップロード中は「XX%」の進捗表示がある。完了まで待つ。

**モーダルが表示される場合**: 「OK」等のボタンを JS eval でクリックして閉じる:
```bash
$BU eval "const btns=document.querySelectorAll('button');for(const b of btns){if(b.textContent.trim()==='OK'){b.click();break;}}'ok'"
```

### Phase 3: キャプション入力

```bash
$BU state  # contenteditable=true role=combobox のインデックスを特定
$BU click <キャプション入力のindex>
```

ClipboardEvent でペースト:
```bash
ENCODED=$(node -e "process.stdout.write(encodeURIComponent(require('fs').readFileSync('<baseDir>/tiktok/caption.txt','utf8').trim()))")
$BU eval "const e=document.querySelector('[contenteditable=true][role=combobox]');if(e){e.focus();const t=decodeURIComponent('$ENCODED');const d=new DataTransfer();d.setData('text/plain',t);e.dispatchEvent(new ClipboardEvent('paste',{clipboardData:d,bubbles:true,cancelable:true}));'ok '+t.length}else{'fail'}"
```

### Phase 4: 予約設定

#### 4-1. 予約ラジオを ON にする

```bash
$BU eval "const labels=document.querySelectorAll('label');for(const l of labels){if(l.textContent.trim()==='投稿予約する'){l.click();break;}}'done'"
sleep 2
```

#### 4-2. 日付を設定する

日付 input をクリックしてカレンダーを展開:
```bash
$BU state  # <input type=text value=YYYY-MM-DD> のインデックスを特定
$BU click <日付inputのindex>
sleep 2
```

カレンダーの月が合っているか確認。月が異なる場合は `>` ボタンで月を送る。

日付セルを JS eval でクリック:
```bash
$BU eval "const cells=document.querySelectorAll('td,div,span');for(const c of cells){if(c.textContent.trim()==='<日>' && c.offsetParent!==null && !c.querySelector('*')){c.click();break;}}'clicked <日>'"
```

**注意**: 日付テキストが他の要素と衝突する場合がある。`c.querySelector('*')` で子要素がない（テキストのみの）要素を選ぶ。

#### 4-3. 時刻を設定する

時刻 input をクリックして時刻ピッカーを展開:
```bash
$BU state  # <input type=text value=HH:MM> のインデックスを特定
$BU click <時刻inputのindex>
sleep 2
```

時と分のインデックスを特定して順にクリック:
```bash
$BU state
# 時リスト: 00〜23 の span 連番（最初の span index + hour）
# 分リスト: 00,05,10,...,55 の span 連番（最初の分 span index + minute/5）
$BU click <時のspan index>
sleep 1
$BU click <分のspan index>
sleep 1
```

**時/分 span の特定方法**: `$BU state` で `00` の span が連続する2箇所を探す:
1. 最初の `00` 連番 = 時リスト（24個）
2. 2番目の `00` 連番 = 分リスト（12個）

#### 4-4. 日時を検証する

```bash
$BU state  # 日付 input の value と時刻 input の value を確認
```

期待値と一致しない場合は停止。

### Phase 5: 予約投稿を実行

```bash
$BU state  # 「投稿予約する」テキストの <button> を特定
$BU click <投稿予約ボタンのindex>
sleep 5
```

### Phase 6: 確認 & クリーンアップ

```bash
$BU screenshot /tmp/tiktok-publish-<contentKey>.png
```

スクリーンショットをユーザーに提示し、結果を報告。

**ブラウザは閉じない**（バッチ実行時にセッションを維持するため）。

### Phase 7: 投稿管理テーブル更新

`docs/11_SNS投稿管理/posts/ranking.md` の TT 列を `scheduled` に更新。

## バッチ実行時の注意

- ブラウザを閉じずに連続実行する
- 各投稿後に日時 input の value を検証し、不一致なら停止
- 動画アップロードに時間がかかるため、1件あたり30秒〜1分を見込む
- `<select id=SELECTOR_>` パターンではなく、span クリックと JS eval を使用（TikTok 固有）

## エラーハンドリング

- **ログインしていない場合**: 手動ログインを案内して停止
- **動画アップロード失敗**: リトライ1回。失敗なら停止
- **キャプションペースト失敗**: 段落ごとに `$BU type` で入力
- **カレンダー月不一致**: `>` ボタンで月を送る（`$BU eval` で SVG の次の月ボタンをクリック）
- **時刻ピッカー span 不一致**: `$BU state` で再取得し、テキスト内容で照合

## 参照

- キャプション生成: `/post-tiktok` スキル
- 動画生成: `/render-sns-stills` スキル
- X 予約投稿: `/publish-x` スキル（類似パターン）
