# .claude/state/surveys/ — survey ポートフォリオ state (schema 正典)

`survey-curator` agent が管理する **survey 別評価・改善実験台帳の決定的 JSON**。
調査マスタの SSOT は `packages/ranking/src/data/surveys.json`、紐付けは
`.claude/rules/survey-linkage-standards.md`、編集本文は
`apps/web/src/features/survey/survey-editorial.ts` であり、
**ここには変動値 (GSC/GA4/在庫/評価) だけを置く。surveys.json / survey-editorial.ts に計測値を書かない**。

- **書き込み口**: `survey-curator` が **builder スクリプト経由**で行う。手編集しない。
  - 機械項目の再導出 (upsert): `npx tsx .claude/scripts/surveys/build-survey-portfolio.ts`
  - 意味項目 (lifecycle/editorial/hypothesis/evidence) の更新: 同スクリプト
    `--set <surveyId> --lifecycle ... --editorial ... --add-evidence ...`
- **再構築可能**: surveys.json (git) + 紐付け監査 (`audit-survey-linkage.ts --json`) + R2
  `app/survey/all.json` (公開 URL・GET のみ) + survey-editorial.ts + 計測 snapshot
  (`.claude/skills/analytics/{gsc,ga4}-improvement/reference/snapshots/`) + レビュー文書
  (`.claude/skills/survey/manage-survey-portfolio/reference/reviews/YYYY-MM-DD-survey-<surveyId>.md`)
  から常に再導出できる派生物 (theme portfolio / blog remediation-queue と同思想)。
- **検証**: `npx tsx .claude/scripts/surveys/validate-survey-portfolio.ts` (決定的 lint。schema +
  下記の判定規律 + survey-editorial.ts との drift を enforce。CI 配線は PR-4)。
- 運用設計の正典: `.claude/skills/survey/manage-survey-portfolio/reference/surveyポートフォリオ運用.md`。

## portfolio.json

