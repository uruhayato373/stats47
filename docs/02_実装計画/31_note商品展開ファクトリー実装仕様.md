---
type: implementation-spec
feature: note-product-rollout
created: 2026-07-18
status: implemented (N0-N5 staging・公開は N7 人間工程)
owner: Fable / note-manager / coconala-product-manager
depends_on: docs/02_実装計画/30_ココナラ商品ファクトリー実装仕様.md
tags: [note, 収益化, 商品販売, content-factory, claude-code]
---

# note商品展開ファクトリー実装仕様

## 1. 目的

`packages/product-factory` の全174商品をnote向けに評価し、無料記事、有料記事、マガジン、ココナラ受注導線へ
決定的に振り分ける。記事原稿、無料／有料境界、添付物、画像指示、ハッシュタグ、価格、出典、利用条件を一括生成する。

「一気に実装」は**全商品の展開判定とドラフト生成**を指す。174記事の一括公開はしない。
`.claude/rules/sns-content-standards.md` のnote月1〜2本上限を守り、公開は人間承認後に順次行う。

## 2. 成功条件

1. 174商品すべてにnoteでの展開方針が設定され、未判定が0件になる。
2. 同じ内容の重複記事を統合し、商品variantを記事本文で乱立させない。
3. 公開候補ごとに `draft.md / hashtags.txt / attachments.json / source-manifest.json` を生成できる。
4. 無料部分だけで対象者・課題・完成イメージ・購入判断材料が分かる。
5. 有料ライン以降に添付物、操作手順、ライセンス、出典、動作環境を配置する。
6. note記事とココナラ商品が共通productId/versionを参照し、内容・価格・版のドリフトを検知できる。
7. 全文重複、誇大表現、根拠なしの時短・収益保証、外部直接取引誘導を機械検査する。
8. 生成と公開を分離し、生成処理はnote.comへログイン・投稿しない。

## 3. 全商品を4つに振り分ける

全商品を記事化するのではなく、全商品に次のdispositionを必須設定する。

| disposition | 意味 | 例 |
|---|---|---|
| `standalone-paid` | 単独有料記事＋添付物 | B-01、C-01、F-01 |
| `bundle-member` | テーマ記事・マガジンに束ねる | A系素材、D系データパック |
| `free-lead` | 無料解説からココナラ受注へ | J系サービス |
| `catalog-only` | 独立記事を作らず商品比較内で扱う | K系ライセンスvariant、重複版 |

174件すべてがどれかに属することをvalidatorで保証する。`catalog-only`も未対応ではなく、意図的な非記事化として記録する。

## 4. 推奨シリーズ

| series | 内容 | 主対象 | 主な商品family |
|---|---|---|---|
| `prefecture-map-powerpoint` | 都道府県地図・PPT図表 | 企画、営業、広報 | A、B |
| `prefecture-excel-analysis` | Excelランキング・地図・比較 | 実務担当 | C |
| `regional-data-packs` | テーマ別データと読み方 | 調査、メディア | D |
| `business-location-analysis` | 出店・採用・観光等 | 事業者 | E |
| `government-statistics-work` | 自治体統計業務の時短 | 公務員 | F |
| `media-data-visuals` | 記事・動画・SNS図版 | クリエイター | G |
| `statistics-education` | 探究・授業・研修 | 教員、学生 | H |
| `life-area-comparison` | 移住・転職・子育て | 個人 | I |
| `custom-analysis-services` | 個別制作の選び方・事例 | 法人 | J |

Kはライセンス説明記事、Lは無料サンプル記事へ集約する。

## 5. SSOTと保存先

### Editorial SSOT

note editorialメタは既存 `.claude/scripts/note/catalog/` のgit TSを正典とする。
product-factoryへ別のnote記事カタログを作らない。商品側はproductId/version、note側はslug/series/magazineを持ち、
中間mappingで結合する。

推奨追加:

```text
packages/product-factory/src/channels/note/
├── types.ts
├── product-note-mapping.ts
├── series.ts
├── pricing.ts
├── article-plan.ts
├── generators/{draft,hashtags,attachments,manifest}.ts
└── validators/{coverage,duplication,claims,paid-boundary}.ts
```

生成物の一次出力:

```text
.local/note-products/<series>/<slug>/
├── draft.md
├── hashtags.txt
├── attachments.json
├── source-manifest.json
├── product-links.json
├── images-plan.json
└── REVIEW.md
```

