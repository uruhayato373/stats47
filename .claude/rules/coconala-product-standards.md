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

- **SSOT = `packages/product-factory/src/channels/kindle/book-catalog.ts`**（`KINDLE_BOOKS`）。4 シリーズ = S1 論点読み物 / S2 テーマ別データブック / S3 地域別 / S4 ランキング大全。本文素材の SSOT は **R2 `app/blog/<slug>/article.md` + `data/*.svg`**。生成物 `.local/kindle-books/<id>/v1/` は派生物（git 管理外・手編集を正典にしない）だが、**KDPへ送る版は送信前にAES-256-GCM暗号化してR2 `archive/kindle-encrypted/<id>/v1/<revision>/`へ完全bundleで保全する**。配信用R2へ平文EPUBを置かない。
- **別PC復元の正典**は `.claude/state/products/kindle-archives.json`（Git）+ 上記R2暗号化bundle。`book.epub / cover.jpg / cover.png / metadata.json / READINESS.md`（`review.md`があれば同梱）のSHA-256からimmutable revisionを作る。暗号鍵はR2/Gitへ置かず、`KINDLE_ARCHIVE_KEY`、未設定時は当該PCの`R2_SECRET_ACCESS_KEY`からHKDFで導出する。認証Cookie・2FA・KDP profileはarchive対象外。
- **主エンジンは EPUB3 リフロー型**（`src/generators/epub.ts`・jszip）。図表は章内ブロック画像として SVG→PNG 化して同梱（sharp・density 288）。カバーは satori→sharp で 1600×2560 自動生成。**KDP は電子で PDF を実質受け付けない**ため EPUB を採る（PDF 生成器 `databook-pdf.ts` は目次・画像・チャート非対応でそもそも書籍に不向き）。

#### 章の中身の作り方（2026-08-12 確定・S2/S3/S4 の 20 冊）

出品前の中身実測で、S2×11 / S3×8 / S4×1 の 20 冊が **1 章 = 定型 1 文 (144〜200 字) + 図**
しかなく、総字数 4,313〜6,001 字だった。S1 の 12 冊 (1 章 2,000〜3,500 字) と同じ値段で
売れる状態ではない。根は 2 つ:

1. **定型文テンプレが本文のすべて**だった（`ranking-databook.ts` の「1位は◯◯で△△、
   最下位は…」1 文）。「差は約 1.0 倍」という無意味文も混入していた
2. **S3 の 8 冊と S4-01 が実質同じ本**だった。全冊が同じ pack の**先頭 24 件**を章にしており、
   差分は地域内最上位県の 1 文だけ（表紙が同一バイトだったのと同根）

| 層 | SSOT / 実装 | 役割 |
|---|---|---|
| 章本文 | `src/channels/kindle/ai-content-composer.ts` | R2 `app/ranking/<key>/ai-content.json` の insights / regionalAnalysis / FAQ / 県別解説を**フィールド単位の数値ゲートを通してから**合成する。1 章 150 字 → 1,000〜1,600 字 |
| 載せる指標 | `src/channels/kindle/book-ranking-keys.ts` (git TS) | 書籍ごとに 30 キー。選定理由をキーごとにコメントで残す。「先頭 24 件」は廃止 |
| 選定の実行 | `scripts/select-book-keys.mts` | 地域固有性・意外性でスコアリングして候補を出す。**欠陥 unit・`isActive:false` を除外** |
| 書き下ろし | `src/channels/kindle/manuscripts/<id>/*.md` | S2/S4 は 7 本、S3 は 7 本。ブリーフは `scripts/build-fresh-briefs.mts` が実データを焼いて生成 |
| 検証 | `scripts/verify-fresh.mts` | ファイル数・スタブでないこと・漢数字・である調・煽り語・SSOT との数値整合 |

**書籍に載せてはいけない指標**（`select-book-keys.mts` が除外し、
`__tests__/book-ranking-keys.test.ts` が固定する）:

- **単位の欠陥が既知のもの** — `MONEY-UNIT-SCALE-01`（賃金構造基本統計 `0003445758` /
  個人企業経済調査 `0003421679` は e-Stat の値が千円なのに config の unit が万円）。実測で
  「バス運転者の平均年収 1位 神奈川県 5,017万円」が原稿に入っていた。サイト表示なら是正で
  済むが、**書籍は出したら取り下げられない**ので config が直るまで載せない
- **`isActive:false`** — `/ranking/<key>` が 410 か空ページになり読者が確かめに行けない。
  非公開の理由自体がデータの欠陥であることが多い（実測 2 件はどちらも接地データの欠陥）

