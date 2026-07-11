---
type: critical-review
date: 2026-07-03
status: active
tags: [operations, automation, agents, ci-cd, design-system, seo, playwright]
---

# 運営自動化・役割分担 総点検 — 月20万PVを支える機械化ロードマップ

> オーナーの問題意識 (2026-07-03): ①agent/skill が増えたが役割分担は適切か、②公開後の「ページが
> 見つかりません」事故は CI/CD で機械検出できるはず、③デザイン統一性と breakpoint 別表示の
> Playwright 検証、④データ保有形式・型定義の整備。月20万PV サイトとして継続運営するための整理。
> 本ドキュメントは 3 並列調査 (agent/skill 棚卸し・CI/CD 機械チェック棚卸し・デザイン/E2E 棚卸し) の統合。

## 0. エグゼクティブサマリ

| 視点 | 診断 | 最重要アクション |
|---|---|---|
| 経営者 | 現状 月~1.5万PV vs 目標20万PV = **13倍ギャップ**。かつ「検証なきdeploy」(施策37 pending / effect確定0) | 施策の量産より**検証ループを閉じる** + 機械ゲートで事故ゼロ化 |
| SEO | **基礎統計53キーが410誤配信中**だった (births/marriages/高齢化率等)。インデックス即時除去シグナルを自ら送っていた | 本レビューと同時に53件復帰 + 整合lint恒久化 (実施済) |
| エンジニア | notFound 3層防御は存在するが、**キーリスト間の集合整合lintが皆無** = 今回の事故クラスは素通り | ranking-key-consistency.test.ts を CI に追加 (実施済) |
| デザイナー | Playwright 導入済みだが **Desktop Chrome 単一・breakpoint検証ゼロ・visual regressionなし** | responsive projects + screenshot smoke (Tier 2) |
| 組織 (agent) | 41体 (README公称37) / skill 129。zombie 1体・重複疑い多数・README乖離 | zombie削除 + critic統合 + README整合 (Tier 2) |

## 1. ケーススタディ: 2026-07-03 の 410 誤配信障害 (なぜ機械化が必要かの実証)

ユーザー報告「/ranking/marine-aquaculture-harvest が見つかりません」を調査した結果:

- **原因**: `GONE_RANKING_KEYS` (410対象) と `KNOWN_RANKING_KEYS` (配信中) の**両方に登録**という矛盾状態。
  metric config は isActive:true、R2 には item.json/values.json 実データあり。middleware の isGone
  短絡が最優先で 410 を返していた。
- **混入経路**: 2026-06-16 COVERAGE-DEACT-01 の一括棚卸しが「config も R2 データも無い空 ranking」の
  判定を誤り、実データを持つキーを大量に GONE 化。**追加時に KNOWN / isActive との突合をしていなかった**。
- **全数調査の結果**: 同一シグネチャ (GONE∩KNOWN∩isActive:true) が **56件**。全件 R2 実データあり
  (values.json 200 / item.json 200 / areaType:prefecture / isActive:true を機械確認)。本番サンプル実測
  8/8 が 410。births(出生数)・marriages(婚姻件数)・ratio-65-plus(高齢化率)・population-growth-rate
  (人口増減率)・households(世帯数) 等、**検索需要の高い基礎統計**を含む。
- **なぜ既存の3層防御をすり抜けたか**: ①check-r2-route-ssg (generateStaticParams混入検査) ②prerender
  scan (notFound焼き込み検査) ③smoke-test-routes (route代表1件のlive検査) はいずれも「**route テンプレート
  単位**」の防御。今回は「**特定キーのみ**が middleware で 410」なので、代表1件 (総人口等) が正常なら
  全チェック green のまま通過する。**per-key のリスト整合はどの層も見ていなかった**。