`.local/`は派生物でgit管理しない。承認した記事だけ、既存noteフローに従い
`docs/31_note記事原稿/<vertical>/<slug>/` へ展開し、R2 `note/<vertical>/<slug>/` を本文SSOTとする。

## 6. マッピング型

```ts
type NoteProductMapping = {
  productId: string;
  disposition: "standalone-paid" | "bundle-member" | "free-lead" | "catalog-only";
  series: NoteProductSeries;
  canonicalSlug: string;
  articleRole: "pillar" | "how-to" | "use-case" | "comparison" | "sample";
  access: "free" | "paid";
  priceJpy: number;
  attachmentProductIds: readonly string[];
  coconalaProductIds: readonly string[];
  stats47Targets: readonly string[];
  priority: 1 | 2 | 3;
  reason: string;
};
```

複数商品が1記事へ束ねられるため、`canonicalSlug`の重複は許可する。ただし同一productIdのmapping重複、
attachmentの循環参照、存在しないproductId、無料記事への有料添付混入を禁止する。

## 7. 記事テンプレート

### 無料部分

1. 読者の具体的な作業・困りごと
2. 完成後に何ができるか
3. 完成イメージまたはサンプル図
4. 対象者／対象外
5. データ年・出典・動作環境
6. 無料で再現できる要点
7. 有料部分と添付ファイルの正確な内容

無料部分だけで購入判断できること。結論を隠して煽らない。

### 有料部分

`<!-- paid:start -->` を有料境界のSSOTマーカーとする。

1. 添付ファイル一覧・version・hash
2. 導入手順
3. データ差し替え手順
4. PowerPoint／Excel固有の操作
5. 出典と加工表示
6. よくあるエラー
7. 利用許諾・再配布禁止・免責
8. 更新条件とサポート範囲

note公開処理ではこのマーカー直前へ有料ラインを置く。添付ファイルはラインより後ろに配置する。

### 無料記事

無料記事は本文中2〜4か所でstats47へ送客する。ココナラへのリンクは規約確認済みの許容範囲に限定し、
プラットフォーム外の直接取引へ誘導しない。

## 8. 文体・品質

- 読者の作業結果を先に示し、商品機能の羅列から始めない。
- stats47の無料コンテンツと有料商品の差を明記する。
- 「誰でも必ず」「売上が上がる」「絶対安全」等を禁止する。
- 時短値、件数、販売実績は計測根拠がある場合だけ記載する。
- e-Stat・行政の公認や推奨を示唆しない。
- 相関を因果と書かない。古いデータ、異年次、欠損を隠さない。
- markdown表を本文に残さない。必要な表は画像計画へ回す。
- 既存note記事やstats47記事との全文重複を禁止する。
- AI生成原稿は公開前に人間またはcriticが全件レビューする。

## 9. 価格

| note商品 | 初期価格帯 |
|---|---:|
| Liteテンプレート＋解説 | 500〜1,980円 |
| 業務テンプレート＋詳細手順 | 1,980〜4,980円 |
| テーマ別データパック | 1,980〜4,980円 |
| 有料マガジン | 3,980〜9,800円 |

同一ファイルをココナラでも売る場合は価格・ライセンス・更新条件を合わせる。価格差を付ける場合は、添付物、
解説、サポート範囲の差を明記する。価格は生成時の提案値であり、公開時に人間が確定する。

## 10. 添付物

`attachments.json` は商品manifestを参照し、ファイルを複製してSSOT化しない。

必須項目: productId、version、sourcePath、filename、sha256、bytes、contentType、isPaid、licenseId、officeCompatibility。

- 商品生成物が`reviewed`または`approved`でない場合、有料記事を`ready-to-publish`にしない。
- Office実機未検証の商品は「未検証」と表示し、販売添付をblockするのを既定とする。
- noteの容量・形式上限は公開前に再確認する。
- zip対応を前提にせず、必要な形式だけ添付する。

## 11. 画像

- 表紙: 1280×670。既存note画像フローを再利用する。
- 記事内: 完成図、操作フロー、無料／有料差、ファイル構成。
- markdown表はPNGへ変換する。
- `.local/coconala-products/<id>/<version>/preview/` を再利用し、同じ画像を手作業で複製しない。
- `images-plan.json`には画像種、入力、alt、caption、生成担当を記録する。

## 12. CLI

