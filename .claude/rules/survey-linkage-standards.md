# ranking ↔ 統計調査 (survey) 紐付け標準 (SSOT)

ranking / ThemeCatalog chart / blog chart と統計調査 (survey) の紐付けの**単一ソース (SSOT) 規約**。survey マスタの管理・紐付けの
編集・監査を行う agent (`survey-curator`) / skill (`/audit-survey-linkage`) / 人間はこれに従う。
テーマ・ブログは独自の surveyId を持たず、各面の既存 lineage (metricKey / e-Stat param /
chart source.json) を共通 resolver が surveys.json へ解決する。

> **背景 (2026-07-06 再設計)**: 旧実装は (a) metric config の `surveyId` が全 2,211 件未使用、
> (b) item.json の surveyId 全 null、(c) サイドバーが「全 41 調査リスト」を無関係に表示、
> (d) /survey 一覧が build 時 R2 不可の空 prerender で永久固着、という状態だった。
> 紐付けは config.source から**機械導出できる Reference** と位置づけ、辞書導出を既定に一本化した。

---

## 1. SSOT 構造 (どのデータがどこにあるか)

| データ | SSOT | 形 | 備考 |
|---|---|---|---|
| **調査マスタ** (id/name/organization/url) | `packages/ranking/src/data/surveys.json` | git JSON (件数は横断監査で照合) | 低頻度更新の reference。追加/削除はここだけ編集 |
| **導出辞書 (SSDS)** cdCat01 → 原典調査 | `packages/data-configs/src/ssds/ssds-provenance.generated.json` | 生成物 (~5,372キー) | `build-ssds-provenance` 系 script で再生成 |
| **導出辞書 (非SSDS)** statsDataId → 調査 | `packages/data-configs/src/ssds/estat-provenance.generated.json` | 生成物 (件数は生成時に報告) | **未カバー statsDataId の追記 = 未分類 item の回収手段** |
| **手動オーバーライド** | `MetricConfig.surveyId` (`packages/data-configs/src/metrics/<key>.ts`) | git TS | 導出不能/誤導出の例外だけ書く。実在 lint (`validate:config` の `survey-id`) が守る |
| **配信 (item→survey)** | R2 `app/ranking/<key>/item.json` の `surveyIds[]` + `originalSurveys[]` | 焼き込み | `generate-ranking-items.ts` (builder) が生成 |
| **配信 (survey→items)** | R2 `app/survey/<id>/items.json` + `app/survey/all.json` (itemCount 付き) | 焼き込み | master exporter (`export-master-snapshots.ts`) が生成 |
| **テーマ chart lineage** | `packages/data-configs/src/theme-catalog/*.ts` の `relatedRankingKeys` / `rankingLink` / `estatParams` | git TS | `resolveThemeSurveyTaxonomy` が直接解決。surveyId を重複記録しない |
| **ブログ chart lineage** | R2 `app/blog/<slug>/data/<base>.source.json` | R2 JSON | rankingKey / statsDataId を解決。記事単位の派生 `surveyIds[]` は `app/blog/all.json` へ焼く |
| **横断監査 state** | `.claude/state/surveys/taxonomy.json` | 派生 JSON | ranking/theme/blog 全量 + survey→各面の逆引き。手編集禁止 |
| **悪化防止 ratchet** | `.claude/config/survey-taxonomy-ratchet.json` | git JSON | 週次監査が改善方向だけに tighten。PR は offline check |

**ranking 紐付け解決の唯一の実装**: `packages/ranking/src/builders/build-ranking-item-from-metric.ts` の
`resolveSurveyLinkage(config, registry)`。横断入口は
`packages/ranking/src/survey/survey-taxonomy.ts` の `resolveSurveyTaxonomy` で、ranking は上記関数、
raw e-Stat は既存 `resolveProvenanceByParams` へ委譲する (辞書を複製しない)。導出優先順位:

```
config.surveyId (手動オーバーライド・先頭固定)
  > 辞書導出 resolveMetricProvenance(config, registry)
      - kind "kakei-chousa"     → kakei-chousa (固定)
      - kind "estat" SSDS       → cdCat01 → 原典調査 (複数可)
      - kind "estat" 非SSDS     → statsDataId → 調査 (1件)
      - kind "calculated"       → 分子/分母 metric を再帰的に辿る
      - kind "mlit"/"external"  → 合成 id (src:) のみ → マスタ非実在なので除外 = 未分類
  > 空 = 未分類 (UI は調査カード非表示。偽の調査を作らない)
```

