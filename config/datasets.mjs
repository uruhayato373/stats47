/**
 * datasets.mjs — 事業の設定 (config/)・記録 (data/) と、まだ .claude/ に残る計測・記録・改善のデータの台帳。
 * どのファイルが何のデータで、本来どこに置くかを決める唯一の正本 (doboku-note の scripts/lib/datasets.mjs と同じ考え方)。
 *
 * 1 行 1 データセット: d(id, path, kind, domain, target, 説明, opts)
 *   id      「取得元.データセット」。置き場を移しても変えない
 *   path    repo root からの相対パス。可変部分は SLOTS ({date} {week} {month} {ts} {hash} {name} {**})
 *   kind    KINDS のどれか
 *   domain  config/domains.json の領域 id
 *   target  本来の置き場 (TARGETS)。path の現在地と食い違う行が、data/ への移行 (手順 2) の対象
 *   opts    retain: 日付付きファイルの寿命 (.claude/scripts/lib/prune-state-snapshots.mjs の RETENTION_POLICIES の名前。
 *                   数値はそちらだけに置く) / planned: まだ 1 件も無い
 *
 * 検査は `npm run check-datasets` (.claude/scripts/lib/check-datasets.mjs)。GOVERNED に当たる追跡ファイルは
 * ちょうど 1 行に当たらなければならず、行は 1 件以上のファイルに当たらなければならない。
 * 新しい設定・記録を足すときは、先にここへ 1 行足す。区分の判断は .claude/rules/data-storage.md。
 */
import * as P from "./paths.mjs";

export const KINDS = {
  config: "設定・正本 (人が判断して変える値)",
  ledger: "台帳 (追記で増える事実)",
  series: "時系列 (取得ごとに 1 ファイル、または 1 ファイルへ追記)",
  state: "最新状態 (上書き)",
  report: "人が読む要約",
  evidence: "根拠 (一回きりの調査・作業の記録)",
  asset: "素材の原本 (画像と、その生成の説明・マニフェスト)",
};

/** 本来の置き場。path がこの dir で始まらない行は移行対象 */
export const TARGETS = {
  config: { dir: "config/", label: "事業の台帳と設定" },
  data: { dir: "data/", label: "事業の記録" },
  state: { dir: ".claude/state/", label: "エージェントの作業状態" },
  "agent-config": { dir: ".claude/config/", label: "品質ゲートの基準・閾値" },
  assets: { dir: "assets/", label: "画像などの素材の原本" },
};

/** 完全性を検査する範囲。ここに当たる追跡ファイルは台帳のどれか 1 行に当たらなければならない */
export const GOVERNED = [
  /^config\//,
  /^data\//,
  /^assets\//,
  /^\.claude\/state\//,
  /^\.claude\/skills\/analytics\/[^/]+\/reference\/(snapshots|monthly-snapshots|weekly-snapshots|archive)\//,
  /^\.claude\/skills\/analytics\/[^/]+\/reference\/(improvement-log\.md|budgets[^/]*\.json)$/,
  /^\.claude\/skills\/analytics\/[^/]+\/snapshots\//,
  /^\.claude\/skills\/management\/nsm-experiment\/reference\/weekly-snapshots\//,
  /^\.claude\/skills\/management\/(weekly|monthly)-review\/reference\/reviews\//,
  /^\.claude\/config\/budgets\//,
];
/**
 * 画像を置いてよい場所。ここに当たらない追跡画像は check-datasets が止める (置き場の判断は .claude/rules/data-storage.md)。
 *   assets/            素材の原本 (生成の入力・出力の原本。配信用に変換したものは public か R2 に置く)
 *   apps/*\/public/     アプリがそのまま配信する画像 (コードと一緒にデプロイされる)
 *   packages/*\/src/・packages/*\/data/  パッケージに同梱する画像・図形 (コードが import する・GIS の県形状など)
 *   config/coconala/assets/  ココナラのプロフィール・商品画像 (出品台帳と一緒に人が判断して変える)
 *   .claude/skills/**\/examples/ (と Codex 用ミラー .agents/)  スキルの説明に使う作例
 *   docs/21_ブログ記事原稿/・docs/31_note記事原稿/  公開待ちの原稿 outbox (公開後に CI が消す)
 */
export const IMAGE_ROOTS = [
  /^assets\//,
  /^apps\/[^/]+\/public\//,
  /^packages\/[^/]+\/(?:src|data)\//,
  /^config\/coconala\/assets\//,
  /^\.(?:claude|agents)\/skills\/(?:[^/]+\/)+examples\//,
  /^docs\/(?:21_ブログ記事原稿|31_note記事原稿)\//,
];
export const IMAGE_EXT = /\.(?:png|jpe?g|webp|gif|avif|svg|ico)$/i;

/** 空ディレクトリを保つための印などは対象外 */
/**
 * `.claude/state/` に置いてよいデータセットの許可リスト (id → そこに置く理由)。
 * 判断の基準は「エージェントの運用をやめたら不要になるか」。事業として見返す記録・キュー・監査の結果は data/ へ置く。
 * `.claude/state/` を指す台帳の行がここに無いと check-datasets が止める。足すときは理由を書く。
 */
export const AGENT_STATE = {
  "agent.backlog-loop": "バックログ自動処理の completion gate の証拠",
  "agent.consistency": "Stop hook が読む整合性監査の印",
  "agent.triggers": "RemoteTrigger の登録記録",
  // obsidian vault の mail-triage (毎日 cron) がこのリポへ書く。書き手と置き場はリポ外で決まるので動かさない
  "agent.mail-inbox": "obsidian の mail-triage エージェントがメールから拾ったイベントの受信箱 (売上の正本ではない)",
  "claude.usage": "Claude routine のトークン実績 (エージェントの費用)",
  "claude.model-usage": "モデル選択の最適化の入力",
  "claude.model-canary": "モデル / effort の canary 比較",
  "claude.prompt-evals": "エージェント用プロンプトの評価",
};

export const IGNORED_NAMES = new Set([".gitkeep", ".gitignore"]);

