---
name: image-prompt
domain: site
description: 外部 AI 画像生成（Midjourney 等）用のプロンプトを 43 種のテンプレートから生成する。Use when user says "OGP画像プロンプト", "note表紙プロンプト", "サムネプロンプト", "画像プロンプト". stats47 ブランド適合度フィルタ付き.
disable-model-invocation: true
primary_agent: image-prompt-curator
co_agents: [x-strategist, blog-editor, note-manager, sns-renderer]
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
- ブログ記事別 OGP / 一覧サムネ背景 → `/generate-blog-images`（Codex imagegen + git JPEG + Satori/Sharp）
- その他の動的タイトル差し込み OGP → Satori（種別カタログ・棚卸しは `.claude/rules/ogp-image-standards.md`）
- OGP / カバー / リンクカード画像の目視確認・棚卸し → `/audit-ogp-images`（`.claude/scripts/ogp/build-image-gallery.mjs`）

## note記事カバーの専用経路（全カテゴリ・新規記事・差し替え共通）

`--use-case note-header` はこの節を使い、以下の43種テンプレート選定へ進まない。
方針は `data/note/cover-policies.json` の8カテゴリの最新版、記事の制作IDと入力は `data/note/cover-assets.json`。
本文を読んでコピー・題材・根拠を管理画面へ保存し、`note:cover-production export` で確定した `imagePrompt` を取得する。
新記事は記事台帳へ登録後、`generate-note-catalog.ts --apply` で制作IDも同期する。分類できない記事は停止し、既存分類の判断を整える。

- **生成担当はCodex built-in imagegenだけ。** 文字・補足・署名を含む完成PNGを生成する。
- **Claudeはカバーを描かない。** Claudeの役割は本文確認・制作内容の準備・Codexへの受け渡し・生成結果の確認・専用CLIによる登録。
  SVG / HTML / Canvas / Python / Remotion / Satoriによる代作や、別の画像モデルへの暗黙フォールバックは禁止。
- Claude Codeは `.claude/rules/codex-mcp.md` のnote画像生成手順でCodexへ渡す。MCPが使えなければ生成待ちのまま理由を報告し、代替カバーを作らない。
- 原寸・幅320pxで、指定全文、余計な文字、誤字、文字切れ、重なり、補足の可読性を確認する。
  確認できないものをPASSにせず、Codex imagegenで修正して新しいSHAで確認し直す。
- 最新カテゴリの `visualRules` に従い、人物なし・題材・補足の可読性とカテゴリ固有項目を個別に確認する。
  県別家計は県名と対象都市・年・世帯区分を保存し、exportされた検証済みの県主域輪郭PNGを参照画像としてimagegenへ渡す。
  地図は地域識別用で離島省略、観測範囲は対象都市。県形を想像で描かせず、原寸で参照と照合する。
- 複数件は `note:cover-production export-batch` の `generation-pending` だけを生成する。生成失敗時は同じID集合で再exportして再開する。
  reviewの `checks` と地図の `referenceSha256`、`prepare-image --reference` はカタログREADMEの契約に従う。
- `prepare-image` → `note:assets import` → 管理画面の修正前後比較 → 採用 → 公開の順。
  元画像・完成画像・実際のプロンプト・目視確認はprivate R2、記事ID・版・状態は共通画像台帳へ保存する。
- 正確な統計図・地図・配色見本は本文の検証済みデータ描画を使う。カバーに架空のデータ図を描かせない。

CLI引数とreview JSONの正典は [カタログREADME](../../scripts/note/catalog/README.md#制作idを使ったポップなカバー)。
画像中の日本語を機械で保証する仕組みではない。機械は仕様・コピーの確認記録・画像SHA・寸法・版・採用状態の整合を検査する。

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
| `note-header` | note.com 記事表紙（上の専用経路） | `1280:670` | カテゴリ方針v2以降 |
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

### Phase 2: 主題とブランド適合の確認

3. テンプレートの Prompt ブロックから原文を取得
4. `--title` は描く主題の選定に使う。テンプレートに `{{TITLE}}` や文字描画の指示がある場合は、その指示を除き、タイトルを後から重ねる安全域を指定する
5. テンプレートにロゴ、数値、精密な行政界、記事と無関係な汎用地図の指示がある場合も除く。主題に合わない候補は別 ID を選ぶ

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
{主題・ブランドゲート・aspect 調整済みの背景プロンプト}
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
| note-header | 専用経路のprivate R2と画像台帳（上記参照） |
| x-banner | `.local/r2/sns/brand/x-banner.png` |
| blog-hero | `contents/blog/<slug>/hero.png` |
| sns-supporting | `.local/r2/sns/ranking/<ranking_key>/supporting.png` |
| brand-asset | `.local/r2/brand/` |

## 運用ルール

- **採択済みブランド方針**: [`デザインシステム`](../../../docs/01_技術設計/04_デザインシステム.md) の「地域のデータアトラス」と `.claude/rules/ogp-image-standards.md` のブランド表現ゲートを優先する。既存 catalog の `fit: high` だけでは採用を決めず、地域・記事の主題との一致を確認する。note-header以外では文字・数値・発行元名・出典を後から合成する。note-headerは上の文字込み専用経路を使う。
- **エージェント連携**: `blog-editor`, `note-manager`, `x-strategist` から呼ばれることを想定。各エージェントは catalog から自分の用途に合う ID を選んで呼び出す
- **イテレーション前提**: ユーザーは複数 ID を試して感触を掴む。`--list` で一覧、`--id` で試作、という流れを推奨
- **ブログOGP背景には使わない**: 本skillの外部AI向け自由promptを記事別背景へ流用しない。
  ブログは `/generate-blog-images` のslug catalogとCodex MCP経路、その他のOGPはSatori /
  Remotionの担当範囲であることを伝える

## 参照

- `reference/catalog.md` — 全 43 テンプレートのカタログ
- `reference/formats.md` — 用途別のサイズ・セーフエリア・制約
- `.claude/rules/ogp-image-standards.md` — OGP / カバー / リンクカード画像の種別カタログ SSOT・棚卸し・生成方式
- `apps/web/src/features/ogp/` — Satori 製 OGP コンポーネント実体（`DefaultOgp` / `BlogOgp` / `RankingOgp` ほか）

## マガジン・外部OGPの一括更新

マガジンの共通コピー/プロンプトは `apps/web/scripts/data/link-card-design.ts`、再開台帳は `data/ogp/link-card-rollout.json`。
`.claude/scripts/ogp/link-card-production.ts` を使い、確定したrequestだけをbuilt-in imagegenへ渡す。
採用SHA・入力・参照画像・目視結果をprivate R2へ保存後、専用公開処理で反映する。
サイトは `apps/web/scripts/refresh-blog-ogp.ts` と `generate-ogp-images.ts` の共通外部rendererを使う。
内部サムネイルを変えず、具体的な生成・検証・公開手順は画像標準の「全件更新・再開の正典」に従う。
