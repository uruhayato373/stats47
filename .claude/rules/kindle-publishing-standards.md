---
paths:
  - "packages/product-factory/src/channels/kindle/**"
  - "packages/product-factory/src/generators/epub.ts"
  - "packages/product-factory/scripts/**"
  - ".claude/{scripts/kdp,skills/product/build-kindle-book,skills/product/kdp-publish}/**"
  - "config/kdp-*.json"
  - "data/products/{kdp,kindle}-*"
  - ".claude/agents/{kdp-operator,kindle-publisher}.md"
---
# Kindle 出版標準 (product-factory kindle チャネル)

Amazon KDP 向けの電子書籍 (EPUB3) の企画・生成・検証・出品の **実行規約の単一ソース (SSOT)**。
書籍カタログ・EPUB 生成・検証は agent `kindle-publisher` (skill `/build-kindle-book`)、
KDP の出品フォーム操作は agent `kdp-operator` (skill `/kdp-publish`) が担い、どちらもこのファイルに従う。
データパック (note で売る PowerPoint / Excel / CSV) の規約は `data-pack-standards.md` で、Kindle はそれに依存しない。

## 1. 位置づけと SSOT


product-factory の **kindle チャネル** が Amazon KDP 向けの電子書籍 (EPUB3) を生成する（2026-07-23 新設）。データパックが「Office/データを売る」のに対し、Kindle は「読ませて送客する」役割で、既存ブログ 98 記事・ランキング ai-content を再構成して束ねる。ランキング大全は競合先行で弱いため、S1 論点読み物を最優先する。

- **SSOT = 台帳 `products.kindle-books`**（読み込み口 `src/channels/kindle/book-catalog.ts` の `KINDLE_BOOKS`）。4 シリーズ = S1 論点読み物 / S2 テーマ別データブック / S3 地域別 / S4 ランキング大全。本文素材の SSOT は **R2 `app/blog/<slug>/article.md` + `data/*.svg`**。生成物 `.local/kindle-books/<id>/v1/` は派生物（git 管理外・手編集を正典にしない）だが、**KDPへ送る版は送信前にAES-256-GCM暗号化してR2 `archive/kindle-encrypted/<id>/v1/<revision>/`へ完全bundleで保全する**。配信用R2へ平文EPUBを置かない。
- **別PC復元の正典**は `data/products/kindle-archives.json`（Git）+ 上記R2暗号化bundle。`book.epub / cover.jpg / cover.png / metadata.json / READINESS.md`（`review.md`があれば同梱）のSHA-256からimmutable revisionを作る。暗号鍵はR2/Gitへ置かず、`KINDLE_ARCHIVE_KEY`、未設定時は当該PCの`R2_SECRET_ACCESS_KEY`からHKDFで導出する。認証Cookie・2FA・KDP profileはarchive対象外。
- **主エンジンは EPUB3 リフロー型**（`src/generators/epub.ts`・jszip）。図表は章内ブロック画像として SVG→PNG 化して同梱（sharp・density 288）。カバーは satori→sharp で 1600×2560 自動生成。**KDP は電子で PDF を実質受け付けない**ため EPUB を採る（PDF 生成器 `databook-pdf.ts` は目次・画像・チャート非対応でそもそも書籍に不向き）。

### 既刊の点検と改訂 (KINDLE-QUALITY-LOOP-01)

- **全県表**: 図だけでは中位の県の値が本に無いので、ブログ章の末尾に「全47都道府県の値」を付ける (`full-tables.ts`・catalog の `fullTables: true`)。
  表は**図と同じデータ** (R2 `app/blog/<slug>/data/<name>.json`、無ければ同じ年の `app/ranking/<key>/values.json`) から作り、年が違えば作らない。
  3 列 (順位・都道府県・値)・12 行ずつに分け、2 つ目から「<指標>（年・単位）のつづき・n〜m番目」(h5) を付ける (Kindle は表の見出し行を繰り返さない)。
  注記は表の下。表は書き下ろし比率の分母に数えない。**新しく作る本・作り直す本は `fullTables: true` を付ける** (付けない本は理由を catalog に書く)。
- **図の題**: 図だけで「何の指標・何年・単位」が分かること。ブログの図の題が汎用語 (「都道府県別ランキング」「都道府県マップ」) のままなら、
  ブログの図を描き直すまでは台帳 `products.kindle-figure-corrections` で書籍版だけ直す (描き直して元の文字が消えると生成が止まるので、そのときエントリを消す)。
