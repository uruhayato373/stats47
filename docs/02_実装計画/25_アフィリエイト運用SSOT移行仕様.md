---
type: implementation-spec
date: 2026-07-15
status: implemented
implemented_at: 2026-07-15
tags: [affiliate, agent, skill, ssot, observability]
---

# アフィリエイト運用 SSOT 移行仕様

## 1. ゴール

`docs/40_アフィリエイト管理/` に人手で蓄積された設計・台帳・生成物を棚卸しし、アフィリエイト運用を
`affiliate-manager` と専用 skill が継続的に監査・計測・改善できる構造へ移行する。

成功状態は次のとおり。

1. 人が `docs/40_アフィリエイト管理/` を読まなくても、Claude Code が在庫、直接配置、実験、計測ゲート、改善施策の現在地を取得できる。
2. 同じ事実を README、rule、skill、改善バックログへ重複記載しない。
3. 広告在庫と直接配置は型付き git TS、運用状態は検証可能な `.claude/state/ads/*.json`、手順は skill、規約は rule、詳細履歴は skill reference に分離する。
4. 週次処理は「取得 → 検証 → 状態更新 → 改善候補作成」まで決定的に実行し、効果判定と本番変更は人間の確認を残す。
5. `docs/40_アフィリエイト管理/` は移行完了後に削除し、ダッシュボードは `/tmp` 生成またはローカル UI から都度閲覧する。

## 2. 設計原則

「`.claude` を SSOT にする」の対象は、運用手順、判断規約、機械状態、監査履歴である。配信用の authored data まで
Markdown に移さない。完全 DB レス設計に従い、広告データの正典は引き続き git TS とする。

| 情報 | 正典 | owner |
|---|---|---|
| 自動配置広告在庫 | `apps/web/scripts/affiliate-ads-data.ts` | `affiliate-manager` |
| vertical と分類写像 | `apps/web/src/features/ads/constants/affiliate-category.ts` | `affiliate-manager` |
| 直接属性方式の広告・配置 | 新設する型付き git TS | `affiliate-manager` |
| 規約・不変条件 | `.claude/rules/affiliate-ads-standards.md` | `affiliate-manager` |
| 登録・配置・監査・実験の手順 | `.claude/skills/ads/*/SKILL.md` | `affiliate-manager` |
| 最新の機械観測状態 | `.claude/state/ads/*.json` | scripts / workflows |
| 詳細な改善・実験履歴 | `.claude/skills/analytics/affiliate-improvement/reference/` | `affiliate-manager` |
| 全施策の status / tier / 期日 | `docs/todo/01_改善バックログ.md` | `improvement-triage` |
| 収益戦略 | `docs/02_実装計画/01_収益化マスタープラン.md` | `strategy-advisor` |

## 3. 現状監査

既に次の基盤があるため、新しい万能 agent や並行する改善 skill は作らない。

- `affiliate-manager`: 在庫・vertical・配置・規約の owner。
- `/register-affiliate-banner`: 自動配置広告の提案と登録。
- `/affiliate-improvement`: 在庫監査、GA4 観測、改善記録。
- `audit-affiliate-inventory.ts`: 決定的な在庫監査。
- `fetch-affiliate-ga4.cjs`: `ad_impression` / `affiliate_click` の取得。
- `affiliate-ga4-weekly.yml`: GA4 snapshot の週次更新。
- `affiliate-dashboard-refresh.yml`: 現在は docs 配下へ HTML を commit-back。

解消すべき問題は次のとおり。

- `docs/40/.../README.md` と `affiliate-ads-standards.md` が登録手順、SSOT、計測方法を重複管理している。
- README と skill 内に「education / mobility は在庫ゼロ」という古い状態が固定文として残る一方、改善バックログは全 10 vertical カバー済みとしている。
- 直接属性方式の 2 バナーだけが Markdown frontmatter の台帳で、自動監査の入力外になっている。
- `AFF-03` は実装済み設計、`AFF-05` は framework 実装済み設計であり、現在状態ではなく履歴文書になっている。
- 生成 HTML を git 管理しており、SSOT と派生物の境界が曖昧である。
- 週次 GA4 取得後に、期限到達、計測ゲート、実験停止条件、次施策候補を一つの機械状態として判定していない。

