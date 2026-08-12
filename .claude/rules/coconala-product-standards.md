# ココナラ商品ファクトリー標準 (product-factory SSOT)

ココナラで販売する stats47 の都道府県データ商品（PowerPoint / Excel / CSV / SVG / PNG / PDF）を、
共通部品から段階的に生成する **実行規約の単一ソース (SSOT)**。商品カタログ・生成・検証・出品準備に
関わる agent (`coconala-product-manager`) / skill (`/build-coconala-product`) / 人間はこれに従う。

> **方式**: `buzz-map-standards.md` / `affiliate-ads-standards.md` と同じ「rules に規約 1 ファイル、
> skill/agent は参照のみ」。本ファイルを恒久仕様の SSOT とする。旧 A-01〜L-07 の調査履歴は
> Git履歴、現行の商品定義・由来・値・コードは下記の git TS を正典とする。

---

## 1. SSOT 構造（どのデータがどこにあるか）

完全DBレス準拠（`docs/01_技術設計/02_データアーキテクチャ.md`）。永続/公開 DB を持たない。

| データ | SSOT | 形 | 備考 |
|---|---|---|---|
| 商品定義（P-01〜P-14・テーマ別 14 パック） | `packages/product-factory/src/catalog/` | git TS | `src/catalog/products/packs.ts` 1 ファイル。`ProductDefinition`（`theme`/`datasets`/`sourceIds`）型。**ここだけ編集**。旧 174 件（A-01〜L-07・family 別）は 2026-07-23 にテーマパックへ破壊的縮約（`sourceIds` にトレース） |
| ライセンス / テンプレ / family メタ | `src/catalog/{licenses,templates,families}.ts` | git TS | 再販売禁止は `resale: false` で型固定 |
| 実データ（観測値） | R2 `app/ranking/<key>/values.json` | 既存 R2 | 取得は `src/data/load-ranking-values.ts` |
| 商品に焼く実データ | `src/data/datasets/<key>.ts` | git TS スナップショット | **基準年固定**。R2 から取得して手記の SOURCES を添える |
| 生成バイナリ（pptx/xlsx/pdf/png…） | `.local/coconala-products/<id>/<version>/` | 派生物・**git 管理外** | 手編集を正典にしない・公開 R2 へ置かない |
| リリース台帳（生成状況） | `.claude/state/products/catalog-status.json` | 機械状態 | `products:report` で再生成 |

- **商品定義=git TS が SSOT**。生成物は再生成可能な派生物（`.local/` は `.gitignore` 済）。
- **実データは R2 → git TS スナップショット（基準年固定）**。架空サンプルは `Dataset.isSample: true` で明示分離する。

---

## 2. 生成・検証フロー

```bash
# カタログ検証（ID 一意・レビュー集合一致・価格整合・参照存在）
npm run products:catalog  --workspace=@stats47/product-factory -- --check
# 生成（単品 / 全商品）— 生成先は .local/coconala-products/<id>/<version>/
npm run products:generate --workspace=@stats47/product-factory -- --id <ID>
npm run products:generate --workspace=@stats47/product-factory -- --all
# リリース台帳を再生成
npm run products:report   --workspace=@stats47/product-factory
# 型 / テスト
npm run type-check --workspace=@stats47/product-factory
npm run test:run   --workspace=@stats47/product-factory
```

- ジェネレータ: pptx（**pptxgenjs custGeom で県別に再着色できる地図** + ネイティブチャート）/ xlsx（**exceljs・
  値編集で再計算する RANK 数式**。ネイティブチャート/塗り分け地図は不可 → Excel 側の挿入手順を案内）/ csv(BOM) /
  svg+png / manual.pdf（pdf-lib + NotoSansJP subset）/ listing / manifest / readiness。
- 地図結合は**都道府県コード**（名称文字列をキーにしない）。全図表にタイトル・単位・基準年・出典を持たせる。

---

## 3. 出典・利用許諾・免責（全成果物に必須）

- `SOURCES.csv`（調査名・表名・statsDataId・URL・年・取得日・単位・加工式・注意事項）を同梱する。
- `LICENSE-ja.txt`（利用範囲・クライアントワーク可否・**再販売/再配布禁止**・出典表示義務・免責）を同梱する。
- e-Stat の**公認・推奨と誤認させない**。国・府省・自治体作成物と誤認させない（`evidence-based-judgment.md` 準拠）。
- 欠損・秘匿・非該当を 0 にしない（`Dataset` は null + 理由で保持）。異年次結合は避ける。
- 架空サンプルは商品内・販売文で明示（`isSample`）。実データ商品は基準年固定・買い切りを明示。

