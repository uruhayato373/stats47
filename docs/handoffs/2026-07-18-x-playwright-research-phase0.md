---
type: session-handoff
date: 2026-07-18
status: active
topic: x-playwright-research-phase0
tags: [X, Playwright, 競合分析, Claude-Code]
---

# X競合調査Playwright Phase 0 引き継ぎ

## 背景

ユーザーはXの競合・バズ投稿調査をPlaywrightで実装し、Claude Codeが安全に継続実装できる詳細仕様と指示promptを
求めた。既存repoにはX投稿用Playwrightがあるが、2026-04に予約selector失敗から4件が即時投稿された事故履歴がある。
調査collectorへ投稿機構を混在させず、専用profile・read-only guard・fixture firstで分離する。

## 正典

- 下位実装仕様: `docs/02_実装計画/33_X競合調査Playwright実装仕様.md`
- 親仕様: `docs/02_実装計画/31_競合インテリジェンス・勝ちパターンカタログ仕様.md`
- TODO: `docs/todo/02_機能バックログ.md#X-COMPETITIVE-PLAYWRIGHT-01`
- 既存調査skill: `.claude/skills/sns/x-viral-research/SKILL.md`
- 既存account観測: `.claude/skills/sns/competitor-scan/SKILL.md`

## 今回確認した既存資産

- Playwright投稿実装: `.claude/skills/sns/publish-x/publish-x.ts`。
- 投稿profile: `.local/playwright-x-profile`（x-strategist/publish-x/update-x-profileで共用）。
- 既存X調査skill: `x-viral-research`はbrowser-use前提で、Playwright collectorは未実装。
- metrics DOM取得例: `.claude/skills/sns/update-sns-metrics/references/platform-x.md`。
- profile/DOM例: `.claude/skills/sns/update-x-profile/update-x-profile.cjs`。
- galleryにはpublish-x job/actionがあるが、research routeは未実装。
- repoには`playwright`/`@playwright/test`依存とgallery/web E2E基盤がある。

## 完了した設計

- 専用`.local/playwright-x-research-profile`とlockを定義。投稿profileをコピー・共用しない。
- read-only network guardでCreateTweet/Favorite/Retweet/Bookmark/Follow/DM等のmutationを拒否。
- clickをTop/Latest/detail/close等のallowlistへ限定。
- query、scroll、件数、時間budgetを定義。既定3軸×10件、合計30件、無限scroll禁止。
- tweet root、status URL、time、text、metrics、mediaのprimary/fallback selector契約を定義。
- null/0、empty/login/rate-limit/selector-changed/metric-conflictを分離。
- raw observation、run summary、score、保存先、screenshot制約を定義。
- agent/model分業、gallery `/research` X view、exit code、fixture/live smoke testを定義。
- Phase 0〜5と受入条件を定義。
- doc 33 §19にPhase 0、§20にPhase 1のClaude Code promptを記載。

## 次セッション

**doc 33 §19のPhase 0 promptをそのまま使う。コード変更・Playwright起動・Xアクセスは禁止。**

1. git statusで本件関連の未コミット・未追跡ファイルを所有者不明として確認。
2. publish-x、update-x-profile、update-sns-metrics、x-viral、competitor-scan、galleryをread-onlyで棚卸し。
3. profile path、lock、cleanup、selector、writer import、Playwright versionを表にする。
4. doc 33提案と既存機能の重複を特定。
5. publish機構とresearch collectorのcompile/runtime境界を確定。
6. Phase 1の最小file、触らないfile、synthetic fixture casesを確定。
7. `docs/04_レビュー/YYYY-MM-DD-x-playwright-phase0-audit.md`へ保存。
8. Phase 1を`ready`または`blocked`で判定し、終了する。

## 禁止事項

- X/Playwright/Chromeの起動。
- research/publish profile、cookie、token、`.env.local`の読込・表示。
- TypeScript、skill、agent、state、gallery、package、lockの変更。
- 投稿、like、repost、reply、bookmark、follow、DM。
- R2、posts.json、sales/stateへのwrite。
- commit、push、PR、deploy。

## Phase 1以降の重要gate

- Phase 1はpure domain + synthetic fixtureだけ。browser moduleとlive X collectorは作らない。
- Phase 2で初めて専用profile/manual login/dry-run collectorを実装する。
- 最初のlive smokeはheaded・最大3件・人間確認・mutation 0。
- screenshotはlocal、tweet領域のみ、第三者assetとして再利用しない。
- collectorは`publish-x`と`sns-posts-store.cjs`をimportしない。
- formal R2/state writerはdoc 31 schema確定後のPhase 4。

## 作業ツリー注意

2026-07-18時点で`.claude/skills/sns/x-viral-research/`、trend-scout、product-factory等を含む多数の未コミット・
未追跡変更がある。今回Codexが作成したのはdoc 33、INDEX/TODO/親仕様参照、本ハンドオフであり、既存関連コードの
所有権は主張しない。一括commit・上書き・削除をせず、必要なら別worktreeを使用する。

## 検証状態

- 文書のみ。Playwright、X live、type-check、unit test、buildは未実行。
- `git diff --check`: PASS（2026-07-18、文書更新後）。
- UI selectorとmutation operation名は実装時にlive smokeで検証が必要。仕様上の候補であり、恒久保証ではない。

## 消化条件

Phase 0監査が完了し、Phase 1 file boundaryとfixture casesが確定したら、結果を親TODOへ反映する。
恒常的決定をagent/skill/rulesへ抽出後、本ハンドオフを削除する。