- **入稿前の確認**: Kindle Previewer の代わりにエージェントが `capture-pages.mjs` (本の CSS のまま 1 段 = 1 ページ・600×800 と 390×700。全章は `--all`) で、
  全県表の見出し・つづきの小見出しの取り残しと 1〜2 行だけのページが 0 であることを確かめる。Send to Kindle で Amazon の変換は確かめられるが、
  Kindle for Web はパーソナル・ドキュメントを表示しないので、変換後の見た目は Kindle アプリか端末でしか見られない。

### 編集設計 (design) が無い本は作らない (2026-09-19 確定)

2026-09-19 の全 32 冊監査で、カタログは「データが何か」(`concept`) しか持たず、**誰のどんな悩みを解決するか・
無料 (stats47.jp) と何が違って何に支払うのか・需要の証拠・タイトルの型**がどこにも無かった (書名 13 冊が
「〇〇の地図 — キーワード列挙」、共通事業方針への参照 0 件)。そこで `KindleBook.design` (`types.ts` の
`EditorialDesign`) を新設し、共通事業方針 `.claude/shared-policy/POLICY.md` の「判断の問い」5 つと
`STRUCTURE.md` のタイトル 5 型・本文 9 型を、書籍ごとに書く場所にした。

| 項目 | 中身 | validator |
|---|---|---|
| `readerProblem` | 誰の・どんな悩み (読者の言葉で) | 20 字未満は error |
| `harm` + `harmReason` | H/A/R/M のどれか、または対象外の理由 | 理由 10 字未満は error |
| `valueAndPayReason` | 無料で得られる価値と、有料で支払う理由 | 20 字未満は error |
| `demandEvidence` | 検索・相談・購入の証拠。無ければ「未検証:」+ 次の検証 | 空は error (未計測を需要ありにしない) |
| `titleCandidates` | **異なる 2 型で 2 案**。`title` はどちらかと一致 | 1 案・同型・不一致は error。型の上限字数超えは warn |
| `bodyPatterns` | 9 型のうち主に使うもの | 空は error |

`products:kindle:generate` は design の無い書籍を生成しない。`validate` は design の無い manuscript 以降の
書籍を `design-missing` で warn する (2026-09-19 時点で 31 冊。S1-01 だけ設計済み)。既存 31 冊は
backlog `KDP-EXPANSION-01` の順で設計してから再生成する。design を埋めるだけで需要ありとは判定しない
(共通方針の原則)。表紙の主題は読点でも折る (`splitTitle`)。

### 章の中身の作り方（2026-08-12 確定・S2/S3/S4 の 20 冊）

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
| 載せる指標 | 台帳 `products.kindle-book-ranking-keys` | 書籍ごとに 30 キー。選定理由をキーごとに同じ台帳の `notes` に残す。「先頭 24 件」は廃止 |
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

### 生成品質と外部公開状態を分離する

監査でEPUBを再生成・上書きしない。機械検証だけで出品台帳のstatusをdraftへ戻さない。
`verify-publishable.mts` は既存版を読み取る互換入口であり、`--apply`は拒否する。

```bash
npx tsx packages/product-factory/scripts/verify-publishable.mts --version <VERSION> --json
npm run products:report --workspace=@stats47/product-factory -- --kindle-version <VERSION>
```

`build-book.ts` の本文量・書き下ろし比率・予定キーcoverageをmetadataへ記録し、
対象版の意味レビュー・Previewer・暗号化保全・公開承認とは別に判定する。
公開実績はKDP出品台帳の確認日付きstatus、販売準備は横断カタログの残工程を読む。
書き下ろし30%は内部編集品質基準で、Amazonが認める安全基準ではない。

### EPUB 構造の不変量（2026-08-12 確定・`__tests__/epub.test.ts` が固定）

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

### 検証は 3 層 (2026-08-12 配線・2026-09-19 に ③ を追加)

```bash
npm run products:kindle:verify-epub  --workspace=@stats47/product-factory            # 全 32 冊
npm run products:kindle:verify-epub  --workspace=@stats47/product-factory -- --book K-S1-01
```

