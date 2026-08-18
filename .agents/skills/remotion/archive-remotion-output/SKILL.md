---
name: archive-remotion-output
description: apps/remotion/out/ の master 動画・メタを manifest に従って .local/r2/{video,sns}/ に move する。R2 push 前の集約ステップ。Use when user says "archive remotion", "remotion 動画を保存", "out を整理".
argument-hint: "[--only <slug>] [--apply] [--copy]"
disable-model-invocation: true
primary_agent: sns-renderer
---

`apps/remotion/out/` の動画を **manifest 宣言に従って** `.local/r2/{video,sns}/` に集約する。

## 背景

`apps/remotion/out/` は Remotion レンダリング先で .gitignore 済。SNS / Web 用に保存したい master と、試行錯誤の scratch が混在する。本スキルは前者だけを `.local/r2/` に隔離する。

## 手順

1. manifest を確認 / 編集:
   ```
   apps/remotion/out/.archive-manifest.json
   ```
   形式は本 SKILL の末尾参照。新規プロジェクトを追加する場合はここに 1 ブロック追記する。

2. dry-run で対象を確認:
   ```bash
   node .Codex/scripts/remotion/archive.mjs
   node .Codex/scripts/remotion/archive.mjs --only <slug>   # 特定プロジェクトのみ
   ```

3. 実行:
   ```bash
   node .Codex/scripts/remotion/archive.mjs --apply
   ```
   - デフォルトは **move** (source を消す)。`--copy` で残す
   - dest が既存かつ同サイズなら skip (べき等)

4. R2 へ push:
   ```bash
   npx tsx packages/r2-storage/src/scripts/diff-push-r2.ts --prefix video
   npx tsx packages/r2-storage/src/scripts/diff-push-r2.ts --prefix sns
   ```

5. 不要な scratch は `/prune-remotion-output` で別途処理する。

## manifest 形式

`apps/remotion/out/.archive-manifest.json`:

```json
{
  "projects": {
    "<slug>": {
      "keep": [
        { "src": "<out 相対パス>", "dest": "<.local/r2 相対パス>" }
      ],
      "sns_segments": {
        "src_dir": "<out 相対ディレクトリ>",
        "dest_dir": "<.local/r2 相対ディレクトリ>"
      }
    }
  }
}
```

- `keep`: master 動画 + thumbnail + description などの個別ファイル
- `sns_segments`: 47 分割など ディレクトリごと丸ごと保存するもの (中身 全部)

## R2 キーパスのルール

| 用途 | dest プレフィックス | 例 |
|---|---|---|
| YouTube / web 埋め込み用 master | `video/<slug>/` | `video/migration-flow-47/master.mp4` |
| SNS 47 分割など再投稿候補 | `sns/<slug>/` | `sns/migration-flow/tokyo.mp4` |
| メタ (description / caption / thumbnail) | `video/<slug>/metadata/` | `video/migration-flow-47/metadata/description.txt` |

詳細: `.Codex/rules/r2-storage-design.md`

## 参照

- スクリプト: `.Codex/scripts/remotion/archive.mjs`
- 共通 lib: `.Codex/scripts/remotion/lib.mjs`
- R2 push: `.Codex/skills/db/push-r2/SKILL.md`
- 関連: `/prune-remotion-output`
