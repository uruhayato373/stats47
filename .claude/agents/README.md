# エージェントチーム

`.claude/agents/` に定義されたサブエージェント群。Agent tool の `subagent_type` または直接起動で利用する。

**現在: Phase 1-5 完了 (33 体構成)**。並行運用最適化のため、ドメイン × フェーズで責務を細分化し、各 agent に「担当 skills / 必読 rules / 触る state」を明示している。旧 17 体のうち `data-pipeline` `db-manager` は Phase 6.7 整理で削除済 (-2)、新 18 agent 追加。差し引き 33 体。残る縮退 agent は新 agent に役割委譲済 (Session B で 4 件移動・24 件は責務上維持)。詳細は移行ステータス表。

## 設計思想

- **細分化 + 並行性最大化**: 同時に 3-5 agent が衝突しないファイル境界を引く。1 メトリクスソース = 1 agent、1 slug = 1 agent の原則
- **3 軸の明示**: 各 agent.md は (a) 担当 skills (b) 必読 rules (c) 触る state/snapshots を冒頭に記述
- **既存 agent は併存維持**: 旧 17 体は削除しない。Phase 3 で役割縮退記述に Edit し、移行先 agent を明示する

## Tier 0: Dispatcher (1 skill)

`task-router` は agent ファイルではなく **skill** (`.claude/skills/management/task-router/SKILL.md`)。 Claude が内部参照 (`user-invocable: false`) で agent / skill 選択に利用。 全 agent から呼ばれる dispatcher なので Tier 0 として明示する。

## Tier 1: Strategy / Planning (3 体)

| agent | role | 派生元 |
|---|---|---|
| `strategy-advisor` | 週次 PDCA・NSM・批判的 review (knowledge / triage は分離) | 既存縮退 |
| `knowledge-curator` 🆕 | 失敗・学びの記録 + auto memory 整理 | strategy-advisor 分離 |
| `improvement-triage` 🆕 | 改善バックログ整理 + status 更新 (`docs/02_実装計画/03_改善バックログ.md` 排他 append) | strategy-advisor 分離 |

## Tier 2: Data / Infra (5 体)

| agent | role | 派生元 |
|---|---|---|
| `estat-researcher` 🆕 | e-Stat / MLIT DPF 探索・メタ確認 (DB には触らない) | data-pipeline 分割 |
| `data-ingester` 🆕 | metrics 登録 + stats_* 投入 + 47県カバレッジ検証 | data-pipeline + db-manager 分割 |
| `db-schema-manager` 🆕 | スキーマ・migration・reset 専任 | db-manager 分割 |
| `snapshot-exporter` 🆕 | D1 → R2 snapshot / Remotion 派生 JSON 生成 | db-manager 分割 |
| `r2-publisher` 🆕 | R2 push / pull / du 専任 | db-manager 分割 |

## Tier 3: Content - Blog / Note (7 体)

| agent | role | 派生元 |
|---|---|---|
| `trend-scout` 🆕 | トレンド発見 (GSC / NotebookLM / 外部ソース) | blog-editor 分割 |
| `blog-editor` | 公開 / 一括公開 / brushup (企画と review は分離) | 既存縮退 |
| `article-writer` | 1 metric → 1 記事 (並列起動量産単位) | 既存 |
| `chart-author` 🆕 | SVG / Remotion チャート生成 (blog / note 共通) | blog-editor + note-manager 分離 |
| `blog-critic` 🆕 | expert review / panel review | blog-editor 分割 |
| `note-manager` | note.com 公開LC / 公開URLトラッキング (完全DBレス: D1 note_articles 廃止、SSOT=R2 `note/<vertical>/<slug>/`。docs/31 は ephemeral outbox。chart は chart-author に委譲) | 既存縮退 |

## Tier 4: SNS (5 体)