export const SLOTS = {
  "{ts}": "\\d{4}-\\d{2}-\\d{2}T\\d{2}[-:]\\d{2}[-:]\\d{2}(?:[.-]\\d{3})?Z?",
  "{date}": "\\d{4}-\\d{2}-\\d{2}",
  "{week}": "\\d{4}-W\\d{2}",
  "{month}": "\\d{4}-\\d{2}",
  "{hash}": "[0-9a-f]{8,}",
  "{name}": "[^/]+",
  "{**}": ".+",
};

const d = (id, path, kind, domain, target, description, opts = {}) => ({ id, path, kind, domain, target, description, ...opts });

const SA = ".claude/skills/analytics";
const SM = ".claude/state/metrics";

export const DATASETS = [
  // ── config/ : 事業の台帳と設定 ──
  d("config.paths", "config/paths.{name}", "config", "ops", "config", "config/ の置き場の定数 (コードが import する)"),
  d("config.datasets", "config/datasets.{name}", "config", "ops", "config", "この台帳"),
  d("coconala.listings", P.COCONALA_LISTINGS, "config", "product", "config", "ココナラの出品内容と公開状態"),
  d("coconala.account", P.COCONALA_ACCOUNT, "config", "product", "config", "ココナラの期待アカウント (account assert)"),
  d("coconala.profile", P.COCONALA_PROFILE, "config", "product", "config", "ココナラの公開プロフィール文面"),
  d("coconala.assets", `${P.COCONALA_ASSETS_DIR}/{name}`, "config", "product", "config", "ココナラのプロフィール・商品画像と生成プロンプト"),
  d("kdp.listings", P.KDP_LISTINGS, "config", "product", "config", "KDP の出品内容と公開・審査状態"),
  d("kdp.account", P.KDP_ACCOUNT, "config", "product", "config", "KDP の期待アカウント (個人情報は .local 側)"),
  d("note.account", P.NOTE_ACCOUNT, "config", "product", "config", "note の期待アカウント"),
  d("asp.connection", P.AFFILIATE_ASP, "config", "affiliate", "config", "A8 / もしも / afb の接続設定とサイト帰属"),
  d("a8.report-automation", P.A8_REPORT_AUTOMATION, "config", "affiliate", "config", "A8 レポート収集の設定と programIdMap"),
  d("admin.domains", P.DOMAINS, "config", "strategy", "config", "領域の正本 (管理画面のメニュー・backlog の領域タグ)"),
  d("psi.urls", P.PSI_URLS, "config", "site", "config", "PSI の計測対象 URL"),
  d("local.resources", P.LOCAL_RESOURCES, "config", "ops", "config", "端末の容量予算・掃除対象・保持日数"),
  d("source-vault.profiles", P.SOURCE_VAULT, "config", "data", "config", "参考文献 vault の資料 profile"),
  d("web.yoy-batch", P.YOY_BATCH, "config", "data", "config", "前年比時系列のバッチ設定"),

  // ── data/ : 事業の記録 ──
  d("note.cover-assets", "data/note/cover-assets.json", "ledger", "product", "data", "note カバーの生成版・採用版・公開版の台帳"),
  d("note.cover-assets-schema", "data/note/cover-assets.schema.json", "config", "product", "data", "上の台帳の JSON Schema"),
  d("note.hashtags", "config/note-hashtags/{name}.json", "config", "product", "config", "note 記事ごとの承認済みハッシュタグ (人が判断して決める値)"),
  d("seo.keywords", "data/seo/keywords.json", "state", "site", "data", "キーワード改善サイクルの対象キーワード"),
  d("seo.selections", "data/seo/selections/{date}.json", "series", "site", "data", "週ごとの対象キーワードの選定"),
  d("seo.rank-history", "data/seo/rank-history/{date}.json", "series", "site", "data", "対象キーワードの順位の観測"),
  d("seo.rank-history-summary", "data/seo/rank-history.json", "state", "site", "data", "順位の観測の要約"),
  d("seo.proposals", "data/seo/proposals/{name}.json", "evidence", "site", "data", "キーワードごとの改善提案"),
  d("seo.improvement-log", "data/seo/improvement-log.json", "ledger", "site", "data", "キーワード改善の実施記録"),
  d("seo.latest-report", "data/seo/latest-report.json", "report", "site", "data", "キーワード改善サイクルの最新報告"),
  d("seo.latest-review", "data/seo/latest-review.json", "report", "site", "data", "キーワード改善サイクルの最新レビュー"),
  d("seo.automation-rollout", "data/seo/automation-rollout.json", "state", "site", "data", "キーワード改善の自動化の展開状況"),
  d("ai-content.staging", "data/ai-content-staging/{**}", "state", "data", "data", "ランキング AI 解説の公開待ち (push で公開される outbox)"),

  // ── data/<取得元> : 計測 ──
  d("gsc.history", "data/gsc/history.csv", "series", "site", "data", "GSC の週次集約"),
  d("gsc.history-finalized", "data/gsc/history-finalized7d.csv", "series", "site", "data", "GSC の確定 7 日集約"),
  d("gsc.latest", "data/gsc/LATEST.md", "report", "site", "data", "GSC の前週比の要約"),
  d("gsc.priority-ranking-keys", "data/gsc/priority-100-ranking-keys.csv", "evidence", "site", "data", "GSC 表示回数の上位 100 ランキング (2026-09-16 時点の抽出。AI 解説の有無付き)"),
  d("gsc.coverage-drilldown", "data/gsc/coverage-drilldown/{week}/{name}", "series", "site", "data", "GSC カバレッジ 6 種別の週次ドリルダウン"),
  d("gsc.coverage-drilldown-history", "data/gsc/coverage-drilldown/history.csv", "series", "site", "data", "カバレッジ件数の推移"),
  d("gsc.coverage-drilldown-latest", "data/gsc/coverage-drilldown/LATEST.md", "report", "site", "data", "カバレッジの最新要約"),
  d("gsc.url-inspection", "data/gsc/url-inspection/{date}.csv", "series", "site", "data", "URL Inspection の日次詳細", { retain: "gsc" }),
  d("gsc.url-inspection-history", "data/gsc/url-inspection/history.csv", "series", "site", "data", "URL Inspection の長期集計"),
  d("gsc.url-inspection-latest", "data/gsc/url-inspection/LATEST.md", "report", "site", "data", "URL Inspection の最新要約"),
  d("gsc.resubmit-history", "data/gsc/resubmit-history.json", "ledger", "site", "data", "カバレッジ是正の再送信の記録"),
  d("gsc.operations-cycle", "data/gsc/operations-cycle-LATEST.{name}", "state", "site", "data", "GSC 週次運用サイクルの配線検査の結果"),
  d("ga4.history", "data/ga4/history.csv", "series", "site", "data", "GA4 の週次集約"),
  d("ga4.history-finalized", "data/ga4/history-finalized7d.csv", "series", "site", "data", "GA4 の確定 7 日集約"),
  d("ga4.latest", "data/ga4/LATEST.md", "report", "site", "data", "GA4 の前週比の要約"),
  d("psi.batch", "data/psi/psi-batch-{ts}.json", "series", "site", "data", "PSI 日次計測の生 JSON", { retain: "psi" }),
  d("psi.history", "data/psi/history.csv", "series", "site", "data", "PSI の長期履歴"),
  d("psi.latest", "data/psi/LATEST.md", "report", "site", "data", "PSI の最新要約"),
  d("cloudflare.snapshots", "data/cloudflare/snapshots/{date}.json", "series", "ops", "data", "Cloudflare 日次 usage", { retain: "cloudflare" }),
  d("cloudflare.history", "data/cloudflare/history.csv", "series", "ops", "data", "Cloudflare usage の推移"),
  d("cloudflare.latest", "data/cloudflare/LATEST.md", "report", "ops", "data", "Cloudflare usage の最新要約"),
  d("adsense.history", "data/adsense/history{name}", "series", "affiliate", "data", "AdSense の履歴 (2026-09-20 停止後は凍結記録)"),
  d("adsense.reports", "data/adsense/{name}.md", "report", "affiliate", "data", "AdSense の要約・施策 before/after (凍結記録)"),
  d("adsense.candidates", "data/adsense/candidates-latest.json", "state", "affiliate", "data", "AdSense の改善候補 (凍結記録)"),
  d("adsense.past-effects", "data/adsense/past-effects.json", "ledger", "affiliate", "data", "AdSense 施策の効果判定 (凍結記録)"),
  d("a8.report-log", "data/affiliate/a8-report-log.json", "ledger", "affiliate", "data", "A8 の月次レポート (成果・報酬)"),
  d("a8.results", "data/affiliate/a8-results.json", "state", "affiliate", "data", "A8 の確定成果"),
  d("a8.ui-last-run", "data/affiliate/a8-ui-last-run.json", "state", "affiliate", "data", "A8 の画面取得を最後に回した記録"),
  d("moshimo.results", "data/affiliate/moshimo-results.json", "state", "affiliate", "data", "もしもアフィリエイトの成果"),
  d("rakuten.results", "data/affiliate/rakuten-results.json", "state", "affiliate", "data", "楽天アフィリエイトの成果"),
  d("revenue.authenticated", "data/authenticated/{name}.json", "series", "strategy", "data", "認証付き CI が取る売上・計測の最新と推移"),
  d("business.measurement-cycle", "data/measurement-cycle/{name}", "series", "strategy", "data", "週次の計測→記録→改善サイクルのまとめと無人 triage の記録"),
  d("ai-content.history", "data/ai-content/history.csv", "series", "data", "data", "ランキング AI 解説の生成の推移"),
  d("ai-content.latest", "data/ai-content/LATEST.md", "report", "data", "data", "ランキング AI 解説の最新要約"),
  d("note.metrics", "data/note/metrics/note-{date}.json", "series", "product", "data", "note のダッシュボード指標", { retain: "note" }),
  d("note.dashboard", "data/note/dashboard/{name}", "series", "product", "data", "note ダッシュボードの期間別取得とカバーの指標"),
  d("note.navigation-pilot", "data/note/navigation/note-navigation-pilot-{date}.json", "series", "product", "data", "note 回遊パイロットの計測", { retain: "note-navigation" }),
  d("note.cover-rollout", "data/note/{name}-latest.json", "state", "product", "data", "note カバー・カード展開の最新の検査結果"),
  d("note.operation-evidence", "data/note/evidence/note-{name}.json", "evidence", "product", "data", "note の一回きりの監査・更新・展開の記録"),
  d("sns.instagram-publish-log", "data/sns/instagram-publish-log.csv", "ledger", "sns", "data", "Instagram 自動投稿の実行記録"),
  d("page-quality.metrics", "data/page-quality/metrics/{name}", "series", "site", "data", "ページ品質の週次監査の推移と UI 確認"),
  d("claude.usage", `${SM}/claude-usage/{name}`, "series", "ops", "state", "Claude routine のトークン実績"),
  d("claude.model-usage", `${SM}/model-usage/{name}.json`, "state", "ops", "state", "モデル使用量と最適化提案"),
  d("claude.model-canary", `${SM}/model-usage/canary/{date}-{name}.json`, "evidence", "ops", "state", "モデル / effort の canary 比較", { retain: "model-usage-canary" }),
  d("claude.prompt-evals", `${SM}/prompt-evals/{date}.json`, "evidence", "ops", "state", "プロンプト評価の結果"),
  d("ops.monthly-jobs", "data/ci/monthly-jobs/{name}.json", "state", "ops", "data", "月次ジョブの最終実行"),
  d("ops.releases", "data/releases/{date}-{name}.json", "evidence", "ops", "data", "release の検証証跡", { retain: "releases" }),
  d("instagram.token", "data/sns/instagram-token.json", "state", "sns", "data", "Instagram トークンの更新日と期限 (トークン本体は置かない)"),
  d("themes.rollout-evidence", "data/themes/evidence/{date}-{name}.json", "evidence", "data", "data", "テーマ拡充の段階ごとの検証記録"),
  d("affiliate.placement-baseline", "data/affiliate/affiliate-placement-baseline-{date}.json", "evidence", "affiliate", "data", "広告配置変更前の基準値"),
  d("content.release-evidence", "data/content-operations/content-release-{date}.json", "evidence", "data", "data", "コンテンツ公開の検証記録"),
  d("geo.operation-evidence", "data/geo/evidence/geo-{name}-{date}.json", "evidence", "data", "data", "Geo 分析の修復・監査・公開の記録"),

  // ── data/ : アフィリエイト・商品・SNS・検索・判定・事業計画 ──
  d("affiliate.catalog", "data/affiliate/affiliate-catalog.json", "state", "affiliate", "data", "3 ASP の提携台帳"),
  d("a8.catalog", "data/affiliate/a8-catalog.json", "state", "affiliate", "data", "A8 の提携案件の一覧"),
  d("affiliate.experiments", "data/affiliate/experiments.json", "ledger", "affiliate", "data", "アフィリエイト実験の台帳"),
  d("affiliate.experiment-history", "data/affiliate/affiliate-experiment-history.csv", "series", "affiliate", "data", "アフィリエイト実験の推移"),
  d("ga4.affiliate-history", "data/affiliate/ga4-affiliate-history.csv", "series", "affiliate", "data", "GA4 のアフィリエイト実測の週次集約"),
  d("ga4.affiliate-snapshots", "data/affiliate/ga4-affiliate-{date}.json", "series", "affiliate", "data", "GA4 のアフィリエイト実測の生 JSON (2026-09-14 以降は R2)"),
  d("affiliate.inventory", "data/affiliate/inventory-{date}.json", "state", "affiliate", "data", "広告在庫の棚卸しの日付ごとの記録 (最新は affiliate.audits)"),
  d("affiliate.audits", "data/affiliate/{name}-latest.json", "state", "affiliate", "data", "広告の compliance・配置・関連度・突合などの最新の検査結果"),
  d("sales.ledger", "data/products/sales-ledger.json", "ledger", "product", "data", "商品の販売台帳"),
  d("products.free-sample-delivery", "data/products/free-sample-delivery.json", "ledger", "product", "data", "無料見本の配布の記録"),
  d("products.interviews", "data/products/admin-stat-interviews.json", "evidence", "product", "data", "行政実務向け商品の聞き取り"),
  d("kindle.archives", "data/products/kindle-archives.json", "ledger", "product", "data", "KDP へ送った版の暗号化保全の台帳"),
  d("products.publication-receipts", "data/products/{name}-{date}.json", "evidence", "product", "data", "商品の公開・準備の受領記録"),
  d("kdp.weekly-publication", "data/products/kdp-weekly-publication.json", "state", "product", "data", "KDP 週次公開の判定"),
  d("products.status", "data/products/{name}-status.json", "state", "product", "data", "商品・書籍・note の生成と販売準備の状態"),
  d("kindle.verification", "data/products/kindle-{name}-verification.json", "evidence", "product", "data", "Kindle 版ごとの検証記録"),
  d("sns.posts", "data/sns/posts.json", "ledger", "sns", "data", "SNS 投稿台帳 (投稿履歴の正本)"),
  d("sns.post-log", "data/sns/post-log.md", "report", "sns", "data", "SNS 投稿の人が読む記録"),
  d("sns.buzz-map-attribution", "data/sns/buzz-map-attribution-{name}.json", "series", "sns", "data", "バズマップ投稿の流入の計測"),
  d("sns.buzz-map-catalog", "data/sns/buzz-map{name}catalog.json", "state", "sns", "data", "バズマップの作例カタログ"),
  d("sns.drafts", "data/sns/{name}-drafts.md", "state", "sns", "data", "SNS シリーズの下書き"),
  d("gsc.coverage-queue", "data/gsc/coverage-remediation/coverage-remediation-queue.json", "state", "site", "data", "GSC カバレッジ是正キュー"),
  d("gsc.coverage-queue-latest", "data/gsc/coverage-remediation/LATEST.md", "report", "site", "data", "是正キューの要約"),
  d("gsc.coverage-totals", "data/gsc/coverage-totals-history.csv", "series", "site", "data", "カバレッジ件数の推移 (是正キュー側)"),
  d("search-growth.state", "data/search-growth/{name}.json", "state", "site", "data", "検索成長の候補・健全性・抑制台帳"),
  d("search-growth.manifests", "data/search-growth/manifests/{week}.json", "evidence", "site", "data", "検索成長の週次入力の固定", { retain: "search-growth-manifests" }),
  d("effect.verdicts", "data/effect-verdict/verdicts-{week}.json", "ledger", "strategy", "data", "改善施策の効果判定 (閾値エンジン)"),
  d("page-quality.findings", "data/page-quality/{name}", "state", "site", "data", "UI 指摘のキュー"),
  d("page-quality.backlog-batches", "data/page-quality/backlog-batches/{**}", "state", "site", "data", "UI 指摘を backlog カードへ束ねた記録"),
  d("business-plan.state", "data/business-plan/{name}.json", "state", "strategy", "data", "事業計画 SSOT から派生した最新状態と KPI ツリー"),
  d("business-plan.history", "data/business-plan/history/{date}.json", "series", "strategy", "data", "事業計画の派生状態の履歴", { retain: "business-plan" }),
  d("business.experiments", "data/business/experiments.json", "ledger", "strategy", "data", "実験の台帳 (PDCA)"),

  // ── data/ : 2026-10-06 の第 2 段階で .claude/state から移した事業の記録・運用状態 ──
  d("blog.operations", "data/blog/{name}", "state", "site", "data", "ブログの週次指標・是正キュー・トピックキュー・図の系譜と監査・勝ち要因"),
  d("ci.health", "data/ci/{name}", "state", "ops", "data", "workflow の健全性・R2 の鮮度・認証付き計測の追いつき"),
  d("content.note-blockers", "data/content-operations/note-generation-blockers.json", "state", "product", "data", "note 記事生成の止まっている理由"),
  d("data-quality.state", "data/data-quality/{name}", "state", "data", "data", "データ品質の要約・再取り込みキュー・ページ横断の事前検査・SEO メタの基準"),
  d("data-quality.checks", "data/data-quality/checks/{name}", "state", "data", "data", "データ品質の検査キュー"),
  d("estat.candidates", "data/estat/{name}", "state", "data", "data", "e-Stat の拡充キュー・候補の要約・テーマ拡充の検証"),
  d("estat.meta", "data/estat/meta/{**}", "evidence", "data", "data", "e-Stat 統計表のメタ情報の控え"),
  d("estat.year-coverage", "data/estat/year-coverage/{**}", "state", "data", "data", "単年設定の指標の年カバレッジ監査キュー"),
  d("geo.sources", "data/geo/{name}", "state", "data", "data", "Geo 分析の出典ページとサムネイルの監査・公開"),
  d("geo.scope", "data/geo/scope/{name}", "evidence", "data", "data", "Geo の対象範囲の棚卸しと拡充の検証"),
  d("business.goals", "data/goals/{**}", "state", "strategy", "data", "/goal の目標とサイクル"),
  d("ai-content.remediation", "data/ai-content/remediation/{name}", "state", "data", "data", "ランキング AI 解説の是正キュー・生成失敗・進捗"),
  d("municipalities.expansion", "data/municipalities/{name}", "state", "data", "data", "市区町村データの拡充調査と棚卸し"),
  d("note.draft-index", "data/note/note-draft-index.json", "state", "product", "data", "note 下書きの索引"),
  d("note.published-urls", "data/note/note-published-urls.json", "ledger", "product", "data", "note の公開 URL 台帳"),
  d("note.r2-missing", "data/note/r2-missing-inventory.md", "report", "product", "data", "R2 に無い note 素材の一覧"),
  d("ogp.inventory", "data/ogp/{name}", "state", "site", "data", "OGP・カード画像の棚卸し"),
  d("provenance.queue", "data/provenance/{name}", "state", "data", "data", "出典・再現性の是正キュー"),
  d("ranking.audits", "data/ranking/{name}", "state", "data", "data", "ランキングの整合性監査・拡充 wave の索引"),
  d("ranking.wave-drafts", "data/ranking/wave-r1-drafts/{**}", "evidence", "data", "data", "ランキング拡充 wave の下書き"),
  d("site.link-audit", "data/site/{name}", "state", "site", "data", "サイト内リンクの監査"),
  d("sns.ig-posted-log", "data/sns/ig-posted-log.jsonl", "ledger", "sns", "data", "Instagram の投稿済みログ (二重投稿の防止)"),
  d("sns.instagram-schedules", "data/sns/instagram-w{name}-schedule.json", "state", "sns", "data", "Instagram の週ごとの予約表"),
  d("sns.threads-schedule", "data/sns/threads-schedule.json", "state", "sns", "data", "Threads の予約表"),
  d("sns.port-bubble-captions", "data/sns/port-bubble-captions/{name}", "state", "sns", "data", "港湾バブルチャート投稿のキャプション"),
  d("source-inventory.manifests", "data/source-inventory/{**}", "ledger", "data", "data", "参考文献の資料ごとの解決台帳と source bundle manifest"),
  d("surveys.portfolio", "data/surveys/{name}", "state", "data", "data", "調査ポートフォリオ・分類・実験"),
  d("themes.portfolio", "data/themes/{name}", "state", "data", "data", "テーマのポートフォリオ・品質・実験・CI レビュー"),
  d("themes.role-review", "data/themes/role-review/{name}", "state", "data", "data", "テーマの指標の役割レビューキュー"),
  d("themes.chart-audit", "data/themes/charts/{name}", "state", "data", "data", "テーマのチャートの本番監査"),

  // ── .claude/state : エージェント運用の状態 (エージェントの運用をやめたら不要になるものだけ) ──
  d("agent.backlog-loop", ".claude/state/backlog-loop/ledger.json", "ledger", "ops", "state", "バックログ自動処理の実行台帳 (gate の証拠)"),
  d("agent.consistency", ".claude/state/consistency/audited.json", "state", "ops", "state", "整合性監査の印 (Stop hook が読む)"),
  d("agent.triggers", ".claude/state/triggers.json", "state", "ops", "state", "RemoteTrigger の記録"),
  d("agent.mail-inbox", ".claude/state/inbox/mail-events.json", "state", "ops", "state", "obsidian の mail-triage がメールから拾ったイベント (売上の正本ではない。正本は各スクレイパーのログ)"),

  // ── assets/ : 画像などの素材の原本 ──
  d("blog.article-backgrounds", "assets/blog/article-backgrounds/{**}", "asset", "site", "assets", "ブログ記事のサムネイル背景の原本 (サムネイル生成が読む)"),
  d("blog.codex-backgrounds", "assets/blog/codex-backgrounds/{**}", "asset", "site", "assets", "Codex で生成したブログ背景の原本と採用状態"),
  d("ogp.backgrounds", "assets/ogp/{**}", "asset", "site", "assets", "OGP・サムネイルのブランド背景と、その元画像"),
  d("area.specialty-illustrations", "assets/area-specialty/{**}", "asset", "site", "assets", "県ページの特産品イラストの原本 (sync-snapshots が R2 へ反映)"),
  d("site.page-heroes", "assets/page-heroes/{name}", "asset", "site", "assets", "カテゴリ・ホーム・テーマのヒーロー画像の原本 (webp にして apps/web/public へ)"),
  d("design.proposals", "assets/design-proposals/{name}", "asset", "site", "assets", "デザイン提案の画像"),
  d("note.assets", "assets/note/{**}", "asset", "product", "assets", "note の背景・見出し・マガジン表紙の原本と生成の説明・マニフェスト"),
  d("affiliate.banners", "assets/affiliate-banners/{name}", "asset", "affiliate", "assets", "note 記事に貼るアフィリエイトのバナー画像"),

  // ── data/ : 改善ログ・計測スナップショット・レビュー ──
  d("improvement.logs", "data/improvement/{name}/improvement-log.md", "ledger", "strategy", "data", "改善施策の詳細ログ (検証コマンド・仮説・判定)"),
  d("improvement.log-archives", "data/improvement/{name}/archive/{**}", "ledger", "strategy", "data", "改善ログの過去分"),
  d("improvement.budgets", ".claude/config/budgets/{name}/budgets{name}", "config", "site", "agent-config", "計測値の警告閾値"),
  d("gsc.snapshots", "data/gsc/snapshots/{week}/{**}", "series", "site", "data", "GSC の週次生 CSV", { retain: "analytics-gsc" }),
  d("ga4.snapshots", "data/ga4/snapshots/{week}/{**}", "series", "site", "data", "GA4 の週次生 CSV", { retain: "analytics-ga4" }),
  d("adsense.snapshots", "data/adsense/snapshots/{week}/{**}", "series", "affiliate", "data", "AdSense の週次生 CSV (凍結記録)", { retain: "analytics-adsense" }),
  d("cloudflare.cost-snapshots", "data/cloudflare/{name}-snapshots/{name}", "series", "ops", "data", "Cloudflare の月次・週次コストの snapshot"),
  d("psi.metric-snapshots", "data/psi/metric-snapshots/{date}/{name}", "series", "site", "data", "性能指標の snapshot"),
  d("sns.metric-snapshots", "data/sns/metric-snapshots/{date}/{name}", "series", "sns", "data", "SNS 投稿の指標の時系列"),
  d("business.nsm-weekly", "data/nsm/weekly-snapshots/{name}.json", "series", "strategy", "data", "週次収益 (NSM) の snapshot"),
  d("business.weekly-reviews", "data/reviews/weekly/{week}.md", "report", "strategy", "data", "週次レビュー"),
  d("business.monthly-reviews", "data/reviews/monthly/{month}.md", "report", "strategy", "data", "月次レビュー"),
];

