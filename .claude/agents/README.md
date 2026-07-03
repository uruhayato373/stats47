# エージェントチーム

`.claude/agents/` に定義されたサブエージェント群。Agent tool の `subagent_type` または直接起動で利用する。

**現在: Phase 1-5 完了 + 2026-07-03 整理 (40 体構成)**。並行運用最適化のため、ドメイン × フェーズで責務を細分化し、各 agent に「担当 skills / 必読 rules / 触る state」を明示している。旧 17 体のうち `data-pipeline` `db-manager` は Phase 6.7 整理で削除済 (-2)、新 18 agent 追加。差し引き 33 体。**2026-06-21 に ranking 系 4 体 (`ranking-ui-manager` / `ranking-publisher` / `ranking-content-author` / `ranking-content-critic`) を新設 (+4)。2026-07-03 運営総点検で zombie 化した `seo-auditor` を削除し、実ファイルベースで 40 体に整合。**残る縮退 agent は新 agent に役割委譲済 (Session B で 4 件移動・24 件は責務上維持)。詳細は移行ステータス表。

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

## Tier 2: Data / Infra (8 体)

| agent | role | 派生元 |
|---|---|---|
| `estat-researcher` 🆕 | e-Stat / MLIT DPF 探索・メタ確認 (DB には触らない) | data-pipeline 分割 |
| `data-ingester` 🆕 | metrics 登録 + stats_* 投入 + 47県カバレッジ検証 (GIS は gis-* に委譲) | data-pipeline + db-manager 分割 |
| `db-schema-manager` 🆕 | スキーマ・migration・reset 専任 | db-manager 分割 |
| `snapshot-exporter` 🆕 | D1 → R2 snapshot / Remotion 派生 JSON 生成 | db-manager 分割 |
| `r2-publisher` 🆕 | R2 push / pull / du 専任 | db-manager 分割 |
| `ranking-publisher` 🆕 | ranking 公開多段 (generate-ranking-items / KNOWN・SITEMAP・INDEXABLE 再生成 / deploy / purge / 本番実測) のオーケストレーション。観測値=data-ingester、push=r2-publisher、deploy=devops-runner に委譲 | 2026-06-21 新設 |
| `gis-curator` 🆕 | KSJ GIS メタ SSOT (datasets.ts / registry.ts) 管理・dataset lifecycle・メタ整合。完全DBレス (git TS=SSOT)。pipeline は gis-pipeline-runner、push は r2-publisher に委譲 | 2026-06-21 新設 (GIS DBレス化) |
| `gis-pipeline-runner` 🆕 | KSJ GIS パイプライン実行 (seed → download → TopoJSON → R2 → build state)。SSOT 編集は gis-curator、push は r2-publisher に委譲 | 2026-06-21 新設 (GIS DBレス化) |

## Tier 3: Content - Blog / Note / Ranking (9 体)

| agent | role | 派生元 |
|---|---|---|
| `trend-scout` 🆕 | トレンド発見 (GSC / NotebookLM / 外部ソース) | blog-editor 分割 |
| `blog-editor` | 公開 / 一括公開 / brushup (企画と review は分離) | 既存縮退 |
| `article-writer` | 1 metric → 1 記事 (並列起動量産単位) | 既存 |
| `chart-author` 🆕 | SVG / Remotion チャート生成 (blog / note 共通) | blog-editor + note-manager 分離 |
| `blog-critic` 🆕 | expert review / panel review | blog-editor 分割 |
| `note-manager` | note.com 公開LC / 公開URLトラッキング (完全DBレス: D1 note_articles 廃止、SSOT=R2 `note/<vertical>/<slug>/`。docs/31 は ephemeral outbox。chart は chart-author に委譲) | 既存縮退 |
| `note-critic` 🆕 | note 記事 (A/B/C/D シリーズ) の意味レビュー専任。read-only、verdict を review.md に書き出す。blog-critic の note 版 | 2026-06-22 新設 |
| `ranking-content-author` 🆕 | ranking ページの ai-content (考察/地域傾向/FAQ/県別解説) 生成・是正 + 決定的ゲート (audit-ai-content.mjs)。生成は image-prompt-curator/data-ingester から移管 | 2026-06-21 新設 |
| `ranking-content-critic` 🆕 | ranking ai-content の意味レビュー (重複/読者価値/トーン)。read-only、修正は author に委譲。blog-critic の ranking 版 | 2026-06-21 新設 |

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

## Tier 6: Theme / UI (7 体)

| agent | role | 派生元 |
|---|---|---|
| `theme-designer` | テーマ → IndicatorSet 設計 (どの指標を載せるか) | 既存 |
| `theme-component-builder` | page_components 監査・INSERT (旧 theme-enhancer) | リネーム |
| `theme-ui-manager` 🆕 | テーマページ UI 層の統一・監査・是正 (レイアウト/見出し/セレクタ/カード構成/コピー)。重複セレクタ・古い「地図」コピー等のドリフトを管理 | 2026-06-20 新設 |
| `ranking-ui-manager` 🆕 | ランキングページ (/ranking/*) UI 層の統一・監査・是正 (レイアウト/見出し/パンくず/サイドバー/SEO構造化データ/コピー)。theme-ui-manager の ranking 版。データ=data-ingester、公開=ranking-publisher に委譲 | 2026-06-21 新設 |
| `chart-component-builder` | shadcn UI + D3.js チャートコンポーネント実装・カタログ管理 (chart-component-standards.md が SSoT)。静的 SVG の chart-author とは別物 (React/D3 実装専任) | 既存 (2026-07-03 Tier 表へ追記・棚卸し漏れ是正) |
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
| `ranking-ui-manager` + `ranking-publisher` | `features/ranking/**` (UI) vs `config/*-ranking-keys.ts` + 公開 scripts (publish) で非重複 |
| `ranking-content-author` + `ranking-content-critic` | author=`app/ranking/<key>/ai-content.json` write (key単位) vs critic=read-only。非衝突 |

**禁則**:
- D1 への並列 write 禁止 (better-sqlite3 単一プロセス前提)。同 D1 への `data-ingester` / `db-schema-manager` 起動は逐次
- `docs/02_実装計画/03_改善バックログ.md` への書き込みは `improvement-triage` のみ。analyst 系は `.claude/state/` にしか書かない

## チーム連携パターン (新体制版)

| シナリオ | エージェント連携 |
|---|---|
| ランキング追加 → SNS 一式 | estat-researcher → data-ingester → snapshot-exporter → r2-publisher → ranking-publisher (公開確定) → x/IG/YT-strategist (3 並列) |
| ランキング本番公開 (isActive→200) | ranking-publisher (orchestrator) → data-ingester (観測値確認) → devops-runner (deploy) → /purge-cdn → 本番実測 |
| ランキング UI ドリフト是正 | ranking-ui-manager (監査 → 外科的是正 → localhost 確認、デプロイは ranking-publisher) |
| ranking ai-content 生成 → 公開 | ranking-content-author (生成 → audit-ai-content.mjs) → ranking-content-critic (意味レビュー) → r2-publisher (R2 反映) |
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
| `seo-auditor` | **削除済 (2026-07-03)** | `gsc-analyst` + `ga4-analyst` + `performance-auditor` + `adsense-analyst` (skill 参照の差し替え完了) |
| `sns-renderer` | 役割縮退 (render 専任) | `sns-metrics-sync`, `image-prompt-curator` に分離 |
| `theme-enhancer` | **リネーム済** | `theme-component-builder` |
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
