---
type: critical-review
date: 2026-07-03
status: active
tags: [claude-code, settings, hooks, mcp, skills, agents, context, security]
---

# Claude Code セットアップ監査 — 診断・是正ログ・残タスク

> オーナー依頼 (2026-07-03): Claude Code 環境 (CLAUDE.md / rules / skills / agents / hooks /
> settings / MCP / 自動化) を read-only で全量診断し、月20万PV を支える持続的運用へ最適化する。
> **注**: 診断はクラウドコンテナ実行のため実PC (ホーム / Documents / Downloads) は対象外。
> repo 内の Claude Code 設定 (git 共有分) を対象とした。3体の Explore agent で並列棚卸し → 実証裏取り。

## 1. 診断サマリ (実測)

| 領域 | 実測 |
|---|---|
| rules/ | 21 ファイル ~65.7K tok。**ただし常時ロードは CLAUDE.md (~5K tok) のみ** — rules に frontmatter (`paths:`/`alwaysApply:`) は無く、auto-load 機構も無い。rules は CLAUDE.md の参照表からオンデマンドで開かれる参照文書。**「rules が毎セッション注入されて重い」という前提は誤り** |
| skills | 129 SKILL.md。frontmatter 欠落4本 (発火不能)・description 500字超4本・300行超16本 |
| agents | 41 ファイル。frontmatter 欠落12体 (`subagent_type` 起動不能)・`model:` 0/41・`tools:` 0/41 |
| commands | 57本すべて skills への薄いポインタ (Claude Code が skill を slash 自動公開するため冗長) |
| hooks | 4。SessionStart×2 + Stop×2 は配線済。**`pre-bash-safety.js` (rm -rf/force-push/secret 検出) が未配線** |
| settings | `settings.local.json` が **git 追跡** + **APIキー直書き3箇所** + `bypassPermissions` + 他マシン絶対パス150行 |
| MCP | 9サーバー。github + cloudflare×2 のみ使用。sqlite/git/playwright/shadcn/mlit-dpf は `/Users/minamidaisuke/...` 固定 + 参照ゼロ |
| state | `.claude/state/` 13MB が git 管理 (>1MB JSON blob 3本) |
| docs | INDEX.md が実態と乖離 (`22_` 番号衝突・`15_`/`20_` は実体なし) |
| 自動化 | .github/workflows 41本。`instagram-mf-day2.yml` は 2026-05-25 one-shot で死骸 |

## 2. 是正ログ (このセッションで実施済み・push 済み)

| Phase | 内容 | commit |
|---|---|---|
| **0 セキュリティ** | `settings.local.json` を `git rm --cached` + gitignore 化 / `settings.json` に deny リスト / `pre-bash-safety.js` を PreToolUse 配線 | c40808a |
| **1 機能修復** | agents 12体 + skills 4本に frontmatter 付与 (発火不能解消) / commands 53本削除 (冗長) / pre-commit 型チェックを apps/web TS staged 時のみ発火で復活 / docs/INDEX 修正 / .mcp.json から死走5サーバー削除 | de8965a 他 |
| **2 コンテキスト減量** | 長すぎる skill/agent description 10件を短縮 (~5,600→2,244字、常時 ~1,100tok 減) | (Phase2 commit) |

> **★キー APIキー漏洩の本質対策 = ローテーション (オーナー作業)**: git から消しても履歴に残る。
> Google Cloud Console で PSI API キー `AIzaSy...sBgGo` を再発行・旧キー無効化すること。未実施。

## 3. 監査で判明した「プランの前提誤り」(重要・再発防止)

決定的ゲート思考の教訓。**機構が目的に合致するかを都度検証する**こと。

1. **rules 移動でコンテキストは減らない**: rules はオンデマンド参照でありセッション常時ロードは CLAUDE.md のみ。
   よって「blog系 rules 3本を skill reference へ移動して -24.6K tok」は**常時削減ゼロ**。唯一の安全な常時削減
   レバーは **skill/agent description の短縮** (一覧に載るため) → Phase 2 で実施。rules 移動は費用対効果なしで不採用。
2. **`tools:` は read-only を保証できない**: critic は判定成果物 `review.md` を書くため Write が要る。
   「審査対象は読むだけ・書くのは review.md だけ」は**パス制約**であって tools:(ツール allowlist) では表現不能。
   → Phase 3 の「critic に tools: で read-only 強制」は機構不成立でスキップ。read-only 保証は prose + critic-review-protocol.md の運用規律で担保。
3. **commands の orphan 判定は要再確認 → 決着**: 冗長な53本は削除。残った4本
   (fetch-youtube-data / post-tiktok / post-youtube / render-ranking-images) は指す SKILL.md が
   repo のどこにも**実在しない壊れたポインタ**だった (ハーネスの利用可能一覧に出るのは commands/ 自体が
   slash 公開されるため。skill 実体ではない)。invoke するとエラーになるため削除。**この4機能は未実装** =
   将来 YouTube/TikTok 投稿・YouTube データ取得・ランキング画像生成が必要なら skill を新規作成する
   (`.claude/skills/{sns,analytics,ranking}/<name>/SKILL.md`)。expert-review / proofread-article は
   blog-review の `--mode` に統合済みで別途対応不要。

## 4. Phase 3 実施結果 + 残タスク

| Phase | タスク | 状態 |
|---|---|---|
| 3 | **agent に `model:` 付与** (haiku 2 / sonnet 30 / inherit 8) | ✅ 完了 (4cc2bf4 他) |
| 3 | commands 保留の実体確認 → 壊れた4本削除 (未実装 dangling) | ✅ 完了 (commands 0本) |
| 3 | ~~critic に tools: で read-only 強制~~ | ✕ 機構不成立 (§3-2)・スキップ |
| 3 | `.claude/state/` サイズ予算 CI (>15MB warn + 世代 prune) | ⬜ 未 (○ 肥大歯止め) |
| 4 | PostToolUse formatter (Edit/Write 後 prettier/eslint --fix) | ⬜ 未 (△ 任意) |
| 4 | memory prune 運用 (2026-04 以前の解決済 feedback を四半期アーカイブ) | ⬜ 未 (△ 任意) |
| 4 | output-styles 新設 (出力トーンの定型化) | ⬜ 未 (△ 任意) |
| — | `instagram-mf-day2.yml` / `.agent/` (廃止D1内容) 削除 | ⬜ 未 (○ 死骸) |
| — | APIキー履歴 purge (filter-repo) | ⬜ オーナー判断 (キー無効化が本質) |

**Phase 0-3 中核は完了・push 済み** (settings 安全化 / frontmatter 16件 / commands 全廃 /
MCP 3社へ / description 短縮 / agent model: 分配)。残りは死骸削除と任意の運用高度化のみ。

## 5. 実PC 側で別途取得すべき情報 (ローカルセッションで)

クラウドからは見えない user スコープ設定。ローカルで実行し貼付 → 差分診断を追補する。

```bash
ls ~/.claude/ && wc -c ~/.claude/CLAUDE.md   # user スコープ CLAUDE.md
cat ~/.claude/settings.json                   # user permissions / hooks
claude mcp list                               # user MCP (.mcp.json との重複)
ls ~/Downloads | wc -l; tree -L 2 -d ~ | head # ホームの散らかり
```

## 関連

- 実行プラン (ephemeral): `~/.claude/plans/humming-gliding-treehouse.md`
- 姉妹 doc (サイト運営観点): `docs/04_レビュー/2026-07-03-operations-automation-review.md`
- critic 運用規律: `.claude/rules/critic-review-protocol.md`