```jsonc
{
  "schemaVersion": 1,
  "generatedAt": "2026-07-13",             // 生成日 (YYYY-MM-DD)
  "linkage": {                              // グローバル紐付けサマリ (audit-survey-linkage --json の転記)
    "auditedAt": "2026-07-13",              // 未分類 (unresolved) は survey に帰属できないため
    "metrics": 2235,                        // per-survey ではなくここが正
    "resolved": 1984,
    "unresolved": 251,
    "coveragePct": 88.8,
    "unresolvedByReason": { "estat-uncovered": 56, "ssds-synthetic-only": 134, "external": 61 },
    "uncoveredStatsDataIds": 50,
    "orphanSurveys": 0,
    "badOverrides": 0
  },
  "surveys": [
    {
      "surveyId": "census",                 // 必須・一意。surveys.json の id と双方向一致
      "name": "国勢調査",                   // surveys.json から転記 (drift 検知用)
      "organization": "総務省統計局",
      "lifecycleStatus": "improve",         // 下記 enum (意味項目)
      "linkageStatus": "ok",                // "ok" | "r2-drift" (active があるのに R2 不在 = 真の stale) |
                                            // "inactive-only" (在庫全て未公開 = R2 不在は正常・公開判断は publisher) |
                                            // "orphan" | "unknown" (R2 未取得)
      "editorialStatus": "measuring",       // 下記 enum (意味項目。ただし exists との整合を validator が検査)
      "itemCount": 312,                     // 監査 perSurvey = git 導出の総数 (inactive 含む「登録済み在庫」)
      "activeItemCount": 300,               // 監査 perSurveyActive = git 導出 × isActive (= 配信されるべき数)
      "liveItemCount": 300,                 // R2 app/survey/all.json の itemCount (本番配信中)。
                                            // ※ live は非 prefecture areaType (市区町村等) も含むため
                                            //   activeItemCount (prefecture のみ) より大きくなり得る (件数比較は目安)
      "latestDataYear": null,               // R2 values 実測から。集計 script では埋めない (survey→items→values の多段 fetch が重い) — editorial 候補の個別事前監査で記入。未確認は null
      "unresolvedItemCount": null,          // 原則 null (未分類は survey 帰属不能 → linkage が正)。個別調査で確定した場合のみ数値
      "orphanStatus": false,                // itemCount === 0
      "editorialContentExists": true,       // survey-editorial.ts から決定的に導出
      "readerQuestionCount": 5,             // 同上 (editorial なしは null)
      "relatedArticleCount": null,          // 同上。relatedArticleSlugs フィールドは未実装 (2026-07-13) のため当面 null
      "gscSnapshotRef": null,               // PR-3 で集計に使った snapshot パス
      "ga4SnapshotRef": null,
      "metrics": {                          // 実測の集計コピー。取れない値は status で明示し推測値を入れない
        // ★集計の基礎: GSC/GA4 の週次 snapshot は各週 last-28d 窓のため、期間重複する複数 snapshot を
        //   合算しない。56d = 非重複 2 窓 (最新週 + 4 週前) の合算。weeks に使用した窓を記録する。
        // ★status の 4 値 (theme portfolio と同一の統計的根拠):
        //   - "measured":          集計済みで最低標本数以上。カウント値も比率値も解釈可
        //   - "measured-low":      集計済みだが最低標本数未満。カウント値 (impressions/clicks/
        //                          landingPageViews) のみ保存・解釈可。比率値 (ctr/averagePosition/
        //                          engagedSessions 率系) は標本不足でノイズ支配のため保存禁止
        //   - "insufficient-data": 集計自体が未実施・取得不能 (数値を持たない)
        //   - "not-instrumented":  計装が存在しない (数値を持たない)
        "gsc": { "status": "measured", "windowDays": 56, "weeks": ["2026-W24", "2026-W28"],
                 "impressions": 460, "clicks": 2,        // measured-low はここまで (カウント値)
                 "ctr": 0.004,                            // 合算 clicks / 合算 impressions (measured のみ)
                 "averagePosition": 12.4 },               // impressions 加重平均 (measured のみ)
        "ga4": { "status": "measured-low", "windowDays": 56, "weeks": ["2026-W24", "2026-W28"],
                 "landingPageViews": 42 },                // screenPageViews 合算 (加算可能)
                 // "engagedSessions": GA4 週次 snapshot に非搭載 (engagementRate のみ)。
                 // measured 時に engagementRatePvWeighted として代替保存する (PR-3 で確定)
        "internalNav": { "status": "not-instrumented" }   // survey→ranking 遷移 (rankingOutboundClicks)。GA4 未計装
      },
      "currentHypothesis": "調査固有の編集ハブで指名系 query の CTR が改善する", // 無ければ null
      "evidenceRefs": [                     // レビュー文書・実測・実験 ID への参照
        ".claude/skills/survey/manage-survey-portfolio/reference/reviews/2026-07-11-survey-census.md"
      ],
      "lastReviewedAt": "2026-07-11",       // reviews/ の該当文書 date (無ければ null)
      "nextReviewAt": "2026-10-01"
    }
  ]
}
```

### lifecycleStatus enum

`keep` (現状維持で良い) / `observe` (需要観測中・既定) / `improve` (改善作業中) /
`editorial-candidate` (編集ハブ化候補・根拠付き) / `linkage-fix-required` (紐付け是正が先) /
`merge-candidate` / `retire-candidate` / `insufficient-data`

### editorialStatus enum

`fallback` (編集情報なし・既定 UI) / `candidate` (ハブ化候補・監査未了) / `audit-ready`
(事前監査完了・実装可) / `implemented` (survey-editorial.ts 実装済) / `measuring` (本番反映済・効果測定中) /
`validated` (効果確認済) / `rejected` (監査の結果ハブ化しない)

- **整合規律**: `editorialContentExists: true` ⇔ editorialStatus ∈ {implemented, measuring, validated}。
  false ⇔ {fallback, candidate, audit-ready, rejected}。違反 = survey-editorial.ts との drift として
  validator が error にする。

### 判定規律 (validator が enforce・根拠なし判定の禁止)

1. `merge-candidate` / `retire-candidate` は **`evidenceRefs` ≥ 2 が必須** (レビュー文書 + 実測)。
2. さらに **GSC と GA4 の両方が「集計済み」(`status` ∈ {measured, measured-low}) かつ
   `windowDays ≥ 56` が必須** — データ不足 (未集計) を需要不足と混同した廃止判定の機械的禁止。
3. 最低標本数 (これ未満は `measured-low` = 比率値の保存禁止): GSC impressions **100/観測期間**・
   GA4 landingPageViews **100/観測期間**。**impressions 100 未満で CTR 効果を確定しない**。
