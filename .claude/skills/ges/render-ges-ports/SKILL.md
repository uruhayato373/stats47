---
name: render-ges-ports
description: browser-use CLI で Google Earth Studio を自動操作し、港湾旋回動画の .esp アップロード→レンダリング→MP4 ダウンロードをバッチ実行する
disable-model-invocation: true
argument-hint: "[--port-code 14002] [--limit 5] [--grade 国際戦略港湾]"
---

browser-use CLI（Chrome Profile 5 / stats47）で Google Earth Studio（GES）を自動操作し、港湾用 .esp プロジェクトファイルのレンダリング→MP4 ダウンロードをバッチ実行する。

## 用途

- `generate-port-projects.ts` で生成済みの港湾用 .esp ファイルを GES でレンダリングしたいとき
- 22 港（国際戦略 5 + 国際拠点 17）の旋回動画を一括生成したいとき

## 引数

| パラメータ | 必須 | デフォルト | 説明 |
|---|---|---|---|
| **--port-code** | - | 全港 | 単一港のコードを指定（例: `14002`） |
| **--limit** | - | 全港 | 最大レンダリング数 |
| **--grade** | - | 国際戦略港湾,国際拠点港湾 | 対象の港湾グレード |
| **--aspect** | - | `1920-1080` | `1920-1080`（横）or `1080-1920`（縦） |
| **--resume** | - | false | チェックポイントから再開 |

## 前提条件（ハードブロック）

1. browser-use CLI がインストール済み（`browser-use doctor` で確認）
2. ESP ファイルが生成済み: `.local/r2/ges/ports/{aspect}/{port_code}.esp`
3. Chrome Profile 5（stats47）で Google アカウントにログイン済み
4. GES へのアクセス権あり（https://earth.google.com/studio/）

### ESP ファイルの生成（未生成の場合）

```bash
cd apps/ges
npx tsx scripts/generate-port-projects.ts
# オプション: --grade, --port-code, --limit, --aspect
```

## browser-use 共通設定

```bash
export PATH="$HOME/.browser-use-env/bin:$HOME/.browser-use/bin:$HOME/.local/bin:$PATH"
BU="browser-use --headed --profile 'Profile 5'"
```

## ファイルパス

| 用途 | パス |
|---|---|
| ESP 入力 | `.local/r2/ges/ports/{aspect}/{port_code}.esp` |
| MP4 出力 | `.local/r2/ges/ports/{aspect}/{port_code}.mp4` |
| チェックポイント | `.local/r2/ges/ports/render-progress.json` |
| ダウンロード一時 | `~/Downloads/` |

## 手順

### Phase 0: 準備

1. 対象の ESP ファイル一覧を取得

```bash
ls .local/r2/ges/ports/1920-1080/*.esp
```

2. チェックポイントファイルがあれば読み込み、完了済みの港をスキップリストに追加

```bash
cat .local/r2/ges/ports/render-progress.json 2>/dev/null || echo '{"completed":[],"failed":[]}'
```

3. 未レンダリングの ESP ファイルリストを確定（既に .mp4 が存在するものも除外）

### Phase 1: GES を開く

```bash
$BU open "https://earth.google.com/studio/"
sleep 8
$BU state
```

state を確認:
- **ログイン済み**: GES のメインページが表示（「New Project」「Open Project」等のボタンが見える）→ Phase 2 へ
- **未ログイン**: Google ログイン画面が表示 → ユーザーに手動ログインを案内して停止
- **アクセス拒否**: GES のウェイトリスト等 → 停止

**重要**: GES は WebGL ベースの SPA。`state` で DOM 要素が取得できるか確認すること。Canvas のみでボタンが見えない場合は、JS eval でボタンを探す:

```bash
$BU eval "const btns=[...document.querySelectorAll('button,a,[role=button]')];btns.map((b,i)=>i+':'+b.textContent.trim().substring(0,30)).join('\\n')"
```

### Phase 2: 各港のレンダリングループ

以下を各 ESP ファイルについて繰り返す。

#### 2-1. プロジェクトを開く

「Open Project」ボタンをクリック:

```bash
$BU state  # "Open" または "Open Project" のボタンインデックスを特定
$BU click <open_button_index>
sleep 3
```

ファイル選択ダイアログが表示されたら、file input を探してアップロード:

```bash
$BU state  # <input type=file> のインデックスを特定
$BU upload <file_input_index> <ESP ファイルの絶対パス>
sleep 8  # プロジェクト読み込み + 3D プレビュー初期化
```

プロジェクトが読み込まれたか `state` で確認。タイムラインやカメラ情報が表示されていれば OK。

#### 2-2. レンダーを開始

「Render」ボタンを探してクリック:

```bash
$BU state  # "Render" ボタンのインデックスを特定
$BU click <render_button_index>
sleep 3
```

レンダー設定ダイアログが表示される。以下を確認・設定:
- **解像度**: 1920x1080（横）or 1080x1920（縦）
- **フォーマット**: MP4（JPEG シーケンスではない）
- **フレームレート**: 30fps
- **品質**: High

設定が正しければ「Start Render」をクリック:

```bash
$BU state  # "Start Render" または "Render" 確認ボタンを特定
$BU click <start_render_index>
```

#### 2-3. レンダリング完了を待つ