---

## 4. 禁止事項

| NG | OK |
|---|---|
| 生成バイナリを git / 公開 R2 に置く | `.local/`（git 管理外）に生成し、配信しない |
| 生成物 (pptx/xlsx/json) を手編集して真実源化 | git TS を編集 → `generate` で再生成 |
| 実在しない商品 ID / licenseId / metric を書く | validator（`catalog --check`）が弾く |
| **実データ未接続パックを status=approved/listed にする** | 実データ接続（`datasets` の全キーが `src/data/datasets/` に実在）まで `cataloged` 固定。出品可否は `packs.ts` の status と validator の `datasets-missing` 検査で決定し、文書へ商品IDを重複記載しない |
| 架空データを実データと偽る | `Dataset.isSample` で分離・販売文に明記 |
| **オーナー承認なしにココナラへ実公開（`--commit`）** | 下書き作成は自動化可・実公開は `--commit` + オーナー承認（§6） |
| 全商品を一括出品して WIP を増やす | 戦略（`docs/02_実装計画/01`）どおり 1 商品ずつ需要実測 |
| Office 実機未確認で「互換性検証済み」と書く | 構造(OOXML)検証と実機検証を区別して報告 |

---

## 5. Office 実機検証（Phase 4・人間工程）

生成は OOXML 構造レベルでのみ検証できる。**PowerPoint / Excel 実機（Windows/Mac 365）での県別再着色・
チャート編集追従・表示崩れは、オーナーが各商品の `READINESS.md` に沿って目視する**。Office の無い環境では
「生成成功」を「互換性検証済み」と報告しない。

---

## 6. 出品規律（出品フォームは自動化・実公開とログインは人間工程）

> **★2026-07-23 方針変更（オーナー判断）**: 旧「ログイン・出品・アップロードを一切自動化しない」を撤回し、
> doboku-note の実証済みパイプライン（`coconala-operator` / `/coconala-publish`）を stats47 へ移植した。
> **出品フォームの入力は Playwright で自動化する**が、下記のガードを**人間工程として維持**する。

- **ログイン認証はエージェントが行わない**。初回のみ人間が headed ブラウザで **stats47 のココナラアカウント**へ手動ログインし、永続プロファイル `.local/playwright-coconala-profile` に保持する（★doboku-note の `dobokunote` とは別アカウント・別プロファイル）。
- **account assert 必須**: `coconala-account.json` の `sellerName`（stats47 の出品者名）がマイページ本文に含まれることを確認してから操作する。別アカウント（dobokunote 等との取り違え）は即中断。**sellerName が空の間は「ログイン済み」しか確認できない**ので、出品者名が確定したら必ず設定する。
- **draft-first + `--commit` gate + オーナー承認**: 既定は「下書きで保存」。**実公開（`--commit`）は outward-facing・不可逆寄りのため、オーナーが明示承認したときだけ**実行する。バリデーションエラー（記入エラー）時は「公開した」と報告しない。
- **1 商品ずつ検証**。一括出品しない。閲覧・お気に入り・問い合わせ・購入・サポート工数・手取りを記録する。
- 反応が無ければ同系統を増やさず、対象・用途・価格・サンプルを見直す（レビュー §実行規律）。
- **規約リスク**: ココナラ利用規約に「出品者が自分の出品をブラウザ自動化することを禁じる明示条項」は doboku 調査（2026-07-18）では未確認だが、bot 検知の運用リスクは残るため自動操作は低頻度（出品時・価格改定時）に限る。
- 実装: agent `coconala-operator` / skill `/coconala-publish` / `.claude/scripts/coconala/`（session/form lib + publish/edit/delete-draft）。出品内容 SoT = `.claude/config/coconala-listings.json`（product-factory から 1 商品ずつ書き起こす）。

---

## 7. 役割分担

| 工程 | 担当 |
|---|---|
| カタログ / ジェネレータ / SSOT の管理・生成・検証・出品準備 | `coconala-product-manager`（skill `/build-coconala-product`） |
| **出品フォーム操作（新規出品・修正・下書き掃除）・出品内容 SoT** | `coconala-operator`（skill `/coconala-publish`・`.claude/scripts/coconala/`） |
| 実データ（新 metric）の R2 投入 | `data-ingester` |
| e-Stat 実在検証 | `estat-researcher` |
| Office 実機検証・実公開（`--commit`）の承認 | 人間（オーナー・Windows 実機） |