```bash
npm run products:note:plan --workspace=@stats47/product-factory -- --check
npm run products:note:generate --workspace=@stats47/product-factory -- --all --draft-only
npm run products:note:generate --workspace=@stats47/product-factory -- --slug <slug>
npm run products:note:validate --workspace=@stats47/product-factory -- --all
npm run products:note:promote --workspace=@stats47/product-factory -- --slug <slug> --dry-run
npm run products:note:report --workspace=@stats47/product-factory
```

`--all`は`.local`へのドラフト生成だけ。`promote`は既定dry-runとし、明示的な人間承認なしにdocs/R2へ書かない。
公開・browser操作は別の `/publish-note` 工程であり、このファクトリーから呼ばない。

## 13. 自動検証

- 174商品のdisposition coverage 100%
- productId、slug、series、magazine、添付物参照の整合
- canonicalSlug単位の重複率・類似見出し・全文重複
- frontmatter必須項目、`paid:start`の数と位置
- 無料記事に有料添付がないこと
- 有料記事の添付一覧とmanifest/hash一致
- 出典、年、単位、ライセンス、Office環境の表示
- 禁止表現、売上保証、行政公認示唆、根拠なし数値
- markdown表、壊れた相対画像、存在しないstats47 URL
- title、description、hashtagsの重複
- note catalogとdraft indexのドリフト
- 公開頻度上限を超えるscheduleを拒否

## 14. レビュー分業

| 担当 | 役割 |
|---|---|
| Fable | 全体設計、束ね方、モデル配分、最終判定 |
| Opus | 有料価値、シリーズ設計、重複統合、高ステークス監査 |
| Sonnet | mapping入力、原稿生成、frontmatter、hashtags、機械検証 |
| note-manager | note catalog、magazine、公開ライフサイクル |
| coconala-product-manager | 商品manifest、版、添付物、ライセンス |
| chart-author | 表紙以外の図表、表画像 |
| 人間 | Office実機確認、価格、公開、最終内容承認 |

同一worktreeの同じファイルを複数agentに編集させない。原稿生成はslug単位で担当を分離し、catalog統合はFableまたは
note-managerの1担当だけが行う。

## 15. Phase計画

| Phase | 内容 | 完了条件 |
|---|---|---|
| N0 | 現状監査 | 174商品、生成物、note catalog、既存記事の実測 |
| N1 | mapping・series・validator | coverage 174/174、重複方針確定 |
| N2 | 原稿・添付manifest生成基盤 | fixture 3記事green |
| N3 | 全ドラフト一括生成 | `.local/note-products`へ全canonical記事生成 |
| N4 | critic一括監査 | blocker 0、類似統合、価格・添付再確認 |
| N5 | 優先3記事をpromote | docs/31 outbox＋note catalog draft |
| N6 | 人間レビュー | Office・添付・無料有料境界を確認 |
| N7 | 公開 | 月1〜2本、オーナー明示承認後のみ |
| N8 | 計測・改善 | note→stats47/ココナラ、購入、手取り、工数 |

## 16. Claude Code（Fable）への実行プロンプト