## 4. `docs/40` の移行表

| 現在のファイル | 移行先 | 処理 |
|---|---|---|
| `README.md` | rule / skills / 本仕様 | 重複を解消後に削除 |
| `banners/*.md` frontmatter | 例: `apps/web/scripts/affiliate-direct-placements-data.ts` | 型付き配列へ移行 |
| `banners/*.md` の説明・原 HTML | skill reference の migration archive または git 履歴 | 運用に必要な最小情報だけ TS に保持 |
| `AFF-03-ranking-banner-design.md` | affiliate improvement log の AFF-03 | 実装結果と検証条件を統合後に削除 |
| `AFF-05-creative-ab-testing-design.md` | 新設 `/manage-affiliate-experiment` の reference | 現行仕様だけ抽出し、旧提案部分は git 履歴へ |
| `affiliate-dashboard.html` | `/tmp/stats47-affiliate-dashboard.html` | commit-back を廃止し都度生成 |

移行後、`docs/40_アフィリエイト管理/` 自体を削除する。削除前にリポジトリ全体を `rg` し、リンクと生成先を更新する。

## 5. 最小の責務構成

### 5.1 既存 agent の拡張

新 agent は作らず、`.claude/agents/affiliate-manager.md` をアフィリエイト領域の唯一の orchestrator とする。

追加する責務:

- 自動配置と直接配置を横断した inventory ownership。
- GA4 と ASP 成果データの freshness / coverage gate 管理。
- 実験の開始可否、停止条件到達、勝者候補の提示。
- stale state、孤立配置、PR 表記漏れ、リンク切れの監査。

担当外は維持する。

- status の排他的更新: `improvement-triage`。
- GA4 汎用取得: `ga4-analyst`。
- 収益戦略: `/monetization-strategy`。
- R2 公開と deploy: CI / `r2-publisher` / `devops-runner`。

### 5.2 skills

| skill | 方針 |
|---|---|
| `/register-affiliate-banner` | 自動配置広告と直接配置広告の mode を明示して拡張 |
| `/affiliate-improvement` | `status/audit/observe/action/next` を維持し、最新 state だけを読むよう修正 |
| `/manage-affiliate-experiment` | 新設。実験の `plan/start/observe/decide/close` に限定 |
| `/audit-affiliate-compliance` | 新設。PR 表記、孤立配置、リンク整合、canonical size を決定的に監査 |

`SKILL.md` に変動する在庫数や gap vertical を直書きしない。値は必ず state / audit output から読む。

## 6. 型付き SSOT と状態ファイル

Claude Code は既存型と consumer を読んでから配置先を確定する。以下は論理スキーマであり、既存構造に合うなら
同一ファイルへの統合を優先する。

### 6.1 直接配置 SSOT

```ts
type AffiliateDirectPlacement = {
  id: string;
  asp: "a8" | "moshimo" | "rakuten" | "valuecommerce";
  title: string;
  href: string;
  imageUrl: string;
  trackingPixelUrl: string | null;
  width: number;
  height: number;
  rewardNote: string | null;
  conversionCondition: string | null;
  placements: Array<{
    channel: "blog" | "note";
    slug: string;
    position: string;
  }>;
  addedAt: string;
  isActive: boolean;
};
```

検証では、ID 重複、URL scheme、画像サイズ、配置先 slug の存在、本文内タグとの双方向一致、PR 表記を確認する。

### 6.2 集約状態

`.claude/state/ads/affiliate-operations-latest.json` を生成し、少なくとも次を含める。

```json
{
  "schemaVersion": 1,
  "generatedAt": "ISO-8601",
  "inventorySnapshot": "relative-path",
  "ga4Snapshot": "relative-path-or-null",
  "freshness": { "inventoryDays": 0, "ga4Days": 0 },
  "measurementGate": { "status": "ready|blocked", "reasons": [] },
  "coverage": { "gapVerticals": [], "thinVerticals": [] },
  "directPlacements": { "total": 0, "orphaned": [], "missingDisclosure": [] },
  "experiments": { "active": [], "readyToDecide": [], "invalid": [] },
  "recommendedActions": []
}
```

