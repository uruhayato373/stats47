---
type: critical-review
date: 2026-07-24
status: completed
tier: 1
target_metric: gsc
tags: [link-rot, site-audit, soft-404]
---

# サイト横断リンク切れ監査 (2026-07-24)

## 発端

`BLOG-LINKROT-01` (ブログ記事本文のリンク切れ 49 件の是正) を終えた直後、オーナーから
「ブログ記事だけに関わらず、サイト内のリンクが切れていないか機械的にチェックする方法はあるのか」
と問われた。

## 結論

**できる。そして即座に、記事本文の検査では原理的に見つからない壊れが 3 系統出た。**

リンクの大半は `article.md` ではなく**ページ側コンポーネントが生成する** (タグ・パンくず・
サイドバー・県データブックの KPI グリッド)。これらは記事本文にもリポジトリの 1 箇所にも
現れないため、レンダリング済み HTML を走査しないと検知できない。

## 手法

判定は `BLOG-LINKROT-01` と同じで、**HTTP ステータスではなく `<title>` の内容**で行う。
`/ranking/<存在しないキー>` は 404 ではなく **200 + タイトル「ランキングが見つかりません」**
を返すため、ステータス監視では原理的にすり抜ける。

全ページ巡回は不要だった。リンク先の集合は route テンプレート駆動で収束が速く、**代表 30 ページの
走査で 2,279 のユニークなリンク先**が集まった (サイトマップ全体は 3,123 URL)。実装
(`.claude/scripts/site/audit-site-links.mjs`) は route テンプレートごとに層化抽出する。

## 発見

### ① ブログのタグリンク 1,988 本が 410 Gone

公開 419 記事が使うタグ **868 種のうち 866 種**が 410。生きていたのは英語 slug の
`automation` / `productivity` の 2 つだけで、日本語タグは 1 つも通らなかった。

原因は `apps/web/src/config/known-tag-keys.ts` が **2026-04-26 に生成されたまま凍結**していたこと。
このファイルはリモート D1 の `articles` テーブルを SELECT して生成する設計だったが、
完全DBレス移行 (`docs/01_技術設計/12_完全DBレス設計.md`) で D1 が廃止され生成不能になり、
定期実行の workflow も現存しない。middleware は `!isKnown` で 410 を返すため、
2026-04-26 以降に増えたタグが全て Gone 扱いになっていた。

**是正**: 生成元を R2 `app/blog/all.json` の `tagMeta[].tagKey` (= ページ描画が使うのと同じ供給元)
へ差し替え、327 → 868 件に再生成。旧 325 件の英語 slug は全て `REDIRECT_TAG_KEYS` の 301 で
拾われるため退行はない (機械照合で確認、orphan 0)。

**さらに、タグページには 2 つ目の欠陥があった。** KNOWN を直して middleware を通した後も
ページが 404 を返した。`app/tag/[tagKey]/page.tsx` が **percent-encoded の params をそのまま**
`listArticleSummariesByTagKey` に渡しており、記事データ側のキー (`家計調査`) と一致せず
記事 0 本 → `notFound()` に落ちていた。表示用にだけ `decodeURIComponent` していたため、
タイトルは正しく出るのに中身が空という形で潜伏していた。データ取得も復号後のキーで行うよう是正。

ローカル dev で検証: `/tag/家計調査` `/tag/食文化` `/tag/紅茶` が 200 + 正しいタイトル、
存在しないタグは 410 のまま、英語 slug は 301 のまま (いずれも退行なし)。

### ② 全 47 県の県ページが到達不能なランキングへリンク

`packages/data-configs/src/area-databook/template.ts` は 47 県共通なので、1 件の見落としが
全 47 ページのリンク切れになる。

| キー | 症状 | 是正 |
|---|---|---|
| `general-household-members` | 410 (GONE 登録済・isActive:false・values.json 404) | 代替となる生きた指標が無いため参照を除去 |
| `prefectural-income-per-capita` | 200 だが isActive:false・values.json 404 の**空ページ** | 同一 statsDataId `0000010203` + cdCat01 `#C01321` を持つ `per-capita-prefectural-income-h27` へ差し替え |

`validate-area-databook.ts` は「METRICS_REGISTRY に実在するか」しか見ておらず、
`isActive:false` を検査していなかった。

### ③ 約 231 ランキングページが合成 survey id へ 404 リンク

`/ranking/abandoned-cultivated-land-area` が `/survey/ssds-src:世界農林業センサス` へリンクし 404。
`.claude/rules/survey-linkage-standards.md` §5 は「合成 id とマスタ非実在 id は配信に出さない」と
定めているが、`resolveSurveyLinkage` の除外は `item.surveyIds` / `item.originalSurveys` にしか
効かず、**`attribution.originalSurveys` は surveys.json 照合を経ずに item.json へ焼き込まれる**
経路が残っていた。

標本 200 キーの実測で 10.5% が該当 → KNOWN 2,199 キーへの外挿で**約 231 ページ**。
合成 id は 18 種 (`ssds-src:気象庁年報` / `ssds-src:消防年報` 等)。

**是正**: `SourceAttribution` に `isLinkableSurveyId` (kebab-case ASCII のみリンク化) を追加。
合成 id は調査名をテキスト表示するので、出典表記の誠実さは保たれる。

### ④ (副産物) ranking キー同期の PR が永久に作られない状態だった

