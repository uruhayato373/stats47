---
name: business-plan-operate
description: >
  stats47 2.0事業計画を型付きSSOT、管理画面、計測state、週次PDCAへ同期する。
  25章の採用判断、100コンテンツ候補、X案、note商品、KPI、開始ゲートの整合を検証し、
  実測に基づき次の実行候補を選ぶ。Use when user says "事業計画", "方針を実装",
  "地域分析事業", "business plan", "事業計画の進捗".
primary_agent: strategy-advisor
---

# business-plan-operate

事業計画書は参考入力であり、運用の正典は
`packages/data-configs/src/business-plan/` と既存の戦略・設計文書である。
管理画面 `/strategy` はこれらを読み取るだけで、独自の判断や状態を書き戻さない。

## 実行

1. `npm run business-plan:check` で章・企画数・owner・skill・文書・metric参照を検証する。
2. `npm run business-plan:build-state` で管理画面用
   `.claude/state/business-plan/latest.json` を再生成する。
3. `npm run business-plan:build-state -- --snapshot` は週次レビュー時だけ実行し、
   同日のsnapshotを上書きする。
4. 管理画面 `npm run admin` → `http://127.0.0.1:4747/strategy` で、
   判断・文書・施策・KPI・イベント・コンテンツ在庫を確認する。
5. `ready` または `in-progress` の施策だけを週次計画候補にする。
   `gated` は `readinessGate` の証拠が揃うまで着手しない。
6. 実装後はカタログ状態と計測状態を証拠に合わせて更新し、再度1〜2を通す。

## 判断契約

- 週次収益を収益化NSMとし、「地域意思決定セッション」は先行指標として扱う。
- 売上・アクセス目標は予測ではなく仮説。実績と同じ表示をしない。
- 未計測・手動・部分計測を0へ変換しない。
- GA4イベントは `apps/web/src/lib/analytics/events.ts`、
  `.claude/rules/analytics-event-standards.md` の登録台帳、GA4反映確認の3点で
  `measured` に昇格する。
- 原案のD1/PostGISは採用しない。git TS/R2/エフェメラル集計の正典を守る。
- 100企画は在庫であり制作ノルマではない。pilot後の需要・品質・収益・更新工数で昇格する。
- AIは質問理解と説明に限定し、数値計算・空間交差・順位を決めない。
- 新ドメイン、SaaS、Pro、AI検索、B2B基盤は需要ゲート前に作らない。

## ownerへの委譲

| 対象 | owner |
|---|---|
| 全体優先順位・Go/Pivot/Stop | strategy-advisor |
| 公開サイトIA・地域分析テンプレ | site-ux-manager |
| GISメタ・データセット採用 | gis-curator / open-data-curator |
| 観測値・変換・品質 | data-ingester / gis-pipeline-runner |
| X / note | x-strategist / note-manager |
| Affiliate / 商品 | affiliate-manager / coconala-product-manager |
| GA4・実測 | ga4-analyst / adsense-analyst |
| デプロイ | devops-runner（ユーザー明示承認が必要） |

## 書き込み境界

- authored SSOT: `packages/data-configs/src/business-plan/**`
- derived state: `.claude/state/business-plan/**`（generator以外で手編集しない）
- 恒久方針: 既存 `docs/00_プロジェクト管理/**`・`docs/01_技術設計/**`
- 一時レビュー文書を新設しない。未完了作業だけを既存TODOへ統合する。
- 管理画面、公開、外部投稿、販売、デプロイは勝手に実行しない。

## Gate

- decisions=25、content=100、X=30、note products=15。
- 全owner・skill・canonical path・metric参照が実在する。
- 25章の適合差分が `adopted/adapted/deferred/rejected` で説明されている。
- `/strategy` がSSOTとstateを表示し、未計測を0表示しない。
- 週次計画・レビューがbusiness-plan stateを参照する。
- `npm run business-plan:check`、対象type-check、docs gateがPASSする。

## Output Contract

`Area | Evidence | Status | Gate | Owner | Next action` の表で返す。
未検証・未計測・外部公開待ちは明示し、完了と呼ばない。