**対処 (本レビューと同時実施)**:
1. 誤検知 3+53=56 件を GONE から削除し復帰 (PR #520/#521 で3件は本番反映済み・200確認済み)
2. `apps/web/src/config/__tests__/ranking-key-consistency.test.ts` を新設。CI (pr-quality-check の
   test ステップ) で以下を恒久検証:
   - [A] GONE ∩ KNOWN = ∅ / [B] GONE ∩ isActive:true = ∅ / [C] INDEXABLE ⊆ KNOWN /
     [D] INDEXABLE ∩ GONE = ∅ / [E] SITEMAP ∩ GONE (警告・ベースライン5件)
3. GONE への追加規約をファイルヘッダに明文化: 「必ず isActive:false + KNOWN 再生成とセット」

**教訓**: 「リストの手動保守 × 複数リストの独立更新」は必ずドリフトする。**集合としての不変条件を
テストで宣言する**のが唯一の恒久解。同型の問題は tag / theme / blog の gone リストにも潜在しうる
(→ Tier 2 で横展開)。

## 2. CI/CD 機械化の現状と穴 (エンジニア視点)

### 現状の防御マップ (調査結果)

| 層 | チェック | 配線 | 穴 |
|---|---|---|---|
| pre-commit | design-system / card-census / r2-route-ssg / metric years・config / blog quality-gate | .husky | `--no-verify` で素通り可・**型チェック無効化中** |
| PR CI (pr-quality-check) | lint / design-system / card-census / years / config / type-check / vitest / build | main宛PRのみ | **r2-route-ssg 未配線**・キーリスト整合なし(→今回追加) |
| deploy 前 | check-prerender-notfound (build産物の title 走査) | deploy-workers | build 未実行時 exit0 skip |
| deploy 後 | smoke-test-routes (route代表1件 live検査) + Playwright smoke | deploy-workers / post-deploy-smoke | 事故が一度本番に出た後の検知・**per-key 不可視** |

### ギャップと対策 (優先順)

| # | ギャップ | 対策 | コスト |
|---|---|---|---|
| G1 | キーリスト集合整合 lint 皆無 | ✅ ranking-key-consistency.test.ts (本PR) | 済 |
| G2 | check-r2-route-ssg が pre-commit のみ | pr-quality-check.yml に 1 step 追加 | 5分 |
| G3 | pre-commit の型チェック無効化 | CI 側で担保済みだが、無効化理由を再評価 | 要調査 |
| G4 | gone/known 系の同型リスト (tag/blog/theme) 整合未検証 | 同型テストを url-policy.test.ts に追加 | 30分 |
| G5 | GSC カバレッジ棚卸し (build-coverage-queue) が deactivate 判定時に isActive / R2 実データと突合しない | 判定前に config + R2 突合を必須化 (COVERAGE-DEACT の再発源) | 1-2h |
| G6 | smoke-test-routes は route 代表1件 | 「復帰/新規公開キー」を PR から抽出して smoke 対象に動的追加 | 2-3h |

## 3. デザイン統一と breakpoint 検証 (デザイナー視点)

### 現状 (調査結果)

- 機械化済み: 色 (`text-black`/raw hex)・影 (`shadow-lg`)・角丸 (`rounded-xl`)・幅直書き・カード増殖
  (check-design-system.mjs 14ルール + check-card-census、CI+pre-commit 配線済み)
- **非機械 (目視/LLM依存)**: PageShell 経由の統一・レール左右セマンティクス・タイポ階層・
  `lg:` vs `@lg:` (コンテナクエリ) の使い分け・dark mode token
- Playwright: E2E 15 spec あるが **CI 未配線 (ローカル手動のみ)**。CI で走るのは本番 smoke 1 spec。
  **全 spec が Desktop Chrome 単一**。viewport/デバイス定義なし。breakpoint 別検証ゼロ。
  visual regression (toHaveScreenshot 等) 未導入。
- 今回のサイドバー統一 (ranking を blog と同じ lg/360px に揃えた) のような「ページ間の breakpoint
  不整合」は、現状どの機械チェックでも検出不能。

### 対策 (Tier 2 の柱)

1. **responsive projects**: playwright.config に mobile(375)/tablet(768)/desktop(1280)/wide(1536) の
   4 project を定義。代表ページ (home / ranking詳細 / blog詳細 / category / themes / areas) ×
   4 viewport で「右レール表示有無・横スクロール無し・フッター到達」を assert する 1 spec を新設。
   → **PageShell の breakpoint 規約 (lg=1024 で右レール等) がテストとして固定される**
2. **screenshot smoke**: 同マトリクスで `toHaveScreenshot` (maxDiffPixelRatio 緩め) を撮り、
   PR で意図しないレイアウト崩れを diff 検出。まず warning 運用 → 安定後 gate 化
3. CI 配線: pr-quality-check に「apps/web 変更時のみ」条件付き job として追加 (毎PR 3-5分増で済む)
4. `lg:` vs `@lg:` 誤用は regex で機械化可能 (card grid 内で `md:grid-cols` を使ったら error 等)
   → check-design-system.mjs に 1 ルール追加

## 4. データ形式・型定義 (アーキテクト視点)

- 完全DBレス (git TS + R2) の SSOT 設計自体は健全。今回の障害も「データ層」ではなく**派生リスト間の
  整合**の問題。既存の validate:years / validate:config (metric config lint) は機能している。
- 弱点は「**生成物どうしの整合**」: KNOWN (R2から生成) / GONE (手動) / SITEMAP (GSC実績から生成) /
  INDEXABLE (手動系) が独立更新される。→ G1 のテストで宣言的に固定した。同じ発想を
  「R2 snapshot ⇄ config」(isActive:true なのに R2 に item.json が無い = 公開漏れの逆パターン) にも
  展開できる (Tier 2、週次 cron で全キー突合レポート)。
- blog の 3点セット (json/source.json/svg) 系譜管理は既に gate 化済みで良い手本。ranking キー系にも
  同じ「生成保証」原則を適用する (KNOWN 再生成を GONE 編集の pre-commit 条件にする等は過剰。テストで十分)。

## 5. agent / skill 組織診断 (経営者×組織設計視点)

### 現状 (調査結果): agent 41体 (README公称37・Tier表39 = カウント不整合) / skill 129個

| 問題 | 対象 | 対策 |
|---|---|---|
| zombie agent | `seo-auditor` (4分割先へ移譲済・skill参照0) | 削除 + README 更新 |
| README 棚卸し漏れ | `chart-component-builder` が Tier 表に不在 | README 追記 |
| critic 3体がほぼ同型 | blog-critic / note-critic / ranking-content-critic | 統合 or 共通テンプレ化 (READMEも KEEP-SKIP 判定済) |
| 命名近似で境界曖昧 | chart-author (SVG/記事用) vs chart-component-builder (React/D3) | 各定義冒頭に「相手との境界」1行を明記 |
| テンプレ重複 | theme-ui-manager vs ranking-ui-manager | 共通チェックリストを rules に抽出し agent は差分のみ |
| 縮退 agent が skill primary のまま | blog-editor / sns-renderer / note-manager / code-reviewer | skill frontmatter の primary_agent 差し替え |
| フォーマット不統一 | 旧: H1形式 / 新: YAML frontmatter | 順次 YAML へ (check-agent-skill-consistency で検出可能に) |
| 無効値 | audit-consistency の primary_agent=claude | 修正 |

**組織原則の提案** (今後 agent を増やす際の判定):
1. **「作る agent」と「審査する agent」は分離を維持** (author/critic 分離は正しい設計。統合するのは critic 同士のテンプレのみ)
2. **新 agent は「既存 agent の責務境界 1 行」を書けなければ作らない** (chart-author vs chart-component-builder の轍)
3. `check-agent-skill-consistency.cjs` は既にあるので **週次 CI 化** (現状 Stop hook のみ) — README と実体の乖離を機械検出

### skill の統廃合は「使用実績」で判定

129 skill は多いが、判定は主観でなく実績で: `.claude/state/` のログ・git log で直近 30 日の発火実績を
集計し、0 回のものを候補リスト化 → 月次で archive 判定 (機能バックログの DEAD-SKILL-DBLESS-TRIAGE と同枠)。

## 6. 経営者・SEO 視点の総括

- **月20万PV は「事故ゼロ×検証ループ×コンテンツ量産」の掛け算**。現状 GSC clicks は右肩上がり
  (W16→W23 3.8x) だが、53キー410 のような自傷事故が成長を相殺してきた。まず「守り」の機械化
  (Tier 1) は本レビューでほぼ完了。次は収益化マスタープランの P2 (トラフィック成長) と検証規律
  (overdue 23件の判定消化) に集中する。
- **NSM との整合**: マスタープランは NSM を PV→週次収益に転換済み。オーナーの「20万PV」目標は
  P2 のトラフィック KPI として位置づけ、NSM (収益) と両立させる (PV はインプット指標、収益がアウトカム)。
- SEO 的には今回の 53 件復帰は「インデックス再登録」まで数週間かかる。GSC の URL Inspection /
  sitemap 再送で回復を追跡し、`docs/todo/01_改善バックログ.md` に効果測定エントリを置く。

## 7. 優先順位付きロードマップ

### Tier 1 — 今週 (機械化 quick win・本PRで実施済みを含む)

- [x] 410 誤配信 56 件の復帰 (3件は #520/#521 で本番反映済み・53件は本PR)
- [x] ranking-key-consistency.test.ts (集合整合の恒久ゲート・CI 自動実行)
- [ ] check-r2-route-ssg の pr-quality-check 配線 (G2・5分)
- [ ] 53件復帰の deploy + CDN purge + 本番実測 (deploy 承認待ち)

### Tier 2 — 今月

- [ ] Playwright responsive projects + 代表ページ×4 viewport の layout assert spec (§3-1)
- [ ] screenshot smoke (warning 運用から) (§3-2)
- [ ] gone/known 同型リスト (tag/blog) の整合テスト横展開 (G4)
- [ ] build-coverage-queue の deactivate 判定に config/R2 突合を必須化 (G5)
- [ ] seo-auditor 削除・README カウント整合・primary_agent 差し替え (§5)
- [ ] check-agent-skill-consistency の週次 CI 化
- [x] 53件復帰の GSC 回復トラッキング (改善バックログ RANKING-GONE-RESTORE-01)
- [ ] **post-deploy-smoke の慢性 failure 解消** (2026-06-22 以降の全デプロイで failure。実測で切り分け済:
  ①`/ranking` が spec 期待の 301 でなく本番 200 を返す — spec か middleware どちらが正か要判定
  ②`ランキング詳細（総人口）にテーブルが表示される` が timeout — SSR HTML に `<table>` は存在、
  Desktop Chrome での可視性の問題。AREA-PROFILE-FIX-01 と合わせて smoke を green に戻さないと
  「毎回赤 = 誰も見ない」でゲートとして死ぬ)

### Tier 3 — 四半期

- [ ] visual regression の gate 化 (安定後)
- [ ] critic 3体のテンプレ統合
- [ ] 「isActive:true なのに R2 に snapshot 無し」逆方向の週次突合レポート (§4)
- [ ] skill 使用実績集計 → 月次 archive 判定の仕組み化
- [ ] デザイン SSOT 規約の機械化拡大 (`lg:` vs `@lg:` regex 等)

## 関連

- 障害対応 PR: #520 (marine 3件 + サイドバー統一) / #521 (release) / 本PR (53件復帰 + 整合テスト)
- 正典: `.claude/rules/nextjs-ssg-preservation.md` (route単位の3層防御) — 本レビューで per-key 層を追加
- 収益化マスタープラン: `docs/02_実装計画/01_収益化マスタープラン.md` (P2 トラフィック成長・検証規律)
- agent 構成: `.claude/agents/README.md` (要カウント整合)
