---
name: manage-affiliate-experiment
description: アフィリエイト クリエイティブ A/B 実験のライフサイクル管理 (plan/start/observe/decide/close)。実験 registry (.Codex/state/ads/experiments.json) と SSOT の variant エントリを整合させ、判定は決定的スクリプトに委ねる。Use when user says "アフィリエイトABテスト", "クリエイティブ実験", "variant 実験", "実験を開始/判定/終了".
primary_agent: affiliate-manager
co_agents: [improvement-triage, ga4-analyst]
---

アフィリエイト広告の **クリエイティブ A/B 実験を registry ベースで運用**する。
配分・計測の技術仕様は `reference/creative-ab-testing.md` (AFF-05 framework、実装済) を参照。

- **実験 registry (SSOT)**: `.Codex/state/ads/experiments.json` — 書込はこの skill のみ
- **variant 実体**: 下記 2 種類 (`kind` で区別する)

### 実験の 2 種類 (★2026-08-04 に `kind: "code"` を新設)

| kind | variant の実体 | 配分 | 決着のしかた |
|---|---|---|---|
| `creative` (従来) | `affiliate-ads-data.ts` の `experimentId`/`variantId`/`weight` | client 加重ランダム + sticky | SSOT の weight 引き上げ / 敗者 `isActive:false` |
| **`code`** (新設) | **コード側の分岐** (どの広告を出すかでなく**どう出すか**) | **決定的ハッシュ** (例 slug) | **コード変更 PR**。weight を触っても変わらない |

`code` 実験は「本文にテキストを出すか 300x250 を出すか」のように**配置・フォーマットを比べる**もので、
広告エントリの差し替えでは表現できない。registry には**必ず登録する** — 登録しないと
`build-affiliate-operations-state.ts` の集約に現れず、稼働中の実験が誰にも見えなくなる
(実際 `blog-inbody-format` は 2026-08-04 の稼働開始時に未登録だった)。

`code` 実験で **weight の変更・`isActive:false` による敗者停止はできない**。close は
「勝ったフォーマットに寄せるコード変更 PR」で行い、registry には結果だけ記録する。
- **判定 (決定的)**: `build-affiliate-operations-state.ts` が invalid / collecting / ready-to-decide /
  inconclusive / closed を評価 (`lib/affiliate-operations-core.mjs`)。**モデルは期限計算・sample 到達判定をしない**
- **禁止**: 勝者の自動反映。effect/* 付与 (improvement-triage の排他領域)。develop push / R2 publish の自動実行

## モード

`/manage-affiliate-experiment [plan|start|observe|decide|close]`

### plan — 実験を設計する (registry 追加はまだしない)

1. 対象枠 (locationCode) と vertical を決め、`.Codex/state/ads/affiliate-operations-latest.json` の
   `measurementGate` が `ready` で `ga4Snapshot` に variant dimension があることを確認
   (blocked のまま実験を始めない)。
2. **停止条件を事前固定**する: `minSamplePerVariant` (既定 1,000 imp) / `minDurationDays` (既定 28) /
   `maxDurationDays` (既定 84) / `primaryMetric` (ctr) / 採用基準 (次点比 +20% かつ 95% 有意)。
3. variant は 2〜3 個に絞る (4 個以上は必要サンプルが急増)。

### start — 実験を開始する

1. `apps/web/scripts/affiliate-ads-data.ts` に同一 `experimentId`・別 `variantId` のエントリを 2〜3 件
   追加 (`/register-affiliate-banner` の Step 4 と同じ形式 + experiment フィールド)。
2. `.Codex/state/ads/experiments.json` の `experiments[]` に registry エントリを追加:
   ```json
   {
     "experimentId": "ranking-sidebar-economy",
     "targetLocation": "sidebar-bottom",
     "variantIds": ["300x250-A", "text-cta-benefit"],
     "startedAt": "YYYY-MM-DD",
     "minSamplePerVariant": 1000,
     "minDurationDays": 28,
     "maxDurationDays": 84,
     "primaryMetric": "ctr",
     "decisionRule": "勝者 CTR が次点比 +20% かつ 95% 有意 (2標本比率 z 検定)",
     "status": "active",
     "winnerVariantId": null
   }
   ```
3. 検証: `npx tsx .Codex/scripts/ads/build-affiliate-operations-state.ts` で `experiments.invalid` が
   空であること (variant 重複 / weight 不正 / 対象枠不一致 / registry-SSOT 不整合を決定的に検出)。
4. 反映はユーザー確認の上 develop push (`publish-affiliate-ads.yml` が R2 反映)。

### observe — 進行状況を確認する

`affiliate-operations-latest.json` の `experiments` を読む (週次 CI が自動更新)。手動更新は
`node .Codex/scripts/ads/fetch-affiliate-ga4.cjs 28` (要 GA4 鍵) → `build-affiliate-operations-state.ts`。

### decide — ready-to-decide の実験を人間に提示する

1. `experiments.readyToDecide` の variant 別 imp / click / CTR を表で提示。
2. 採用基準 (decisionRule) との照合結果を添えて **ユーザーに判断を仰ぐ** (自動採用しない)。
3. 効果の記録は `.Codex/rules/evidence-based-judgment.md` のテンプレで
   `reference/improvement-log.md` (affiliate-improvement) に書き、status 更新は improvement-triage へ。

### close — 実験を終了する

1. ユーザー決定に従い実体を変更する。**kind で手段が違う**:
   - `creative`: SSOT (`affiliate-ads-data.ts`) の weight 引き上げ / 敗者 `isActive: false`
   - `code`: **勝ったフォーマットに寄せるコード変更 PR** (割当関数を撤去するか片方に固定する)。
     weight も `isActive` も効かないので、SSOT をいじろうとしないこと
2. registry の該当エントリを `"status": "closed"`, `"winnerVariantId": "<id>"`, `"closedAt": "YYYY-MM-DD"` に更新。
3. `build-affiliate-operations-state.ts` 再実行で `experiments.closed` に移ることを確認。

## 関連ファイル

| ファイル | 役割 |
|---|---|
| `reference/creative-ab-testing.md` | 配分方式 (client 加重ランダム + sticky)・GA4 計測・停止ルールの現行仕様 |
| `.Codex/state/ads/experiments.json` | 実験 registry (SSOT) |
| `.Codex/scripts/ads/build-affiliate-operations-state.ts` | 決定的判定 + 集約 state 生成 |
| `.Codex/scripts/ads/lib/affiliate-operations-core.mjs` | 判定コア (純粋関数・`node --test` 対象) |
| `.Codex/scripts/ads/__tests__/affiliate-operations-core.test.mjs` | 判定コアの fixture テスト (gate/実験 status/state validate) |
| `apps/web/scripts/affiliate-ads-data.ts` | variant 実体 (experimentId/variantId/weight) |
| `apps/web/src/features/ads/components/VariantAdSlot.tsx` | 出し分け実装 (client 加重ランダム + sticky) |
