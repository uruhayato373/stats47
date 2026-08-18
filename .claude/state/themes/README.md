# .claude/state/themes/ — テーマポートフォリオ state (schema 正典)

`theme-portfolio-manager` agent が管理する**テーマ別評価・実験台帳の決定的 JSON**。
テーマ定義の SSOT は ThemeCatalog (`packages/data-configs/src/theme-catalog/`) であり、
**ここには変動値 (GSC/GA4/品質評価) だけを置く。ThemeCatalog に計測値を書かない**。

- **書き込み口**: `theme-portfolio-manager` が **builder スクリプト経由**で行う。手編集しない。
  - 機械項目の再導出 (upsert): `npx tsx .claude/scripts/themes/build-theme-portfolio.ts`
  - 意味項目 (lifecycle/hypothesis/evidence) の更新: 同スクリプト `--set <themeKey> --lifecycle ... --add-evidence ...`
  - 実験の登録/期日記録/verdict: `node .claude/scripts/themes/evaluate-theme-experiments.mjs --register '<json>'` / `--check` / `--verdict`
- **再構築可能**: ThemeCatalog (git TS) + 計測 snapshot (`.claude/state/metrics/` /
  `.claude/skills/analytics/{gsc,ga4}-improvement/reference/snapshots/`) + レビュー文書
  (`.claude/skills/theme/manage-theme-portfolio/reference/reviews/*-theme-*.md`) から常に再導出できる派生物 (blog remediation-queue と同思想)。
- **検証**: `node .claude/scripts/themes/validate-theme-state.mjs` (決定的 lint。schema +
  下記の判定規律を enforce。pre-commit/CI 配線は PR-4)。
- 運用設計の正典: `.claude/skills/theme/manage-theme-portfolio/reference/テーマポートフォリオ運用.md`。判定基準の正典:
  `.claude/skills/theme/manage-theme-portfolio/reference/theme-taxonomy-reorganization.md`。

## portfolio.json

```jsonc
{
  "schemaVersion": 1,
  "generatedAt": "2026-07-13",          // 生成日 (YYYY-MM-DD)
  "themes": [
    {
      "themeKey": "aging-society",       // 必須・一意。THEME_CATALOGS または legacy キー
      "catalogStatus": "catalog",        // "catalog" (THEME_CATALOGS 登録) | "legacy" (IndicatorSet のみ)
      "lifecycleStatus": "keep",         // 下記 enum
      "reviewStatus": "reviewed",        // "reviewed" | "review-missing" | "stale" (レビュー後にカタログが大きく変わった)
      "reviewGate": "proposal-ready",    // レビュー文書 frontmatter の status をそのまま転記 (proposal-ready / ready-after-*-audit / blocked-*)。次アクションの優先度判断に使う
      "reviewDocRef": ".claude/skills/theme/manage-theme-portfolio/reference/reviews/2026-07-11-theme-aging-society.md",
      "latestDataYear": "2023",          // R2 values 実測から (未集計は null)
      "primaryMetricCount": 1,           // ThemeCatalog から決定的に導出
      "secondaryMetricCount": 6,
      "contextMetricCount": 3,
      "selectionMissingCount": 7,        // primary/secondary で selection 未記入の数
      "chartCount": 15,
      "officialSourceReviewedAt": "2026-07-11", // selection.surveyedAt の最新 or レビュー日 (無ければ null)
      "gscSnapshotRef": ".claude/skills/analytics/gsc-improvement/reference/snapshots/2026-W28/pages.csv",
      "ga4SnapshotRef": ".claude/skills/analytics/ga4-improvement/reference/snapshots/2026-W28/pages.csv",
      "metrics": {                        // 実測の集計コピー。取れない値は status で明示し推測値を入れない
        // ★集計の基礎 (aggregate-theme-metrics.ts): GSC/GA4 の週次 snapshot は各週 last-28d 窓のため、
        //   56d = 非重複 2 窓 (最新週 + 4 週前) の合算。weeks に使用した 2 窓を記録する。
        // ★status の 4 値 (2026-07-13 PR-4 改訂・統計的根拠):
        //   - "measured":        集計済みで最低標本数以上。カウント値も比率値も解釈可
        //   - "measured-low":    集計済みだが最低標本数未満。**カウント値 (clicks/impressions/pageViews)
        //                        のみ保存・解釈可** — 56d 窓での低カウントはそれ自体が「需要が低い」証拠
        //                        (計数統計)。**比率値 (ctr/avgPosition/engagementRate/滞在) は標本不足で
        //                        ノイズが支配するため保存禁止** (比率統計)。PR-3 で GSC 0/22 measured
        //                        となり merge/retire が構造的に不可能化した問題への、閾値を下げずに
        //                        カウント/比率を区別する是正
        //   - "insufficient-data": 集計自体が未実施・取得不能 (数値を持たない)
        //   - "not-instrumented":  計装が存在しない (数値を持たない)
        "gsc": { "status": "measured",
                 "windowDays": 56, "weeks": ["2026-W24", "2026-W28"],
                 "clicks": 120, "impressions": 4300,   // measured-low はここまで (カウント値)
                 "ctr": 0.028,             // 合算 clicks / 合算 impressions (measured のみ)
                 "avgPosition": 12.4 },    // impressions 加重平均 (measured のみ)
        "ga4": { "status": "measured", "windowDays": 56, "weeks": ["2026-W24", "2026-W28"],
                 "pageViews": 800,                     // 2 窓合算 (加算可能・measured-low もここまで)
                 "activeUsersLast28d": 500,            // ユーザー数は週横断加算不能 → 最新窓のみ (measured のみ)
                 "engagementRatePvWeighted": 0.61,     // pageViews 加重平均 (近似・名前で明示・measured のみ)
                 "avgSessionDurationSecPvWeighted": 74 },
        "internalNav": { "status": "not-instrumented" }  // theme→ranking/blog 遷移・指標クリック。GA4 未計装 (25_テーマポートフォリオ運用 §1.3)
      },
      "contentCoverage": { "relatedArticles": 4 },   // 関連記事数 (未集計は null)
      "dataQuality": {                    // R2 app/ranking/<key>/values.json の実測 (aggregate-theme-metrics.ts)
        "keysChecked": 10, "missingKeys": 0,
        "missingKeyList": [],             // 404/空だった rankingKey (先頭 10 件)
        "latestYearPrefCoverageMin": 47   // 最新年の都道府県カバレッジ最小値 (prefecture 行が無い指標は対象外)
      },
      "dataQualityStatus": "ok",         // "ok" | "stale-data" (latestDataYear が 5 年超前) | "gaps" (values.json 欠測あり) | "unknown"
      "currentHypothesis": "支え手比率の主問化で滞在が伸びる", // 無ければ null
      "nextReviewAt": "2026-10-01",
      "evidenceRefs": [                   // レビュー文書・実測・実験 ID への参照
        ".claude/skills/theme/manage-theme-portfolio/reference/reviews/2026-07-11-theme-aging-society.md"
      ]
    }
  ]
}
```