①の再発防止として `known-tag-keys.ts` の生成を `sync-snapshots.yml` に配線する際、既存の PR 作成
ステップに同型の欠陥を見つけた。

```bash
KEY_FILES="a/known-ranking-keys.ts b/sitemap-ranking-keys.ts"
if git diff --quiet -- "$KEY_FILES"; then exit 0; fi   # ← 常に「差分なし」
```

引用により 2 パスが**単一の pathspec** に潰れ、どのファイルにも一致しないため `git diff --quiet` が
常に成功する。つまり **ranking キーが変わっても PR が作られない**。ローカルの最小再現で確認した。

**是正**: bash 配列 (`KEY_FILES=(...)` / `"${KEY_FILES[@]}"`) に変更。あわせてガード
`audit-workflow-policy.cjs` の `ARG_VECTOR_QUOTED` を拡張した。既存ルールは「連結で組んだ引数列
(`VAR="$VAR --x"`)」しか見ておらず、「空白区切りのパス列」と「`git` への引き渡し」を検知できて
いなかった。拡張後は 54 workflow に対し**誤検知 0**、変異テスト (旧形に戻す) で当該箇所を検出する。
`echo "$VAR" | xargs` のような意図的な文字列渡しは除外している。

## 再発防止

| 層 | タイミング | 何を弾くか | 実装 |
|---|---|---|---|
| オフライン validator | pre-commit + PR CI | 県データブックの `isActive:false` 参照 | `validate-area-databook.ts` `[metric-inactive]` |
| 同上 | 同上 | テーマカタログの `isActive:false` 参照・`rankingLink` の死んだキー | `validate-theme-catalog.ts` `[metric-inactive]` / `[ranking-link]` |
| 単体テスト | PR CI | 合成 survey id のリンク化 | `source-attribution.test.ts` (surveys.json 全 id との突合を含む) |
| **鮮度ゲート** | **PR CI (デプロイ前)** | **KNOWN_TAG_KEYS が R2 blog snapshot から乖離** (= タグリンクが黙って 410 になる) | `generate-known-tag-keys.ts --check` |
| 自動追従 | 週次 sync-snapshots | 新タグの KNOWN 反映 (乖離したら PR を出す) | `sync-snapshots.yml` |
| 週次 live 実測 | post-deploy | 上記で確定できない壊れ全般 | `internal-link-audit-weekly.yml` の (B) |

**なぜ E2E (Playwright) を足さないか**: 今回の壊れはいずれも「データ/設定に書かれたキーが到達可能か」
という**集合の突合**で決まり、ブラウザ操作も client-side JS も関与しない。リンクはサーバ HTML に
出るので `fetch` で足り、実際 ①②③ はすべて上表のオフライン検査か HTTP クロールで捕捉できる。
2,300 URL をブラウザで回すのは桁違いに遅く、dev サーバのコンパイル待ちで CI が不安定になる。
既存の Playwright は a11y 代表ルート検証という別目的で PR CI に載っており、そこへ混ぜない。

新しい validator 検査は**いずれも変異テストで発火を確認**した (壊れたキーを一時的に戻すと
error になり、戻すと 0 になる)。`validate-theme-catalog.ts` の新検査は導入直後に実在のバグ
(`dwelling-per-floor-area` が `/themes/living-housing` で 410) を検出し、`housing-floor-area`
へ是正した。

## 検証

- `validate:area-databook` / `validate:catalog` — error 0
- `tsc --noEmit` — `packages/data-configs` / `apps/web` ともクリーン
- `vitest` — 23 passed (SourceAttribution 4 + config 19)
- 監査スクリプト実測 — 59 ページ走査 / 2,391 リンク先 / 壊れ 22 件を検出 (上記 3 系統に一致)
- **LLM 不使用 = API 課金ゼロ**

## 残件

**本番反映は未実施** (2026-07-24 時点。オーナー確認待ち)。必要な操作は 2 つ:

1. **再デプロイ** — ①タグ (`known-tag-keys.ts` は middleware がビルド時に取り込む静的ファイル +
   `page.tsx` のコード修正)、②県ページ (テンプレは git TS を直接 import)、③出典リンク
   (`SourceAttribution` のコード修正) はいずれもデプロイで反映される。
2. **page-components の R2 push** — テーマの `rankingLink` だけは R2
   `app/page-components/theme/living-housing.json` を読むため、デプロイとは別に push が要る
   (`sync-snapshots` の `only=page-components`)。ローカル生成物は是正済み・R2 は旧値のままを実測確認。

その他:

- `REDIRECT_TAG_KEYS` の 8 件は 301 先の日本語タグが記事 0 本になっており `301 → 410` の連鎖を作る
  (`agricultural-processing→農産加工` 等)。最終応答が 410 なので Google への signal としては正しく、
  今回は手を付けていない。
- タグページは `generateStaticParams` を持つため、デプロイ後は 868 タグが prerender される見込み。
  復号バグを直す前にデプロイしていたら**全タグが notFound で prerender され固着**していた
  (`.claude/rules/nextjs-ssg-preservation.md`)。デプロイ後に `/tag/家計調査` の live 実測が要る。

## 関連

- 前段: `docs/04_レビュー/2026-07-24-blog-internal-link-audit.md` (記事本文のリンク 49 件)
- 施策: `docs/todo/01_改善バックログ.md` `SITE-LINKROT-01`
- 正典: `.claude/rules/blog-quality-standards.md` §内部リンクの実在 (三層)