`recommendedActions` は決定的な条件から生成する。モデルに routing、期限計算、サンプル到達判定をさせない。

## 7. 継続運用ループ

週次 workflow は次の順序にする。

1. 自動配置と直接配置を監査する。
2. dashboard を `/tmp` 用成果物として生成する。
3. GA4 snapshot を取得する。鍵や dimension が無ければ失敗を隠さず measurement gate を blocked にする。
4. 実験の sample、期間、CTR、停止条件を決定的スクリプトで評価する。
5. `affiliate-operations-latest.json` を生成・validate する。
6. 異常がある場合だけ workflow summary に action table を出す。
7. state snapshot だけを commit-back する。HTML は commit しない。

自動化してよいのは観測と候補生成まで。次は自動実行しない。

- ASP への提携申請。
- 広告在庫、priority、variant の変更。
- `effect/*` の付与。
- develop push、R2 publish、本番 deploy。

## 8. 実験運用

`AFF-05` から現行仕様だけを reference に抽出する。実験 state には `experimentId`、対象枠、variants、開始日、
事前固定した最小 sample、最短期間、主要指標、採用基準、status を持たせる。

判定スクリプトは最低限、次を区別する。

- `invalid`: variant 重複、weight 不正、対象枠不一致。
- `collecting`: 最小期間または sample 未到達。
- `ready-to-decide`: 事前停止条件に到達。人間へ結果を提示。
- `inconclusive`: 最大期間到達でも採用条件未達。
- `closed`: 勝者反映とログ記録が完了。

勝者の自動反映は禁止する。`ready-to-decide` は提案であり、効果判定は
`.claude/rules/evidence-based-judgment.md` と `improvement-triage` を通す。

## 9. 実装フェーズ

### Phase A: 棚卸しと schema 固定

- 全参照と現行 consumer を調査する。
- `docs/40` の各事実を移行表へ突合する。
- 直接配置 TS schema、operations state schema、validator のテストを先に作る。

### Phase B: 直接配置と compliance

- 2 件の Markdown 台帳を型付き TS へ移行する。
- 記事 / note との双方向監査と PR 表記監査を実装する。
- `/register-affiliate-banner` と `affiliate-manager` を更新する。

### Phase C: 計測と実験

- GA4 freshness / dimension gate を集約 state に反映する。
- `/manage-affiliate-experiment` と決定的な実験判定スクリプトを作る。
- `AFF-05` の現行仕様を reference へ抽出する。

### Phase D: workflow と docs/40 廃止

- dashboard 出力先を `/tmp` に変更し、HTML commit-back を止める。
- 週次 workflow を operations state 生成まで接続する。
- `AFF-03` の履歴を improvement log に統合する。
- `rg` で参照ゼロを確認して `docs/40_アフィリエイト管理/` を削除する。
- `docs-vs-issues.md`、agents README、自動化インベントリを更新する。

Phase ごとに独立 commit を作れる差分にし、D まで一括で deploy しない。

## 10. 受入条件

- [ ] `docs/40_アフィリエイト管理/` にしか存在しなかった運用上必要な情報が移行済み。
- [ ] `docs/40_アフィリエイト管理/` とその参照がゼロ。
- [ ] 自動配置 41 件と直接配置 2 件を横断監査できる。件数は実装時の実測に合わせ、テストへ固定しない。
- [ ] gap / thin vertical は skill の固定文ではなく audit state から表示される。
- [ ] 直接配置の孤立、本文との不一致、PR 表記漏れを fixture test で検出できる。
- [ ] GA4 dimension 不足または古い snapshot を `measurementGate=blocked` にできる。
- [ ] 実験の invalid / collecting / ready-to-decide / inconclusive をテストできる。
- [ ] dashboard HTML は git 差分を発生させない。
- [ ] `docs/todo/01_改善バックログ.md` は `improvement-triage` だけが更新する境界を維持する。
- [ ] `npm run type-check --workspace apps/web`、対象テスト、対象 audit が成功する。
- [ ] SSG / route / R2 export を変更した場合だけ、該当する限定 build または full build を追加実行する。
- [ ] commit / push / deploy はユーザーの明示指示なしに実行しない。

## 11. Claude Code に渡す実装プロンプト

