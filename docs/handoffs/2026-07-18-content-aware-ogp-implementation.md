---
type: session-handoff
date: 2026-07-18
status: active
tags: [ogp, satori, frontmatter, note, blog, link-card, claude-code]
---

# 記事内容別OGP・noteリンクカード最適化 実装手順書

## Claude Codeへ渡す開始プロンプト

```text
OUTPUT FORMAT:
- 各Phase終了時に「変更ファイル / 検証結果 / 未解決」を最大8項目で報告する。
- 最終報告は「実装結果 / 検証 / 未実行 / 承認待ち」の4節だけにする。
- 未検証、R2未反映、本番未反映を完了扱いしない。

BEHAVIOR CONTRACT:
- 最初にCLAUDE.mdと本手順書の参照必須ファイルを最後まで読む。
- note・blog・OGP以外の既存変更を編集、整形、削除、commitしない。
- 既存OGP生成パイプラインを拡張し、同義の別generatorを作らない。
- 文字、数値、県名、ブランドはSatoriで描画する。生成AIに文字を描かせない。
- 観測値をfrontmatterへ複製しない。ranking valuesをSSOTとして生成時に解決する。
- 訴求型の選択はfrontmatterまたはgit TSで明示し、生成時にモデルへ分類させない。
- R2 push、note.com更新、git push、deployは人間の明示承認なしに実行しない。
- 最初は3訴求型、1記事、ローカルdry-runまで。効果未確認の全記事展開は禁止。

TASK:
docs/handoffs/2026-07-18-content-aware-ogp-implementation.md に従い、
ブログfrontmatter・note catalog・ranking configから記事内容別OGPを決定し、
Satoriでnoteリンクカードのセーフティエリアを守って生成できる基盤を実装する。
最初のセッションはPhase 0〜4のローカルパイロットまでとし、R2やnote.comへは反映しない。
```

## 1. 目的

ブログ記事、note記事、rankingページごとにOGPの訴求を使い分ける。ただし自由デザインにはせず、ブランド、可読性、データ正確性を維持した少数テンプレートから選ぶ。

最初に実装する訴求型:

- `gap`: 最大と最小の差を入口にする。
- `question`: 「あなたの県は？」と自分ごと化する。
- `reversal`: 通説とデータの逆転を入口にする。

背景の既存6分類は維持する。

- `map`
- `people`
- `economy`
- `industry`
- `timeline`
- `comparison`

訴求型は「何を伝えるか」、背景型は「何を描くか」であり、別軸として扱う。

## 2. 成功条件

1. ブログ記事はfrontmatterで訴求型とOGP専用見出しを設定できる。
2. note記事はnote catalogで同じOGP型を設定できる。
3. rankingは既存metric configから同じ型へ解決できる余地を残す。
4. 観測値は`rankingKey`から生成時に取得し、frontmatterへ数値を複製しない。
5. Satoriが`gap / question / reversal`を決定的に描画する。
6. 1200×630の中央安全域に重要情報が収まる。
7. noteリンクカード相当の縮小プレビューを機械生成できる。
8. 設定なしの既存記事は現在のOGPと同じ結果になる。
9. AI背景の失敗・未使用時もブランド背景へfallbackする。
10. 海外旅行記事で3型のローカルモックを比較できる。

## 3. 参照必須ファイル

- `CLAUDE.md`
- `.claude/rules/ogp-image-standards.md`
- `.claude/rules/blog-quality-standards.md`
- `.claude/rules/sns-content-standards.md` のnote節
- `.claude/rules/r2-storage-design.md`
- `.claude/rules/coding-standards.md`
- `.claude/rules/branch-workflow.md`
- `docs/04_レビュー/2026-07-18-note-circulation-cta-redesign.md`
- `docs/handoffs/2026-07-18-note-circulation-cta-implementation.md`
- `apps/web/scripts/data/blog-ogp-visual-catalog.ts`
- `apps/web/scripts/lib/blog-ogp-visual.ts`
- `apps/web/scripts/lib/blog-thumbnail-render.ts`
- `apps/web/scripts/generate-blog-thumbnails-cloud.ts`
- `apps/web/scripts/generate-ogp-images.ts`
- `apps/web/scripts/lib/__tests__/blog-ogp-visual.test.ts`
- `packages/types/src/article.ts`
- `.claude/scripts/note/catalog/types.ts`
- `.claude/scripts/note/catalog/data/stats47-note.ts`
- `.claude/scripts/note/catalog/validate-note-catalog.ts`
- `docs/21_ブログ記事原稿/overseas-travel-gap/article.md`