30秒間隔で state をポーリングし、完了を検知する。最大 15 分（30回）。

```bash
# ポーリングループ（エージェントが手動で繰り返す）
sleep 30
$BU state
# 確認ポイント:
#   - プログレスバーまたは "XX%" テキストの有無
#   - "Download" ボタンの出現
#   - "Render complete" テキスト
#   - ダイアログが閉じてメインページに戻った（= 自動ダウンロード完了）
```

**完了検知パターン（優先順）**:
1. `state` に "Download" ボタンが出現 → クリックしてダウンロード
2. `state` に "100%" または "complete" テキスト → ダウンロードが自動開始される場合あり
3. `~/Downloads/` に新しい MP4 ファイルが出現（名前にプロジェクト名を含む）

**タイムアウト**: 15 分経過しても完了しない場合は failed として記録し、次の港に進む。

#### 2-4. ダウンロードファイルを移動

GES はデフォルトで `~/Downloads/` にダウンロードする。ファイル名はプロジェクト名ベース。

```bash
# 最新の MP4 ファイルを特定
ls -t ~/Downloads/*.mp4 | head -1

# ターゲットパスに移動
mv ~/Downloads/<ダウンロードされたファイル名>.mp4 .local/r2/ges/ports/1920-1080/<port_code>.mp4
```

ダウンロードファイルが見つからない場合は 10 秒待って再確認（最大 3 回リトライ）。

#### 2-5. チェックポイント更新

```bash
# render-progress.json を更新（completed に追加）
# エージェントが JSON を読み書きする
```

チェックポイント JSON 形式:
```json
{
  "completed": ["13001", "14002", "28002"],
  "failed": ["23003"],
  "lastUpdated": "2026-03-29T10:30:00Z"
}
```

#### 2-6. 次の港へ

GES のトップページに戻る:

```bash
$BU open "https://earth.google.com/studio/"
sleep 5
```

または「Close Project」→「Open Project」で次の ESP をアップロード。

### Phase 3: 後処理

全港のレンダリング完了後:

1. **結果レポート**を出力:

```bash
echo "=== GES Port Rendering Report ==="
echo "Completed: $(ls .local/r2/ges/ports/1920-1080/*.mp4 2>/dev/null | wc -l) ports"
echo "Expected:  $(ls .local/r2/ges/ports/1920-1080/*.esp | wc -l) ports"
ls .local/r2/ges/ports/1920-1080/*.mp4
```

2. **ポートレート版の生成**（縦動画が必要な場合）:

```bash
# FFmpeg で横→縦変換（中央クロップ + スケール）
for f in .local/r2/ges/ports/1920-1080/*.mp4; do
  code=$(basename "$f" .mp4)
  out=".local/r2/ges/ports/1080-1920/${code}.mp4"
  mkdir -p .local/r2/ges/ports/1080-1920
  ffmpeg -i "$f" -vf "crop=608:1080:(in_w-608)/2:0,scale=1080:1920,format=yuv420p" \
    -c:v libx264 -preset medium -crf 23 -an "$out" -y
done
```

3. スクリーンショットで最終確認:

```bash
$BU screenshot /tmp/ges-render-complete.png
```

## エラーハンドリング

| 状況 | 対応 |
|---|---|
| Google 未ログイン | ユーザーに手動ログインを案内して停止 |
| GES ページがロードされない | 5秒待ってリロード、2回失敗で停止 |
| ESP アップロード後にプロジェクトが開かない | 10秒追加待ち、失敗ならスキップ |
| レンダー 15 分タイムアウト | failed に記録してスキップ |
| ダウンロードファイルが見つからない | 10秒 x 3回リトライ、失敗なら failed |
| セッション切れ（リダイレクト） | 停止してユーザーに再ログイン依頼 |
| DOM 要素が取得できない（WebGL のみ） | JS eval でボタン探索を試みる |

## GES DOM 探索メモ

> **重要**: 初回実行時に以下の情報を記録し、このセクションを更新すること。

GES は WebGL ベースの SPA のため、`state` で取得できる要素が限定的な場合がある。
初回実行時に `$BU state` の出力を分析し、以下のパターンを記録:

- [ ] "Open Project" ボタンの特定方法
- [ ] ファイル入力要素の特定方法
- [ ] "Render" ボタンの特定方法
- [ ] レンダー設定ダイアログの構造
- [ ] "Start Render" ボタンの特定方法
- [ ] レンダー進捗の表示方法
- [ ] レンダー完了の検知方法
- [ ] ダウンロードファイル名のパターン

## バッチ実行時の注意

- ブラウザは閉じない（セッション維持のため）
- 1 港あたり 5-10 分のレンダリング時間を見込む
- 22 港で合計 3-4 時間
- チェックポイントにより途中停止→再開が可能
- Google アカウントのセッションは通常数時間は持つが、バッチ途中で切れる可能性あり

## 参照

- ESP 生成: `apps/ges/scripts/generate-port-projects.ts`
- 都道府県版 ESP 生成: `apps/ges/scripts/generate-projects.ts`
- browser-use パターン: `.claude/agents/browser-publisher.md`
- TikTok 自動投稿（類似パターン）: `.claude/skills/sns/publish-tiktok/SKILL.md`