- **合成 id (`ssds-src:` / `src:`) とマスタ非実在 id は配信に出さない** (surveys.json 照合で除外)。
- `surveyIds` は**配列** (SSDS は複数原典に属す)。`surveyId` (単数) は後方互換の主参照 = 先頭。
- `surveyIds: []` (空配列) は「未分類が確定」の意味。exporter はこれを尊重し fallback しない。
- theme/blog は `resolved` / `unresolved` / `missing-lineage` / `not-applicable` を区別する。
  未解決を空成功に丸めず、`authored` / `manual` の非統計 chart だけを対象外にする。

## 2. UI での意味

| 場所 | 表示 | データ源 |
|---|---|---|
| ranking サイドバー `SurveyCard` | 「**この統計の出典調査**」(1-2件) + 同調査の関連ランキング5件 | item.json の `originalSurveys` (追加 fetch なし) |
| `/category/<key>` サイドバー `SurveyCard` | そのカテゴリの active item の出典調査のみ | `app/category/<key>/items.json` の `sourceSurveys` 焼き込み (exporter が survey バケットと同じ導出で集計。**全調査リストを出さない** — 旧実装が all.json 全件を無関係に表示していた 2026-07-14 是正) |
| `/themes/<key>` 本文 | 「このテーマの出典調査」 | ThemeCatalog 全 chart + indicator item の lineage から request 時に派生 |
| `/blog/<slug>` 右レール | 「この記事の出典調査」 | `all.json.surveyIds`、旧 snapshot は chart source.json を fallback 解決 |
| `/survey` 一覧 | 調査カード + 件数 | all.json (`itemCount` 焼き込み、force-dynamic) |
| `/survey/<id>` | 調査ハブ + 関連ランキング / テーマ / ブログ記事 | survey items + ThemeCatalog 逆引き + `app/blog/all.json.surveyIds` (ƒ オンデマンド ISR) |

双方向リンクは `nav_click` の既存 custom dimensions で計測する。各面→survey は
`*_survey`、survey→各面は `survey_ranking` / `survey_theme` / `survey_blog`。
`survey_ranking` は週次 `survey-navigation.csv` から portfolio の internalNav へ56日集計する。

- **/survey 系ページに generateStaticParams を付けない** (build 時 R2 不可 → 空/notFound prerender 固着。
  ガード: `.claude/scripts/lib/check-r2-route-ssg.cjs`、正典: `nextjs-ssg-preservation.md`)。

## 3. 編集フロー

### 監査の 2 層 (導出 × 焼き込み) と active/total の区別 ★誤診防止 (2026-07-14)

- **導出層** (git): `audit-survey-linkage.ts` が本番と同一コードで全 metric を集計。`perSurvey` =
  総数 (inactive 含む在庫)、`perSurveyActive` = isActive のみ (= 配信されるべき数)。
  **R2 all.json は active のみ配信する** (exporter が `!item.isActive` を除外) ため、
  「在庫はあるが全て未公開」の調査が all.json に無いのは正常 (**inactive-only**)。これを
  「snapshot が stale (r2-drift)」と混同して sync や公開を要求しない (実例: population-projection)。
- **焼き込み層** (R2 live): `audit-survey-linkage.ts --compare-r2 [--sample N]` が active 全 item の
  live item.json `surveyIds` を git 導出と item 単位で突合 + 調査集合 (all.json vs git-active) を照合。
  月次のポートフォリオ監査 (`/manage-survey-portfolio`) で実行する (ネットワーク必須のため PR CI には
  入れない)。初回全件実測 2026-07-14: active 2,159 件 一致 100%・欠落 0・調査集合一致。
- **横断層**: `audit-survey-taxonomy.ts` が ranking / ThemeCatalog 全 chart / 公開 blog 全 SVG を
  同じ core で監査し、`.claude/state/surveys/taxonomy.json` に逆引き索引も保存する。PR は
  `--offline --check` で git drift・10日 freshness・ratchet を検査し、週次 workflow が R2 blog を
  全量再取得して ratchet を改善方向だけに更新する。

### 新しい調査を追加する
1. `packages/ranking/src/data/surveys.json` にエントリ追加 (id は kebab-case)
2. その調査に属する metric が辞書で解決されるようにする:
   - 非SSDS: `estat-provenance.generated.json` の `statsDataIdToSurvey` に statsDataId を追記
   - 例外的に手動: 対象 metric の TS に `surveyId: "<id>"`
3. `/audit-survey-linkage` で解決件数と orphan を確認 (item 0 件の調査を作らない)

