---
type: session-handoff
date: 2026-05-25
status: complete
related_prs: [343, 345, 355, 356]
deployed_to_production: true
verification_due: 2026-06-08
tags: [handoff, 2-axis-strategy, cities-revival, phase-2-authority]
---

# Session Handoff — 2026-05-25 (2 軸戦略明文化 + cities indexed率修正 + Phase 2 Axis B 30 本)

## このセッションで完了した 3 つの主要作業

### 1. 2 軸 (Two-track) 戦略の明文化 → main 反映

5 つのプロジェクト管理 doc に Axis A/B のフレームワークを統一適用:

| Doc | 変更内容 |
|---|---|
| [`01_プロジェクト定義.md`](../../00_プロジェクト管理/01_プロジェクト定義.md) §8 収益化方針 | Track A (AdSense/A8.net/楽天) + Track B (note + 公務員 AI アフィリ) に分割 |
| [`04_ターゲットペルソナ.md`](../../00_プロジェクト管理/04_ターゲットペルソナ.md) 冒頭 | **2 軸フレームワーク表**を追加 (canonical doc) |
| [`05_コンテンツ企画マスター.md`](../../00_プロジェクト管理/05_コンテンツ企画マスター.md) 冒頭 | Axis A/B のカテゴリ分類セクション追加 |
| 02, 03 | 既に 2026-05-16 で Two-track 化済 → 維持 |

**2 軸 = Two-track = Axis A + Axis B**:
- Axis A (統計データ削減): `stats47.jp` + blog → AdSense / A8.net
- Axis B (公務員 AI): note `koumuin-claude-code` + Phase 2 authority 30 本 → note 有料 / AI アフィリ
- 横断: blog → note 送客 ([`generate-utm-url`](../../../.claude/skills/sns/generate-utm-url/SKILL.md))

### 2. cities indexed率 0% 問題の修正 → main deploy (PR #355)

`docs/02_実装計画/cities-revival-plan.md` の Phase 1 ×4 倍率の前提を検証した結果:

**診断 (URL Inspection 50 サンプル)**:
- Blocked by robots.txt: **25 (50%)** ← 4-5月の古い cache (cities-revival 前の 410 状態)
- URL is unknown to Google: **24 (48%)** ← クロール経路発見遅延
- Indexed: **0 (0%)**

**根本原因**: robots.txt / meta robots / 内部リンク (CitiesNavCard) はすべて正常。Google 側の古いキャッシュが残っていた。

**修正 (deploy 済)**:
- `apps/web/src/app/sitemap.ts` の `SITEMAP_BASELINE` を `2026-05-25` に進める (cities 25,785 URL に再クロールシグナル)
- Indexing API で **200 cities 強制 submit** (ok 200/fail 0、`.claude/scripts/gsc/submit-cities-indexing.mjs`)
- 診断スクリプト永続化 (`.claude/scripts/gsc/inspect-cities-sample.cjs`)

**検証期日**: **2026-06-08** に再診断スクリプト実行。目標: Blocked 50% → 10% 以下、Indexed 0% → 20% 以上。残 160 cities も同日 submit。

### 3. Phase 2 Axis B 30 本企画 + 2 本公開 → main deploy (PR #356)

`docs/02_実装計画/phase-2/authority-content-plan.md` で計画されていた 30 本企画を実装フェーズへ。

**生成済**:
- 30 アウトライン (`docs/20_ブログ記事企画/backlog/phase-2-authority/articles/A1-D6.md` + INDEX)
- フル draft 2 本 (`docs/21_ブログ記事原稿/{assembly-answer-chatgpt-5steps, estat-7-techniques-from-unusable-to-usable}/article.md`)