4. 観測期間の使い分け: 7 日 = インデックス/canonical/404/計測異常の検知のみ (効果判定に使わない) /
   28 日 = 暫定判定 / **56 日 = 基本判定**。
5. 期間の重複する複数 snapshot (各週 last-28d 窓) を合算しない。query 非開示分を推測で補完しない。
6. 季節性・サイト全体変動が疑われる場合は experiments.json の `notes` に注記必須。

## experiments.json

```jsonc
{
  "schemaVersion": 1,
  "experiments": [
    {
      "experimentId": "SURVEY-EXP-001",    // 必須・一意
      "surveyId": "census",                // surveys.json に実在すること
      "hypothesis": "調査固有の編集ハブ化で impressions と CTR が改善する",
      "changeType": "editorial-hub",       // "editorial-hub" | "linkage" | "title-meta" | "structure" | "merge" | "retire"
      "baselinePeriod": { "from": "2026-06-12", "to": "2026-07-09" },
      "startedAt": "2026-07-12",           // 本番反映日 (デプロイ実測)
      "evaluateAt7d": "2026-07-19",        // 異常検知のみ (インデックス/canonical/404/計測異常)
      "evaluateAt28d": "2026-08-09",       // 暫定判定
      "evaluateAt56d": "2026-09-06",       // 基本判定
      "primaryKpi": "gsc.impressions",
      "guardrailKpis": ["gsc.averagePosition", "gsc.ctr"],
      "baseline": { "gsc.impressions": 23, "gsc.clicks": 0, "gsc.ctr": 0, "gsc.averagePosition": 25.43 },
      "observations": { "d7": null, "d28": null, "d56": null },  // 期日到達時に evaluate-survey-experiments.mjs --check が
                                           // {observedAt, window (56d 2窓), values: {"<kpi>": {value,status}}} を記録 (手書きしない)
      "verdict": "pending",                // "pending" | "effect-full" | "effect-partial" | "effect-none" | "effect-adverse" | "insufficient-data" | "aborted"
      "notes": null,                       // 季節性・順位変動・サイト全体変動の注記
      "evidenceRefs": [],
      "implementationRef": "apps/web/src/features/survey/survey-editorial.ts"  // 実装の所在 (PR/commit/ファイル)
    }
  ]
}
```

### 実験規律 (validator が enforce)

1. `experimentId` は一意。`surveyId` は surveys.json に実在。
2. **同一 `surveyId` × `changeType` で verdict が `pending` の実験は 1 件まで** (重複実験の防止)。
3. `verdict` の確定は d7 では不可 (d7 は異常検知のみ)。effect/* 確定には `observations` の d28 または
   d56 が必須。d28 = 暫定 / d56 = 基本判定。
4. `baseline` の無い実験は登録不可 (効果測定不能な実験を作らない)。
5. **primaryKpi が CTR の場合、判定に使う観測 (d56 優先) の gsc.impressions ≥ 100 が無いと
   effect/* を確定できない** (insufficient-data とする)。sessions・内部遷移が僅少の場合も同様。
6. verdict 確定時は `observations` と `evidenceRefs` (実測 snapshot への参照) が必須。
7. effect/* の**バックログ status への反映は improvement-triage に依頼する** (本 state は判定材料と
   実験履歴の台帳であり、`.claude/todo/improvements.md` へは書かない)。

## 禁止事項

| NG | OK |
|---|---|
| portfolio/experiments を手編集 | builder スクリプト経由で再生成・更新 |
| surveys.json / survey-editorial.ts に GSC/GA4 等の変動値を書く | 変動値は本 state のみ |
| 推測値・代替値を measured として保存 | 取れない値は insufficient-data / not-instrumented |
| 根拠 (evidenceRefs/56日測定) なしの merge/retire | validator が error で弾く |
| 期間重複 snapshot の合算・非開示 query の推測補完 | 非重複窓のみ合算・開示分のみ記録 |
| `.claude/todo/improvements.md` へ直接書く | improvement-triage へ引き渡す |
| 紐付けの別ロジックで itemCount を数える | audit-survey-linkage の実測値を転記 |
| 未公開 (inactive-only) を stale (r2-drift) と混同して sync/公開を要求 | active/total の区別で判定 (2026-07-14 教訓)。焼き込みの実測突合は `audit-survey-linkage.ts --compare-r2` |