### 未分類 item を回収する (最重要の定常運用)
```bash
npx tsx packages/ranking/src/scripts/audit-survey-linkage.ts   # 未カバー statsDataId 一覧が出る
```
1. レポートの `辞書未カバー statsDataId` から調査名を e-Stat で確認
2. `estat-provenance.generated.json` の `statsDataIdToSurvey` に `{id,name}` を追記
   (調査がマスタに無ければ surveys.json にも追加)
3. 再監査 → R2 再生成 (§4)

### orphan 調査を削除する
`/audit-survey-linkage` の orphan 一覧で機械確定 → surveys.json から**物理削除** (git 履歴で復活可)。

## 4. R2 反映 (実行順厳守)

```bash
# 1. item.json (surveyIds 焼き込み) を先に再生成
npx tsx packages/ranking/src/scripts/generate-ranking-items.ts        # CI: sync-snapshots (ranking-items)
# 2. その後に master (survey items.json / all.json) を再グループ化
npx tsx packages/ranking/src/scripts/export-master-snapshots.ts       # CI: sync-snapshots (master)
# 3. blog article の逆引き surveyIds は blog publish 時に source.json から再生成
NODE_OPTIONS='--conditions react-server' npx tsx apps/web/scripts/export-blog-snapshot.ts
```

順序が逆だと master が stale item.json を読む。CI は `gh workflow run sync-snapshots.yml` で
`ranking-items` → `master` の順に実行 (デプロイ規律: 本番反映はまとめて・確認の上)。

## 5. 禁止事項

| NG | OK |
|---|---|
| R2 の item.json / items.json / all.json を手編集 | builder/exporter で再生成 |
| 実在しない surveyId を config に書く | `validate:config` が error で弾く (survey-id lint) |
| 合成 id (`ssds-src:*`/`src:*`) を surveys.json に登録 | 実調査として正式登録 (id/name/organization) |
| 合成 id を `/survey/<id>` リンクとして描画する | `SourceAttribution` の `isLinkableSurveyId` (kebab-case ASCII のみ通す) で最終防波堤。合成 id は**調査名をテキスト表示**しリンクにしない。★`attribution.originalSurveys` は surveys.json 照合を経ずに item.json へ焼き込まれるため、`resolveSurveyLinkage` の除外だけでは漏れる (2026-07-24 に約 231 ランキングページが `/survey/ssds-src:世界農林業センサス` へ 404 リンクしていた) |
| 未分類の受け皿となる擬似調査 (旧 `ssds`) を作る | 未分類は非表示のまま辞書追記で回収 |
| bucketing/builder を経由しない独自の紐付けロジック追加 | `resolveSurveyLinkage` に一本化 |
| theme/blog に手書き surveyId を追加 | 既存 lineage を `resolveSurveyTaxonomy` で派生 |
| taxonomy state / portfolio / experiments を手編集 | 各 audit / builder script で再生成 |
| /survey 系に generateStaticParams を付ける | ƒ (revalidate) / force-dynamic (`check-r2-route-ssg.cjs` が守る) |

## 6. 役割分担

| 工程 | 担当 |
|---|---|
| surveys.json / 導出辞書 / config.surveyId / 横断 taxonomy state の管理・監査 | `survey-curator` (skill `/audit-survey-linkage`) |
| 観測値投入 (新 metric) | `data-ingester` (投入後に紐付け解決を確認、未解決は survey-curator へ) |
| R2 push / snapshot 再生成 | CI (sync-snapshots) / `r2-publisher` |
| 公開パイプライン (KNOWN/SITEMAP/deploy) | `ranking-publisher` |
| サイドバー等 UI | `ranking-ui-manager` |
| ThemeCatalog chart lineage | `theme-component-builder` |
| blog chart source.json lineage | `chart-author` / `blog-editor` |
| nav_click snapshot | `ga4-analyst` |

## 関連

- 監査スクリプト: `packages/ranking/src/scripts/audit-survey-linkage.ts`
- 横断 core / 監査: `packages/ranking/src/survey/survey-taxonomy.ts` /
  `packages/ranking/src/scripts/audit-survey-taxonomy.ts`
- 週次自動化: `.github/workflows/survey-taxonomy-audit-weekly.yml`
- 導出実装: `packages/ranking/src/builders/build-ranking-item-from-metric.ts` (`resolveSurveyLinkage`) /
  `packages/data-configs/src/provenance/resolve-metric-provenance.ts`
- バケット: `packages/ranking/src/exporters/survey-bucketing.ts`
- lint: `packages/data-configs/scripts/validate-metric-config.ts` (survey-id)
- agent: `.claude/agents/survey-curator.md` / skill: `.claude/skills/db/audit-survey-linkage/SKILL.md`
- SSG 保全: `.claude/rules/nextjs-ssg-preservation.md`