```text
OUTPUT FORMAT:
最終報告は「結果 / 分業 / 変更ファイル / 検証 / 公開前blocker / 次Phase」の6見出し、1000語以内。
未検証を完了と書かず、主張ごとにファイルまたはコマンドを示す。

BEHAVIOR CONTRACT:
- あなたはFable。全体設計、分業、統合、受入判定を担当する。
- Opusはシリーズ設計・有料価値・重複統合・難所レビューに使う。
- Sonnetは調査、mapping、原稿生成、validator、testの決定的作業に使う。
- 既存agent / skill / workflow / scriptを先に検索し、同等機能を新設しない。
- agent prompt冒頭にOUTPUT FORMATとBEHAVIOR CONTRACTを置き、mode: bypassPermissionsを既定にする。
- 読み取り調査は並列可。書込みはslugまたは非重複ファイル単位。catalog編集者は1担当だけ。
- 既存の未コミット変更を変更・削除・整形・commitしない。
- note.comへのログイン、投稿、公開、外部送信、git push、deploy、公開R2書込みをしない。
- Office実機未検証の商品を有料添付可能にしない。

TASK:
docs/02_実装計画/31_note商品展開ファクトリー実装仕様.md に従い、
packages/product-factoryの全174商品をnote向けに展開する基盤を実装する。

正典:
1. docs/02_実装計画/31_note商品展開ファクトリー実装仕様.md
2. docs/02_実装計画/30_ココナラ商品ファクトリー実装仕様.md
3. docs/04_レビュー/2026-07-18-coconala-content-monetization.md
4. .claude/rules/sns-content-standards.md
5. .claude/agents/note-manager.md

今回はN0〜N3を実施する。全商品の展開判定とローカルドラフト一括生成まで行うが、
N4以降のpromote・公開・browser操作はしない。

必読:
- CLAUDE.md
- .claude/rules/{coding-standards,data-storage,docs-vs-issues,agent-output-contract}.md
- .claude/rules/coconala-product-standards.md
- .claude/rules/sns-content-standards.md
- .claude/agents/{README,note-manager,coconala-product-manager}.md
- .claude/scripts/note/catalog/README.md
- packages/product-factory/README.md

ORCHESTRATION:
1. Fableがgit statusと現在の174商品生成状況、note catalog、既存note原稿を確認する。
2. Sonnet調査担当へ商品・既存記事・noteスクリプトの読み取り監査を委譲する。
3. Opusへ174商品の束ね方、シリーズ、無料/有料、重複排除を設計させる。
4. FableがdispositionとcanonicalSlugを確定する。
5. Sonnet実装担当へmapping、generator、validator、testsを非重複ファイル単位で実装させる。
6. 原稿生成はcanonicalSlug単位で分割し、同じslugを複数agentへ渡さない。
7. Fableが全diffと自動検証を再実行し、N0〜N3の受入判定を行う。

受入条件:
- 174/174商品にdispositionがある。
- 同内容variantはcanonical記事へ統合されている。
- 全canonical記事が.local/note-productsへ生成される。
- draft.md、hashtags.txt、attachments.json、source-manifest.json、images-plan.json、REVIEW.mdが揃う。
- 無料/有料境界、添付manifest、出典、ライセンス、動作環境をvalidatorが検査する。
- 月1〜2本を超える公開scheduleを作らない。
- unit test、workspace type-check、catalog check、git diff --checkが成功する。
- docs/31、note catalog、R2、note.comは未変更のまま止める。

完了時に、174商品→canonical記事数の集約結果、series別件数、無料/有料件数、catalog-only件数、
生成・検証結果、Office実機blocker、N4開始条件を報告する。
```

## 17. 公開前の人間ゲート

N3までの一括生成後、公開する記事は人間が1本ずつ選ぶ。次を確認するまで`ready-to-publish`にしない。

- 添付Officeファイルを実機で開ける
- 無料部分が購入判断に十分
- 有料ラインより後に添付物がある
- note版とココナラ版の差が明確
- 価格、返金、更新、サポート範囲が妥当
- 出典と加工表示が正しい
- 規約確認日が記録されている

## 18. Phase 記録

### N0 現状監査 (2026-07-18 完了)

`packages/product-factory` の 174 商品を構造化抽出して実測。family (asset18/powerpoint20/excel24/data20/
industry16/government15/media10/education10/consumer9/service15/license10/entry7)・dataMode
(empty70/sample51/fixed-year37/customer15/updated1)・formats (pptx90/xlsx101/csv24/pdf60/svg13/png13/
docx2/web1) を確認。ココナラ生成物 (`.local/coconala-products/` 174 商品) は manifest つきで実在。
既存 note editorial SSOT (`.claude/scripts/note/catalog/data/`) と衝突しないことを確認。note channel は未実装だった。

### N1 mapping・series・validator (2026-07-18 完了)

新規 `packages/product-factory/src/channels/note/` を最小構成で追加。

- `types.ts` — `NoteProductMapping` / `NoteArticlePlan` / disposition(4) / role(5) / access。`any` 不使用。
- `series.ts` — 11 シリーズ (仕様 §4 の 9 + `license-guide` / `free-samples`) レジストリ + family→series 写像。
- `pricing.ts` — 価格帯 5 tier (仕様 §9) + tier 判定。
- `article-plan.ts` — **55 本の canonical 記事**を SSOT として定義。174 商品を漏れなく重複なく束ねる。
- `product-note-mapping.ts` — 174 mapping を (family, 記事) から **決定的に導出** (手書き 174 エントリを持たない)。
  disposition 規則: license→catalog-only / entry・service→free-lead / 単独 member の有料記事→standalone-paid / それ以外→bundle-member。
- `validators/{coverage,duplication,claims,paid-boundary,index}.ts` — 仕様 §13 の決定的検査 (coverage 174/174・
  slug 重複・productId 重複割当・series↔family 整合・禁止表現/markdown 表・無料記事の有料添付混入・価格帯・未検証添付)。