| agent | role | 派生元 |
|---|---|---|
| `x-strategist` | X 投稿・キャプション・分析 | 既存 |
| `instagram-strategist` | IG 投稿・カルーセル・リール | 既存 |
| `youtube-strategist` | YouTube 企画 → 公開 → 分析 | 既存 |
| `sns-renderer` | Remotion 全レンダリング (metrics 同期と画像生成は分離) | 既存縮退 |
| `sns-metrics-sync` 🆕 | 全プラットフォーム メトリクス同期 (`state/metrics/{sns,youtube}/`) | sns-renderer + 各 strategist 分離 |

## Tier 5: SEO / Analytics (4 体)

| agent | role | 派生元 |
|---|---|---|
| `gsc-analyst` 🆕 | GSC 専任 (fetch + inspect + improvement + indexing) | seo-auditor 分割 |
| `ga4-analyst` 🆕 | GA4 専任 | seo-auditor 分割 |
| `performance-auditor` 🆕 | PSI / Lighthouse / Cloudflare cost | seo-auditor 分割 |
| `adsense-analyst` 🆕 | AdSense / アフィリエイト収益計測 | seo-auditor 分割 + new |

## Tier 6: Theme / UI (4 体)

| agent | role | 派生元 |
|---|---|---|
| `theme-designer` | テーマ → IndicatorSet 設計 | 既存 |
| `theme-component-builder` | page_components 監査・INSERT (旧 theme-enhancer) | リネーム |
| `ui-reviewer` | melta-ui 準拠 + UI panel review | 既存 |
| `image-prompt-curator` 🆕 | OGP / note 表紙 / SNS 静止素材プロンプト生成 | sns-renderer + note-manager 分離 |

## Tier 7: Code Quality / DevOps (4 体)

| agent | role | 派生元 |
|---|---|---|
| `code-reviewer` | feature / packages / types / app コード review (UI 一貫性は分離) | 既存縮退 |
| `ui-consistency-reviewer` 🆕 | ページ横断 UI 一貫性 review | code-reviewer `--scope ui-consistency` 分離 |
| `tdd-guide` | TDD 設計・テスト品質 (Red-Green-Refactor) | 既存 |
| `devops-runner` | テスト・デプロイ・Git・CDN 実行 | 既存 |

## 並行衝突回避マトリクス

| 同時起動シナリオ | 各 agent の file boundary |
|---|---|
| `trend-scout` + `gsc-analyst` + `ga4-analyst` | `state/blog/` vs `state/metrics/gsc/` vs `state/metrics/ga4/` |
| `article-writer × 5` + `chart-author` | `.local/r2/app/blog/<slug>/` を slug 単位排他、chart-author は `docs/21_ブログ記事原稿/<slug>/` を読むのみ |
| `data-ingester` → `snapshot-exporter` → `r2-publisher` | D1 write → `.local/r2/app/` write → R2 push の一方向。同 ranking_key は逐次、別 key は並列可 |
| `x-strategist` + `instagram-strategist` + `youtube-strategist` | API / state / metrics サブディレクトリが完全分離 |
| `gsc-analyst` + `improvement-triage` | gsc-analyst → `.claude/state/metrics/gsc/` write、triage → `docs/02_実装計画/03_改善バックログ.md` 排他 append |
| `code-reviewer` + `ui-consistency-reviewer` + `tdd-guide` | 全員 read-only、git diff のみ |

**禁則**:
- D1 への並列 write 禁止 (better-sqlite3 単一プロセス前提)。同 D1 への `data-ingester` / `db-schema-manager` 起動は逐次
- `docs/02_実装計画/03_改善バックログ.md` への書き込みは `improvement-triage` のみ。analyst 系は `.claude/state/` にしか書かない

## チーム連携パターン (新体制版)

