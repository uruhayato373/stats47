---
type: handoff
date: 2026-07-18
topic: instagram-playwright-research-phase0
status: ready
---

# Instagram競合調査Playwright Phase 0 ハンドオフ

## 目的

Instagram公開投稿の競合調査をPlaywrightで安全に実装する前に、既存資産と共通化境界をread-only監査する。
このハンドオフの消化範囲はPhase 0のみで、ブラウザやInstagramを実行しない。

## 正典

1. `CLAUDE.md`
2. `docs/02_実装計画/31_競合インテリジェンス・勝ちパターンカタログ仕様.md`
3. `docs/02_実装計画/33_X競合調査Playwright実装仕様.md`
4. `docs/02_実装計画/34_Instagram競合調査Playwright実装仕様.md`
5. `.claude/rules/sns-content-standards.md`
6. `.claude/rules/browser-use-cleanup.md`
7. `.claude/skills/sns/competitor-scan/SKILL.md`
8. `.claude/skills/sns/post-instagram/SKILL.md`
9. `.claude/skills/sns/update-sns-metrics/references/platform-instagram.md`
10. `apps/gallery/README.md`

## 確定した設計

- 競合観測は専用`.local/playwright-instagram-research-profile`と専用lockを使う。
- 自社Graph API、token、投稿コード、posts writerとは分離する。
- 候補発見はWeb検索優先。Instagram UIは最大15件の深掘りに限定する。
- network denyとUI click allowlistの二重guard。未知mutationはfail closed。
- 欠損は`null`。viewsとlikes、emptyとblocked、single/carousel/reelを混同しない。
- 第三者mediaはdownload、git、R2、制作物、生成AI入力へ流さない。
- raw観測と分析、adaptation、自社実測を分離し、永続D1を追加しない。

## Phase 0で行うこと

1. `git status`でユーザーの既存変更を確認する。
2. 上記正典と既存Playwright/Instagram/gallery contractを読む。
3. X版共通domainとInstagram adapterの境界を表にする。
4. profile、lock、cleanup、selector、writer、token境界の監査結果を出す。
5. Phase 1の最小file/test案と未確定事項を提示する。

## 禁止

- ファイル変更、Playwright/browser起動、Instagram/live URLアクセス。
- `.env.local`、token、cookie、profile内容の読込。
- API write、R2/state write、投稿、like、follow、デプロイ。
- selectorやInstagram内部operation名を未検証のまま確定扱いすること。

## 完了ゲート

- 自社APIと競合UI観測の分離が監査で確認される。
- 共通化対象とInstagram固有adapterが明確になる。
- Phase 1がpure functionとsynthetic fixtureだけに絞られる。
- live smokeへ進まず、未検証項目が明記される。

## working tree注意

同一working treeには他作業の未コミット変更が存在する。所有権を主張せず、一括commit、上書き、削除をしない。
実装へ進む際は同時にClaude/Codexを走らせず、必要なら別worktreeを使う。

## 検証状態

- 文書のみ。Playwright、Instagram live、type-check、unit test、buildは未実行。
- `git diff --check`: PASS（2026-07-18、文書更新後）。

## 消化後

Phase 0監査が承認され、Phase 1の変更範囲が確定したら本handoffを抽出・削除する。Phase 1以降を勝手に開始しない。