| 層 | 何を見るか | 実装 |
|---|---|---|
| ① 仕様適合 | KDP の受理条件 | 外部の `epubcheck` (無ければスキップし、**その旨を出力する**) |
| ② レイアウト不変量 | 上表の 6 項目を**生成物**に対して | `scripts/verify-epub.mts` |
| ③ 本文不変量 | Web 記事の名残 (「この記事」= error) / 同じ年の「年」「年度」混在 / 率系指標に個数単位 (= error) / 同一指標の 2 章重複 / **冊間**の同一指標・同一段落 (全冊検査時のみ) | `src/channels/kindle/content-invariants.ts` (verify-epub から呼ぶ) |

**③が要る理由も実測で確定している** — 2026-09-19 に販売中 22 冊 (v1) を展開したところ、①②は通るのに
S1 各冊に「この記事 / 本記事」が 11〜38 件、S2/S3 で同一章に「2023年」と「2023年度」が 9〜19 章/冊、
合計特殊出生率に「（人）」、S2/S3/S4 のランキング章 481 のうち 177 が他冊にも載る同一指標 (71 指標)、
60 字以上の同一段落が 2 冊以上に 532 件あった。意味的な正しさ (分母・因果・対象世帯) は critic の領分で、
③は文字列だけで決定的に数えられるものに限る。ブログ由来章の「この記事」は `fetch-content.ts` の
`rewriteWebSelfReference` が書籍版だけ「この章」へ揃える (公開ブログ原文は変えない)。

**②が要る理由は実測で確定している** — 3 症状が出ていた当時、epubcheck は
**全 32 冊で 0 error 0 warning** だった。素の `<img>` 表紙は構文として妥当で、
壊れるのはレイアウトだけなので仕様適合検査では原理的に捕まらない。
検証器自体も、修正前の cover.xhtml を復元した EPUB で **3 error が発火すること**を実測済み。

生成器側のユニットテスト (`src/generators/__tests__/epub.test.ts`) と同じ不変量を、
こちらは**ビルド済み .epub に対して**見る (生成器を通さず手で置いた EPUB も検査できる)。

- **カバー画像は二層 (2026-09-30)**: 承認前の版を公開 R2 に出さず、CI が読める承認版だけを R2 に置く。
  - **上層 = Google Drive (非公開・人が見る・耐久)**: imagegen の出力・採用前の候補・元画像。`stats47/Kindle表紙/<bookId>/candidates/`
    (参考資料 vault と同じマウント解決。`参考文献/` とは混在させない)。置くのは
    `npx tsx packages/product-factory/scripts/stash-cover-candidate.mts --book <id> --input <画像>`、採用は
    `ingest-cover-background.mts --input drive:<bookId>/<ファイル名>`。Drive のマウントが無い PC では止まる (別の場所へ黙って落とさない)。
  - **下層 = R2 `media/kindle-cover-assets/<bookId>/<revision>/` (承認した最終版だけ)**: 背景JPEG・完成PNG/JPEG・manifest。
    Gitには `cover-design.ts` のR2キー・SHA-256・byte・寸法だけを置き、画像本体を置かない。
    目視確認中は `.local/kindle-cover-drafts/` (admin の確認画面が読む作業 cache)、承認時は `.local/r2/media/kindle-cover-assets/` に
    exact stagingし、`push-exact-r2-assets.ts` で明示キーだけを反映する。
  - 背景は1600×2560 JPEG・**文字を含まない**。生成は **Codex MCP の built-in imagegen**（`.claude/rules/codex-mcp.md`）で、
    タイトル・著者は satori が**実テキストとして重ねる**。生成 AI に日本語や数字を焼き込ませない家ルールは
    ブログ OGP と同一（`.claude/rules/ogp-image-standards.md` §5）。生成時はR2取得物をSHA検証して`.local`へcacheし、
    背景が未承認の書籍はシリーズ基調色の無地にdegradeする。
  - **例外: 書名ごと描いた表紙 (オーナー判断 2026-11-03・S1)**: ポップで目立つ表紙にするため、S1 は Codex imagegen に
    書名・副題・帯の文字ごと描かせた 1 枚をそのまま表紙にする (`cover-design.ts` の `textBaked`。satori は重ねない)。
    日本語が崩れる危険は消えないので、**描かれた文字を拡大して 1 字ずつ照合し、誤字 0 の画像だけ**を採る。照合した文字列を
    `textBaked.checkedText` に書き、書名を変えたら `cover.test.ts` が落ちる (描き直す)。プロンプトの型は `prompt-b.txt`
    (各冊の `.local/kindle-cover-drafts/<id>/` と Drive の候補置き場)。地図・人物の顔・指定外の文字は描かせない。
