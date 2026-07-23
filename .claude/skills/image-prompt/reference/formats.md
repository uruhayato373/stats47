# 用途別の出力フォーマット仕様

各用途（use_case）ごとの推奨サイズ・アスペクト比・セーフエリア・テキスト配置制約をまとめる。`/image-prompt` はここから値を引いてプロンプトを調整する。

## 用途別スペック

| use_case | 推奨サイズ | アスペクト比 | 想定クロップ | 保存先 |
|---|---|---|---|---|
| `note-header` | 1280×670 | ≒1.91:1 | 上下わずか | `docs/31_note記事原稿/<slug>/header.png` |
| `blog-hero` | 1600×900 | 16:9 | なし（記事内で使用） | `docs/21_ブログ記事原稿/<slug>/hero.png` |
| `x-banner` | 1500×500 | 3:1 | モバイル時に上下クロップ | `.local/r2/sns/brand/x-banner.png` |
| `sns-supporting` | 1080×1080 or 1080×1350 | 1:1 or 4:5 | プラットフォーム依存 | `.local/r2/sns/ranking/<ranking_key>/supporting.png` |
| `brand-asset` | 任意（1920×1080 推奨） | 16:9 | なし | `.local/r2/brand/` |
| `portal-ranking-thumbnail` | 1280×720 | 16:9 | 中央/下部セーフエリア | `.local/portal-thumbnails/<ranking_key>/background.<ext>`（生成のみ・R2/commit しない） |

`portal-ranking-thumbnail` は home 注目ランキングカードの **AI 背景**専用（文字・数値・県名・年度・出典・正確な日本地図・ロゴ・UI は描かせず、決定的 renderer が合成する）。プロンプト SSOT = `apps/web/scripts/data/portal-thumbnail-catalog.ts`（`buildPortalThumbnailPrompt`）、生成 = `apps/web/scripts/generate-portal-thumbnails.ts`。正典 = `docs/02_実装計画/38_ポータル型ホーム・ヘッダー再設計仕様.md` §12.7-12.11。生成 = `GEMINI_API_KEY`（CI Secret 専任）で CI `gemini-image-run.yml` 経由。**home-featured-v1 実験は 2026-07-23 に終了・editorial 採用済み**（doc 28 §9.5）なので §11.2 の「判定前は wire しない」制約は解消。composite（AI 背景 + 決定的 data overlay。title/値は DOM text 保持）は生成 asset が R2 に揃った後に注目ランキングカードへ wire する。

## テキスト配置の制約

### 共通ルール

- **最重要情報（タイトル）は中央に寄せる**: どのクロップ仕様でも生存する中央セーフゾーンを想定
- **タイトル文字数の目安**: 日本語 8〜15 文字 / 英数字 20〜30 文字（極太フォントが前提）
- **長いタイトルは改行を想定**: プロンプトの `"{{TITLE}}"` 部分は 1 行想定のため、30 文字以上になる場合はタイトルを短縮するか複数行対応プロンプトに切り替える

### 用途別セーフエリア

**note-header（1280×670）**
- note.com のフィード表示で上下がわずかにクロップされる
- タイトル上下に各 50px の余白を確保
- 左右は 100px の余白

**x-banner（1500×500）**
- モバイル表示では高さ約 350px に縮小される（中央のみ残る）
- **タイトルは必ず中央 1500×350 の領域内**
- プロフィール画像と重なる左下 400×250 は情報を置かない

**sns-supporting（1:1 正方形）**
- Instagram フィード・X 画像投稿・TikTok サムネ共用
- 中央 900×900 にタイトル・グラフ要素を集約

## アスペクト比変換（Midjourney `--ar`）

カタログのプロンプトは `--ar 2500:1000` がデフォルト（2.5:1）。用途によって書き換える:

| use_case | 書き換え先 `--ar` |
|---|---|
| note-header | `--ar 1920:1005`（1.91:1 相当） |
| blog-hero | `--ar 16:9` |
| x-banner | `--ar 3:1` |
| sns-supporting (1:1) | `--ar 1:1` |
| sns-supporting (4:5) | `--ar 4:5` |
| brand-asset | `--ar 16:9` |

## 後処理（生成後の推奨作業）

1. **解像度確認**: Midjourney は 2K 程度で出力。必要に応じて Upscale
2. **テキスト可読性チェック**: AI 生成は時々文字が崩れる。重要なタイトルは Photoshop / Figma で上書きするのが安全
3. **ブランドロゴ追加**: 右下に stats47 のウォーターマーク（オプション）
4. **ファイルサイズ最適化**: 保存前に `pngquant` 等で圧縮（note は 10MB 上限）

## OGP セーフエリアとの関係

**本スキルは OGP を直接生成しない**。サイト内 OGP は Satori (`apps/web/src/app/**/opengraph-image.tsx`) または Remotion (`apps/remotion/src/features/ogp/`) で作る。

ただし、`/image-prompt` で生成したヘッダー画像を **OGP の背景として再利用**するケースでは、中央 630×630 に重要情報が収まっている必要がある。カタログの 2.5:1 プロンプトから 1.91:1 に変換するとき、タイトルが中央セーフエリア外に出ないか確認すること。

## イテレーションの記録

試作の履歴を残すと感触を掴みやすい。推奨フォーマット:

```
<保存先>/
├── v1-id51.png    # #51 で試作
├── v2-id75.png    # #75 に変更
├── v3-id77.png    # #77 を採用 → 最終
└── final.png      # v3 を採用としてコピー
```

採用した ID は記事の frontmatter に記録:

```yaml
---
title: "..."
ogp_template_id: 77
---
```

将来の参考・横展開時に使える。