- **実測**: coverage 174/174・55 記事・errors 0・warnings 142 (全て `attachment-unverified` = 仕様 §10 の実機検証ゲート=正常)。
  disposition = bundle-member 135 / standalone-paid 7 / free-lead 22 / catalog-only 10。access = paid 49 / free 6。

### N2 生成基盤 + fixture 3 記事 (2026-07-18 完了)

deterministic generators (LLM 原稿ではなく article-plan + 商品 manifest からの決定的アセンブリ):

- `generators/attachments.ts` — 商品 manifest (`.local/coconala-products/<id>/v1/manifest.json`) を**参照** (複製しない)。
  有料記事のみ添付を持つ。listing/preview を除いた成果物 (pptx/xlsx/csv/pdf/svg/png/txt) を sha256・bytes つきで列挙。
- `generators/draft.ts` — 有料記事は 無料部 → `<!-- paid:start -->` → 有料部 (添付一覧・手順・ライセンス)。
  無料記事 (J/K/L) は境界なし (J=ココナラ受注導線・K=選び方・L=サンプル)。markdown 表なし・禁止表現なし・ですます調。
- `generators/{hashtags,manifest,images-plan,review}.ts` — hashtags.txt / source-manifest.json + product-links.json /
  images-plan.json (商品 preview を再利用) / REVIEW.md (公開前チェック §17・reviewer/verdict pending)。
- `build/build-note.ts` (単一) / `build/build-note-all.ts` (全件) / `build/note-report.ts` (機械台帳)。
- CLI `src/channels/note/cli.ts` + package.json scripts (`products:note:{plan,generate,validate,promote,report}`)。
  **promote は既定 dry-run** (実 promote・note.com 公開は N4 人間工程で未実装)。
- **fixture 3 記事**を生成・目視: `ppt-data-explainer-deck` (有料単独・B-01 添付 5)・`excel-choropleth-map` (有料)・
  `service-regional-report` (無料 J・添付 0)。有料/無料境界・添付・送客・文体を確認。

### N3 全ドラフト一括生成 (2026-07-18 完了)

- `products:note:generate --all --draft-only` で **55 記事すべて**を `.local/note-products/<series>/<slug>/` に生成
  (draft.md / hashtags.txt / attachments.json / source-manifest.json / product-links.json / images-plan.json / REVIEW.md の 7 ファイル×55)。
- `products:note:validate --all` = **green** (plan errors 0・55 本の draft 本文 claims スキャン 0 件)。
- `products:note:report` = `.claude/state/products/note-catalog-status.json` に台帳を書き出し。

**検証 (実行済・直接 exit code)**: type-check=0 / vitest **36/36** (既存 24 + note channel 12) / catalog --check=0 (回帰) /
git diff --check=0 / `.local/note-products` は gitignore 済 (git 未追跡) / channels/ は未追跡 (新規)。

**未実施 (規律・仕様 N4 以降)**: promote (docs/31 outbox + note catalog draft)・note.com 公開・browser 操作・
Office 実機検証・commit・push・deploy・公開R2・ココナラ出品。すべて人間承認後の別工程。

### N4 開始条件

生成した `.local/note-products/` の記事を 1 本ずつ人間が選び、REVIEW.md §17 のチェック
(実機で添付を開ける / 無料部が購入判断に十分 / note版とココナラ版の差が明確 / 価格・規約) を満たしたものだけを
`products:note:promote --slug <slug>` (実装は N4 で dry-run→実 promote 化) で docs/31 outbox + note catalog draft へ展開する。
公開は月1〜2本・オーナー明示承認後のみ。

### N4-N5 promote 基盤 + 全 55 記事 draft staging (2026-07-18 完了・オーナー選択「全 55 を draft で一括 staging」)

`products:note:promote` を dry-run→実 promote (`--apply`) 化し、**55 記事すべてを docs/31 outbox +
note catalog SSOT に draft (published:false) で staging**した。**note.com 公開・R2 push・commit はしていない**
(実公開 N7 は月1〜2本・ローカル browser-use・オーナー承認の別工程)。

- `build/promote-note.ts` — canonical 記事を (a) `docs/31_note記事原稿/product-sales/<slug>/`
  (`type: note-draft` frontmatter へ変換・`status: draft`・`published: false`・有料は `<!-- paid:start -->` 保持) と
  (b) note catalog data (`.claude/scripts/note/catalog/data/product-sales.ts`・55 `NoteArticle` エントリ) に展開する。