以下を新しい Claude Code セッションにそのまま渡す。

```text
OUTPUT FORMAT: 最終報告は 12 行以内の箇条書き。
各行は「完了」「検証」「未実行」「要判断」のいずれかで始める。
途中の調査結果は簡潔に共有し、未検証を完了扱いしない。

BEHAVIOR CONTRACT (命令):
- 結論先行。情報が揃ったら実装し、不要な再設計や周辺リファクタをしない。
- 各主張をコマンド結果と突合する。変動する在庫数や gap を文書へ固定しない。
- 削除・commit・push・deploy の境界を守る。commit / push / deploy は実行しない。
- 同一作業ツリーで別 agent を同時起動しない。

TASK:
`docs/02_実装計画/25_アフィリエイト運用SSOT移行仕様.md` を正典として、Phase A から D を順番に実装してください。

最初に必ず読むもの:
- CLAUDE.md
- `.claude/memory/MEMORY.md`
- `.claude/rules/affiliate-ads-standards.md`
- `.claude/rules/{data-storage,docs-vs-issues,skill-code-placement,evidence-based-judgment,agent-output-contract,branch-workflow}.md`
- `.claude/agents/affiliate-manager.md`
- `.claude/skills/analytics/affiliate-improvement/SKILL.md`
- `.claude/skills/ads/register-affiliate-banner/SKILL.md`
- `docs/02_実装計画/25_アフィリエイト運用SSOT移行仕様.md`
- `docs/40_アフィリエイト管理/` の全ファイル

実装ルール:
1. 書く前に既存 exports、types、consumer、workflow、tests、全参照を `rg` で確認する。
2. 新しい万能 agent は作らず、`affiliate-manager` を唯一の orchestrator として拡張する。
3. 自動配置の SSOT `apps/web/scripts/affiliate-ads-data.ts` と vertical hub を維持する。
4. 直接配置 Markdown 2 件は、既存構成に合う最小の型付き git TS SSOT へ移す。Markdown の説明を無条件に複製しない。
5. routing、freshness、期限、sample 到達、実験 status は決定的スクリプトで処理する。
6. skill に `education / mobility はゼロ` のような変動値を固定しない。state を読む。
7. `/manage-affiliate-experiment` と `/audit-affiliate-compliance` は責務が既存 skill と重ならない最小構成にする。
8. dashboard は既定 `/tmp/stats47-affiliate-dashboard.html` とし、HTML の commit-back を廃止する。
9. workflow は state snapshot と summary のみ更新する。広告変更、effect 判定、push、deploy を自動化しない。
10. `docs/40` を削除する前に情報移行と全参照更新を検証する。
11. `docs-vs-issues.md`、`.claude/agents/README.md`、`docs/01_技術設計/06_自動化インベントリ.md` を必要範囲だけ更新する。
12. `docs/todo/01_改善バックログ.md` を直接編集しない。必要なら `improvement-triage` 向け提案を最終報告に出す。

進め方:
- Phase A: 調査結果と変更対象をチェックポイント報告してから schema / validator test を実装。
- Phase B: 直接配置 SSOT と compliance audit を実装・検証。
- Phase C: operations state、計測 gate、実験 skill / 判定を実装・検証。
- Phase D: workflow、参照、履歴を移行し、最後に docs/40 を削除。

必須検証:
- 対象 unit / fixture tests
- `npx tsx .claude/scripts/ads/audit-affiliate-inventory.ts --check-size`
- 新しい compliance / operations validator
- `npm run type-check --workspace apps/web`
- `rg -n "docs/40_アフィリエイト管理|affiliate-dashboard.html" . --glob '!node_modules/**' --glob '!.git/**'`

フル build は route / SSG / R2 配信挙動を変更した場合のみ実行し、未実行なら理由を報告してください。
```

## 12. 実装前にユーザーが決めること

原則として上記の推奨案で実装できる。唯一、ASP 側の成約数・確定報酬も週次 state に統合する場合は、対象 ASP と
取得方法を別途決める必要がある。API や安全な export が無い ASP について、ブラウザ自動操作や認証情報保存を
この実装へ暗黙に追加しない。初回は GA4 の impression / click / CTR と手入力可能な成果 snapshot の schema までに留める。
