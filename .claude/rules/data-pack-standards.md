---
paths:
  - "packages/product-factory/src/{catalog,build,data,generators,channels/note}/**"
  - "packages/product-factory/tests/**"
  - ".claude/{scripts/products,skills/product/build-data-pack}/**"
  - "data/products/**"
  - ".claude/agents/data-pack-manager.md"
---
# データパック標準 (product-factory・note で売る統計データ商品)

stats47 の都道府県データ商品（PowerPoint / Excel / CSV / SVG / PNG / PDF。テーマ別 14 パック P-01〜P-14）を
共通部品から生成し、note の有料記事として売る **実行規約の単一ソース (SSOT)**。商品カタログ・生成・検証・
note 販売準備に関わる agent (`data-pack-manager`) / skill (`/build-data-pack`) / 人間はこれに従う。
Kindle の規約は `kindle-publishing-standards.md` で、データパックと Kindle は互いの台帳を読まずに回る。

> 2026-10-19 にココナラから撤退し、2026-11-08 にココナラの出品台帳・出品自動化・担当 agent を削除した。
> note の納品版の固定値は出品台帳の `_noteDelivery` から `data/products/note-pack-deliveries.json` へ移した。

---

## 1. SSOT 構造（どのデータがどこにあるか）

完全DBレス準拠（`docs/01_技術設計/02_データアーキテクチャ.md`）。永続/公開 DB を持たない。

| データ | SSOT | 形 | 備考 |
|---|---|---|---|
| 商品定義（P-01〜P-14・テーマ別 14 パック） | 台帳 `products.packs` | JSON + Schema | `ProductDefinition`（`theme`/`datasets`/`sourceIds`）型は `src/catalog/types.ts`。**ここだけ編集**（`rankingKeys` は生成物から読み込み口が注入）。旧 174 件（A-01〜L-07・family 別）は 2026-07-23 にテーマパックへ破壊的縮約（`sourceIds` にトレース） |
| ライセンス / テンプレ | 台帳 `products.licenses` / `src/catalog/templates.ts` | JSON + Schema / git TS | 再販売禁止は Schema の `resale: const false` |
| 実データ（観測値） | R2 `app/ranking/<key>/values.json` | 既存 R2 | 取得は `src/data/load-ranking-values.ts` |
| 商品に焼く実データ | 台帳 `products.pack-datasets` | JSON + Schema のスナップショット | **基準年固定**。R2 から取得して手記の出典の行を添える。正規化は読み込み口 `src/data/datasets/<key>.ts` |
| 生成バイナリ（pptx/xlsx/pdf/png…） | `.local/data-packs/<id>/<version>/` | 派生物・**git 管理外** | 手編集を正典にしない・公開 R2 へ置かない |
| リリース台帳（生成状況） | `data/products/catalog-status.json` | 機械状態 | `products:report` で再生成 |

- **商品定義=台帳 `products.packs` が SSOT**。生成物は再生成可能な派生物（`.local/` は `.gitignore` 済）。
- **実データは R2 → git TS スナップショット（基準年固定）**。架空サンプルは `Dataset.isSample: true` で明示分離する。

---

## 2. 生成・検証フロー

