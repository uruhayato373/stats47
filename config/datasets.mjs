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
};

/** 本来の置き場。path がこの dir で始まらない行は移行対象 */
export const TARGETS = {
  config: { dir: "config/", label: "事業の台帳と設定" },
  data: { dir: "data/", label: "事業の記録" },
  state: { dir: ".claude/state/", label: "エージェントの作業状態" },
  "agent-config": { dir: ".claude/config/", label: "品質ゲートの基準・閾値" },
};

/** 完全性を検査する範囲。ここに当たる追跡ファイルは台帳のどれか 1 行に当たらなければならない */
export const GOVERNED = [
  /^config\//,
  /^data\//,
  /^\.claude\/state\/(metrics|ads|products|sns|gsc|search-growth|effect-verdict|page-quality|business-plan)\//,
  /^\.claude\/state\/experiments\.json$/,
  /^\.claude\/skills\/analytics\/[^/]+\/reference\/(snapshots|monthly-snapshots|weekly-snapshots|archive)\//,
  /^\.claude\/skills\/analytics\/[^/]+\/reference\/(improvement-log\.md|budgets[^/]*\.json)$/,
  /^\.claude\/skills\/analytics\/[^/]+\/snapshots\//,
  /^\.claude\/skills\/management\/nsm-experiment\/reference\/weekly-snapshots\//,
  /^\.claude\/skills\/management\/(weekly|monthly)-review\/reference\/reviews\//,
];
/** 空ディレクトリを保つための印などは対象外 */
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
  d("config.datasets", "config/datasets.mjs", "config", "ops", "config", "この台帳"),
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
  d("note.hashtags", "data/note/hashtags/{name}.json", "config", "product", "config", "note 記事ごとの承認済みハッシュタグ (人が判断して決める値)"),
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

  // ── .claude/state/metrics : 計測 ──
  d("gsc.history", `${SM}/gsc/history.csv`, "series", "site", "data", "GSC の週次集約"),
  d("gsc.history-finalized", `${SM}/gsc/history-finalized7d.csv`, "series", "site", "data", "GSC の確定 7 日集約"),
  d("gsc.latest", `${SM}/gsc/LATEST.md`, "report", "site", "data", "GSC の前週比の要約"),
  d("gsc.coverage-drilldown", `${SM}/gsc/coverage-drilldown/{week}/{name}`, "series", "site", "data", "GSC カバレッジ 6 種別の週次ドリルダウン"),
  d("gsc.coverage-drilldown-history", `${SM}/gsc/coverage-drilldown/history.csv`, "series", "site", "data", "カバレッジ件数の推移"),
  d("gsc.coverage-drilldown-latest", `${SM}/gsc/coverage-drilldown/LATEST.md`, "report", "site", "data", "カバレッジの最新要約"),
  d("gsc.url-inspection", `${SM}/gsc/url-inspection/{date}.csv`, "series", "site", "data", "URL Inspection の日次詳細", { retain: "gsc" }),
  d("gsc.url-inspection-history", `${SM}/gsc/url-inspection/history.csv`, "series", "site", "data", "URL Inspection の長期集計"),
  d("gsc.url-inspection-latest", `${SM}/gsc/url-inspection/LATEST.md`, "report", "site", "data", "URL Inspection の最新要約"),
  d("gsc.resubmit-history", `${SM}/gsc/resubmit-history.json`, "ledger", "site", "data", "カバレッジ是正の再送信の記録"),
  d("gsc.operations-cycle", `${SM}/gsc/operations-cycle-LATEST.{name}`, "state", "site", "state", "GSC 週次運用サイクルの配線検査の結果"),
  d("ga4.history", `${SM}/ga4/history.csv`, "series", "site", "data", "GA4 の週次集約"),
  d("ga4.history-finalized", `${SM}/ga4/history-finalized7d.csv`, "series", "site", "data", "GA4 の確定 7 日集約"),
  d("ga4.latest", `${SM}/ga4/LATEST.md`, "report", "site", "data", "GA4 の前週比の要約"),
  d("psi.batch", `${SM}/psi/psi-batch-{ts}.json`, "series", "site", "data", "PSI 日次計測の生 JSON", { retain: "psi" }),
  d("psi.history", `${SM}/psi/history.csv`, "series", "site", "data", "PSI の長期履歴"),
  d("psi.latest", `${SM}/psi/LATEST.md`, "report", "site", "data", "PSI の最新要約"),
  d("cloudflare.snapshots", `${SM}/cloudflare/snapshots/{date}.json`, "series", "ops", "data", "Cloudflare 日次 usage", { retain: "cloudflare" }),
  d("cloudflare.history", `${SM}/cloudflare/history.csv`, "series", "ops", "data", "Cloudflare usage の推移"),
  d("cloudflare.latest", `${SM}/cloudflare/LATEST.md`, "report", "ops", "data", "Cloudflare usage の最新要約"),
  d("adsense.history", `${SM}/adsense/history{name}`, "series", "affiliate", "data", "AdSense の履歴 (2026-09-20 停止後は凍結記録)"),
  d("adsense.reports", `${SM}/adsense/{name}.md`, "report", "affiliate", "data", "AdSense の要約・施策 before/after (凍結記録)"),
  d("adsense.candidates", `${SM}/adsense/candidates-latest.json`, "state", "affiliate", "data", "AdSense の改善候補 (凍結記録)"),
  d("adsense.past-effects", `${SM}/adsense/past-effects.json`, "ledger", "affiliate", "data", "AdSense 施策の効果判定 (凍結記録)"),
  d("a8.report-log", `${SM}/affiliate/a8-report-log.json`, "ledger", "affiliate", "data", "A8 の月次レポート (成果・報酬)"),
  d("a8.results", `${SM}/affiliate/a8-results.json`, "state", "affiliate", "data", "A8 の確定成果"),
  d("a8.ui-last-run", `${SM}/affiliate/a8-ui-last-run.json`, "state", "affiliate", "data", "A8 の画面取得を最後に回した記録"),
  d("moshimo.results", `${SM}/affiliate/moshimo-results.json`, "state", "affiliate", "data", "もしもアフィリエイトの成果"),
  d("rakuten.results", `${SM}/affiliate/rakuten-results.json`, "state", "affiliate", "data", "楽天アフィリエイトの成果"),
  d("revenue.authenticated", `${SM}/authenticated/{name}.json`, "series", "strategy", "data", "認証付き CI が取る売上・計測の最新と推移"),
  d("business.measurement-cycle", `${SM}/measurement-cycle/{name}`, "series", "strategy", "data", "週次の計測→記録→改善サイクルのまとめと無人 triage の記録"),
  d("blog.history", `${SM}/blog/history.csv`, "series", "site", "data", "ブログの週次指標"),
  d("ai-content.history", `${SM}/ai-content/history.csv`, "series", "data", "data", "ランキング AI 解説の生成の推移"),
  d("ai-content.latest", `${SM}/ai-content/LATEST.md`, "report", "data", "data", "ランキング AI 解説の最新要約"),
  d("note.metrics", `${SM}/note/note-{date}.json`, "series", "product", "data", "note のダッシュボード指標", { retain: "note" }),
  d("note.dashboard", `${SM}/note/dashboard/{name}`, "series", "product", "data", "note ダッシュボードの期間別取得とカバーの指標"),
  d("note.navigation-pilot", `${SM}/note/navigation/note-navigation-pilot-{date}.json`, "series", "product", "data", "note 回遊パイロットの計測", { retain: "note-navigation" }),
  d("note.cover-rollout", `${SM}/note/{name}-latest.json`, "state", "product", "state", "note カバー・カード展開の最新の検査結果"),
  d("note.operation-evidence", `${SM}/note-{name}.json`, "evidence", "product", "state", "note の一回きりの監査・更新・展開の記録"),
  d("sns.instagram-publish-log", `${SM}/sns/instagram-publish-log.csv`, "ledger", "sns", "data", "Instagram 自動投稿の実行記録"),
  d("page-quality.metrics", `${SM}/page-quality/{name}`, "series", "site", "state", "ページ品質の週次監査の推移と UI 確認"),
  d("claude.usage", `${SM}/claude-usage/{name}`, "series", "ops", "state", "Claude routine のトークン実績"),
  d("claude.model-usage", `${SM}/model-usage/{name}.json`, "state", "ops", "state", "モデル使用量と最適化提案"),
  d("claude.model-canary", `${SM}/model-usage/canary/{date}-{name}.json`, "evidence", "ops", "state", "モデル / effort の canary 比較", { retain: "model-usage-canary" }),
  d("claude.prompt-evals", `${SM}/prompt-evals/{date}.json`, "evidence", "ops", "state", "プロンプト評価の結果"),
  d("ops.monthly-jobs", `${SM}/monthly-jobs/{name}.json`, "state", "ops", "state", "月次ジョブの最終実行"),
  d("ops.releases", `${SM}/releases/{date}-{name}.json`, "evidence", "ops", "state", "release の検証証跡", { retain: "releases" }),
  d("instagram.token", `${SM}/instagram-token.json`, "state", "sns", "state", "Instagram トークンの更新日と期限 (トークン本体は置かない)"),
  d("themes.rollout-evidence", `${SM}/themes/{date}-{name}.json`, "evidence", "data", "state", "テーマ拡充の段階ごとの検証記録"),
  d("affiliate.placement-baseline", `${SM}/affiliate-placement-baseline-{date}.json`, "evidence", "affiliate", "data", "広告配置変更前の基準値"),
  d("content.release-evidence", `${SM}/content-release-{date}.json`, "evidence", "data", "state", "コンテンツ公開の検証記録"),
  d("geo.operation-evidence", `${SM}/geo-{name}-{date}.json`, "evidence", "data", "state", "Geo 分析の修復・監査・公開の記録"),

  // ── .claude/state : アフィリエイト・商品・SNS・検索・判定・事業計画 ──
  d("affiliate.catalog", ".claude/state/ads/affiliate-catalog.json", "state", "affiliate", "data", "3 ASP の提携台帳"),
  d("a8.catalog", ".claude/state/ads/a8-catalog.json", "state", "affiliate", "data", "A8 の提携案件の一覧"),
  d("affiliate.experiments", ".claude/state/ads/experiments.json", "ledger", "affiliate", "data", "アフィリエイト実験の台帳"),
  d("affiliate.experiment-history", ".claude/state/ads/affiliate-experiment-history.csv", "series", "affiliate", "data", "アフィリエイト実験の推移"),
  d("ga4.affiliate-history", ".claude/state/ads/ga4-affiliate-history.csv", "series", "affiliate", "data", "GA4 のアフィリエイト実測の週次集約"),
  d("ga4.affiliate-snapshots", ".claude/state/ads/ga4-affiliate-{date}.json", "series", "affiliate", "data", "GA4 のアフィリエイト実測の生 JSON (2026-09-14 以降は R2)"),
  d("affiliate.inventory", ".claude/state/ads/inventory-{date}.json", "state", "affiliate", "state", "広告在庫の棚卸しの日付ごとの記録 (最新は affiliate.audits)"),
  d("affiliate.audits", ".claude/state/ads/{name}-latest.json", "state", "affiliate", "state", "広告の compliance・配置・関連度・突合などの最新の検査結果"),
  d("sales.ledger", ".claude/state/products/sales-ledger.json", "ledger", "product", "data", "商品の販売台帳"),
  d("products.free-sample-delivery", ".claude/state/products/free-sample-delivery.json", "ledger", "product", "data", "無料見本の配布の記録"),
  d("products.interviews", ".claude/state/products/admin-stat-interviews.json", "evidence", "product", "data", "行政実務向け商品の聞き取り"),
  d("kindle.archives", ".claude/state/products/kindle-archives.json", "ledger", "product", "data", "KDP へ送った版の暗号化保全の台帳"),
  d("products.publication-receipts", ".claude/state/products/{name}-{date}.json", "evidence", "product", "data", "商品の公開・準備の受領記録"),
  d("kdp.weekly-publication", ".claude/state/products/kdp-weekly-publication.json", "state", "product", "state", "KDP 週次公開の判定"),
  d("products.status", ".claude/state/products/{name}-status.json", "state", "product", "state", "商品・書籍・note の生成と販売準備の状態"),
  d("kindle.verification", ".claude/state/products/kindle-{name}-verification.json", "evidence", "product", "state", "Kindle 版ごとの検証記録"),
  d("sns.posts", ".claude/state/sns/posts.json", "ledger", "sns", "data", "SNS 投稿台帳 (投稿履歴の正本)"),
  d("sns.post-log", ".claude/state/sns/post-log.md", "report", "sns", "data", "SNS 投稿の人が読む記録"),
  d("sns.buzz-map-attribution", ".claude/state/sns/buzz-map-attribution-{name}.json", "series", "sns", "data", "バズマップ投稿の流入の計測"),
  d("sns.buzz-map-catalog", ".claude/state/sns/buzz-map{name}catalog.json", "state", "sns", "state", "バズマップの作例カタログ"),
  d("sns.drafts", ".claude/state/sns/{name}-drafts.md", "state", "sns", "state", "SNS シリーズの下書き"),
  d("gsc.coverage-queue", ".claude/state/gsc/coverage-remediation-queue.json", "state", "site", "state", "GSC カバレッジ是正キュー"),
  d("gsc.coverage-queue-latest", ".claude/state/gsc/LATEST.md", "report", "site", "state", "是正キューの要約"),
  d("gsc.coverage-totals", ".claude/state/gsc/coverage-totals-history.csv", "series", "site", "data", "カバレッジ件数の推移 (是正キュー側)"),
  d("search-growth.state", ".claude/state/search-growth/{name}.json", "state", "site", "state", "検索成長の候補・健全性・抑制台帳"),
  d("search-growth.manifests", ".claude/state/search-growth/manifests/{week}.json", "evidence", "site", "state", "検索成長の週次入力の固定", { retain: "search-growth-manifests" }),
  d("effect.verdicts", ".claude/state/effect-verdict/verdicts-{week}.json", "ledger", "strategy", "data", "改善施策の効果判定 (閾値エンジン)"),
  d("page-quality.findings", ".claude/state/page-quality/{**}", "state", "site", "state", "UI 指摘のキューと backlog への束ね"),
  d("business-plan.state", ".claude/state/business-plan/{name}.json", "state", "strategy", "state", "事業計画 SSOT から派生した最新状態と KPI ツリー"),
  d("business-plan.history", ".claude/state/business-plan/history/{date}.json", "series", "strategy", "state", "事業計画の派生状態の履歴", { retain: "business-plan" }),
  d("business.experiments", ".claude/state/experiments.json", "ledger", "strategy", "data", "実験の台帳 (PDCA)"),

  // ── .claude/skills : 改善ログ・計測スナップショット・レビュー ──
  d("improvement.logs", `${SA}/{name}/reference/improvement-log.md`, "ledger", "strategy", "data", "改善施策の詳細ログ (検証コマンド・仮説・判定)"),
  d("improvement.log-archives", `${SA}/{name}/reference/archive/{**}`, "ledger", "strategy", "data", "改善ログの過去分"),
  d("improvement.budgets", `${SA}/{name}/reference/budgets{name}`, "config", "site", "agent-config", "計測値の警告閾値"),
  d("gsc.snapshots", `${SA}/gsc-improvement/reference/snapshots/{week}/{**}`, "series", "site", "data", "GSC の週次生 CSV", { retain: "analytics-gsc" }),
  d("ga4.snapshots", `${SA}/ga4-improvement/reference/snapshots/{week}/{**}`, "series", "site", "data", "GA4 の週次生 CSV", { retain: "analytics-ga4" }),
  d("adsense.snapshots", `${SA}/adsense-improvement/reference/snapshots/{week}/{**}`, "series", "affiliate", "data", "AdSense の週次生 CSV (凍結記録)", { retain: "analytics-adsense" }),
  d("cloudflare.cost-snapshots", `${SA}/cloudflare-cost-improvement/reference/{name}-snapshots/{name}`, "series", "ops", "data", "Cloudflare の月次・週次コストの snapshot"),
  d("psi.metric-snapshots", `${SA}/performance-improvement/snapshots/{date}/{name}`, "series", "site", "data", "性能指標の snapshot"),
  d("sns.metric-snapshots", `${SA}/sns-metrics-improvement/snapshots/{date}/{name}`, "series", "sns", "data", "SNS 投稿の指標の時系列"),
  d("business.nsm-weekly", ".claude/skills/management/nsm-experiment/reference/weekly-snapshots/{name}.json", "series", "strategy", "data", "週次収益 (NSM) の snapshot"),
  d("business.weekly-reviews", ".claude/skills/management/weekly-review/reference/reviews/{week}.md", "report", "strategy", "data", "週次レビュー"),
  d("business.monthly-reviews", ".claude/skills/management/monthly-review/reference/reviews/{month}.md", "report", "strategy", "data", "月次レビュー"),
];

/**
 * 移した旧置き場 ({ from, to, since })。コード・workflow・package.json に from が残っていたら check-datasets が止める
 * (旧パスを読んで黙って空になる・旧パスへ書き続けて記録が割れるのを防ぐ)。履歴の記録 (json の出典・md) は対象外。
 */
export const RETIRED = [];

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
