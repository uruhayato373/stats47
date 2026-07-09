---
type: screenshot-guide
slug: ollama-offline-local-llm
article_title: ローカル LLM (Ollama) × Claude Code で完全オフライン業務
total_shots: 1
created: 2026-05-18
status: draft
---

# ローカル LLM (Ollama) × Claude Code で完全オフライン業務 — スクリーンショット撮影ガイド

## 撮影前準備

### macOS コマンド
- 全画面: `Cmd + Shift + 3`
- 範囲指定: `Cmd + Shift + 4`
- ウィンドウ単体: `Cmd + Shift + 4` → `Space`
- クリップボード保存: 上記に `Ctrl` 追加

### ターミナル推奨
- フォント: SF Mono / JetBrains Mono 14pt
- 背景: `#1E1E1E` (ダーク) で「機内モード ON」状況がわかりやすい
- ウィンドウサイズ: 1200×800
- プロンプト: `user@koumuin-mac ~ %` 程度に短縮

### マスキング原則
- 自治体名 → `○○市` (含めない方が無難)
- ユーザー名・ホスト名 → `user` / `koumuin-mac`
- Wi-Fi SSID (メニューバーに表示される場合) → 必ず塗りつぶし
- Ollama レスポンス内に実在組織名が出たら塗りつぶし or プロンプト変更

### 保存先
- ディレクトリ: `docs/31_note記事原稿/koumuin-claude-code/13-ollama-offline-local-llm/images/`
- 命名規則: `screenshot-N-<short>.png`
- 圧縮: 500KB 超は `pngquant --quality=70-90` で再圧縮

## 撮影リスト

### Shot 1: 機内モード ON + Ollama ローカル推論成功

- **本文位置**: 「### Step 2: モデルの選定とダウンロード」末尾の `ollama run qwen2.5:7b "総務省の文書管理規程の趣旨を 200 字以内で要約してください"` 直後
- **撮影対象**: Mac の画面全体スクリーンショット 1 枚に以下を収める:
  - メニューバー右上: Wi-Fi アイコンがオフ (斜線) / Bluetooth もオフ推奨
  - ターミナルウィンドウ中央: `ollama run qwen2.5:7b "総務省の文書管理規程の趣旨を 200 字以内で要約してください"` のコマンドと、その下に Ollama (Qwen 2.5 7B) が生成した日本語応答 (200 字程度) が表示されている状態
  - 任意で右上に control center を開き「Wi-Fi オフ」状態を明示
- **準備するもの**:
  1. `brew install ollama && ollama pull qwen2.5:7b` 完了済み環境
  2. `ollama serve` がバックグラウンドで起動 (`launchctl` or 別タブ)
  3. Wi-Fi をオフ (メニューバーアイコン → Wi-Fi をオフ)、有線 LAN も抜く
  4. 事前に同じプロンプトで応答品質を確認しておく (失敗時の再撮影回避)
- **マスキング項目**:
  - Wi-Fi SSID 履歴がドロップダウンに見えていたら塗りつぶし
  - メニューバーの位置情報サービス・通知センターに個人名が出ていたら隠す
  - ターミナルプロンプトの `user@hostname` → `user@koumuin-mac` に伏字 (`PS1` 変更 or 撮影後上書き)
  - Ollama 応答内の固有名詞は記事の趣旨と一致しているか確認
- **推奨ファイル名**: `screenshot-1-ollama-offline-demo.png`
- **撮影手順**:
  1. ターミナルを開き、新規セッションで `clear` 実行
  2. メニューバー → Wi-Fi アイコンをクリック → Wi-Fi をオフ
  3. (任意) 有線 LAN ケーブルを物理的に抜く
  4. ターミナルで `ollama run qwen2.5:7b "総務省の文書管理規程の趣旨を 200 字以内で要約してください"` を実行
  5. 応答が完了するまで待機 (M2 16GB なら 10-20 秒)
  6. 応答全文 + コマンド + メニューバーの Wi-Fi オフ状態が 1 画面に収まっていることを確認
  7. `Cmd + Shift + 3` で全画面撮影
  8. プレビューで余白トリミング & 個人情報塗りつぶし
  9. 撮影後 Wi-Fi を戻す (戻し忘れ注意)

## 撮影後手順

1. PNG を `images/` ディレクトリに保存
2. 500KB 超なら `pngquant --quality=70-90` で圧縮
3. `draft.md` のマーカー行を `![Wi-Fi オフ状態で Ollama がローカル推論している様子](./images/screenshot-1-ollama-offline-demo.png)` に置換
4. 個人情報残存チェック:
   - Wi-Fi SSID が映り込んでいないか
   - メニューバーの通知バナーに Slack / メール本文が出ていないか
   - 壁紙に個人写真が映っていないか (撮影前に無地壁紙へ切り替え推奨)
   - `pngcheck -t` でメタデータ確認