```bash
# カタログ検証（ID 一意・レビュー集合一致・価格整合・参照存在）
npm run products:catalog  --workspace=@stats47/product-factory -- --check
# 生成（単品 / 全商品）— 生成先は .local/data-packs/<id>/<version>/
npm run products:generate --workspace=@stats47/product-factory -- --id <ID> --version <NEW_VERSION>
npm run products:generate --workspace=@stats47/product-factory -- --all --version <NEW_VERSION>
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
| **実データ未接続パックを status=approved にする** | 実データ接続（`datasets` の全キーが台帳 `products.pack-datasets` に実在）まで `cataloged` 固定。`packs.ts` の status は商品として完成したか (`cataloged`/`approved`) だけを持ち、公開状態は持たない。note の公開状態の正本は記事台帳 `data/note/articles.json` |
| 架空データを実データと偽る | `Dataset.isSample` で分離・販売文に明記 |
| 全商品を一括出品して WIP を増やす | 戦略（`docs/02_実装計画/01`）どおり 1 商品ずつ需要実測 |
| Office 実機未確認で「互換性検証済み」と書く | 構造(OOXML)検証と実機検証を区別して報告 |

---

## 5. Office 実機検証（Phase 4・人間工程）

生成は OOXML 構造レベルでのみ検証できる。**PowerPoint / Excel 実機（Windows/Mac 365）での県別再着色・
チャート編集追従・表示崩れは、オーナーが各商品の `READINESS.md` に沿って目視する**。Office の無い環境では
「生成成功」を「互換性検証済み」と報告しない。

---

## 6. note 商品チャネル

`packages/product-factory/src/channels/note/` は、商品カタログから note の無料・有料記事候補、
添付manifest、画像計画、ハッシュタグを生成するチャネルとする。商品定義を複製せず、
商品側は台帳 `products.packs`、note editorial メタは
記事台帳 `data/note/articles.json`（git の JSON + `articles.schema.json`。規約は `.claude/scripts/note/catalog/README.md`）を SSOT とし、mapping で結合する。

> **現在の実装**: article-planとmappingはP-01〜P-14から導出し、TypeScript/Vitestの対象。
> 販売準備は `note/cli.ts revision --revision <NEW_REVISION> --all` を使い、納品版台帳 `data/products/note-pack-deliveries.json` の
> `_delivery` 固定SHAから非公開の別版を作る。旧v1直参照のgenerate/promoteで改訂版を公開しない。
> 商品別の公開記録・品質・人間確認待ちは `products:report` の派生カタログで分離する。

### SSOTと生成物

- サイトLPとnote無料部分のコピーは `data/products/landings/<id>.json`、固定納品由来の収録形式・画像の型とSHAは
  `data/products/landing-evidence/<id>.json` に持つ。商品IDと記事キーで結合し、商品別のUI分岐や別媒体のコピーを作らない。
  `npm run products:landing:assets` は納品版台帳の `archive` から共通画像型で見本を再生成する。
  `npm run generate:product-storefront -w apps/web` の後、`npm run products:landing:preview -- --serve 4792` で
  全商品のサイトLPとnote無料部分を順に目視できる。Markdown/HTMLは登録済み `.local/product-portfolio/` の派生物。
  `npm run products:landing:check` は台帳との不一致・未整備の商品・媒体間の取りこぼしを止める。公開note・有料本文・添付はこの生成で変更しない。

- mapping・記事計画・生成コードは git TS、`.local/note-products/` の生成物は派生物とする。
- 承認前の生成物を note.com、R2、公開用カタログへ自動反映しない。
- 添付は `.local/data-packs/<id>/<version>/manifest.json` を参照し、商品ファイルを複製して
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


## 7. 役割分担

| 工程 | 担当 |
|---|---|
| カタログ / ジェネレータ / SSOT の管理・生成・検証・note 販売準備 | `data-pack-manager`（skill `/build-data-pack`） |
| note への公開・公開後の記録 | `note-manager` |
| 実データ（新 metric）の R2 投入 | `data-ingester` |
| e-Stat 実在検証 | `estat-researcher` |
| Office 実機検証・公開の承認 | 人間（オーナー） |

## 関連

- 商品案の由来: 台帳 `products.packs` の `sourceIds`（旧調査はGit履歴）
- モジュール: `packages/product-factory/`（README + `src/`）
- 納品版の固定値: `data/products/note-pack-deliveries.json` / 照合: `.claude/scripts/products/lib/pack-evidence.mjs`
- 完全DBレス: `docs/01_技術設計/02_データアーキテクチャ.md` / データ保存先: `.claude/rules/data-storage.md`
- 実証判定: `.claude/rules/evidence-based-judgment.md` / 収益化戦略: `docs/00_プロジェクト管理/02_収益化戦略.md`