**本番公開済 (2026-05-25)**:
- [https://stats47.jp/blog/assembly-answer-chatgpt-5steps](https://stats47.jp/blog/assembly-answer-chatgpt-5steps) — 公務員 ChatGPT 議会答弁 5 ステップ
- [https://stats47.jp/blog/estat-7-techniques-from-unusable-to-usable](https://stats47.jp/blog/estat-7-techniques-from-unusable-to-usable) — e-Stat 7 つのテクニック

**fact-check 結果** (memory `project_blog_brushup_risk_2026_05_25` の警告対応):
- B1 の statsDataId 7 件を e-Stat API で実存確認
- **3 件エラー検出 → 修正**: 工業統計調査 `00550100` → `00550010`、経済構造実態調査 → `00200555`、商業統計調査 → `00550020`

## 既存戦略との位置付け

- 100x-pv-strategy: Phase 0 (×1.5、完了) → **Phase 1 (×4) の indexed 率改善が今回の主作業**。Phase 2 (×3) を W45 前倒しで 2 本着地
- Two-track: Axis A の Phase 1 + Axis B の Phase 2 が同時進行になった状態

## 次セッションへ引き継ぐタスク

### 期日のあるもの

| 期日 | 内容 | コマンド |
|---|---|---|
| **2026-06-08 (日)** | cities indexed 率 再診断 | `node .claude/scripts/gsc/inspect-cities-sample.cjs` + `node .claude/scripts/gsc/submit-cities-indexing.mjs --execute --limit 160` |
| 2026-06-20 | Phase 0 (漏れ止め ×1.5) 効果測定 | `docs/02_実装計画/100x-pv-strategy.md` §Phase 0 完了判定 |
| W45 (2026-11-03 ~) | Phase 2 本格開始 | 30 本中 28 本 draft 化 + UTM 計測有効化 |

### 期日なし (優先順)

1. **Phase 2 残 28 本 draft 化** — INDEX 優先順位 (D1 消滅可能性都市 / B2 予算グラフ / A4 AI ガイドライン 47 比較) から順次。月 5-10 本ペース
2. **smoke test 失敗の修正** (現セッション外):
   - `/blog` サムネイル `highway-japan-58years/thumbnail-light.webp` 404 (別 PC 由来)
   - `/compare` ページ h1 element not found (compare ページの h1 セレクタが変わった)
3. **A2 / B1 の効果計測** — 公開 1-2 週間後に GSC で「公務員 ChatGPT 議会答弁」「e-Stat 使い方」のインプレッション/CTR/順位を見る

## 関連ファイル (1 箇所で全部辿れる)

### 戦略真実源
- [`docs/00_プロジェクト管理/04_ターゲットペルソナ.md`](../../00_プロジェクト管理/04_ターゲットペルソナ.md) — **2 軸 canonical doc**
- [`docs/02_実装計画/100x-pv-strategy.md`](../../02_実装計画/100x-pv-strategy.md) — 24 ヶ月 ×100 計画
- [`docs/02_実装計画/phase-2/authority-content-plan.md`](../../02_実装計画/phase-2/authority-content-plan.md) — Axis B 30 本企画
- [`docs/02_実装計画/cities-revival-plan.md`](../../02_実装計画/cities-revival-plan.md) — Phase 1 cities 復活

### 今日生成した運用ファイル
- [`docs/20_ブログ記事企画/backlog/phase-2-authority/articles/INDEX.md`](../../20_ブログ記事企画/backlog/phase-2-authority/articles/INDEX.md) — 30 本管理
- [`.claude/scripts/gsc/inspect-cities-sample.cjs`](../../../.claude/scripts/gsc/inspect-cities-sample.cjs) — cities 50 サンプル URL Inspection
- [`.claude/scripts/gsc/submit-cities-indexing.mjs`](../../../.claude/scripts/gsc/submit-cities-indexing.mjs) — Indexing API submit

## 本番状態 (2026-05-25 終了時点)

| URL | 状態 |
|---|---|
| `https://stats47.jp/` | HTTP 200 |
| `https://stats47.jp/themes/local-finance/cities` | HTTP 200 (#292+ MVP) |
| `https://stats47.jp/blog/assembly-answer-chatgpt-5steps` | HTTP 200 (今日公開) |
| `https://stats47.jp/blog/estat-7-techniques-from-unusable-to-usable` | HTTP 200 (今日公開) |
| `https://stats47.jp/sitemap/8.xml` | lastmod=2026-05-25 (cities 再クロール促進) |

## このセッションで使った主要 commit

- `42788b72` feat(themes): /themes/local-finance/cities (#292+)
- `e36e4442` fix(ci): 3 件の post-deploy エラーを解消
- `2b80d56c` fix(seo): cities indexed率 0% 問題に対処 + 2 軸戦略明文化 (#355)
- `7816f8f9` feat(blog): Phase 2 authority 30 本アウトライン + 2 本フル draft + 公開 (#356)