## 4. 現状と変更方針

### 現状

- ブログOGPはNode上のSatoriで事前生成しR2配信する。
- `ogpVisualType`と`ogpMotif`は実装済み。
- AI背景はGeminiが文字なし背景だけを生成する。
- category、archetype、tagsから背景型を決定的に選ぶ。
- 最終文字合成は`blog-thumbnail-render.ts`のSatori。
- `generate-blog-thumbnails-cloud.ts`がOGP、light/darkカード、metadataを生成する。
- noteカバーはverticalごとに生成系統が異なる。公務員2系統はbespoke generatorが正典。
- note editorial metaは`.claude/scripts/note/catalog/`がgit TS SSOT。

### 変更方針

既存の背景分類へ訴求分類を追加し、最終Satoriレイアウトを切り替える。AIプロンプトの自由入力や新しい画像生成providerは追加しない。

```text
article frontmatter / note catalog / metric config
                    ↓
            resolveOgpEditorial
                    ↓
      ranking valuesから表示値を解決
                    ↓
     背景解決（既存6分類・AI任意）
                    ↓
     Satori訴求レイアウト（3型）
                    ↓
  OGP + site card + note link-card preview
```

## 5. 作業境界

### 変更してよい

- `packages/types/src/article.ts`
- `apps/web/scripts/data/blog-ogp-visual-catalog.ts`
- `apps/web/scripts/lib/blog-ogp-visual.ts`
- `apps/web/scripts/lib/blog-thumbnail-render.ts`
- `apps/web/scripts/generate-blog-thumbnails-cloud.ts`
- 上記のテスト
- `.claude/scripts/note/catalog/`の型、validator、対象記事メタ
- `docs/21_ブログ記事原稿/overseas-travel-gap/article.md`のfrontmatter
- `.local/ogp-pilot/`のローカル派生画像
- 必要な設計・検証記録

### 原則変更しない

- AI背景providerとモデル
- `apps/web/src`の公開UI
- note.com公開記事とカバー
- R2本番オブジェクト
- 既存OGP URL、R2 key、ファイル名
- 公務員note bespoke cover generator
- 無関係なdirty worktree
- `.env.local`

開始前と終了時に`git status --short`を保存し、対象ファイルに別作業の差分があれば中断する。

## 6. Phase 0 — 現行挙動の固定

### 6.1 ベースライン

海外旅行記事の現行OGPを既存パイプラインでローカル生成する。R2へ書かない。

```bash
npx tsx apps/web/scripts/generate-blog-thumbnails-cloud.ts \
  --slug overseas-travel-gap \
  --force \
  --out-dir .local/ogp-pilot/baseline
```

公開R2から記事を取得する実装のため、ローカルoutboxのfrontmatterがまだR2へ反映されていない場合は、既存スクリプトへローカル入力オプションを追加する前に現状を報告する。パイロット専用の`--article-file`を追加する場合は1ファイル限定、既定挙動不変、`--apply`併用禁止とする。

### 6.2 既存テスト

```bash
npx vitest run apps/web/scripts/lib/__tests__/blog-ogp-visual.test.ts
npm run type-check --workspace apps/web
```

既存失敗と新規失敗を区別する。今回の変更前から失敗しているものを勝手に修正しない。

## 7. Phase 1 — 共通OGP editorial型

### 7.1 型定義

`packages/types/src/article.ts`へ追加する。

```ts
export type OgpHookType = "gap" | "question" | "reversal";
export type OgpSafeArea = "standard" | "link-card";

export interface OgpEditorial {
  hookType?: OgpHookType;
  headline?: string;
  rankingKey?: string;
  safeArea?: OgpSafeArea;
}
```

既存`ArticleFrontmatter`にはflat fieldで追加する。

```ts
ogpHookType?: OgpHookType;
ogpHeadline?: string;
ogpRankingKey?: string;
ogpSafeArea?: OgpSafeArea;
```

初回はnested YAMLを採用しない。現在の軽量frontmatter parserはscalar前提であり、nested objectを加えると複数parser間で挙動がずれるため。

### 7.2 値の責務

frontmatterへ保存してよい:

- 訴求型
- 編集見出し
- 値を取得するranking key
- セーフティエリア
- 既存のvisual type / motif

保存しない:

- 1位・47位の県名
- 観測値
- 倍率
- データ年
- AIプロンプト全文
- Satoriの座標やfont size

観測値はR2 `app/ranking/<key>/values.json`をSSOTとして生成時に読む。

### 7.3 note catalog

`.claude/scripts/note/catalog/types.ts`の`NoteArticle`に同じsemantic fieldをoptionalで追加する。型の重複を避けられるimport境界なら`@stats47/types`の`OgpHookType`等をimportする。`.claude/scripts`からworkspace package importが不安定なら、Phase 1ではnote側を実装せず、型共有方法を先に検証する。別名の同義unionを恒久化しない。

推奨形:

```ts
ogp?: {
  hookType: OgpHookType;
  headline?: string;
  rankingKey?: string;
  safeArea?: OgpSafeArea;
  visualType?: OgpVisualType;
  motif?: string;
};
```

ブログはflat frontmatter、TypeScript内部では`OgpEditorial`へ正規化する。noteはgit TSなのでnested objectを許容できる。

## 8. Phase 2 — frontmatter解析と決定的resolver

### 8.1 parser

`blog-ogp-visual.ts`の既存`parseOgpVisualFrontmatter`を拡張する。別parserを増やさない。

追加入力:

```ts
ogpHookType?: string | null;
ogpHeadline?: string | null;
ogpRankingKey?: string | null;
ogpSafeArea?: string | null;
```

### 8.2 resolver

新規pure functionを同ファイルまたは`blog-ogp-editorial.ts`へ置く。

```ts
resolveOgpEditorial(input): OgpEditorialResolution
```

解決規則:

1. 有効なfrontmatter明示値。
2. `ogpHookType`未指定なら従来レイアウト。自動で`gap`を選ばない。
3. `ogpHeadline`未指定なら記事`title`。
4. `ogpRankingKey`未指定なら既存`rankingKey`を候補にする。
5. `ogpSafeArea`未指定なら`standard`。
6. 設定なし記事はlegacy modeとして既存`buildElement`を使う。

意味解釈が必要な`reversal`は自動推定しない。`gap`も倍率だけで全記事へ自動適用しない。

### 8.3 validator

最低限以下を機械検証する。

error:

- 未知の`ogpHookType`。
- 未知の`ogpSafeArea`。
- `ogpHeadline`が空または長すぎる。上限は実レイアウトテストから決め、初期案は全角32文字。
- `gap`なのにranking keyを解決できない。
- `ogpRankingKey`が既知ranking keyにない。

warn:

- `reversal`に`ogpHeadline`がない。
- `question`見出しが疑問形になっていない。ただし文体を強制errorにしない。
- `ogpVisualType`とhook typeの組合せが非推奨。

既存記事全件を新field必須にはしない。

### 8.4 テスト

- 明示`gap`が解決される。
- 未指定はlegacy。
- 不正hookは拒否。
- headline fallback。
- rankingKey fallback。
- safeArea fallback。
- 既存visual resolverの12テストが回帰しない。

## 9. Phase 3 — ranking values解決

### 9.1 既存readerの再利用

まず`rg`でR2 ranking valuesを読む既存helperを探す。`generate-ogp-images.ts`やranking exporterに既存readerがあれば再利用する。同じURL組立・schema parserを別実装しない。

必要な正規化結果:

```ts
interface OgpRankingSummary {
  top: { prefecture: string; value: number; formattedValue: string };
  bottom: { prefecture: string; value: number; formattedValue: string };
  ratio: number | null;
  year?: string;
  unit?: string;
}
```

### 9.2 ratio規則

- bottomが0、null、負値ならratioを出さない。
- 上位/下位の意味が`higherIsBetter`と一致しなくても、順位はvaluesの正規順を使う。
- `gap`表示は比率が有限かつ意味のある場合だけ。
- 丸めは決定的にする。原則小数1桁、10倍以上は整数も検討するが定数化する。
- `約`を付ける。
- 記事本文とデータ年が異なる可能性を隠さない。OGP metadataへsource yearを残す。

### 9.3 fallback

values取得失敗、schema不整合、ratio算出不可の場合:

- 生成全体を落とさずlegacy OGPへfallback。
- `gap`の捏造値を表示しない。
- `ogp.json`へfallback reasonを記録する。
- APIレスポンス本文やsecretをログへ出さない。

