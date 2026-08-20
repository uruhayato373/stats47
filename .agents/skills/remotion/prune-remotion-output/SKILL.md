---
name: prune-remotion-output
description: apps/remotion/out/ の「manifest 未記載 & 一定日数以上経過」のファイルを削除する。デフォルト dry-run + 7 日閾値。Use when user says "remotion out を掃除", "scratch を削除", "prune remotion".
argument-hint: "[--age <days>] [--apply]"
disable-model-invocation: true
primary_agent: sns-renderer
---

`apps/remotion/out/` から **scratch (manifest 未記載 & 古い) ファイル** を削除する。

## 安全装置

- デフォルト dry-run。`--apply` で初めて削除
- manifest (`.archive-manifest.json`) に `keep` / `sns_segments` として記載されたファイルは絶対に消さない
- mtime ベース。デフォルト 7 日以上経過したものだけ対象
- 空になったディレクトリは自動削除 (out ルートは残す)

## 手順

1. dry-run で確認:
   ```bash
   node .Codex/scripts/remotion/prune.mjs            # age >= 7d
   node .Codex/scripts/remotion/prune.mjs --age 0    # 全 scratch 即対象
   node .Codex/scripts/remotion/prune.mjs --age 14   # 2 週間以上のみ
   ```
   - 出力例:
     ```
     mode: DRY-RUN | age >= 7d
     candidates: 12, total: 1.2 GB
       yoy-landscape.mp4  [5.9 MB, 14d old]   ← v2 にリプレース済
       ...
     ```

2. ユーザーに目視確認してもらう (master を未登録のまま削除しないため)

3. 実削除:
   ```bash
   node .Codex/scripts/remotion/prune.mjs --apply
   node .Codex/scripts/remotion/prune.mjs --age 14 --apply
   ```

## 「うっかり保存し損ね」を防ぐ運用

- 新しい master をレンダリングした日に、`.archive-manifest.json` に追記 → `/archive-remotion-output` を実行する
- prune は週次レビュー (土〜日) などに走らせる
- もし master が prune 対象に含まれていたら、まず manifest に追加し `/archive-remotion-output` を実行してから prune する

## 参照

- スクリプト: `.Codex/scripts/remotion/prune.mjs`
- 共通 lib: `.Codex/scripts/remotion/lib.mjs`
- 関連: `/archive-remotion-output`
