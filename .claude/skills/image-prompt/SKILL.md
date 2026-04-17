---
name: image-prompt
description: 外部 AI 画像生成（Midjourney 等）用のプロンプトを 43 種のテンプレートから生成する。Use when user says "OGP画像プロンプト", "note表紙プロンプト", "サムネプロンプト", "画像プロンプト". stats47 ブランド適合度フィルタ付き.
disable-model-invocation: true
---

外部 AI 画像生成（Midjourney、DALL-E、Nano Banana 等）用のプロンプトを、テンプレートカタログから選んで生成する。

## スコープ

**このスキルの担当範囲**:
- note.com 記事の表紙画像
- X バナー・固定ヘッダー
- SNS 投稿の補助画像
- ブログ記事の hero 画像（静的）
- ブランド素材・プロフィール画像

**担当外（別ルート）**:
- 記事別 OGP（動的タイトル差し込み） → Satori `apps/web/src/app/**/opengraph-image.tsx`
- 固定 OGP（凝ったビジュアル） → Remotion `apps/remotion/src/features/ogp/`

詳細は `docs/01_技術設計/ogp_default_design.md` の「画像生成 3 方式の使い分け」を参照。

## 引数

```
/image-prompt [options]
```

| オプション | 値 | 説明 |
|---|---|---|
| `--id <N>` | 51〜93 | 使うテンプレート ID を直接指定 |
| `--use-case <kind>` | 下記参照 | 用途で絞り込み |
| `--title "<text>"` | 任意の日本語 | プロンプト内の `{{TITLE}}` に差し込む文字列 |
| `--aspect <ratio>` | `2500:1000` `2:1` `1.91:1` `3:1` 等 | Midjourney `--ar` に入る比率。省略時は use-case から自動決定 |
| `--fit <high|medium|low>` | フィルタ | stats47 ブランド適合度で絞り込み |
| `--list` | - | 条件に合うテンプレ一覧のみ表示（プロンプト出力なし） |

### use-case の値

| 値 | 用途 | デフォルト aspect | 推奨 fit |
|---|---|---|---|
| `note-header` | note.com 記事表紙 | `2:1` | high or medium |
| `x-banner` | X プロフィール背景 | `3:1` | high |
| `blog-hero` | ブログ記事 hero 画像 | `2:1` | high or medium |
| `sns-supporting` | SNS 投稿の補助画像 | `1:1` or `4:5` | 全 |
| `brand-asset` | ブランド素材・汎用 | `16:9` | high |

## 手順

### Phase 1: テンプレート選定

1. `reference/catalog.md` を読み、条件に合う候補を抽出する

   - `--id` 指定時: 該当 ID のテンプレートを 1 件選択
   - `--use-case` 指定時: `use_cases` に該当する値を持つテンプレートを全て抽出
   - `--fit` 指定時: `fit` メタデータでフィルタ
   - 何も指定がない場合: `fit: high` のみを候補とし、ユーザーに用途を質問

2. `--list` 指定時はここで一覧だけ出力して終了

### Phase 2: タイトル差し込み

3. テンプレートの Prompt ブロックから原文を取得
4. `{{TITLE}}` プレースホルダーをユーザー指定の `--title` に置換
5. `{{TITLE}}` が未指定で Prompt に含まれる場合は、ユーザーに尋ねるかデフォルト「【タイトルをここに入力してください】」を残す

### Phase 3: アスペクト比調整

6. プロンプト末尾の `--ar <比率>` を `--aspect` 引数で上書き
7. use-case から推奨比率を自動適用した場合はその旨を出力に明記
8. 1.91:1（OGP 標準）が指定されたら、catalog 側の「正方形セーフエリア」メモも併記

### Phase 4: 出力

以下のフォーマットで出力する:

```markdown
# 画像プロンプト: {ID番号}. {テンプレート名}

## メタデータ

- **用途**: {use_cases}
- **ブランド適合度**: {fit}
- **印象**: {mood}

## 完成プロンプト（コピペ用）

\`\`\`
{タイトル差し込み・aspect 調整済みプロンプト}
\`\`\`

## 使い方

1. 上記プロンプトを Midjourney / DALL-E / Nano Banana 等にコピペ
2. 生成された画像を `{推奨保存先パス}` に保存
3. 気に入らなければ別 ID で再実行:
   \`/image-prompt --id {推奨代替ID} --title "同じタイトル"\`

## 代替候補（同じ用途で印象違い）

- **#{ID}**: {名前}（{1 行説明}）
- **#{ID}**: {名前}（{1 行説明}）
```

### Phase 5: 保存先の提示

use-case に応じて以下の推奨パスを出力する:

| use-case | 保存先 |
|---|---|
| note-header | `docs/31_note記事原稿/<slug>/header.png` |
| x-banner | `.local/r2/sns/brand/x-banner.png` |
| blog-hero | `docs/21_ブログ記事原稿/<slug>/hero.png` |
| sns-supporting | `.local/r2/sns/ranking/<ranking_key>/supporting.png` |
| brand-asset | `.local/r2/brand/` |

## 運用ルール

- **エージェント連携**: `blog-editor`, `note-manager`, `x-strategist`, `youtube-strategist` から呼ばれることを想定。各エージェントは catalog から自分の用途に合う ID を選んで呼び出す
- **イテレーション前提**: ユーザーは複数 ID を試して感触を掴む。`--list` で一覧、`--id` で試作、という流れを推奨
- **OGP には使わない**: 記事別 OGP に静的画像を使うと 119 記事分の再生成コストが破綻する。OGP が必要なら Satori / Remotion の担当範囲であることを明確にユーザーに伝える

## 参照

- `reference/catalog.md` — 全 43 テンプレートのカタログ
- `reference/formats.md` — 用途別のサイズ・セーフエリア・制約
- `docs/01_技術設計/ogp_default_design.md` — 画像生成 3 方式の使い分け規約