### 9.4 テスト

- 正常な47県。
- bottom 0。
- null含有。
- 同値。
- 降順・昇順の扱い。
- 単位format。
- values 404。
- 47件未満でもtop/bottomが安全に解決できるか、拒否するかを明示。

## 10. Phase 4 — Satori訴求レイアウト

### 10.1 既存`buildElement`を壊さない

`BuildOptions`へoptionalなeditorial dataを追加する。

```ts
interface BuildOptions {
  background?: boolean;
  backgroundImage?: string;
  editorial?: ResolvedOgpEditorial;
}
```

`editorial`なしは現在のDOM構造をそのまま返す。

推奨分割:

```text
buildElement
├── buildLegacyElement
└── buildEditorialElement
    ├── GapLayout
    ├── QuestionLayout
    └── ReversalLayout
```

React componentへ過剰分割せず、Satori互換の`createElement` helperとして最小限にする。

### 10.2 セーフティエリア

1200×630の共通token:

```ts
const OGP_SAFE_AREA = {
  standard: { left: 72, right: 72, top: 60, bottom: 60 },
  "link-card": { left: 96, right: 96, top: 76, bottom: 76 },
} as const;
```

実装後、noteリンクカードの実測cropに合わせて調整する。重要要素は`link-card`の内側へ置く。

重要要素:

- headline
- 主数値または主問い
- top/bottom比較
- stats47ブランド

外側へ置いてよい:

- 地図断片
- ドット
- 装飾線
- 背景チャート

### 10.3 gap

優先順位:

1. `約3.6倍`
2. headline
3. `1位 東京 18.2%` / `47位 秋田 5.0%`
4. category / brand

倍率を誇張する`格差`文言はfrontmatter headlineにない限り自動追加しない。

### 10.4 question

優先順位:

1. headline
2. `47都道府県比較`
3. 必要ならtop valueを小さく表示

疑問符をrendererが勝手に二重付与しない。

### 10.5 reversal

優先順位:

1. editorial headline
2. 対比する事実
3. データ出典を示すcategory / brand

通説そのものはranking valuesから導出できないため、headlineを必須に近いwarn対象とする。

### 10.6 文字サイズとoverflow

初期値:

- 主数値: 88〜112px
- headline: 44〜54px、最大2行
- 比較値: 30〜38px
- badge: 18〜22px
- brand: 18〜22px

長文はfont sizeの段階縮小を決定的に行う。文字数に応じた閾値をpure function化し、CSS任せのoverflowにしない。省略記号で意味が変わる場合はvalidator errorにする。

### 10.7 アクセシビリティ

- WCAG相当の高コントラストを目視・可能なら計算検証する。
- 色だけで1位/47位を区別しない。
- 赤を煽り用途に使わない。
- light/dark双方で読める。
- AI背景の上に既存scrimを維持する。

## 11. noteリンクカードプレビュー

本番note.comを自動スクリーンショットする機能は初回に作らない。まず決定的な縮小プレビューを生成する。

推奨出力:

```text
.local/ogp-pilot/<slug>/<hook>/ogp.png
.local/ogp-pilot/<slug>/<hook>/thumbnail-light.webp
.local/ogp-pilot/<slug>/<hook>/thumbnail-dark.webp
.local/ogp-pilot/<slug>/<hook>/note-link-card-preview.png
.local/ogp-pilot/<slug>/<hook>/ogp.json
```

previewはOGPをnoteカード相当サイズへ縮小し、白背景、記事タイトル、`stats47.jp`を下部に合成する。noteの商標UIを完全複製せず、可読性確認用の近似枠と明記する。

検証:

- 幅320〜360px相当でheadlineが読める。
- 主数値が判読できる。
- top/bottom県名が潰れない。
- edge cropを仮定しても重要要素が残る。
- 重要情報を画像下のカードtitleへ重複させすぎない。

galleryに追加する場合は既存`apps/gallery`のread-only pilot collectorを再利用し、新しいgallery appやserverを作らない。

## 12. 海外旅行記事パイロット

### 12.1 frontmatter

`docs/21_ブログ記事原稿/overseas-travel-gap/article.md`へ、まず`gap`案を設定する。

```yaml
ogpHookType: gap
ogpVisualType: comparison
ogpMotif: left-right-panels
ogpHeadline: "海外旅行する県、しない県"
ogpRankingKey: overseas-travel-activity-rate-15plus
ogpSafeArea: link-card
```