---

## 8. Kindle 出版チャネル（product-factory に同居）

同じ product-factory に、Amazon KDP 向けの電子書籍 (EPUB3) を生成する **kindle チャネル** を持つ（2026-07-23 新設）。ココナラが「Office/データを売る」のに対し、Kindle は「読ませて送客する」役割で、既存ブログ 98 記事・ランキング ai-content を再構成して束ねる。ランキング大全は競合先行で弱いため、S1 論点読み物を最優先する。

- **SSOT = `packages/product-factory/src/channels/kindle/book-catalog.ts`**（`KINDLE_BOOKS`）。4 シリーズ = S1 論点読み物 / S2 テーマ別データブック / S3 地域別 / S4 ランキング大全。本文素材の SSOT は **R2 `app/blog/<slug>/article.md` + `data/*.svg`**。生成物 `.local/kindle-books/<id>/v1/book.epub` は派生物（git 管理外・手編集を正典にしない）。
- **主エンジンは EPUB3 リフロー型**（`src/generators/epub.ts`・jszip）。図表は章内ブロック画像として SVG→PNG 化して同梱（sharp・density 288）。カバーは satori→sharp で 1600×2560 自動生成。**KDP は電子で PDF を実質受け付けない**ため EPUB を採る（PDF 生成器 `databook-pdf.ts` は目次・画像・チャート非対応でそもそも書籍に不向き）。

#### EPUB 構造の不変量（2026-08-12 確定・`__tests__/epub.test.ts` が固定）

Kindle Previewer で「表紙が描画されない / 途中ページが表示されない / 改ページが不適切」の
3 症状が出た。原因は**表紙が素の `<img>`** で、`max-width:100%` の幅合わせだと 1600×2560 の
高さがページを超え、表紙が複数ページに割れて以降の境界をすべて汚していたこと。
**epubcheck は 0 error のまま通る**（構文は妥当・レイアウトだけ壊れる）ので、構造テストで守る。

| 不変量 | 理由 |
|---|---|
| **表紙は SVG ラップ**（`viewBox` + `preserveAspectRatio="xMidYMid meet"`）。素の `<img>` 禁止 | 幅にも高さにも収まり 1 ページに収まる。電子書籍の全面表紙の標準パターン |
| cover item に **`properties="svg"`** | EPUB3 要件。漏れると epubcheck error |
| cover.xhtml に **style.css をリンクしない** | `body{margin:0 5%}` が効くと表紙が中央からずれる |
| OPF に **legacy `<meta name="cover">`** | Kindle 系がサムネイル識別に使う。削除条件: `properties="cover-image"` だけで Previewer / KDP が表紙を認識することを実機確認できたとき (期限は設けない) |
| nav に **landmarks**（cover / toc / bodymatter）+ **目次を spine に入れる** | 読書開始位置と目次ページの識別（KDP 推奨） |
| CSS に `page-break-after:avoid`（見出し）/ `figure img{max-height}` / `orphans:widows` | 見出しの孤立と図のページ跨ぎを止める |
| 扉と奥付は `.colophon{page-break-before:always}` で 2 ページに分ける | 1 ページに詰め込むと書籍の体裁にならない |

#### 検証は 2 層 (2026-08-12 配線)

```bash
npm run products:kindle:verify-epub  --workspace=@stats47/product-factory            # 全 32 冊
npm run products:kindle:verify-epub  --workspace=@stats47/product-factory -- --book K-S1-01
```

| 層 | 何を見るか | 実装 |
|---|---|---|
| ① 仕様適合 | KDP の受理条件 | 外部の `epubcheck` (無ければスキップし、**その旨を出力する**) |
| ② レイアウト不変量 | 上表の 6 項目を**生成物**に対して | `scripts/verify-epub.mts` |

**②が要る理由は実測で確定している** — 3 症状が出ていた当時、epubcheck は
**全 32 冊で 0 error 0 warning** だった。素の `<img>` 表紙は構文として妥当で、
壊れるのはレイアウトだけなので仕様適合検査では原理的に捕まらない。
検証器自体も、修正前の cover.xhtml を復元した EPUB で **3 error が発火すること**を実測済み。

生成器側のユニットテスト (`src/generators/__tests__/epub.test.ts`) と同じ不変量を、
こちらは**ビルド済み .epub に対して**見る (生成器を通さず手で置いた EPUB も検査できる)。

