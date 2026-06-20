---
name: reference_voicevox_setup
description: VOICEVOX engine (CPU 版、Apple Silicon) のローカル起動手順。アプリ不要・CLI のみで http://127.0.0.1:50021 を立てる
metadata: 
  node_type: memory
  type: reference
  originSessionId: 06b3ea99-97e3-4491-8bc4-d8db37376bd9
---

ナレーション付き動画を作るときの VOICEVOX engine セットアップ。アプリ版 DMG ではなく
`voicevox_engine` バイナリを直接 DL する方式。

## インストール (初回)

```bash
mkdir -p ~/voicevox_engine_dl
curl -fL --progress-bar -o ~/voicevox_engine_dl/voicevox_engine-macos-arm64-0.25.2.7z.001 \
  "https://github.com/VOICEVOX/voicevox_engine/releases/download/0.25.2/voicevox_engine-macos-arm64-0.25.2.7z.001"
# 1.7GB DL → 解凍は p7zip 必要
brew install p7zip
cd ~/voicevox_engine_dl && 7z x voicevox_engine-macos-arm64-0.25.2.7z.001
# macOS Gatekeeper 隔離属性を外す (必須)
xattr -dr com.apple.quarantine ~/voicevox_engine_dl/macos-arm64
```

最新バージョンは GitHub Releases (https://github.com/VOICEVOX/voicevox_engine/releases) で確認。

## 起動

```bash
~/voicevox_engine_dl/macos-arm64/run --host 127.0.0.1 --port 50021 &
```

数十秒で http://127.0.0.1:50021/version で 0.25.x が返るようになる。バックグラウンドプロセス。

## 主要 API

- `POST /audio_query?text=...&speaker=N` → AudioQuery (JSON、accent_phrases 等を含む)
- `POST /synthesis?speaker=N` body: AudioQuery → WAV
- `GET /speakers` → 話者一覧

## 話者 ID 早見

- 四国めたん ノーマル: **2** (migration-flow / station-passengers で使用)
- 四国めたん あまあま / ツンツン / セクシー / ささやき / ヒソヒソ: 0 / 6 / 4 / 36 / 37

## ハマりどころ

- 「N 位」表記は「N くらい」に聞こえやすい (キュウイ→キュウクライ) → 「N 番目」推奨
- speedScale はテキスト長と動画尺から計算する (`apps/remotion/scripts/pipeline/lib/voicevox-tts.ts` 参照)
- バイナリは macOS 署名なし → `xattr -dr com.apple.quarantine` 必須
- ディスク: バイナリ 1.7GB + 解凍後 2.1GB

## 使うスキル

- [[reference_publish_youtube_47_summary]] (47県動画のナレーション付与)