記事の実データは東京18.2%、秋田5.0%、約3.6倍。先に生成した画像モックの8.8倍、青森2.1%はデザイン例であり、実装fixtureや本番画像へ流用しない。

### 12.2 3型比較

frontmatterを3回書き換えず、CLI overrideまたはfixture入力で3型を同時生成する。

```bash
npx tsx apps/web/scripts/generate-blog-thumbnails-cloud.ts \
  --article-file docs/21_ブログ記事原稿/overseas-travel-gap/article.md \
  --ogp-hook gap,question,reversal \
  --out-dir .local/ogp-pilot/overseas-travel-gap
```

このCLIはパイロット限定。`--article-file`または複数hook指定時は`--apply`を拒否する。

候補headline:

- gap: `海外旅行する県、しない県`
- question: `あなたの県は海外旅行する県？`
- reversal: `海外旅行率は所得だけでは決まらない`

reversalは本文の相関分析に基づくが、OGPだけで因果を断定しない。

### 12.3 選定基準

- noteリンクカード縮小時の可読性。
- 記事内容との一致。
- 数値の正確性。
- 煽りすぎていない。
- 既存ブランドとの統一。
- クリック後に期待外れにならない。

初回は人間が1型を選ぶ。選ばれた型だけをfrontmatterの正値にする。

## 13. note記事への適用

初回のblogパイロットが通るまでnoteへ広げない。

### 13.1 SSOT

- note本文・画像: R2。
- note editorial meta: note catalog git TS。
- OGP設定: note catalogの`ogp`。
- cover PNG:派生物。

### 13.2 制約

- note.comの記事内リンクカードはリンク先サイトのOGPを表示する。note記事自体のカバーとは別物。
- stats47へのリンクカード改善はサイト側`app/blog/<slug>/ogp/ogp.png`の更新で効く。
- note記事自身のカバー変更は別工程で、公開済みカバー差し替えには人間承認が必要。
- 公務員2verticalのbespoke cover正典を今回Satoriへ置換しない。

### 13.3 stats47-note cover

blogパイロットで勝った訴求型を、`stats47-note`の新規記事カバーに限り再利用できる。ただし1200×630と1280×670のsize tokenを分離し、座標の直書き複製を避ける。

## 14. metadataとキャッシュ

既存`ogp.json`へ追加する。

```json
{
  "title": "海外旅行する県、しない県",
  "editorial": {
    "hookType": "gap",
    "headline": "海外旅行する県、しない県",
    "rankingKey": "overseas-travel-activity-rate-15plus",
    "safeArea": "link-card",
    "sourceYear": "2001",
    "top": { "prefecture": "東京都", "formattedValue": "18.2%" },
    "bottom": { "prefecture": "秋田県", "formattedValue": "5.0%" },
    "ratio": 3.6
  }
}
```

これは生成結果のprovenanceでありSSOTではない。手編集しない。

prompt/render hashには次を含める。

- renderer version
- hook type
- headline
- ranking key
- source data hashまたはtop/bottom/year
- safe area
- visual type
- motif
- AI background prompt hash

背景が同じでも訴求型や値が変われば最終OGPを再生成する。AI背景自体はvisual prompt hashが同じなら再利用する。

## 15. CLIと安全弁

既存CLIを拡張する。

追加候補:

- `--article-file <path>`: ローカル記事1件、dry-run専用。
- `--ogp-hook <type[,type]>`: パイロットoverride、dry-run専用。
- `--preview-link-card`: note近似preview生成。
- `--force-layout`: 背景を再生成せずSatoriレイアウトだけ再生成。

安全規則:

- `--article-file`と`--apply`の併用はexit 1。
- 複数hookと`--apply`の併用はexit 1。
- AI背景APIは明示`--ai-background`時のみ。
- layout比較では既存背景またはbrand fallbackを使い、不要なAI課金をしない。
- 出力は`.local/ogp-pilot`または`/tmp`。
- R2 keyは変更しない。

## 16. テスト計画

### unit

- hook type parser/resolver。
- headline長検証。
- safe area解決。
- ranking summaryとratio。
- 値取得失敗fallback。
- hook別Satori element生成。
- font size閾値。
- hash決定性。
- CLI禁止組合せ。
- legacy記事の出力経路。

### snapshot/structural