### lifecycleStatus enum

`keep` / `improve` / `merge-candidate` / `split-candidate` / `rename-candidate` /
`retire-candidate` / `insufficient-data`

### 判定規律 (validator が enforce・根拠なし判定の禁止)

1. `merge-candidate` / `split-candidate` / `rename-candidate` / `retire-candidate` は
   **`evidenceRefs` ≥ 2 が必須** (レビュー文書 + 実測 or 実験)。
2. `merge-candidate` / `retire-candidate` はさらに **GSC と GA4 の両方が「集計済み」
   (`status` ∈ {measured, measured-low}) かつ `windowDays ≥ 56` が必須** —
   「データ不足」(insufficient-data = 未集計/取得不能) を「需要不足」と混同して廃止判定する
   ことを機械的に禁止する。需要不足の証拠は **measured-low のカウント値** (56d 窓での低
   clicks/impressions/pageViews) で示す。
   > 2026-07-13 改訂の根拠: 旧規律は `gsc.status === "measured"` (imp ≥ 200) を要求したが、
   > PR-3 実測で全 22 テーマが imp < 200/56d と判明し、merge/retire が構造的に不可能だった。
   > カウント統計 (量) は低値そのものが証拠になる一方、比率統計 (CTR/順位/engagement) は
   > 標本不足でノイズが支配する — この区別を measured-low として機械化し、**閾値は下げない**。
3. 最低標本数 (これ未満は `measured-low` = 比率値の保存禁止): GSC impressions **200/観測期間**・
   GA4 pageViews **100/観測期間** (初期値。改訂は本 README を更新)。
4. 観測期間の使い分け: 7 日 = 異常検知のみ (判定に使わない) / 28 日 = 暫定判定 / **56 日 = 基本判定**。
5. 季節性・検索順位変動・サイト全体変動が疑われる場合は experiments.json の `notes` に注記必須。

## experiments.json

```jsonc
{
  "schemaVersion": 1,
  "experiments": [
    {
      "experimentId": "THEME-EXP-001",   // 必須・一意
      "themeKey": "aging-society",
      "hypothesis": "primary を老年化指数に変更すると CTR が改善する",
      "changeType": "catalog-metrics",   // "catalog-metrics" | "catalog-charts" | "copy" | "structure" | "merge" | "split" | "rename" | "retire"
      "baselinePeriod": { "from": "2026-05-18", "to": "2026-07-12" },
      "startedAt": "2026-07-13",
      "evaluateAt": { "d7": "2026-07-20", "d28": "2026-08-10", "d56": "2026-09-07" },
      "primaryKpi": "gsc.clicks",
      "guardrailKpis": ["gsc.avgPosition", "ga4.engagementRate"],
      "baseline": { "gsc.clicks": 120, "gsc.avgPosition": 12.4, "ga4.engagementRate": 0.61 },
      "result": null,                     // 判定時に {d7:{...}, d28:{...}, d56:{...}} を記録
      "verdict": "pending",               // "pending" | "effect-full" | "effect-partial" | "effect-none" | "effect-adverse" | "insufficient-data" | "aborted"
      "notes": null,                      // 季節性・順位変動・サイト全体変動の注記
      "evidenceRefs": []
    }
  ]
}
```

### 実験規律 (validator が enforce)

1. `experimentId` は一意。
2. **同一 `themeKey` × `changeType` で verdict が `pending` の実験は 1 件まで** (重複実験の防止)。
3. `verdict` の確定は d7 では不可 (d7 は異常検知のみ)。d28 = 暫定 / d56 = 基本判定。
4. `baseline` の無い実験は登録不可 (効果測定不能な実験を作らない)。
5. verdict 確定時は `result` と `evidenceRefs` (実測 snapshot への参照) が必須。
6. effect/* の**バックログ status への反映は improvement-triage に依頼する** (本 state は判定材料と
   実験履歴の台帳であり、`.claude/todo/04_改善バックログ.md` へは書かない)。

## 禁止事項

| NG | OK |
|---|---|
| portfolio/experiments を手編集 | build スクリプト経由で再生成・更新 |
| ThemeCatalog に GSC/GA4 等の変動値を書く | 変動値は本 state のみ。カタログは定義のみ |
| 推測値・代替値を measured として保存 | 取れない値は insufficient-data / not-instrumented |
| 根拠 (evidenceRefs/56日測定) なしの merge/retire | validator が error で弾く |
| `.claude/todo/04_改善バックログ.md` へ直接書く | improvement-triage へ引き渡す |