- **別カタログを作らない (仕様 §5)**: note catalog に新 vertical **`product-sales`** を追加
  (`catalog/types.ts` の `NoteVertical` union + `catalog/index.ts` 配線)。magazine は初版 null
  (stats47-note と同じ・オーナーが後で束ねる)。r2Body:false = R2 未反映 (docs/31 outbox のみ)。
- CLI: `products:note:promote --all --apply` (全件) / `--slug <s> --apply` (単一)。**既定は dry-run**。
- **カバー画像 (§11)**: `generators/cover.ts` + `build/build-note-covers.ts` で **決定的タイトルカード
  (1280×670・外部 AI 不使用・stats47 トークン・シリーズ別アクセント色・価格/無料バッジ)** を sharp で PNG 化。
  `products:note:covers --all` で全 55 記事の `images/cover.png` を生成。有料 49 記事は完成イメージ
  `completion.png` に商品プレビュー (`.local/coconala-products/<id>/v1/preview/`) を再利用 (SSOT を増やさない)。
  ハッシュタグは各記事 `hashtags.txt` + draft.md frontmatter `tags` に生成済み (3〜6 個)。
- **実測**: docs/31 = **55 記事 × {draft.md / hashtags.txt / attachments.json / REVIEW.md / images/cover.png}
  + 有料 49 の images/completion.png**。カバー 55 枚 (1280×670)・完成イメージ 49 枚。日本語描画を目視確認済み。
  note catalog validate = **error 0** (294 記事 = 既存 239 + product-sales 55、product-sales 由来の error/warn 0。
  warn 7 は既存 koumuin/paid の title 重複)。product-factory type-check=0 / vitest 36/36 / note plan --check=0 /
  coconala catalog --check=0 (回帰) / git diff --check=0 / docs/31・catalog data は git 未追跡 (未 commit)。

**残る公開ゲート (N6-N7・人間工程)**: (1) 現ドラフトは決定的な骨組み=読者価値の磨き込み (critic/人間) が公開前に必要。
(2) 添付の Office 実機検証 (オーナー・Windows。現 142 warning `attachment-unverified`)。(3) note 公開は月1〜2本・
ローカル `/publish-note` (browser-use)・オーナー明示承認後のみ。(4) 公開時に該当記事を `published: true` + noteUrl 更新
→ docs/31 は自動 prune・本文 SSOT は R2。

### N5.1 stale staging 修正 + draft 品質改善 (2026-07-18)

N4-N5 の後、`draft.ts` generator を修正して `.local` を再生成 (16:23) したが **promote を再実行しなかったため
docs/31 staging の 24/55 記事が古い draft (空 markdown 表・仕様§8違反) を固着**していた。`products:note:promote
--all --apply` を再実行し 55/55 を最新化 (markdown表混入 0/55)。

**再発防止 (運用規律)**: promote は `.local/note-products/<series>/<slug>/draft.md` を読んでコピーするだけなので、
**generator (draft.ts 等) を直したら必ず `generate --all --draft-only` → `promote --all --apply` を再実行**して
staging を同期する。memory `project_note_product_rollout` にも記録。

**draft 品質改善 (§7「無料部分だけで購入判断できる」の強化・全 55 記事に決定的波及)**: `draft.ts` の
`renderPaidDraft` を 3 点改善。(a) `deliverableNoun(article, members)` を新設し、完成イメージ・無料/有料差の説明を
記事の成果物 (PowerPoint テンプレート / Excel テンプレート / データパック / 図版テンプレート / 比較シート 等) に
正確化 (旧: 全記事「地図」固定=非地図商品で事実誤り)。(b)「この記事で手に入るもの」を member 商品の
`name：jobToBeDone` 列挙に変更し、束ね記事 (例 data-packs-population-economy = D-02/03/04) の中身を買い手が
把握できるようにした (旧: jobToBeDone のみで商品名が消えていた)。(c) 無料/有料差の文言を成果物名詞で具体化。

**検証 (再生成後・直接 exit code)**: type-check=0 / vitest 36/36 / note:validate --all OK (warnings 142=Office ゲート) /
docs/31 markdown表 0/55 / note catalog validate 294 記事 error 0・warn 7 (全て既存 koumuin/recovered title 重複・
product-sales 由来 0) / git diff --check=0。**commit・note.com 公開・R2 push はしていない (N6-N7 人間工程・オーナー承認後)**。

