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
        "internalNav": { "status": "insufficient-data" }  // 国内の theme_* nav_click を実日付付きで集計。未取得を0件にしない
      },
      "contentCoverage": { "relatedArticles": 4 },   // 関連記事数 (未集計は null)
      "dataQuality": {                    // R2 app/ranking/<key>/values.json の実測 (aggregate-theme-metrics.ts)
        "keysChecked": 10, "missingKeys": 0,
        "missingKeyList": [],             // 404/空だった rankingKey (先頭 10 件)
        "latestYearPrefCoverageMin": 47   // 最新年の都道府県カバレッジ最小値 (prefecture 行が無い指標は対象外)
      },
      "dataQualityStatus": "ok",         // "ok" | "gaps" (値の欠測・品質errorあり) | "unknown"。経過年数だけで更新遅延を確定しない
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
      "changeType": "catalog-metrics",   // "catalog-metrics" | "catalog-charts" | "copy" | "structure" | "merge" | "split" | "rename" | "retire" | "launch"
      "baselinePeriod": { "from": "2026-05-18", "to": "2026-07-12" },
      "startedAt": "2026-07-13",
      "evaluateAt": { "d7": "2026-07-20", "d28": "2026-08-10", "d56": "2026-09-07" },
      "primaryKpi": "gsc.clicks",
      "guardrailKpis": ["gsc.avgPosition", "ga4.engagementRate"],
      "baseline": { "gsc.clicks": 120, "gsc.avgPosition": 12.4, "ga4.engagementRate": 0.61 },
      "result": null,                     // 判定時に {d7:{...}, d28:{...}, d56:{...}} を記録
      "verdict": "pending",               // "pending" | "effect-full" | "effect-partial" | "effect-none" | "effect-adverse" | "insufficient-data" | "aborted" | "launch-reviewed"
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
4. 改善実験は `baseline` 必須。新規URLの `changeType=launch` は下記の初回公開観測契約を使い、公開前baselineを0で代用しない。
5. verdict 確定時は `result` と `evidenceRefs` (実測 snapshot への参照) が必須。
6. effect/* の**バックログ status への反映は improvement-triage に依頼する** (本 state は判定材料と
   実験履歴の台帳であり、`.claude/todo/improvements.md` へは書かない)。

### 新規URLの初回公開観測（launch）

新規URLは公開前トラフィックが存在しないため、`baseline=null` と
`baselineStatus=not-applicable-new-url` を明記する。`baselinePeriod` はnull、
`baselineScopes` / `baselineStatuses` は未設定または空にする。
`--register` は書込み前にschema・重複を検査し、`startedAt/evaluateAt/result=null`、
`verdict=pending` だけを受け付ける。既存テーマ改善のbaseline要件は維持する。

```bash
node .claude/scripts/themes/evaluate-theme-experiments.mjs --register '{"experimentId":"THEME-LAUNCH-20260909-construction-industry","themeKey":"construction-industry","changeType":"launch","hypothesis":"公開後の国内閲覧と検索露出を観測し、構成の継続・改善を判断する","primaryKpi":"ga4.pageViews","guardrailKpis":["gsc.impressions","internalNav.eventCount"],"baseline":null,"baselineStatus":"not-applicable-new-url","evidenceRefs":[".claude/state/estat/theme-expansion-verification.json"]}'
# 実際の公開と本番HTTP/表示確認が済んだ日だけ指定する（下記は日付書式の例）。
node .claude/scripts/themes/evaluate-theme-experiments.mjs --schedule THEME-LAUNCH-20260909-construction-industry YYYY-MM-DD
```

未来日のscheduleと設定済み公開日の変更は拒否する。同日scheduleは何も変えない。
ローカル検証やPR作成日は公開日ではない。公開のやり直しは既存観測を動かさず別実験にする。

- d7は品質の実測のみ。品質が未取得ならunknownとして記録し、正常と補完しない。
- `portfolio.metrics` は従来の非重複56日窓、`metrics28d` は成功メタ付き最新の単独28日窓。
  d28は後者を読み、公開後だけの完全窓で `launch-provisional` を記録する。未取得・行欠落は
  `insufficient-data`。両フィールドとも同じ国条件・低標本・欠測規律を適用する。
- d56の完全窓は `launch-observed`。低標本の実カウントは保持し、比率や効果を推定しない。
  欠測・低標本・guardrail不足は `reasons/constraints` に残す。
- launchは `effect-*` を確定しない。d56後に
  `--launch-review <id> continue|improve|hold --evidence <ref> --note '<判断理由と次の検証>'`
  で継続・改善・保留の材料と判断を `result.launchReview` へ保存し、`verdict=launch-reviewed`
  とする。continueには適合する56日窓が必要。窓不足なら計測修復のimproveまたはholdを記録する。
- 初回公開の有効な56日窓は、主KPIがmeasuredなら `result.baselineCandidate` として保存する。
  同じ期間・国条件で適合するKPIだけを含め、元実験・観測日を参照する。これは**次の改善**の
  baseline候補であり、launch自身のbaselineを置換しない。次の改善は別IDで登録し、変更公開前の
  56日窓・scope・statusと照合する。期間不明または変更日以降を含むbaselineではeffectを確定しない。

週次監査の既存 `aggregate-theme-metrics.ts` と `--check` が両窓・期日観測を更新する。
期日は取得開始の目安であり、実際に公開後の窓が揃うまでは再観測を追記する。
改善作業はownerと検証条件付きで既存台帳へ渡し、変更後も新しい実験IDで同じ確認を繰り返す。

## 禁止事項

| NG | OK |
|---|---|
| portfolio/experiments を手編集 | build スクリプト経由で再生成・更新 |
| ThemeCatalog に GSC/GA4 等の変動値を書く | 変動値は本 state のみ。カタログは定義のみ |
| 推測値・代替値を measured として保存 | 取れない値は insufficient-data / not-instrumented |
| 根拠 (evidenceRefs/56日測定) なしの merge/retire | validator が error で弾く |
| `.claude/todo/improvements.md` へ直接書く | improvement-triage へ引き渡す |


## 2026-09-08以降の品質・計測契約

- 母集団は現行ThemeCatalog。気候はcatalog、旧財政市区町村URLはredirectで対象外。
- `quality.json` は章/登録/期間/単位/有限値coverage/重複/履歴退行の観測。前回正常値を
  `lastGoodObservations` に保持し、異常継続中の基準すり替えを防ぐ。全操作・全国系列・GISは別途表示確認。
- GA4はJapan-only `pages-clean.csv` と `.meta.json` のstatus=ok/source/countryFilter/実期間を必須にする。
  2窓の実日付が連続する56日だけを集計。raw pages.csvは効果・統廃合判断に使わない。
- `metrics.ga4.scope=Japan`。`internalNav` はtheme_* nav_clickのJapan-only eventCount。
  未取得窓や欠落行はinsufficient-data、0で補完しない。低標本ではカウントだけを保存する。
- `dataQuality.oldestLatestDataYear/ageReviewKeys` は古い系列を隠さないための補助。
  古さは更新漏れの断定ではなく一次資料確認の入口。海の無い県や秘匿の欠測を0に変えない。
- 週次は同じ異常を再通知せず、新規/変化/復旧を報告。月次は全テーマの公式公表予定と新年を確認する。

### 評価履歴の互換性

保存済みの `result.d7/d28/d56` は維持し、再観測を `result.rechecks.dNN[]` へ追記する。同じ観測内容は日時だけ変わっても重複させない。新しい評価は status / reasons / constraints と KPI ごとの scope / windowDays / periodStart / periodEnd / weeks を保存する。旧 baseline の scope・status が不明な場合は数値を保持したまま効果確定を拒否する。d28 は暫定観測であり、公開後だけを含む 56 日窓・測定可能な主 KPI と baseline が揃った d56 のみ効果を確定できる。

`dataQuality.ageReviewKeys` は最新観測が5年以上前の一次資料確認候補であり、未更新の確定ではない。5年周期の調査を自動で stale-data にしない。`freshnessStatus` は公表済み新年との照合が別工程であることを示す。

定期フォロー: 元PCには2026-09-08登録の「全テーマの品質確認と継続改善」の記録がある。このPCではテーマ監査の設定が見つからなかったため、2026-09-09にCodex heartbeat `automation`「テーマ拡充の検証と継続改善」をこのタスクへ登録した。毎週月曜09:00 JSTに確認し、月初は公式資料・構成も見直す。変化のない既知警告は通知しない。元PCの稼働が確認できた場合は重複を照合する。GitHub週次監査はworkflowの公開後に稼働する。


## 別PCで未公開のテーマ改善を再開する

進捗・既知の未解決問題・公開対象は `../metrics/themes/2026-09-09-implementation.json`、
次の作業は `.claude/todo/backlog.md` の `THEME-PORTFOLIO-REMAINDER-01` を正典とする。
`.local` のステージデータ、元資料、ブラウザHTML、詳細ログはgit対象外。秘密情報も移行されない。
新しいPCでは依存関係を `npm ci` で復元し、そのPCの正規の環境設定を使用する。
Codex heartbeatは元PCのタスクに設定されておりgitでは移行されない。追加登録の前に既存設定を確認する。

### 128候補の初回3テーマ

対象と実装検証は [first-batch記録](../metrics/themes/2026-09-09-first-batch.json)、残工程は
`THEME-EXPANSION-IMPLEMENT-01` を参照する。新規公開の3実験は未公開の間 `startedAt=null` を保つ。
公開後にHTTP、全県値、公開日を記録してから `--schedule` を実行する。

```bash
# 新規3指標の取込は page-data-batch.ts --metric <key> --kind prefecture
# 検証API応答を保持したディレクトリを指定。既存6指標は公開R2から歴史系列も維持する。
node --conditions=react-server --import tsx .claude/scripts/themes/stage-theme-expansion.mjs --api-artifact-dir /tmp/stats47-theme-expansion-api
# 31ファイルのsha256を照合するlocalhostゲートウェイ（GET/HEADのみ、書込み不可）
node .claude/scripts/themes/preview-theme-release.mjs --manifest .local/verification/themes/first-batch/release-manifest.json
# R2_PUBLIC_FETCH_URL=http://127.0.0.1:4778 で本番用buildとlocalhost起動後、PC/mobileを確認
node --import tsx .claude/scripts/themes/probe-theme-expansion.mjs --url http://127.0.0.1:3011
```

ステージを更新したらプレビューゲートウェイも再起動する。既存21テーマの未公開manifestと
併合する際は同じキーの上書きに注意し、特に `app/ranking-items/all.json` を現行定義から再生成する。
観測値・スクリーンショットは `.local/`、件数・hash・検証結果は上記stateへ保存する。

### データの復元

1. `release.manifest.metricKeys` の100指標は、既存の
   `packages/ranking/src/scripts/generate-ranking-items.ts --only <カンマ区切りのキー>` で
   `.local/r2` に再生成する。このCLIは `all.json` も生成するが、今回の公開対象には含めない。
2. `apps/web/scripts/data/page-components/theme/*.json` の21ファイルを
   `.local/r2/app/page-components/theme/` へ同名でコピーする（ThemeCatalogからの生成物）。
3. 公式資料からの3指標は下記CLIで再生成する。e-Stat APP IDは既存の環境設定を使う。
   元資料のhash変更、旧年との不一致は停止して一次資料を確認する。

```bash
python3 -m venv /tmp/stats47-theme-python
/tmp/stats47-theme-python/bin/pip install -r packages/data-configs/scripts/lib/requirements-official-theme-data.txt
OFFICIAL_THEME_PYTHON=/tmp/stats47-theme-python/bin/python node --conditions=react-server --import tsx packages/data-configs/scripts/refresh-official-theme-data.ts --stage-dir .local/r2 --artifact-dir /tmp/stats47-official-theme-data
```

4. ラスパイレス指数の単位是正は、公開R2の `app/stats/laspeyres-index-prefecture/values.json` と
   `app/ranking/laspeyres-index-prefecture/values.json` を読み、statsの行単位とrecipe、rankingの
   partition/行単位をconfigの「指数」に合わせる。数値・県・年・rankは不変、658行を突合する。
   この2ファイル専用の再生成CLIは未整備なので、既存のrecipe/partition生成関数でローカル是正する。
5. 129ファイルのmanifestとrecipe・観測値・47県・期間を再検査する。生成日時によりSHAは変わるため、
   旧manifestのSHAをそのまま再利用せず、新しい検証済みmanifestを作る。公開R2の変更も別途検出する。
   未公開の値を用いた監査結果を、公開品質baseline `quality.json` に上書きしない。

全129ファイルを一度に復元する永続CLIは未整備。特にラスパイレス2件の再生成を補う必要がある。
汎用ranking生成の入力は公開R2を読むため、更新済みstageからranking値を派生するときはgatewayまたは
純粋builder経由を使い、ローカルstageが自動的に読まれると仮定しない。

### 表示エラーの再現

検証済みのローカルデータを使ったproduction build/startで調べる。既存のpreview gatewayのソースは
`../metrics/themes/2026-09-09-hydration.json` の `previewGatewaySource` に保存している。
作業ルートで起動し、gatewayと同じディレクトリに `release.manifest` を `release-manifest.json` として置く。
gatewayは127.0.0.1:4778でmanifest内だけローカル値を読み、他のappキーは公開R2をGETする。
Nextの起動には `R2_PUBLIC_FETCH_URL=http://127.0.0.1:4778` と空の
`R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_S3_ENDPOINT` を明示する。
Turboを経由する場合は `--env-mode=loose` が必要（strictではこのURL overrideが渡らない）。

```bash
node .claude/scripts/themes/probe-theme-hydration.mjs --mobile --scenarios after-real-income
```

Chromeを使い、390×844、ja-JP、pref=28000、同意拒否で実収入を開いた後、同じcontextの新しいページで道路を開く。
出力は `.local/verification/themes/hydration/`。最終検証は42画面中41 PASSで、道路mobileの#418が未解決。
診断JSONの `diagnosticSource` は当時のReact chunk専用の応答計装であり、次のbuildで一致を確認してから
一時mjsへ復元し `--diagnostic <path>` で使う。元の例外を抑止しない。
本文divに対しcursorが内部JSON-LD scriptを指すことまで確認済み。非同期埋め込みsectionの
Suspense境界は次の調査候補であり、原因の確定・修正は未実施。
