---
name: operate-geo-content
description: >
  GeoAI地域分析のXコンテンツを、空間分析契約・Geo専用画像・出典SHA・投稿台帳まで一貫管理する。
  都道府県ランキングやテーマ投稿との混在を防ぎ、管理画面には監査結果だけを表示する。
  Use when user says "GeoAI投稿", "Geo X", "空間分析投稿", "人口×地価", "人口×洪水", "人口×駅".
primary_agent: x-strategist
co_agents: [geo-analysis-curator, gis-curator, sns-renderer]
argument-hint: "[--key geo-001-x-NN] [--publish]"
---

# operate-geo-content

Geoコンテンツの正典入口。GeoAIの価値は「都道府県値の順位」ではなく、
**2層以上の地理データを決定的な空間演算で重ね、地域の意思決定に変換すること**に置く。
AIは問いと説明だけを担い、集計・空間交差・距離判定・順位を計算しない。

## Geoと他ドメインの境界

| domain | reader value | required visual | 禁止 |
|---|---|---|---|
| ranking | 1指標の47都道府県順位 | ranking-card | Geoを名乗ること |
| theme | 複数指標の概況ダッシュボード | theme chart | 未実施の空間演算を示唆 |
| buzz-map | 地図で分布を直感把握 | BuzzMap spec | 意思決定分析と自動同一視 |
| geo | 地理レイヤーの重なりから判断 | GeoX-InsightCard | ranking-card流用・順位だけの結論 |

baseline投稿は分析の入口として15件中3件まで許可する。Geoの主役は
`cross-analysis=9`、説明責任は`method=2`、意思決定への統合は`decision=1`に固定する。

## 実行フロー

1. `x-strategist` が `packages/data-configs/src/business-plan/m1.ts` の問い・投稿文・役割を管理する。
2. `gis-curator` が各入力データのgeometry、公式出典、版、利用可否を確認する。
3. `geo-analysis-curator` が`sourceLayers`の計算入力/補助境界、stage、canonical着地を確認する。
4. `/build-geo-analysis`で数値・空間演算を決定的コードから県別artifactとmanifestへ派生し、保存則を監査する。
5. 以下の静的ゲートとキュー生成を実行する。

   ```bash
   npm run business-plan:check
   npm run business-plan:export-m1-x
   node .claude/skills/sns/post-x-batch/scripts/lint-x-captions.cjs \
     --in .local/r2/sns/_queue/business-plan-m1-x.json
   ```

6. `sns-renderer` がGeo専用compositionだけで画像を生成し、画像・観測値SHAを記録する。

   ```bash
   npm run business-plan:render-m1-x-geo
   npm run business-plan:audit-m1-x-geo
   ```

7. 目視で地図が主役、文字が読める、レイヤーと演算が一致することを確認する。
8. 既存draftだけを同期する。scheduled/postedは上書きしない。

   ```bash
   node .claude/skills/sns/post-x-batch/scripts/register-drafts.cjs \
     --in .local/r2/sns/_queue/business-plan-m1-x.json --sync-draft
   ```

9. 管理画面 `npm run admin` → `/strategy` と `/content/x` は監査・閲覧だけに使う。
   予約、即時投稿、dry-run、caption編集、レンダ、R2 pushを管理画面から実行しない。
10. 外部X投稿はユーザーが明示した場合だけ、`x-strategist` が `/publish-x` に委譲する。
   `/publish-x` 自身の安全dry-run契約は維持し、管理画面には露出しない。

## 機械Gate

- queueは15件・一意content key・`baseline/cross/method/decision = 3/9/2/1`。
- cross-analysisは分析1件、レイヤー2層以上、prefecture以外のgeometryを1つ以上含む。
- `claimMetricKey`は分析のmetricKeysに存在し、47都道府県coverageを満たす。
- canonical landingは単独分析=`/geo/<slug>/<NN>/population|overlap|audit`、方法横断=`/geo/method`、意思決定横断=`/geo/compare`。X投稿を一覧ハブ`/geo`へ直接着地させない。
- 単独分析はlineage manifest、県別artifact 47/47、保存則47/47がPASSするまでdraftを生成しない。
- imageKind=`geo-insight-card`、composition=`GeoX-InsightCard`、出力=`sns/geo/**`。
- PNGは1080×1350。画像と`source.json`は1対1で、画像SHA・観測値SHAが一致する。
- 洪水0値を「安全」と断定しない。coverage・免責・代表点法を表示する。
- 一般の`/post-x-batch`候補選定、ranking-card、theme chartへGeo投稿を混ぜない。
- 管理画面のAPI routeはGETだけ。POST/PATCH/PUT/DELETE、子プロセス起動を禁止する。

## 書き込み境界

- authored: `packages/data-configs/src/business-plan/m1.ts`
- derived queue: `.local/r2/sns/_queue/business-plan-m1-x.json`
- derived analysis: `.local/r2/app/geo/**`
- derived media: `.local/r2/sns/geo/**`
- draft ledger: `.claude/state/sns/posts.json`（store/agent経由のみ）
- admin: read-only。SSOT・queue・台帳・R2へ書き込まない。

## Output Contract

`Post/Analysis | Geo role | Layers/operation | Mechanical gate | Visual gate | Ledger | Next action`
の表で返す。未レンダ、未目視、未R2、未投稿を完了扱いしない。