**書き下ろし 30% の判定は `products:kindle:generate` が書籍単位で行う**（比率の権威）。
`verify-fresh` の字数判定は「章として成立するか」（900 字）に絞る — 目安字数は 30% 比率からの
推定値にすぎず、実測 fresh は必要量の 2.2 倍あったので、そこで 7 字差を落とすと本来の要件から
外れた数字を守らせることになる。

#### 出品可否は実測で決める（`verify-publishable.mts`）

出品停止（`blocked-thin`）は人手で書き込むと、**是正しても誰も戻さない / 中身を直さずに
status だけ戻せる**の両方が起きる。実際 `blockReason` に是正前の実測値
（「本文 4,568 字 / 1章 152 字」）が残ったままだった。

```bash
npx tsx packages/product-factory/scripts/verify-publishable.mts          # 実測して表示
npx tsx packages/product-factory/scripts/verify-publishable.mts --apply  # listings も更新
```

全書籍をビルドし、`build-book.ts` の `volumeOk`（総 20,000字 / 1章 800字）と
`freshRatioOk`（KDP の 30%）で判定して `.claude/config/kdp-listings.json` の
`status` / `blockReason` を書き換える。**閾値をここに再定義しない**（build-book が正典）。
`listed`（公開済み）は巻き戻さない — 公開状態は KDP 側が真実源。

**このスクリプトは実公開しない。** KDP へのアップロードはオーナー工程（§8 の KDP 出品自動化）。

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
#### 本文量の床 — 比率ゲートだけでは「本になっていない本」が通る (2026-08-12 実測)

30% 書き下ろしゲートは**比率**しか見ないので、分母が小さいほど満たしやすい。実測で
**S2/S3/S4 の 20 冊が総字数 4,313〜5,725 字・1 章 144〜191 字**（定型 1 文 + 図の羅列）なのに
`書き下ろし比率 32.9% ✅` を出していた。1 章の中身は次のような 1 文だけだった:

> 平均身長（2023年）の1位は青森県で141cm、最下位は愛媛県で139cmです。上位と下位の差は約1.0倍で、全国平均は約140cmです。

| 床 | 値 | 根拠 (実測の分離幅) |
|---|---|---|
| 総字数 | **20,000 字** | 実書籍 23,419〜43,596 / 薄い本 4,313〜5,725 |
| 1 章あたり | **800 字** | 実書籍 1,952〜2,906 / 薄い本 144〜191 |

分離幅が 4〜10 倍あるので誤検知しない。`buildBook` が `volumeOk` を返し `generate` が `⛔` を出す。
床に届かない書籍は `kdp-listings.json` の `status: "blocked-thin"` + `blockReason` で出品を止める
(理由が消えると次の人が status だけ戻して出品しかねないので upsert 保持する)。

**S1 の 12 冊は合格・S2/S3/S4 の 20 冊は不合格**だった。以下の章コンポーザで是正した。

#### 章コンポーザ — ranking 章の本文は ai-content から組む (2026-08-12 新設)

R2 `app/ranking/<key>/ai-content.json` はサイトで公開済み・監査済みの解説
(insights 400〜700字 / regionalAnalysis 700〜1,000字 / faq / 県別解説 47県) を持つ。
これを書籍本文へ再利用し、**1 章 150 字 → 1,000〜1,600 字**にした。

| 層 | 実装 |
|---|---|
| 取得・合成・フィールド判定 | `src/channels/kindle/ai-content-composer.ts` |
| 書籍別のキー選定 SSOT | `src/channels/kindle/book-ranking-keys.ts` (生成: `scripts/select-book-keys.mts`) |
| 書き下ろしの執筆ブリーフ | `scripts/build-fresh-briefs.mts` (実データ 30 指標を焼き込む) |
| 書き下ろしの検証 | `scripts/verify-fresh.mts` |

**捏造を通さない設計**: 採用前に `.claude/scripts/ai-content/lib/number-audit.mjs` を
**import して** ai-content 側とまったく同じ判定で数値を突合する (書籍側に別実装を作らない =
「サイトでは通るが書籍では落ちる」二重基準を作らない)。判定は**フィールド単位**で、
落ちたものだけ理由付きで捨てる (キーごと捨てると使える解説まで失う)。

**禁止**:

| NG | OK |
|---|---|
| pack の全キーを渡して先頭 N 件を章にする | `book-ranking-keys.ts` で書籍ごとに確定させる |
| S3 8 冊が同じキー・同じ本文になる | 地域の県が上位/下位に偏る指標を選び、本文も県名で地域抽出する |
| ai-content の見出し語で地方ブロックを照合する | **節の中の県名**で判定 (見出しは内容ベースの自由文で固定区分ではない) |
| 書き下ろし章を `freshText` でインライン持ちする | `manuscripts/<id>/*.md` を `freshFile` で参照 (S1 と同じ) |
| ヘルパー定数を使用箇所より後ろに置く | 前に置く (`const` は巻き上げされず生成が落ちる) |