- **著作権規律（`data-provenance-standards.md` / pdf-book-survey と同一）**: 参照書籍からは論点・見せ方の型のみ。文言・図案・写真・編集構成は複製しない。数値は e-Stat / R2 の自社データのみ。自ブログの再利用は自己著作物。**内部編集基準として、各書籍は再構成 + 30% 以上の書き下ろし（はじめに / おわりに / 章横断の合成分析）を必須**とし、validator が `newContentNote` 非空 + manuscript 以降の fresh 章 1 つ以上を強制する。KU（KDP Select 独占）登録は当面見送り（販売のみ・¥500-1,000）。

内部比率はAmazonの許諾・審査合格基準ではない。著作権者自身のWeb公開素材と他者の素材を区別し、AI生成内容の申告を別途確認する（[KDPコンテンツガイドライン](https://kdp.amazon.com/en_US/help/topic/G200635600)）。
- **CLI**: `products:kindle:{plan,validate,generate,report,kdp-listings}`（`generate --id K-S1-01`）。生成は `.local` への書き出しのみ。
### 本文量の床 — 比率ゲートだけでは「本になっていない本」が通る (2026-08-12 実測)

30% 書き下ろしゲートは**比率**しか見ないので、分母が小さいほど満たしやすい。実測で
**S2/S3/S4 の 20 冊が総字数 4,313〜5,725 字・1 章 144〜191 字**（定型 1 文 + 図の羅列）なのに
`書き下ろし比率 32.9% ✅` を出していた。1 章の中身は次のような 1 文だけだった:

> 平均身長（2023年）の1位は青森県で141cm、最下位は愛媛県で139cmです。上位と下位の差は約1.0倍で、全国平均は約140cmです。

| 床 | 値 | 根拠 (実測の分離幅) |
|---|---|---|
| 総字数 | **20,000 字** | 実書籍 23,419〜43,596 / 薄い本 4,313〜5,725 |
| 1 章あたり | **800 字** | 実書籍 1,952〜2,906 / 薄い本 144〜191 |

分離幅が 4〜10 倍あるので誤検知しない。`buildBook` が `volumeOk` を返し `generate` が `⛔` を出す。
床に届かない書籍は `kdp.listings` の `status: "blocked-thin"` + `blockReason` で出品を止める
(理由が消えると次の人が status だけ戻して出品しかねないので upsert 保持する)。

**S1 の 12 冊は合格・S2/S3/S4 の 20 冊は不合格**だった。以下の章コンポーザで是正した。

### 章コンポーザ — ranking 章の本文は ai-content から組む (2026-08-12 新設)

R2 `app/ranking/<key>/ai-content.json` はサイトで公開済み・監査済みの解説
(insights 400〜700字 / regionalAnalysis 700〜1,000字 / faq / 県別解説 47県) を持つ。
これを書籍本文へ再利用し、**1 章 150 字 → 1,000〜1,600 字**にした。

| 層 | 実装 |
|---|---|
| 取得・合成・フィールド判定 | `src/channels/kindle/ai-content-composer.ts` |
| 書籍別のキー選定 SSOT | 台帳 `products.kindle-book-ranking-keys` (候補: `scripts/select-book-keys.mts`) |
| 書き下ろしの執筆ブリーフ | `scripts/build-fresh-briefs.mts` (実データ 30 指標を焼き込む) |
| 書き下ろしの検証 | `scripts/verify-fresh.mts` |

**捏造を通さない設計**: 採用前に `.claude/scripts/ai-content/lib/number-audit.mjs` を
**import して** ai-content 側とまったく同じ判定で数値を突合する (書籍側に別実装を作らない =
「サイトでは通るが書籍では落ちる」二重基準を作らない)。判定は**フィールド単位**で、
落ちたものだけ理由付きで捨てる (キーごと捨てると使える解説まで失う)。

**禁止**:

| NG | OK |
|---|---|
| pack の全キーを渡して先頭 N 件を章にする | 台帳 `products.kindle-book-ranking-keys` で書籍ごとに確定させる |
| S3 8 冊が同じキー・同じ本文になる | 地域の県が上位/下位に偏る指標を選び、本文も県名で地域抽出する |
| ai-content の見出し語で地方ブロックを照合する | **節の中の県名**で判定 (見出しは内容ベースの自由文で固定区分ではない) |
| 書き下ろし章を `freshText` でインライン持ちする | `manuscripts/<id>/*.md` を `freshFile` で参照 (S1 と同じ) |
| ヘルパー定数を使用箇所より後ろに置く | 前に置く (`const` は巻き上げされず生成が落ちる) |

- **需要ファースト**: 一括生成せず 1 冊ずつ manuscript へ昇格 → 生成 → 人間が KDP 公開 → 4 週実測（KENP/販売数）→ 良ければ横展開。パイロット = **K-S1-01『実質手取りの地図』**（血肉 = 家計・所得系ブログ 9 本 + 書き下ろし）。書き下ろしの最終仕上げは `article-writer` → `blog-critic` の既存品質ゲートを通す。

## 2. KDP 出品自動化（2026-07-23）

> **★方針**: 旧「KDP アップロードは人間工程で自動化しない」を、**「出品フォームは Playwright で自動化・ただし下記ガードを人間工程として維持」**へ改訂した。

- **ログイン認証・2FA はエージェントが行わない**。初回のみ人間が headed Chrome で **stats47 の Amazon/KDP アカウント**へ手動ログインし、永続プロファイル `.local/playwright-kdp-profile` に保持する。
- **税務情報（Tax interview）・銀行口座・支払情報の入力は人間工程**。KDP はこれらが未完了だと公開させない。エージェントは一切触らない。
- **account assert 必須**: `config/kdp-account.json` の `accountEmail`/`accountName` が KDP のアカウント表示に一致することを確認してから操作。別アカウントは即中断。
- **出品内容 SoT = `data/products/kdp/listings.json`**。改訂書誌は`products:kindle:kdp-listings --version <VERSION>`で`.local/kindle-listing-revisions/`へ準備提案を出し、公開記録と分離する。旧`--apply`での一括上書きは禁止。独立レビュー・Previewer・保全・承認後に対象IDだけ切り替える。カテゴリと読みはgit TSを参照し、公開履歴を保持する。
- **KDP運用状態も同じSoT**に `kdpStatus`（`draft|in_review|live|unknown`）/ 生の日本語表示 / `kdpStatusCheckedAt` / `lastSubmittedAt` / `salesStartedAt`（販売中を初めて確認した日）/ ASIN を保存する。`listed`だけで審査中を販売中扱いしない。`kdp-batch --phase status`はASIN未割当でも毎回状態を書き戻す。
- **出版工程の状態機械**も同じSoTに保存する。`publicationStage` は
  `prepared → details_filled → files_processed → verified → submitted → live → previous_unpublished` の一方向。
  再試行で前工程を実行してもstageは後退させず、工程ごとの時刻とread-back証拠を残す。
- **draft-first + `--commit` gate + オーナー承認**: 既定は「下書き保存」。**実公開（`--commit`）は outward-facing・取り下げに時間がかかるため、オーナー明示承認時のみ**。未充填フィールド・公開未確定時は「公開した」と報告しない。
- **週次レビュー→週次計画→公開の接続**: weekly-reviewはKDP本棚状態と`products:sales`の販売数/KENPを同期し、
  `npm run kdp:weekly -- --week YYYY-Www --write`で`data/products/kdp-weekly-publication.json`を再生成する。
  weekly-planは`prepare-one`なら1冊だけ準備し、`ready-for-owner-approval`ならその1冊だけを候補にできる。
  計画への記載・checkbox・過去の包括承認は公開承認ではない。対象IDの新しい明示承認がある場合だけ
  `npm run kdp:weekly-publish -- --week YYYY-Www --id <ID> --owner-approved <ID> --commit`を実行する。
  専用入口は実行直前に4週実測・需要シグナル・週1冊上限・候補IDを再計算し、既存preflightへ渡す。
- **★実公開を cron / launchd で無人実行しない（2026-08-16 オーナー判断で確定）**。
  2026-08-13 に `com.stats47.kdp-resume-daily`（毎日 8:30/14:30）が `--phase draft` に続けて
  `--phase publish --commit` を回し、残り 22 冊を無人で公開まで進める構成になっていた。
  当時のオーナー指示（「32 冊すべてを公開までやり切る」）を根拠にしていたが、8/16 に
  **KDP 出品は手動のみ**へ方針変更した。plist は `~/Library/LaunchAgents/` から削除済みで、
  launchctl にも未登録。**「一度承認を得たから以後ずっと無人で公開してよい」とはしない**
  （承認は都度・1 冊ずつ）。スクリプト `scripts/scheduled/kdp-resume-daily.sh` と repo 内 plist は
  再開できるよう残してあるが、**再登録するにはオーナーの新しい明示指示が要る**。
- **KDP フォームは React SPA で DOM が変わりやすい**。初回は必ず `kdp-publish --probe` で構造を `.local/kdp-debug/` に dump し、`kdp-form.mjs` の label セレクタが合うか確認する。実機での初回調整が前提。
- **KU（KDP Select 独占）は既定 未登録**（`kuEnrolled:false`・販売のみ）。判断はオーナー。**規約リスク**: 出品者自身のブラウザ自動化の明示禁止は未確認だが bot 検知リスクは残るため低頻度（出品時・価格改定時）に限る。
- **公開・既刊修正の前にR2 archive gate必須**。ローカル6ファイルのSHAが最新の検証済みrevisionと一致しなければKDP操作を停止する。修正は原稿/表紙SSOTを編集→再生成→新revisionをR2へpush→`kdp-publish --update`で修正下書き→`--update --commit`で再申請する。旧revisionは削除せずrollback可能にする。
### 表紙の縮小確認 (2026-11-09)

読者が最初に見るのは検索結果の小さな表紙なので、公開の前に縮めても題名が読めるかを目で確かめる。
`node .claude/scripts/kdp/kdp-cover-thumbnail.mjs render --id <ID>` で 120px / 220px の高さの PNG を一時領域に作り、
見た判定を `record --id <ID> --verdict readable|unreadable --by <名前>` で `data/products/kdp-cover-thumbnail-checks.json` に書く。
記録は表紙の SHA-256 ごとで、表紙を差し替えたら取り直す。`kdp-publish --commit` は今の表紙に readable の記録が無いと止まる。
高さは仮置きの目安で、Amazon の公式の寸法ではない (実測で違えば `lib/kdp-cover-thumbnail.mjs` を直す)。

### 紹介文とキーワード (2026-11-06 オーナー依頼)

紹介文は読者が買うかを決める文章で、定型文の差し替えにしない。正本は `data/products/kdp-listing-copy.json` で、
`data/products/kdp/listings.json` の `description` と `keywords` はここから作る。台帳を手で直さない。

- **構成**: 読者の悩み → 【この本で分かること】 → 【データの範囲】 → 【全県の値を表で収録している指標】 → 【こんな方に】 → 【収録内容】 → 【データについて】。新版は冒頭に KDP が求める旧版の刊行情報を置く ([KDP](https://kdp.amazon.com/en_US/help/topic/GW7J4WEKBVU25YEC)、2026-11-06 確認)。
- **収録内容**: 図と全県表の数は `kindle-quality.json` の EPUB 実測から入れる。手で書かない。
- **データの範囲と指標 (2026-11-13 オーナー依頼)**: どの粒度の何のデータかを紹介文で分かるようにする。【データの範囲】は比較の単位 (都道府県・市区町村ごとの一覧は無い) を書き、家計調査の値を載せる本は県庁所在市の値であることを足す。【全県の値を表で収録している指標】は全県表の見出しの指標・年・単位を並べる。どちらも `kindle-quality.json` の実測 (`fullTableIndicators`・`householdCityValues`) から組み立て、手で書かない。見出しの付いた全県表の無い本 (K-S1-13) は指標の一覧を出さない。家計調査以外で県全体でない値を載せる本 (K-S1-01 の物価指数・K-S1-13 の家賃) は、原稿の `scopeNote` に断り書きを書き、別エージェントが本文と照合する。世帯の種類は指標ごとに違うので範囲の文には書かない。比較の単位が都道府県でない本 (K-S1-14 の県庁所在市) は `scopeLead` で 1 文目を、1 つの統計で年をそろえた本は `dataSourceLine` で【データについて】の末尾の 1 文を差し替える。図も全県表も無い本の【収録内容】は実測の本文の字数になる。`kindle:quality` は販売中の本に加えて出品準備中 (`status: draft`) の本も測る。出典の調査名は EPUB から機械で取れないので載せていない。
- **載せられない内容**: URL・連絡先・レビュー・価格や入手方法・時期に左右される情報・広告 ([メタデータ指針](https://kdp.amazon.com/en_US/help/topic/G201097560)、2026-11-06 確認)。サイト名の URL も載せない。
- **キーワード**: 7 枠すべて使い、題名の語を重ねず、宣伝語を入れず、本文にある語だけにする ([キーワード](https://kdp.amazon.com/en_US/help/topic/G201298500)、同日確認)。
- **本が答える範囲で書く**: カタログの `readerProblem` は読者の悩みであって、本の約束ではない。そのまま紹介文に写すと本に無い内容を約束する (2026-11-06 の照合で 13 冊中 10 冊に 26 件。例: 県別の回復率が無いのに「県ごとに確かめられる」)。原稿は書き手と別のエージェントが EPUB の本文と照合し、`review.epubSha256` に今の版を記録しないと `apply` が止める。
- **検査**: `npm run kdp:listing-copy -- check` (全項目)。`kdp-preflight` は載せられない内容を入稿前に止める。原稿は別エージェントのレビューとオーナー承認を経て `apply` で台帳へ写し、`kdp-update-listing-copy.mjs` で紹介文とキーワードだけを反映する。提出後は「変更事項のレビュー中」で詳細画面が開けないので `submitted` とし、レビュー後に `--verify` で一致を確かめて `reflected` にする。
- **効果の計測**: `targetQueries` の検索順位を週次監査 `kdp-search-ranks` が `data/products/kdp-search-ranks/` に記録する。読み取れない語は `unreadable` で、圏外と混同しない。

### KDP 入稿フォームの実仕様 (2026-08-12 に実機で確定)

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

**ブラウザ操作前にも fail-closed のプリフライトを置く**。タイトル/フリガナ/ローマ字/版番号/価格/
旧版ASIN・免責文を決定的に検査し、タイトルを変更したのに読みの確認snapshotが古い場合は接続前に止める。
account assert後は本棚を直前取得し、`下書き + レビュー中 + 今回新規` の見込みが10冊を超えないことを確認する。
本棚に状態不明行がある、台帳の未公開件数より本棚の読取件数が少ない、行を1件も読めない場合は作成しない。
表紙の非同期反映が90秒で終わらない場合だけ、同じ下書きで1回再アップロードする。2回失敗したら停止する。

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

- 実装: agent `kdp-operator` / skill `/kdp-publish` / `.claude/scripts/kdp/`（`{login,capture-account,kdp-publish,kdp-batch,kdp-drafts}.mjs` + `lib/kdp-{session,form,flow,status,archive-gate}.mjs`。フローの単一実装は `lib/kdp-flow.mjs`、多冊数は `kdp-batch.mjs --phase draft|verify|publish|status`）。完成物保全・復元は `npm run kindle:archive --workspace=@stats47/r2-storage -- --push|--audit|--restore`。出品内容と公開状態の SSOT は `data/products/kdp/listings.json`、暗号化archive台帳は `data/products/kindle-archives.json`。書籍生成・カタログは `kindle-publisher` に委譲。

## 3. 役割分担

| 工程 | 担当 |
|---|---|
| kindle カタログ / EPUB 生成器 / SSOT の管理・生成・検証 | `kindle-publisher`（skill `/build-kindle-book`） |
| 書き下ろし章（はじめに・おわりに・横断分析）の執筆・レビュー | `article-writer` → `blog-critic`（既存ブログ品質ゲート） |
| 本文素材（ブログ / ai-content）の供給 | `blog-editor` / `ranking-content-author` |
| **KDP 出品フォーム操作（下書き作成・修正・公開）・出品内容 SoT** | `kdp-operator`（skill `/kdp-publish`・`.claude/scripts/kdp/`） |
| ログイン・2FA・Tax interview・銀行口座・Kindle Previewer 最終目視・実公開（`--commit`）承認・KU 判断 | 人間（オーナー） |