画像pixel snapshotを大量に固定せず、Satori SVGまたはelement構造の次を検証する。

- headlineを1回含む。
- top/bottom値を正確に含む。
- safe area tokenを使う。
- gapでratioを含む。
- questionで捏造ratioを含まない。
- reversalでheadlineを含む。
- UTMやplaceholderを含まない。

### visual

海外旅行記事3型についてlight/dark/OGP/note previewをgalleryで目視する。

### 回帰

- frontmatter設定なし記事1件。
- AI背景あり記事1件。
- brand fallback記事1件。
- 長いタイトル1件。
- 日本語と数字の混在1件。

## 17. 検証コマンド

実在するscript名を`package.json`で確認してから実行する。

```bash
npx vitest run apps/web/scripts/lib/__tests__/blog-ogp-visual.test.ts
npx vitest run <追加したOGP editorialテスト>
npm run type-check --workspace apps/web
npx tsx .claude/scripts/note/catalog/validate-note-catalog.ts
git diff --check -- \
  packages/types/src/article.ts \
  apps/web/scripts \
  .claude/scripts/note/catalog \
  docs/21_ブログ記事原稿/overseas-travel-gap/article.md
git status --short
```

full web buildは初回ローカル画像生成には不要。metadata route、snapshot schema、公開ページ参照を変更した場合のみ節目で実行する。未実行なら最終報告に明記する。

## 18. Phase 5 — 効果測定後の展開

R2反映は別承認工程。反映前に提示する。

- 旧OGPと3候補。
- noteリンクカードpreview。
- 使用値とデータ年。
- frontmatter差分。
- R2上書き対象key。
- rollback元の存在。

承認後も海外旅行記事1件だけを反映する。

観測指標:

- noteからstats47への参照セッション。
- ブログカードCTR。
- SNSカードCTRが取得できる場合は補助指標。
- 記事到達後のengagement。
- 直帰悪化や期待不一致。

最低2週間、可能なら4週間観測する。1件で勝ち型を一般化せず、テーマの異なる記事で再現する。

次のパイロット候補:

- gapが自然な記事。
- questionが自然な記事。
- reversalが本文で十分立証された記事。

勝った型だけを高流入記事へ段階展開する。全記事を`gap`へ自動分類しない。

## 19. 禁止事項

- 観測値、県名、倍率をfrontmatterへ手入力してSSOT化する。
- 記事ごとの自由AIプロンプト。
- AI画像へ日本語や数値を直接描かせる。
- Codex画像生成を本番バッチgeneratorとして呼ぶ。
- ランタイムImageResponseへ戻す。
- OGP更新と記事本文・note CTA改修を同じ効果測定で同時実施する。
- 公開済み全記事の一括再生成。
- note公開カバーの無承認差し替え。
- R2への無承認push。
- mockの8.8倍、青森2.1%を実データとして使用する。

## 20. 中断条件

- ranking valuesのschemaまたは順位方向を安全に解決できない。
- 記事frontmatterの`rankingKey`とOGP用rankingが一致しない。
- R2記事とdocs/21 outboxのどちらが新しいか判定できない。
- 対象コードに別セッションの未コミット変更がある。
- 既存AI背景実装が未mergeで、現在branchの正典が不明。
- noteの実カードcropを推測だけで確定する必要がある。
- R2、note.com、git push、deployの権限が必要。

## 21. 完了時の記録

1. `.claude/rules/ogp-image-standards.md`へ確定した訴求型、safe area、生成規則を追記する。
2. `docs/04_レビュー/`へパイロット比較と選定理由を保存する。
3. 機能バックログに既存項目があればstatusを更新し、同義項目を増やさない。
4. R2未反映、本番未反映、note未更新を明記する。
5. 全Phase消化後、このhandoffから恒常事項と残TODOを抽出し、`docs/handoffs/README.md`に従って削除する。

## 22. 最終報告テンプレート

```md
## 実装結果

- 共通型:
- frontmatter resolver:
- ranking values解決:
- Satoriレイアウト:
- 海外旅行パイロット:

## 検証

- unit tests:
- type-check:
- catalog validate:
- visual review:
- diff check:

## 未実行

- R2 push: 未実行
- note.com更新: 未実行
- deploy: 未実行
- full build: 実行有無と理由

## 承認待ち

- 採用候補:
- 上書き対象R2 key:
- 観測期間:
```