/**
 * 移した旧置き場 ({ from, to, since })。コード・workflow・package.json に from が残っていたら check-datasets が止める
 * (旧パスを読んで黙って空になる・旧パスへ書き続けて記録が割れるのを防ぐ)。履歴の記録 (json の出典・md) は対象外。
 */
export const RETIRED = [
  // 画像の原本 (2026-10-06 に assets/ へ)
  { from: "apps/web/scripts/lib/assets", to: "assets/blog・assets/ogp", since: "2026-10-06" },
  { from: "apps/web/scripts/data/area-specialty", to: "assets/area-specialty", since: "2026-10-06" },
  { from: "docs/assets", to: "assets/page-heroes", since: "2026-10-06" },
  { from: ".claude/scripts/note/assets", to: "assets/note", since: "2026-10-06" },
  { from: ".claude/assets/affiliate-banners", to: "assets/affiliate-banners", since: "2026-10-06" },
  { from: ".claude/skills/analytics/gsc-improvement/reference/priority-100-ranking-keys.csv", to: "data/gsc/priority-100-ranking-keys.csv", since: "2026-10-07" },
  // 作業状態 (2026-10-06 の第 2 段階で data/ へ。.claude/state にはエージェント運用の状態だけを残す)
  { from: ".claude/state/ads", to: "data/affiliate", since: "2026-10-06" },
  { from: ".claude/state/ai-content", to: "data/ai-content/remediation", since: "2026-10-06" },
  { from: ".claude/state/blog", to: "data/blog", since: "2026-10-06" },
  { from: ".claude/state/business-plan", to: "data/business-plan", since: "2026-10-06" },
  { from: ".claude/state/ci", to: "data/ci", since: "2026-10-06" },
  { from: ".claude/state/content-operations", to: "data/content-operations", since: "2026-10-06" },
  { from: ".claude/state/data", to: "data/data-quality", since: "2026-10-06" },
  { from: ".claude/state/data/data-quality", to: "data/data-quality/checks", since: "2026-10-06" },
  { from: ".claude/state/data/estat-year-coverage", to: "data/estat/year-coverage", since: "2026-10-06" },
  { from: ".claude/state/estat", to: "data/estat", since: "2026-10-06" },
  { from: ".claude/state/geo", to: "data/geo", since: "2026-10-06" },
  { from: ".claude/state/geo-scope", to: "data/geo/scope", since: "2026-10-06" },
  { from: ".claude/state/goals", to: "data/goals", since: "2026-10-06" },
  { from: ".claude/state/gsc", to: "data/gsc/coverage-remediation", since: "2026-10-06" },
  { from: ".claude/state/ig-posted-log.jsonl", to: "data/sns/ig-posted-log.jsonl", since: "2026-10-06" },
  { from: ".claude/state/instagram-w", to: "data/sns/instagram-w", since: "2026-10-06" },
  { from: ".claude/state/metrics/content-release-", to: "data/content-operations/content-release-", since: "2026-10-06" },
  { from: ".claude/state/metrics/geo-", to: "data/geo/evidence/geo-", since: "2026-10-06" },
  { from: ".claude/state/metrics/gsc/operations-cycle-LATEST.json", to: "data/gsc/operations-cycle-LATEST.json", since: "2026-10-06" },
  { from: ".claude/state/metrics/gsc/operations-cycle-LATEST.md", to: "data/gsc/operations-cycle-LATEST.md", since: "2026-10-06" },
  { from: ".claude/state/metrics/instagram-token.json", to: "data/sns/instagram-token.json", since: "2026-10-06" },
  { from: ".claude/state/metrics/monthly-jobs", to: "data/ci/monthly-jobs", since: "2026-10-06" },
  { from: ".claude/state/metrics/note", to: "data/note", since: "2026-10-06" },
  { from: ".claude/state/metrics/note-", to: "data/note/evidence/note-", since: "2026-10-06" },
  { from: ".claude/state/metrics/page-quality", to: "data/page-quality/metrics", since: "2026-10-06" },
  { from: ".claude/state/metrics/releases", to: "data/releases", since: "2026-10-06" },
  { from: ".claude/state/metrics/themes", to: "data/themes/evidence", since: "2026-10-06" },
  { from: ".claude/state/municipalities", to: "data/municipalities", since: "2026-10-06" },
  { from: ".claude/state/note", to: "data/note", since: "2026-10-06" },
  { from: ".claude/state/note-draft-index.json", to: "data/note/note-draft-index.json", since: "2026-10-06" },
  { from: ".claude/state/note-published-urls.json", to: "data/note/note-published-urls.json", since: "2026-10-06" },
  { from: ".claude/state/ogp", to: "data/ogp", since: "2026-10-06" },
  { from: ".claude/state/page-quality", to: "data/page-quality", since: "2026-10-06" },
  { from: ".claude/state/products", to: "data/products", since: "2026-10-06" },
  { from: ".claude/state/provenance", to: "data/provenance", since: "2026-10-06" },
  { from: ".claude/state/ranking", to: "data/ranking", since: "2026-10-06" },
  { from: ".claude/state/search-growth", to: "data/search-growth", since: "2026-10-06" },
  { from: ".claude/state/site", to: "data/site", since: "2026-10-06" },
  { from: ".claude/state/sns", to: "data/sns", since: "2026-10-06" },
  { from: ".claude/state/sns-port-bubble-captions", to: "data/sns/port-bubble-captions", since: "2026-10-06" },
  { from: ".claude/state/source-inventory", to: "data/source-inventory", since: "2026-10-06" },
  { from: ".claude/state/surveys", to: "data/surveys", since: "2026-10-06" },
  { from: ".claude/state/theme", to: "data/themes/role-review", since: "2026-10-06" },
  { from: ".claude/state/theme-charts", to: "data/themes/charts", since: "2026-10-06" },
  { from: ".claude/state/themes", to: "data/themes", since: "2026-10-06" },
  { from: ".claude/state/threads-schedule.json", to: "data/sns/threads-schedule.json", since: "2026-10-06" },
  // 計測・記録 (2026-10-06 に data/ へ)
  { from: ".claude/state/metrics/psi", to: "data/psi", since: "2026-10-06" },
  { from: ".claude/skills/analytics/adsense-improvement/reference/budgets.json", to: ".claude/config/budgets/adsense-improvement/budgets.json", since: "2026-10-06" },
  { from: ".claude/skills/analytics/adsense-improvement/reference/improvement-log.md", to: "data/improvement/adsense-improvement/improvement-log.md", since: "2026-10-06" },
  { from: ".claude/skills/analytics/adsense-improvement/reference/snapshots", to: "data/adsense/snapshots", since: "2026-10-06" },
  { from: ".claude/skills/analytics/affiliate-improvement/reference", to: "data/improvement/affiliate-improvement", since: "2026-10-06" },
  { from: ".claude/skills/analytics/cloudflare-cost-improvement/reference/budgets-daily.json", to: ".claude/config/budgets/cloudflare-cost-improvement/budgets-daily.json", since: "2026-10-06" },
  { from: ".claude/skills/analytics/cloudflare-cost-improvement/reference/budgets.json", to: ".claude/config/budgets/cloudflare-cost-improvement/budgets.json", since: "2026-10-06" },
  { from: ".claude/skills/analytics/cloudflare-cost-improvement/reference/improvement-log.md", to: "data/improvement/cloudflare-cost-improvement/improvement-log.md", since: "2026-10-06" },
  { from: ".claude/skills/analytics/cloudflare-cost-improvement/reference/monthly-snapshots", to: "data/cloudflare/monthly-snapshots", since: "2026-10-06" },
  { from: ".claude/skills/analytics/cloudflare-cost-improvement/reference/weekly-snapshots", to: "data/cloudflare/weekly-snapshots", since: "2026-10-06" },
  { from: ".claude/skills/analytics/ga4-improvement/reference/archive", to: "data/improvement/ga4-improvement/archive", since: "2026-10-06" },
  { from: ".claude/skills/analytics/ga4-improvement/reference/budgets.json", to: ".claude/config/budgets/ga4-improvement/budgets.json", since: "2026-10-06" },
  { from: ".claude/skills/analytics/ga4-improvement/reference/improvement-log.md", to: "data/improvement/ga4-improvement/improvement-log.md", since: "2026-10-06" },
  { from: ".claude/skills/analytics/ga4-improvement/reference/snapshots", to: "data/ga4/snapshots", since: "2026-10-06" },
  { from: ".claude/skills/analytics/gsc-improvement/reference/archive", to: "data/improvement/gsc-improvement/archive", since: "2026-10-06" },
  { from: ".claude/skills/analytics/gsc-improvement/reference/budgets.json", to: ".claude/config/budgets/gsc-improvement/budgets.json", since: "2026-10-06" },
  { from: ".claude/skills/analytics/gsc-improvement/reference/improvement-log.md", to: "data/improvement/gsc-improvement/improvement-log.md", since: "2026-10-06" },
  { from: ".claude/skills/analytics/gsc-improvement/reference/snapshots", to: "data/gsc/snapshots", since: "2026-10-06" },
  { from: ".claude/skills/analytics/performance-improvement/reference", to: "data/improvement/performance-improvement", since: "2026-10-06" },
  { from: ".claude/skills/analytics/performance-improvement/snapshots", to: "data/psi/metric-snapshots", since: "2026-10-06" },
  { from: ".claude/skills/analytics/sns-metrics-improvement/reference", to: "data/improvement/sns-metrics-improvement", since: "2026-10-06" },
  { from: ".claude/skills/analytics/sns-metrics-improvement/snapshots", to: "data/sns/metric-snapshots", since: "2026-10-06" },
  { from: ".claude/skills/management/monthly-review/reference/reviews", to: "data/reviews/monthly", since: "2026-10-06" },
  { from: ".claude/skills/management/nsm-experiment/reference/weekly-snapshots", to: "data/nsm/weekly-snapshots", since: "2026-10-06" },
  { from: ".claude/skills/management/weekly-review/reference/reviews", to: "data/reviews/weekly", since: "2026-10-06" },
  { from: ".claude/state/ads/a8-catalog.json", to: "data/affiliate/a8-catalog.json", since: "2026-10-06" },
  { from: ".claude/state/ads/affiliate-catalog.json", to: "data/affiliate/affiliate-catalog.json", since: "2026-10-06" },
  { from: ".claude/state/ads/affiliate-experiment-history.csv", to: "data/affiliate/affiliate-experiment-history.csv", since: "2026-10-06" },
  { from: ".claude/state/ads/experiments.json", to: "data/affiliate/experiments.json", since: "2026-10-06" },
  { from: ".claude/state/ads/ga4-affiliate-", to: "data/affiliate/ga4-affiliate-", since: "2026-10-06" },
  { from: ".claude/state/effect-verdict", to: "data/effect-verdict", since: "2026-10-06" },
  { from: ".claude/state/experiments.json", to: "data/business/experiments.json", since: "2026-10-06" },
  { from: ".claude/state/gsc/coverage-totals-history.csv", to: "data/gsc/coverage-totals-history.csv", since: "2026-10-06" },
  { from: ".claude/state/metrics/adsense", to: "data/adsense", since: "2026-10-06" },
  { from: ".claude/state/metrics/affiliate", to: "data/affiliate", since: "2026-10-06" },
  { from: ".claude/state/metrics/affiliate-placement-baseline-", to: "data/affiliate/affiliate-placement-baseline-", since: "2026-10-06" },
  { from: ".claude/state/metrics/ai-content", to: "data/ai-content", since: "2026-10-06" },
  { from: ".claude/state/metrics/authenticated", to: "data/authenticated", since: "2026-10-06" },
  { from: ".claude/state/metrics/blog", to: "data/blog", since: "2026-10-06" },
  { from: ".claude/state/metrics/cloudflare", to: "data/cloudflare", since: "2026-10-06" },
  { from: ".claude/state/metrics/ga4", to: "data/ga4", since: "2026-10-06" },
  { from: ".claude/state/metrics/gsc/coverage-drilldown", to: "data/gsc/coverage-drilldown", since: "2026-10-06" },
  { from: ".claude/state/metrics/gsc/history-finalized7d.csv", to: "data/gsc/history-finalized7d.csv", since: "2026-10-06" },
  { from: ".claude/state/metrics/gsc/history.csv", to: "data/gsc/history.csv", since: "2026-10-06" },
  { from: ".claude/state/metrics/gsc/LATEST.md", to: "data/gsc/LATEST.md", since: "2026-10-06" },
  { from: ".claude/state/metrics/gsc/resubmit-history.json", to: "data/gsc/resubmit-history.json", since: "2026-10-06" },
  { from: ".claude/state/metrics/gsc/url-inspection", to: "data/gsc/url-inspection", since: "2026-10-06" },
  { from: ".claude/state/metrics/measurement-cycle", to: "data/measurement-cycle", since: "2026-10-06" },
  { from: ".claude/state/metrics/note/dashboard", to: "data/note/dashboard", since: "2026-10-06" },
  { from: ".claude/state/metrics/note/navigation", to: "data/note/navigation", since: "2026-10-06" },
  { from: ".claude/state/metrics/note/note-", to: "data/note/metrics/note-", since: "2026-10-06" },
  { from: ".claude/state/metrics/sns", to: "data/sns", since: "2026-10-06" },
  { from: ".claude/state/products/admin-stat-interviews.json", to: "data/products/admin-stat-interviews.json", since: "2026-10-06" },
  { from: ".claude/state/products/coconala-packs-2026-09-06.json", to: "data/products/coconala-packs-2026-09-06.json", since: "2026-10-06" },
  { from: ".claude/state/products/coconala-profile-2026-09-06.json", to: "data/products/coconala-profile-2026-09-06.json", since: "2026-10-06" },
  { from: ".claude/state/products/free-sample-delivery.json", to: "data/products/free-sample-delivery.json", since: "2026-10-06" },
  { from: ".claude/state/products/geo-service-readiness-2026-09-06.json", to: "data/products/geo-service-readiness-2026-09-06.json", since: "2026-10-06" },
  { from: ".claude/state/products/kindle-archives.json", to: "data/products/kindle-archives.json", since: "2026-10-06" },
  { from: ".claude/state/products/sales-ledger.json", to: "data/products/sales-ledger.json", since: "2026-10-06" },
  { from: ".claude/state/sns/buzz-map-attribution-", to: "data/sns/buzz-map-attribution-", since: "2026-10-06" },
  { from: ".claude/state/sns/post-log.md", to: "data/sns/post-log.md", since: "2026-10-06" },
  { from: ".claude/state/sns/posts.json", to: "data/sns/posts.json", since: "2026-10-06" },
  { from: "data/note/hashtags", to: "config/note-hashtags", since: "2026-10-06" },
];

const BY_ID = new Map(DATASETS.map((ds) => [ds.id, ds]));
const lookup = (id) => {
  const ds = BY_ID.get(id);
  if (!ds) throw new Error(`台帳に無いデータセット: ${id}`);
  return ds;
};

/** 可変部分の無いデータセットの repo 相対パス。コードは置き場を直書きせずこれで引く */
export function datasetPath(id) {
  const ds = lookup(id);
  if (ds.path.includes("{")) throw new Error(`${id} は可変部分を持つので datasetDir を使う: ${ds.path}`);
  return ds.path;
}

/** データセットが置かれるディレクトリ (可変部分より前・末尾の / なし) */
export function datasetDir(id) {
  const { path } = lookup(id);
  const i = path.indexOf("{");
  const fixed = i < 0 ? path : path.slice(0, i);
  return fixed.slice(0, fixed.lastIndexOf("/"));
}