| シナリオ | エージェント連携 |
|---|---|
| ランキング追加 → SNS 一式 | estat-researcher → data-ingester → snapshot-exporter → r2-publisher → x/IG/YT-strategist (3 並列) |
| GSC 中位クエリ → 量産 | gsc-analyst → trend-scout → article-writer × N (並列, metric→R2直執筆) → chart-author → blog-editor (publish) |
| 週次 PDCA | strategy-advisor (orchestrator) → gsc/ga4/adsense-analyst (3 並列) → improvement-triage |
| トレンド → ブログ記事 | trend-scout → article-writer (metric→R2直執筆) → chart-author → blog-critic → blog-editor (publish) |
| トレンド → IG リール | trend-scout → sns-renderer (render-bar-chart-race) → instagram-strategist |
| YouTube 動画制作 | youtube-strategist → sns-renderer → sns-metrics-sync (公開後) |
| コード変更 → デプロイ | code-reviewer + ui-consistency-reviewer + tdd-guide (3 並列) → devops-runner |
| テーマダッシュボード設計 | theme-designer → data-ingester → theme-component-builder → ui-reviewer |

## 移行ステータス

**Phase 1-5 完了 (2026-05-28)**: 新 18 agent 追加 → 既存 8 agent 縮退記述 → 136 SKILL.md に `primary_agent` frontmatter 付与 (task-router のみ意図的 skip) → 縮退 agent への primary 参照 28 件を精査し責務に応じて 4 件移動・24 件維持 (Session B) → 並行運用検証 (Session 5-1/5-2/5-3) 実施済。L3-1 統合は Cluster 1 (blog-review) + Cluster 7 (brushup-blog) のみ実装、Cluster 2/3/4/5/6 は KEEP-SKIP 判定 (各 Cluster の責務分離が既に適切なため、形式統合より現状維持が CLAUDE.md 行動原則「シンプル最優先」に整合)。判定詳細: `docs/02_実装計画/03_改善バックログ.md` AGENT-L3-CONSOLIDATE-01。

| 旧 agent | 状態 | 移行先 |
|---|---|---|
| `data-pipeline` | **削除済 (2026-05-28)** | `estat-researcher` + `data-ingester` |
| `db-manager` | **削除済 (2026-05-28)** | `db-schema-manager` + `snapshot-exporter` + `r2-publisher` + `data-ingester` |
| `blog-editor` | 縮退予定 (Phase 3、publish 系のみ保持) | + `trend-scout` + `chart-author` + `blog-critic` (企画は article-writer に統合) |
| `seo-auditor` | 縮退予定 (Phase 3) | `gsc-analyst` + `ga4-analyst` + `performance-auditor` + `adsense-analyst` |
| `sns-renderer` | 役割縮退 (render 専任) | `sns-metrics-sync`, `image-prompt-curator` に分離 |
| `theme-enhancer` | リネーム予定 (Phase 3) | `theme-component-builder` |
| `code-reviewer` | 役割縮退 (review-feature / security 専任) | `ui-consistency-reviewer` 分離 |
| `note-manager` | 役割縮退 (note.com 専任) | `chart-author` に chart 委譲 |
| `strategy-advisor` | 役割縮退 (NSM / 週次専任) | `knowledge-curator`, `improvement-triage` 分離 |

## 各 agent の詳細

担当 skills / 必読 rules / 触る state / Output Contract / file boundary は各 `.claude/agents/<name>.md` を参照。

新 agent ファイルの構成テンプレ:
- **frontmatter**: `name`, `description`, `model`, `tools`
- **担当範囲**: 役割の詳細記述 (1 段落)
- **担当 skills**: `.claude/skills/<category>/<name>/` の path リスト (表形式)
- **担当外**: 委譲先の agent 名と理由
- **必読 rules**: `.claude/rules/<name>.md` の path リスト
- **触る state**: `.claude/state/` や `docs/` の path リスト
- **Output Contract**: `agent-output-contract.md` に沿った Output Format (Template A/B/C)
- **File Boundary**: 同時並行する agent との書き込み境界

## 旧 README 互換 (Tier 1-3 表記)

過去のドキュメント / commit メッセージ参照のため、旧 Tier 表記との対応:
- 旧 Tier 1 (主力 4 体): x/youtube/instagram-strategist + seo-auditor → 新 Tier 4-5 に分散
- 旧 Tier 2 (Specialist 12 体): theme / data / db / blog / sns / note / code / ui / devops / tdd / strategy → 新 Tier 1-7 に分散
- 旧 Tier 3 (Worker 1 体): article-writer → 新 Tier 3 維持