- **カバー背景の SSOT**: `src/channels/kindle/assets/cover-backgrounds/<bookId>.jpg`（git 管理・
  1600×2560 JPEG・**文字を含まない**）。生成は **Codex MCP の built-in imagegen**（`.claude/rules/codex-mcp.md`）で、
  タイトル・著者は satori が**実テキストとして重ねる**。生成 AI に日本語や数字を焼き込ませない家ルールは
  ブログ OGP と同一（`.claude/rules/ogp-image-standards.md` §5）。背景が無い書籍はシリーズ基調色の無地に degrade する。
- **著作権規律（`data-provenance-standards.md` / pdf-book-survey と同一）**: 参照書籍からは論点・見せ方の型のみ。文言・図案・写真・編集構成は複製しない。数値は e-Stat / R2 の自社データのみ。自ブログの再利用は自己著作物。**ただし KDP の「Web で無料入手可能なコンテンツ」規定に備え、各書籍は再構成 + 30% 以上の書き下ろし（はじめに / おわりに / 章横断の合成分析）を必須**とし、validator が `newContentNote` 非空 + manuscript 以降の fresh 章 1 つ以上を強制する。KU（KDP Select 独占）登録は当面見送り（販売のみ・¥500-1,000）。
- **CLI**: `products:kindle:{plan,validate,generate,report,kdp-listings}`（`generate --id K-S1-01`）。生成は `.local` への書き出しのみ。
- **需要ファースト**: 一括生成せず 1 冊ずつ manuscript へ昇格 → 生成 → 人間が KDP 公開 → 4 週実測（KENP/販売数）→ 良ければ横展開。パイロット = **K-S1-01『実質手取りの地図』**（血肉 = 家計・所得系ブログ 9 本 + 書き下ろし）。書き下ろしの最終仕上げは `article-writer` → `blog-critic` の既存品質ゲートを通す。

### KDP 出品自動化（2026-07-23・coconala-operator から移植）

> **★方針**: 旧「KDP アップロードは人間工程で自動化しない」を、coconala と同じ**「出品フォームは Playwright で自動化・ただし下記ガードを人間工程として維持」**へ改訂した。

- **ログイン認証・2FA はエージェントが行わない**。初回のみ人間が headed Chrome で **stats47 の Amazon/KDP アカウント**へ手動ログインし、永続プロファイル `.local/playwright-kdp-profile` に保持する。
- **税務情報（Tax interview）・銀行口座・支払情報の入力は人間工程**。KDP はこれらが未完了だと公開させない。エージェントは一切触らない。
- **account assert 必須**: `.claude/config/kdp-account.json` の `accountEmail`/`accountName` が KDP のアカウント表示に一致することを確認してから操作。別アカウントは即中断。
- **出品内容 SoT = `.claude/config/kdp-listings.json`**（`products:kindle:kdp-listings --apply` で KINDLE_BOOKS から生成。title/description/keywords/price/epubPath。カテゴリは人手で `categories` に記入・upsert 保持）。
- **draft-first + `--commit` gate + オーナー承認**: 既定は「下書き保存」。**実公開（`--commit`）は outward-facing・取り下げに時間がかかるため、オーナー明示承認時のみ**。未充填フィールド・公開未確定時は「公開した」と報告しない。
- **KDP フォームは React SPA で DOM が変わりやすい**。初回は必ず `kdp-publish --probe` で構造を `.local/kdp-debug/` に dump し、`kdp-form.mjs` の label セレクタが合うか確認する（coconala の `discover-categories` 相当）。実機での初回調整が前提。
- **KU（KDP Select 独占）は既定 未登録**（`kuEnrolled:false`・販売のみ）。判断はオーナー。**規約リスク**: 出品者自身のブラウザ自動化の明示禁止は未確認だが bot 検知リスクは残るため低頻度（出品時・価格改定時）に限る。
- 実装: agent `kdp-operator` / skill `/kdp-publish` / `.claude/scripts/kdp/`（`{login,capture-account,kdp-publish}.mjs` + `lib/kdp-{session,form}.mjs`）。書籍生成・カタログは `kindle-publisher` に委譲。

役割分担（追加分）:

| 工程 | 担当 |
|---|---|
| kindle カタログ / EPUB 生成器 / SSOT の管理・生成・検証 | `coconala-product-manager`（product-factory オーナー・当面兼務） |
| 書き下ろし章（はじめに・おわりに・横断分析）の執筆・レビュー | `article-writer` → `blog-critic`（既存ブログ品質ゲート） |
| 本文素材（ブログ / ai-content）の供給 | `blog-editor` / `ranking-content-author` |
| **KDP 出品フォーム操作（下書き作成・修正・公開）・出品内容 SoT** | `kdp-operator`（skill `/kdp-publish`・`.claude/scripts/kdp/`） |
| ログイン・2FA・Tax interview・銀行口座・Kindle Previewer 最終目視・実公開（`--commit`）承認・KU 判断 | 人間（オーナー） |

---

## 9. note 商品チャネル

`packages/product-factory/src/channels/note/` は、商品カタログから note の無料・有料記事候補、
添付manifest、画像計画、ハッシュタグを生成するチャネルとする。商品定義を複製せず、
商品側は `src/catalog/products/packs.ts`、note editorial メタは
`.claude/scripts/note/catalog/` の git TS を SSOT とし、mapping で結合する。

> **現在の状態**: note チャネルは旧174商品を前提とする legacy 実装。削除条件は
> `docs/todo/05_機能バックログ.md` の `COCONALA-PRODUCT-FACTORY-01` 完了。現在はTypeScriptとVitestの
> 対象から一時除外している。P-01〜P-14 の14パックへ移行し、coverage・重複・添付検証を更新して
> exclude を解除するまでは `products:note:*` を実運用しない。残工程は
> 同backlog IDを正典とする。

### SSOTと生成物

- mapping・記事計画・生成コードは git TS、`.local/note-products/` の生成物は派生物とする。
- 承認前の生成物を note.com、R2、公開用カタログへ自動反映しない。
- 添付は `.local/coconala-products/<id>/<version>/manifest.json` を参照し、商品ファイルを複製して
  新しいSSOTを作らない。
- 有料境界は `<!-- paid:start -->` を唯一のマーカーとし、有料ラインと添付物を境界より後ろに置く。

### 決定的検証

- 14パックすべてのmapping coverage、productId・slug・seriesの一意性と参照整合を検査する。
- canonical記事間の重複、同一商品の重複割当、添付循環参照、無料記事への有料添付混入を拒否する。
- frontmatter、有料境界、添付manifest/hash、出典、基準年、単位、ライセンス、Office対応環境を検査する。
- 誇大表現、収益保証、行政・e-Statの公認示唆、相関を因果とする表現、根拠のない数値を拒否する。
- Office実機未確認の商品を有料添付可能・公開可能として扱わない。

### 公開ゲート

- 一括処理は `.local/` へのドラフト生成までとし、一括公開しない。
- promote は既定dry-run、note.com公開は既存の専用公開フローへ分離する。
- 公開、価格、無料・有料境界、添付内容は人間が記事単位で確認する。
- noteの公開頻度は `.claude/rules/sns-content-standards.md` の上限に従う。

## 関連

- 商品案の由来: `packages/product-factory/src/catalog/products/packs.ts` の `sourceIds`（旧調査はGit履歴）
- モジュール: `packages/product-factory/`（README + `src/`）
- 完全DBレス: `docs/01_技術設計/02_データアーキテクチャ.md` / データ保存先: `.claude/rules/data-storage.md`
- 実証判定: `.claude/rules/evidence-based-judgment.md` / 収益化戦略: `docs/00_プロジェクト管理/02_収益化戦略.md`
- agent: `.claude/agents/coconala-product-manager.md`（商品生成）/ `.claude/agents/coconala-operator.md`（出品自動化）
- skill: `.claude/skills/product/build-coconala-product/SKILL.md` / `.claude/skills/product/coconala-publish/SKILL.md`
- 出品スクリプト: `.claude/scripts/coconala/`（`coconala-{publish,edit,delete-draft}.mjs` + `lib/coconala-{session,form}.mjs`）
- 出品 SoT: `.claude/config/coconala-listings.json` / アカウント: `.claude/config/coconala-account.json`（★stats47 専用・sellerName 要記入）
- 認証プロファイル: `docs/01_技術設計/07_Playwright認証プロファイル.md`（`playwright-coconala-profile`）
- 移植元: doboku-note `.claude/agents/coconala-operator.md` / `.claude/skills/management/coconala-publish/`
- **Kindle チャネル (§8)**: SSOT `packages/product-factory/src/channels/kindle/book-catalog.ts` / EPUB 生成器 `src/generators/epub.ts` / CLI `src/channels/kindle/cli.ts` / 台帳 `.claude/state/products/kindle-status.json`