- **需要ファースト**: 一括生成せず 1 冊ずつ manuscript へ昇格 → 生成 → 人間が KDP 公開 → 4 週実測（KENP/販売数）→ 良ければ横展開。パイロット = **K-S1-01『実質手取りの地図』**（血肉 = 家計・所得系ブログ 9 本 + 書き下ろし）。書き下ろしの最終仕上げは `article-writer` → `blog-critic` の既存品質ゲートを通す。

### KDP 出品自動化（2026-07-23・coconala-operator から移植）

> **★方針**: 旧「KDP アップロードは人間工程で自動化しない」を、coconala と同じ**「出品フォームは Playwright で自動化・ただし下記ガードを人間工程として維持」**へ改訂した。

- **ログイン認証・2FA はエージェントが行わない**。初回のみ人間が headed Chrome で **stats47 の Amazon/KDP アカウント**へ手動ログインし、永続プロファイル `.local/playwright-kdp-profile` に保持する。
- **税務情報（Tax interview）・銀行口座・支払情報の入力は人間工程**。KDP はこれらが未完了だと公開させない。エージェントは一切触らない。
- **account assert 必須**: `.claude/config/kdp-account.json` の `accountEmail`/`accountName` が KDP のアカウント表示に一致することを確認してから操作。別アカウントは即中断。
- **出品内容 SoT = `.claude/config/kdp-listings.json`**（`products:kindle:kdp-listings --apply` で KINDLE_BOOKS から生成。title/description/keywords/price/epubPath。カテゴリは人手で `categories` に記入・upsert 保持）。
- **KDP運用状態も同じSoT**に `kdpStatus`（`draft|in_review|live|unknown`）/ 生の日本語表示 / `kdpStatusCheckedAt` / `lastSubmittedAt` / `salesStartedAt`（販売中を初めて確認した日）/ ASIN を保存する。`listed`だけで審査中を販売中扱いしない。`kdp-batch --phase status`はASIN未割当でも毎回状態を書き戻す。
- **draft-first + `--commit` gate + オーナー承認**: 既定は「下書き保存」。**実公開（`--commit`）は outward-facing・取り下げに時間がかかるため、オーナー明示承認時のみ**。未充填フィールド・公開未確定時は「公開した」と報告しない。
- **★実公開を cron / launchd で無人実行しない（2026-08-16 オーナー判断で確定）**。
  2026-08-13 に `com.stats47.kdp-resume-daily`（毎日 8:30/14:30）が `--phase draft` に続けて
  `--phase publish --commit` を回し、残り 22 冊を無人で公開まで進める構成になっていた。
  当時のオーナー指示（「32 冊すべてを公開までやり切る」）を根拠にしていたが、8/16 に
  **KDP 出品は手動のみ**へ方針変更した。plist は `~/Library/LaunchAgents/` から削除済みで、
  launchctl にも未登録。**「一度承認を得たから以後ずっと無人で公開してよい」とはしない**
  （承認は都度・1 冊ずつ）。スクリプト `scripts/scheduled/kdp-resume-daily.sh` と repo 内 plist は
  再開できるよう残してあるが、**再登録するにはオーナーの新しい明示指示が要る**。
- **KDP フォームは React SPA で DOM が変わりやすい**。初回は必ず `kdp-publish --probe` で構造を `.local/kdp-debug/` に dump し、`kdp-form.mjs` の label セレクタが合うか確認する（coconala の `discover-categories` 相当）。実機での初回調整が前提。
- **KU（KDP Select 独占）は既定 未登録**（`kuEnrolled:false`・販売のみ）。判断はオーナー。**規約リスク**: 出品者自身のブラウザ自動化の明示禁止は未確認だが bot 検知リスクは残るため低頻度（出品時・価格改定時）に限る。
- **公開・既刊修正の前にR2 archive gate必須**。ローカル6ファイルのSHAが最新の検証済みrevisionと一致しなければKDP操作を停止する。修正は原稿/表紙SSOTを編集→再生成→新revisionをR2へpush→`kdp-publish --update`で修正下書き→`--update --commit`で再申請する。旧revisionは削除せずrollback可能にする。
#### KDP 入稿フォームの実仕様 (2026-08-12 に実機で確定)

移植元 (doboku-note) の英語版フォーム前提の実装は**日本語版でほぼ動かなかった**。実測で分かった要点:

| 箇所 | 実仕様 | 取り違えるとどうなるか |
|---|---|---|
| ドメイン | `kdp.amazon.co.jp/ja_JP` | `.com` は別アカウント扱いで「アカウントが見つかりません」 |
| 入力欄の識別 | `<label>` が空。`id="data-title"` / `name="data[title]"` で名指し | ラベル検索は 1 つも一致しない |
| フリガナ・ローマ字 | タイトル / サブタイトル / 著者に必須 (英語版に無い欄) | 未入力で先へ進めない |
| 内容紹介 | CKEditor。`setData` で `<p>` を組んで入れる | キー入力だと空段落が `&nbsp;` になり「不可視文字」で拒否 |
| カテゴリ | 3 段の select で絞り込み → **掲載場所のチェック**で 1 枠 | select だけでは「0 個選択済み」のまま 1 枠も入らない |
| カテゴリのボタン | 成人向けラジオを選ぶまで `disabled` | 押せずウィザードが 1 歩も進まない |
| 出版権利のラジオ | `name="data-is-public-domain"` (他と命名規則が違う) | `data[...]-radio` で探すと 0 件 |
| モーダル内のボタン | Amazon AUI。**Playwright の実クリックのみ有効** | `evaluate` の `.click()` は静かに無反応 |
| select | React 制御 (`react-aui-N`)。`selectOption` を使う | `value` 代入 + `change` は state を変えない |
| 表紙 | **JPEG / TIFF のみ**。先に「作成済みの表紙をアップロード」を選ぶ | PNG は黙って拒否され「表紙がアップロードされていません」のまま |
| 価格 | 12 か国ぶん並ぶ。`…[JP][price_vat_inclusive]` を名指し | ラベル検索だと別の国の欄に入る |
| ステップ移動 | 自動で進まない。「保存して続行」→ URL の変化を read-back | 押しただけを成功とすると、埋まっていない状態で先へ進んだと誤報する |
| 表紙欄の出現 | 原稿の処理が終わってから描画される。出るまで待つ | 新規作成の 1 回目だけ空振りし、やり直すと通るので原因が見えない |
| AI 開示の確認 | `div[role="checkbox"]` + `aria-checked` (素の checkbox は存在しない) | `input[type=checkbox]` を探すと 0 件で、永久に「入らない」 |
| 同じ確認欄が 2 つ | AI 申告用と再アップロード用。**両方**入れる | 片方だけで「チェックした」と思い、同じエラーで止まり続ける |
| 確認チェックの順序 | **カバーを入れたあと**に押す | アップロードのたびに未チェックへ戻るので、先に押すと無効化される |
| アコーディオン | 開いていたら押さない (押すと閉じる) | やり直し実行で質問票が消え、入力できなくなる |

**判定は必ず read-back で行う**。「押せた / setInputFiles できた」を成功条件にすると、
実際には 1 件も入っていないのに ✓ が並ぶ (カテゴリで実際にそうなり、3 枠 ✓ と報告しながら
1 枠も保存されていなかった)。カテゴリは「選択済み件数が期待どおり増えたか」、
表紙は「未アップロード表示が消えたか」で判定する。

**KDP には本の作成数制限がある (2026-08-13 実測)**。未公開 (下書き + レビュー中) タイトルが
約 10 冊に達すると「本の作成数制限を超えました」モーダルが出て、新規下書きの保存が
一切できなくなる。**公開直後 (レビュー中) も枠を食う**ので、公開しても即座には空かない。
32 冊は「10 冊作成 → verify → 公開 → 審査完了 (最大 72h) を待つ → 次の 10 冊」の
パイプラインで数日かけて出す。`goToNextKdpStep` がこのモーダルを名指しで検出し
(`limitHit`)、バッチは連続失敗ブレーカで残りを焼かずに止まる。**制限の回避は試みない**
(bot 検知・アカウント停止のリスク)。

**下書きは使い回す**。`draftId` を listings に控えて既存を開く。毎回 `new/details` から作ると
同じ本の空下書きが増え、公開済みの本に対して実行すれば重複出品になる (実装中に 9 件たまった)。
掃除は `.claude/scripts/kdp/kdp-drafts.mjs`
(`--prune` で対象表示 / `--prune --apply` で削除。SSOT の draftId は消さない)。

- 実装: agent `kdp-operator` / skill `/kdp-publish` / `.claude/scripts/kdp/`（`{login,capture-account,kdp-publish,kdp-batch,kdp-drafts}.mjs` + `lib/kdp-{session,form,flow,status,archive-gate}.mjs`。フローの単一実装は `lib/kdp-flow.mjs`、多冊数は `kdp-batch.mjs --phase draft|verify|publish|status`）。完成物保全・復元は `npm run kindle:archive --workspace=@stats47/r2-storage -- --push|--audit|--restore`。出品内容と公開状態の SSOT は `.claude/config/kdp-listings.json`、暗号化archive台帳は `.claude/state/products/kindle-archives.json`。書籍生成・カタログは `kindle-publisher` に委譲。

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
> `.claude/todo/backlog.md` の `COCONALA-PRODUCT-FACTORY-01` 完了。現在はTypeScriptとVitestの
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
