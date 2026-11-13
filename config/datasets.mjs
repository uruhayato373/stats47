/**
 * datasets.mjs — カタログ (RDB のシステムカタログ)。どのファイルが何のデータで、どこに置くかを決める唯一の正本。
 *
 * DB にあたるのはマスタと台帳 (種類 master・ledger) で、data/ に JSON + Schema で置く。関係は ID で結び refs に宣言する。
 * config/ はシステムの設定だけ、packages/ と apps/ は型・読み込み・検査の関数とアプリだけを持つ (2026-11-10 オーナー決定)。
 * 規則はこの 3 行だけで、守らせるのは check-datasets の検査 (下の SYSTEM_CONFIG・CONFIG_MOVE_PENDING・OUTSIDE_DATA・DATA_README_PENDING)。
 *
 * 1 行 1 データセット: d(id, path, kind, domain, target, 説明, opts)
 *   id      「取得元.データセット」。置き場を移しても変えない
 *   path    repo root からの相対パス。可変部分は SLOTS ({date} {week} {month} {ts} {hash} {name} {**})
 *   kind    KINDS のどれか
 *   domain  data/business/domains.json の領域 id
 *   target  本来の置き場 (TARGETS)。path の現在地と食い違う行が、data/ への移行 (手順 2) の対象
 *   opts    schema: 形状契約 (JSON Schema) のパス。kind が master / ledger / config で path が .json の行は必須。それ以外の kind も
 *                   宣言すれば検証する (check-datasets。判断に使う記録は書き手も .claude/scripts/lib/dataset-shape.mjs で書く前に検証)
 *           retain: 日付付きファイルの寿命 (.claude/scripts/lib/prune-state-snapshots.mjs の RETENTION_POLICIES の名前。
 *                   数値はそちらだけに置く) / planned: まだ 1 件も無い (追跡ファイルができたら外す。check-datasets が落とす)
 *           r2State: 正本は private R2 のこの prefix。手元は git 管理外の live/ に置く (npm run media:state:pull / push)。
 *                    git の追跡ファイルに当たらなくてよい (2026-10-18 オーナー判断: 画像まわりの派生データは R2)
 *           refs:   この台帳の ID が指す先 (外部キー相当。2026-10-26)。下の「REFS の書き方」
 *
 * 検査は `npm run check-datasets` (.claude/scripts/lib/check-datasets.mjs)。GOVERNED に当たる追跡ファイルは
 * ちょうど 1 行に当たらなければならず、行は 1 件以上のファイルに当たらなければならない。
 * 新しい設定・記録を足すときは、先にここへ 1 行足す。区分の判断は .claude/rules/data-storage.md。
 */
import * as P from "./paths.mjs";

/**
 * 種類。master と ledger が DB にあたる (RDB のテーブル)。置き場との対応は check-datasets が止める:
 *   master・ledger → data/ (移行待ちの例外は CONFIG_MOVE_PENDING) / config → config/ か .claude/config/ / schema → *.schema.json
 */
export const KINDS = {
  master: "マスタ (ほかから ID で指される ID の集合。人が判断して変える)",
  ledger: "台帳 (判断して増える記録・ID に付く本文)",
  config: "システムの設定 (DB ではない。アカウント・接続先・パス・予算・閾値)",
  schema: "形の契約 (JSON Schema)",
  series: "時系列 (取得ごとに 1 ファイル、または 1 ファイルへ追記)",
  state: "最新状態 (上書き)",
  report: "人が読む要約",
  evidence: "根拠 (一回きりの調査・作業の記録)",
  asset: "素材の原本 (画像と、その生成の説明・マニフェスト)",
  outbox: "公開待ちの原稿 (公開後に CI が消す。公開した記事の正本は R2)",
};

/** 本来の置き場。path がこの dir で始まらない行は移行対象 */
export const TARGETS = {
  config: { dir: "config/", label: "事業の台帳と設定" },
  data: { dir: "data/", label: "事業の記録" },
  state: { dir: ".claude/state/", label: "エージェントの作業状態" },
  "agent-config": { dir: ".claude/config/", label: "品質ゲートの基準・閾値" },
  assets: { dir: "assets/", label: "画像などの素材の原本" },
  contents: { dir: "contents/", label: "公開待ちの原稿" },
};

/** 完全性を検査する範囲。ここに当たる追跡ファイルは台帳のどれか 1 行に当たらなければならない */
export const GOVERNED = [
  /^config\//,
  /^data\//,
  /^assets\//,
  /^contents\//,
  /^\.claude\/state\//,
  /^\.claude\/skills\/analytics\/[^/]+\/reference\/(snapshots|monthly-snapshots|weekly-snapshots|archive)\//,
  /^\.claude\/skills\/analytics\/[^/]+\/reference\/(improvement-log\.md|budgets[^/]*\.json)$/,
  /^\.claude\/skills\/analytics\/[^/]+\/snapshots\//,
  /^\.claude\/skills\/management\/nsm-experiment\/reference\/weekly-snapshots\//,
  /^\.claude\/skills\/management\/(weekly|monthly)-review\/reference\/reviews\//,
  // 監査・レビューの全文と定期レポートは skill の reference/ に置かない (2026-11-14。置き場は data/<領域>/{reviews,audits}/ と
  // data/<取得元>/<レポートの名前>/)。行が無い置き場なので、ここへ置いた追跡ファイルは「未宣言」で落ちる
  /^\.claude\/skills\/(?:[^/]+\/)+reference\/(reviews|audits|reports)\//,
  /^\.claude\/config\/budgets\//,
];
/**
 * 画像を置いてよい場所。ここに当たらない追跡画像は check-datasets が止める (置き場の判断は .claude/rules/data-storage.md)。
 *   assets/            素材の原本 (生成の入力・出力の原本。配信用に変換したものは public か R2 に置く)
 *   apps/*\/public/     アプリがそのまま配信する画像 (コードと一緒にデプロイされる)
 *   packages/*\/src/・packages/*\/data/  パッケージに同梱する画像・図形 (コードが import する・GIS の県形状など)
 *   .claude/skills/**\/examples/ (と Codex 用ミラー .agents/)  スキルの説明に使う作例
 *   contents/blog/  ブログの公開待ち原稿 outbox (公開後に CI が消す)。note の原稿は git に置かない (正本は R2)
 */
export const IMAGE_ROOTS = [
  /^assets\//,
  /^apps\/[^/]+\/public\//,
  /^packages\/[^/]+\/(?:src|data)\//,
  /^\.(?:claude|agents)\/skills\/(?:[^/]+\/)+examples\//,
  /^contents\/blog\//,
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

/**
 * `config/` に置いてよいデータセットの許可リスト (id → そこに置く理由)。`config/` はシステムの設定だけを置く。
 * マスタと台帳は `data/` に置く (規則は .claude/rules/data-storage.md)。`config/` を指す行がここにも
 * CONFIG_MOVE_PENDING にも無いと check-datasets が止める。
 */
export const SYSTEM_CONFIG = {
  "config.paths": "置き場の定数 (コードが import する)",
  "config.inbound-utm": "UTM の定数 (コードが import する)",
  "config.datasets": "カタログ自身",
  "config.schemas": "カタログが参照する形の契約",
  "image.routes": "AI 画像の生成経路の登録 (未登録の API 呼び出しを止める設定)",
  "kdp.account": "期待アカウント (account assert)",
  "note.account": "期待アカウント (account assert)",
  "asp.connection": "ASP の接続設定とサイト帰属",
  "a8.report-automation": "A8 レポート収集の設定",
  "psi.urls": "PSI の計測対象 URL",
  "local.resources": "端末の容量予算・掃除対象・保持日数",
  "source-vault.profiles": "参考文献 vault の接続先と資料 profile",
  "web.yoy-batch": "バッチの設定",
};

/**
 * `config/` にまだ残っているマスタ・台帳 (id → 移す段)。縮小専用で、移したら行を消す (残すと check-datasets が止める)。
 * ここへ新しく足さない。
 */
export const CONFIG_MOVE_PENDING = {
};

/**
 * `packages/` と `apps/` にある JSON と、まだそこに残っているマスタ・台帳 (TS を含む) の一覧。
 * `packages/`・`apps/` は型・読み込み・検査の関数とアプリを持ち、DB (マスタ・台帳) は `data/` に置く。
 *   why: "app"       アプリの部品・アプリが配信する静的ファイル (DB ではない)
 *        "generated" スクリプトが作る生成物・外部の写し
 *        "pending"   `data/` へ移すマスタ・台帳。phase は移す段。縮小専用 (移したら行を消す。残すと止まる)
 * check-datasets は、`packages/`・`apps/` の JSON (テスト・生成物・ツールの設定を除く) がどれかの行に当たること、
 * 行がファイルに当たること、REGISTRIES が読む `data/` の外のファイルが行に載っていることを確かめる。
 * path が "/" で終わる行はその下すべて、そうでなければそのファイル。
 */
export const OUTSIDE_DATA = [
  // ── アプリ・生成物 (移さない) ──
  { path: "apps/web/scripts/data/page-components/", why: "app", note: "ページの部品" },
  { path: "apps/web/public/", why: "app", note: "アプリが配信する静的ファイル" },
  { path: "apps/remotion/public/", why: "generated", note: "動画の入力に生成した静的データ" },
  { path: "apps/web/coverage-thresholds.json", why: "app", note: "テストの閾値" },
  { path: "apps/web/regconfig.json", why: "app", note: "画像比較の設定" },
  { path: "packages/database/drizzle/meta/", why: "generated", note: "migration のメタ" },
  { path: "packages/database/seed/", why: "generated", note: "R2 と外部カタログから作る seed" },
  { path: "packages/types/src/site.json", why: "app", note: "サイトの識別子" },
  { path: "packages/product-factory/src/channels/kindle/kdp-category-tree.json", why: "generated", note: "KDP の分類表の写し" },
  { path: "packages/data-configs/src/registry.ts", why: "generated", note: "data/metrics から作る一覧 (build-registry.ts)" },
  { path: "apps/remotion/src/features/buzz-map/specs/sample-anim.json", why: "app", note: "地図カードの見本 (実際のカードの仕様は sns.buzz-map-specs)" },
  { path: "apps/remotion/src/features/buzz-map/specs/sample-landlocked.json", why: "app", note: "地図カードの見本 (Studio のプレビューが import する)" },
  { path: "apps/remotion/src/features/buzz-map/specs/sample-towns-villages.json", why: "app", note: "地図カードの見本" },
  {
    path: "apps/web/src/features/local-finance-dashboard/data/finance-cards.json",
    why: "generated",
    note: "apps/web/scripts/generate-finance-cards.py が総務省の都道府県決算カード (年度ごとの xlsx) から作る県別・年別の値",
  },
  // ── data/ へ移すマスタ・台帳 (縮小専用。why: "pending" と移す段 phase を書く) ──
];

/**
 * `data/` の中に置いてよい README (path → 残す理由)。`data/` はデータの置き場で、説明はカタログの説明欄と Schema の
 * description に書く。縮小専用。形の契約を文章で持つ README は、JSON Schema と検査へ移してから消す。
 */
export const DATA_README_PENDING = {};

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

/**
 * REFS の書き方 (台帳どうしの ID 参照。check-datasets が参照先の実在を検査し、無ければ error で止める)
 *
 *   refs: [{ field, to, key?, where?, unless?, parse?, copies?, severity?, why? }]
 *     field    この台帳のファイルの中の ID の場所。"." 区切りで、`name[]` は配列の各要素、`*` はオブジェクトの各値、
 *              末尾の `$keys` はオブジェクトのキー (例: "posts[].parent_post_id" / "listings.$keys")。値が無い要素は見ない
 *     to       参照先。台帳の id か "registry:<REGISTRIES の名前>" (TS 側の正本)
 *     key      参照先の台帳で ID の並ぶ場所 (field と同じ書き方)。registry には書かない
 *     where    field を持つ要素の兄弟の項目がこの値のときだけ検査する (例: { channel: "kdp" })。値を配列にすると
 *              そのどれか (例: { domain: ["ranking-quiz", "map-carousel"] })
 *     unless   where と同じ書き方で、合う要素を検査しない (例: { status: ["posted", "deleted"] })
 *     parse    "list" = 値が配列・JSON 配列の文字列・カンマ区切りの文字列のどれでも ID の並びとして読む
 *     copies   参照先の要素の写しとして持つ項目。値が参照先と違えば error (二重の事実のずれを止める)
 *     severity "warn" = 既存データの違反を一覧するだけで止めない。why に理由を書く (書かない参照は error)。
 *              違反を個別に許す一覧は作らない (縮小専用の規律と同じく、違反を隠さない)
 */
const d = (id, path, kind, domain, target, description, opts = {}) => ({ id, path, kind, domain, target, description, ...opts });

/**
 * 参照先にする TS 側の正本。check-datasets は素の node で動くので TS を import せず、本文を正規表現で読む
 * (pattern の 1 番目の括弧が ID。between を書くと、その 2 つの印の間だけを読む)。読んだ件数が 0 なら error。
 * union: [名前] は他の registry の ID を合わせる (参照先が 2 つの正本のどちらかにあればよいとき。union の入れ子は不可)。
 * 正規表現と TS の値が一致することは packages/product-factory/tests/dataset-registries.test.ts が固定する
 * (読み方がずれると、参照切れの誤検知か照合漏れになる)。
 */
export const REGISTRIES = {
  metrics: {
    description: "都道府県の指標 (METRICS_REGISTRY のキー)",
    files: ["packages/data-configs/src/registry.ts"],
    between: ["AUTOGEN_REGISTRY_START", "AUTOGEN_REGISTRY_END"],
    pattern: '^\\s*"([a-z0-9][a-z0-9-]*)":',
  },
  "ranking-slug-redirects": {
    description: "公開後に置き換えた旧 ranking slug (RANKING_SLUG_REDIRECTS のキー。現行ページへ 301 する)",
    files: ["data/site/url-history/ranking-redirects.json"],
    pattern: '^\\s*"from":\\s*"([a-z0-9][a-z0-9-]*)"',
  },
  "ranking-content-keys": {
    description: "ranking の投稿が指してよいキー (現行の指標と、301 で現行の指標へ届く旧 slug)",
    union: ["metrics", "ranking-slug-redirects"],
  },
  "geo-analysis-metric-names": {
    description: "Geo 分析の台帳 (geo.analyses) の metricKeys の各行 (Geo の集計値の名前)",
    files: ["data/geo/analyses/analyses.json"],
    pattern: "^        \"([a-z][A-Za-z0-9]*)\",?$",
  },
  "geo-post-metric-keys": {
    description: "Geo の投稿が指してよい指標 (都道府県の指標と Geo 分析の集計値の名前)",
    union: ["metrics", "geo-analysis-metric-names"],
  },
};

/**
 * TS 側の正本から台帳を指す参照 ({ from: "registry:<名前>", to, key, severity?, why? })。from の ID がすべて参照先にあること。
 */
export const REGISTRY_REFS = [];

const SA = ".claude/skills/analytics";
const SM = ".claude/state/metrics";

export const DATASETS = [
  // ── config/ : 事業の台帳と設定 ──
  d("config.paths", "config/paths.{name}", "config", "ops", "config", "config/ の置き場の定数 (コードが import する)"),
  d("config.inbound-utm", "config/inbound-utm.{name}", "config", "product", "config", "商品 (Kindle・note) からサイトへ戻るリンクの UTM 規約 (コードが import する)"),
  d("config.datasets", "config/datasets.{name}", "config", "ops", "config", "この台帳"),
  d("kdp.listings", P.KDP_LISTINGS, "ledger", "product", "data", "KDP の出品内容と公開・審査状態", { schema: "config/schema/kdp.listings.schema.json" }),
  d("image.routes", "config/image-generation-routes.json", "config", "ops", "config", "AI 画像の生成経路の登録 (未登録の画像 API 呼び出しを止める)", { schema: "config/schema/image-generation-routes.schema.json" }),
  d("kdp.listing-copy", P.KDP_LISTING_COPY, "ledger", "product", "data", "KDP の紹介文とキーワードの原稿 (台帳の description と keywords の正本)", { schema: "config/schema/kdp.listing-copy.schema.json" }),
  d("kdp.cover-thumbnail-checks", P.KDP_COVER_THUMBNAIL_CHECKS, "ledger", "product", "data", "KDP の表紙を検索結果の大きさに縮めて目で確かめた記録 (表紙の SHA ごと。公開の前提)", { schema: "config/schema/kdp.cover-thumbnail-checks.schema.json" }),
  d("kdp.account", P.KDP_ACCOUNT, "config", "product", "config", "KDP の期待アカウント (個人情報は .local 側)", { schema: "config/schema/kdp.account.schema.json" }),
  d("note.account", P.NOTE_ACCOUNT, "config", "product", "config", "note の期待アカウント", { schema: "config/schema/note.account.schema.json" }),
  d("asp.connection", P.AFFILIATE_ASP, "config", "affiliate", "config", "A8 / もしも / afb の接続設定とサイト帰属", { schema: "config/schema/asp.connection.schema.json" }),
  d("a8.report-automation", P.A8_REPORT_AUTOMATION, "config", "affiliate", "config", "A8 レポート収集の設定と programIdMap", { schema: "config/schema/a8.report-automation.schema.json" }),
  d("admin.domains", P.DOMAINS, "master", "strategy", "data", "領域の正本 (管理画面のメニュー・backlog の領域タグ)", { schema: "config/schema/admin.domains.schema.json" }),
  d("config.schemas", "config/schema/{name}.schema.json", "schema", "ops", "config", "マスタ・台帳・設定の JSON の形の契約 (JSON Schema。ファイル名はカタログの id)"),
  d("psi.urls", P.PSI_URLS, "config", "site", "config", "PSI の計測対象 URL"),
  d("local.resources", P.LOCAL_RESOURCES, "config", "ops", "config", "端末の容量予算・掃除対象・保持日数", { schema: "config/schema/local.resources.schema.json" }),
  d("source-vault.profiles", P.SOURCE_VAULT, "config", "data", "config", "参考文献 vault の資料 profile", { schema: "config/schema/source-vault.profiles.schema.json" }),
  d("web.yoy-batch", P.YOY_BATCH, "config", "data", "config", "前年比時系列のバッチ設定", { schema: "config/schema/web.yoy-batch.schema.json" }),

  // ── data/ : 事業の記録 ──
  d("note.kakei-expense-evidence", "data/note/kakei-expense-evidence.json", "ledger", "product", "data", "note 家計シリーズの十大費目→根拠指標の対応表 (build-kakei-note-evidence-data.mjs の入力)", { schema: "data/note/kakei-expense-evidence.schema.json" }),
  d("note.kakei-expense-evidence-schema", "data/note/kakei-expense-evidence.schema.json", "schema", "product", "data", "上の対応表の JSON Schema"),
  d("note.series", "data/note/series.json", "master", "product", "data", "note のシリーズ (シリーズ ID をキーにした名前・読者・サイトへ戻す既定の遷移先と、パックのテーマ → シリーズの対応。シリーズごとのテーマの一覧は読み込み口が導く)。読み込みは packages/product-factory/src/channels/note/series.ts", {
    schema: "config/schema/note.series.schema.json",
    refs: [
      { field: "seriesByTheme.*", to: "note.series", key: "series.$keys" },
      { field: "seriesByTheme.$keys", to: "products.packs", key: "packs.*.theme" },
    ],
  }),
  d("note.articles", "data/note/articles.json", "ledger", "product", "data", "note 記事の ID 台帳 (編集メタ・本文の所在とマニフェストの SHA)。本文と画像の実体は R2", { schema: "data/note/articles.schema.json" }),
  d("note.articles-schema", "data/note/articles.schema.json", "schema", "product", "data", "上の台帳の JSON Schema"),
  d("note.body-figures", "data/note/body-figures.json", "ledger", "product", "data", "note 本文の図の台帳。記事ごとの図・指標・年と今の R2 との照合 (build-note-figure-ledger.mjs の生成物。有料本文は書かない)", { schema: "data/note/body-figures.schema.json" }),
  d("note.body-figures-schema", "data/note/body-figures.schema.json", "schema", "product", "data", "上の台帳の JSON Schema"),
  d("note.body-figure-reviews", "data/note/body-figure-reviews.json", "ledger", "product", "data", "note 本文の照合で人が読んで誤検知と確かめた主張と理由", { schema: "data/note/body-figure-reviews.schema.json" }),
  d("note.body-figure-reviews-schema", "data/note/body-figure-reviews.schema.json", "schema", "product", "data", "上の台帳の JSON Schema"),
  d("note.magazines", "data/note/magazines.json", "ledger", "product", "data", "note マガジンの台帳 (記事台帳の magazine が参照するキーの正本)", { schema: "data/note/magazines.schema.json" }),
  d("note.magazines-schema", "data/note/magazines.schema.json", "schema", "product", "data", "上の台帳の JSON Schema"),
  d("note.paid-landing", "data/note/paid-landing/{name}.json", "ledger", "product", "data", "公開済み有料記事の無料部分の文言 (patch-note-paid-landing.mjs の入力)", { schema: "data/note/paid-landing.schema.json" }),
  d("note.paid-landing-schema", "data/note/paid-landing.schema.json", "schema", "product", "data", "上の文言の JSON Schema"),
  d("note.cover-assets", "data/note/cover-assets.json", "ledger", "product", "data", "note カバーの台帳の正本 (記事ごとに、どの版が候補・採用・公開かの参照と公開の観測)。制作内容と版の記録は note.cover-records に分けて持ち、読み書きは .claude/scripts/note/lib/cover-assets.mjs だけが 2 つを結ぶ", { schema: "data/note/cover-assets.schema.json" }),
  d("note.cover-assets-schema", "data/note/cover-assets.schema.json", "schema", "product", "data", "上の台帳の JSON Schema"),
  d("note.cover-records", "data/note/cover-records/{name}.json", "ledger", "product", "data", "note カバーの記事ごとの記録 (1 記事 1 ファイル。ファイル名は記事 key。制作 ID・方針・コピー・題材・根拠と、版の保存先・SHA・レビュー・生成元を登録順に持つ。正本 note.cover-assets の候補版・採用版・公開版の参照が指す先)", {
    schema: "data/note/cover-records.schema.json",
    refs: [{ field: "articleKey", to: "note.cover-assets", key: "articles[].articleKey" }],
  }),
  d("note.cover-records-schema", "data/note/cover-records.schema.json", "schema", "product", "data", "上の記録の JSON Schema"),
  d("note.cover-policies", "data/note/cover-policies.json", "master", "product", "data", "noteカバーのカテゴリ別方針ID・版・プロンプト", { schema: "data/note/cover-policies.schema.json" }),
  d("note.cover-policies-schema", "data/note/cover-policies.schema.json", "schema", "product", "data", "カバー方針のJSON Schema"),
  d("note.hashtags", "data/note/hashtags.json", "ledger", "product", "data", "note 記事ごとの承認済みハッシュタグ (記事の ID → タグ・本文の SHA・モデル・生成日時)。題・URL・系統は記事台帳から結ぶ。生成の記録を持ち書き手も別なので、記事台帳の列にはしない", {
    schema: "config/schema/note.hashtags.schema.json",
    refs: [{ field: "hashtags.$keys", to: "note.articles", key: "articles[].key" }],
  }),
  d("metrics.definitions", `${P.METRIC_DEFINITIONS_DIR}/{name}.ts`, "master", "data", "data", "指標ID・取得元・単位・表示方針の型付き正本"),
  d("metrics.defaults", `${P.METRIC_DEFINITIONS_DIR}/defaults/{name}.ts`, "master", "data", "data", "指標表示の共通既定値。指標ごとに上書き可能"),
  d("metrics.policy", `${P.METRIC_DEFINITIONS_DIR}/policy/{name}.ts`, "ledger", "data", "data", "指標の極性など、根拠付きの判断方針"),
  d("metrics.quality", `${P.METRIC_DEFINITIONS_DIR}/quality/{name}.ts`, "ledger", "data", "data", "指標の検証済み分布と期限付き形状例外"),
  d("metrics.sources", `${P.METRIC_SOURCES_DIR}/{name}.ts`, "master", "data", "data", "指標の公表資料・抽出レシピの正本"),
  d("metrics.schema", `${P.METRIC_DEFINITIONS_DIR}/schema/{name}.schema.json`, "state", "data", "data", "MetricConfig型から生成する形状契約"),
  d("metrics.index", `${P.METRIC_DEFINITIONS_DIR}/index/{name}.json`, "state", "data", "data", "指標の出典座標と利用先の逆引き索引"),
  d("metrics.display-units", `${P.METRIC_DEFINITIONS_DIR}/display-units/ledger.json`, "state", "data", "data", "公開中の都道府県ランキングごとの図の表示単位・倍率・小数桁と最新年の最大・最小 (build-chart-display-units.ts が R2 の値と規則から生成。手で編集しない)", { schema: `${P.METRIC_DEFINITIONS_DIR}/display-units/ledger.schema.json` }),
  d("metrics.display-units-schema", `${P.METRIC_DEFINITIONS_DIR}/display-units/ledger.schema.json`, "schema", "data", "data", "上の台帳の JSON Schema"),
  d("metrics.summary-display", `${P.METRIC_DEFINITIONS_DIR}/summary-display/ledger.json`, "ledger", "data", "data", "指標ごとの合計表示の可否。未登録は非表示。単位や名前から加算可否を推測しない", {
    schema: `${P.METRIC_DEFINITIONS_DIR}/summary-display/ledger.schema.json`,
    refs: [{ field: "entries[].metricKey", to: "registry:metrics" }],
  }),
  d("metrics.summary-display-schema", `${P.METRIC_DEFINITIONS_DIR}/summary-display/ledger.schema.json`, "schema", "data", "data", "合計表示台帳の JSON Schema"),
  d("correlation.selection-policy", "data/correlation/selection-policy.json", "ledger", "data", "data", "相関の選定基準・正負別の件数・表示名。生成と読み込みとUIが共有", { schema: "data/correlation/selection-policy.schema.json" }),
  d("correlation.selection-policy-schema", "data/correlation/selection-policy.schema.json", "schema", "data", "data", "相関選定方針の JSON Schema"),
  d("themes.catalogs", "data/themes/catalogs/{name}.json", "master", "data", "data", "テーマページの指標・チャート・章・選定根拠の定義 (1 テーマ 1 ファイル。表示の SSOT)", {
    schema: "data/themes/schema/theme-catalog.schema.json",
    refs: [
      { field: "evidenceTopics[].lensKey", to: "themes.evidence-lenses", key: "lenses.$keys" },
      { field: "evidenceTopics[].sourceKeys[]", to: "themes.evidence-lenses", key: "sources.$keys" },
    ],
  }),
  d("content.tags", "data/content/tags.json", "master", "data", "data", "タグの不変ID・表示名・既存URLキー・別名", { schema: "data/content/schema/tags.schema.json" }),
  d("content.routes", "data/content/routes.json", "master", "data", "data", "全公開ページ種別のIDとURLパラメータ契約", { schema: "data/content/schema/routes.schema.json" }),
  d("content.navigation", "data/content/navigation.json", "master", "data", "data", "回遊関係の意味・優先度・件数と明示的な紐付け", {
    schema: "data/content/schema/navigation.schema.json",
    refs: [{ field: "categoryTags.$keys", to: "categories.master", key: "categories[].key" }],
  }),
  d("content.entities", "data/content/entities.json", "state", "data", "data", "各正本から再生成するページID索引。観測値・記事本文は含まない", { schema: "data/content/schema/entities.schema.json" }),
  d("content.external", "data/content/external.json", "state", "data", "data", "stats47 の外の公開物 (note 記事・SNS の投稿) の ID と指標・記事への関係。note のカタログと data/sns/posts.json から再生成"),
  d("content.pages", "data/content/pages/{name}.json", "state", "data", "data", "ID索引の種別・県別分割。必要なページ種別だけアプリへ読み込む", { schema: "data/content/schema/pages.schema.json" }),
  d("content.schema", "data/content/schema/{name}.schema.json", "schema", "data", "data", "ページ・タグ・回遊台帳の形状契約"),
  // 問いは分類軸ではなく、ページを結ぶ参照関係の起点 (docs/01_技術設計/03_情報設計.md「問いの台帳」)。
  // 意味の検査 (親子・役割・導出できる関係の写し) は npm run issues:check、棚卸しは npm run issues:coverage
  d("content.issues", "data/content/issues.json", "master", "data", "data", "記事・ページを作る起点の問いの台帳。ID は不変、小さな問いの親は ID から導出する", {
    schema: "data/content/schema/issues.schema.json",
    refs: [
      { field: "issues[].primaryTheme", to: "content.pages", key: "pages[].id" },
      { field: "issues[].products[]", to: "content.external", key: "pages[].id" },
      // 文章 (dataNote) から出した e-Stat の表 ID。表の台帳が git にあるのは家計調査だけなので、ほかの調査の表は止めずに一覧する
      {
        field: "issues[].estatTables[]", to: "estat.kakei-ledger", key: "tables[].statsDataId",
        severity: "warn",
        why: "表の台帳が git にあるのは家計調査だけ。ほかの調査の表は e-Stat カタログ (R2) が正本で、参照先がまだ無い",
      },
      // 軸が使うデータ。指標と系列 (家計調査の分析単位) の実在をここで見る。粒度が合うかは npm run issues:check
      ...["explanatory", "outcome"].flatMap((side) => [
        { field: `issues[].axes.${side}.data[].metric`, to: "registry:metrics" },
        { field: `issues[].axes.${side}.data[].series`, to: "surveys.analysis-units", key: "units[].id" },
      ]),
    ],
  }),
  d("content.issue-links", "data/content/issue-links.json", "ledger", "data", "data", "問いとページの関係 (答え・根拠)。導出できる関係は書かない", {
    schema: "data/content/schema/issue-links.schema.json",
    refs: [
      { field: "links[].issue", to: "content.issues", key: "issues[].id" },
      { field: "links[].page", to: "content.pages", key: "pages[].id" },
    ],
  }),
  d("content.analysis-viewpoints", "data/content/analysis-viewpoints.json", "master", "data", "data", "分析で確かめる視点の層", {
    schema: "data/content/schema/analysis-viewpoints.schema.json",
  }),
  d("content.analyses", "data/content/analyses.json", "master", "data", "data", "問いに答える分析の台帳。入力の spec と再現のスクリプトを持ち、値は持たない", {
    schema: "data/content/schema/analyses.schema.json",
    refs: [
      { field: "analyses[].issue", to: "content.issues", key: "issues[].id" },
      { field: "analyses[].derivedMetrics[].key", to: "registry:metrics" },
      { field: "analyses[].viewpoints[].layer", to: "content.analysis-viewpoints", key: "layers[].id" },
    ],
  }),
  d("content.types", "data/content/content-types.json", "master", "data", "data", "コンテンツの 4 型の定義と、ページ・投稿・商品を型へ振り分ける規則。ID と規則だけを持ち、件数は持たない", {
    schema: "data/content/schema/content-types.schema.json",
    refs: [
      ...["pageKinds.*", "blogSlugSuffixes.*", "blogSlugInfixes.*", "noteVerticals.*", "noteSeries.*", "snsDomains.*", "kindle"].map((f) => ({ field: `rules.${f}`, to: "content.types", key: "types[].id" })),
      { field: "assignments[].type", to: "content.types", key: "types[].id" },
    ],
  }),
  d("content.type-fit-review", "data/content/type-fit-review.json", "ledger", "data", "data", "型に合っていない記事の処置の案 (機械) と決定 (人)。npm run content-types:fit が案を作り直し、決定は残す", {
    schema: "data/content/schema/type-fit-review.schema.json",
  }),
  d("content.figures", "data/content/figures.json", "ledger", "data", "data", "図の台帳。分析と型に結び、同じ図の配信先を持つ。データは写さない", {
    schema: "data/content/schema/figures.schema.json",
    refs: [
      { field: "figures[].analysis", to: "content.analyses", key: "analyses[].id" },
      { field: "figures[].metrics[].key", to: "registry:metrics" },
      { field: "figures[].template", to: "content.image-templates", key: "templates[].id" },
      { field: "figures[].destinations[].page", to: "content.pages", key: "pages[].id" },
      { field: "figures[].destinations[].postId", to: "sns.posts", key: "posts[].id" },
    ],
  }),
  d("themes.composition-sets", "data/themes/compositions/sets.json", "state", "data", "data", "足すと全体になる指標の組。テーマのカタログの積み上げから作る生成物 (build-composition-ledger.ts)", { schema: "data/themes/schema/composition-sets.schema.json" }),
  d("themes.composition-sets-schema", "data/themes/schema/composition-sets.schema.json", "schema", "data", "data", "上の台帳の JSON Schema"),
  d("themes.catalog-schema", "data/themes/schema/theme-catalog.schema.json", "schema", "data", "data", "上の定義の JSON Schema"),
  d("themes.selection-viewpoints", P.THEME_SELECTION_VIEWPOINTS, "master", "data", "data", "テーマの指標を選ぶ視点 (採用基準の定義・判断規則と機械検査の対応。人が判断して変える値)", { schema: "config/schema/themes.selection-viewpoints.schema.json" }),
  d("themes.evidence-lenses", "data/themes/viewpoints/evidence-lenses.json", "master", "data", "data", "論点レンズ (lenses) と白書・報告書の出典 (sources)。テーマの evidenceTopics が lensKey・sourceKeys で指す。読み込みは packages/data-configs/src/theme-catalog/evidence-lenses.ts", { schema: "config/schema/themes.evidence-lenses.schema.json" }),
  d("themes.japan-catalogs", "data/themes/japan/catalogs.json", "master", "data", "data", "全国 (/japan/<slug>) の手書きのテーマ (slug をキーにした題・説明・キーワード・指標と短いラベル。家計の分は themes.japan-kakei-catalogs。notes と batches は採否の判断の記録)。読み込みは packages/data-configs/src/geo-scope/japan-catalog.ts", {
    schema: "config/schema/themes.japan-catalogs.schema.json",
    refs: [
      { field: "themes.*.metrics[].metricKey", to: "registry:metrics" },
      { field: "batches[].themeSlugs[]", to: "themes.japan-catalogs", key: "themes.$keys" },
      { field: "notes.$keys", to: "themes.japan-catalogs", key: "themes.$keys" },
    ],
  }),
  d("themes.japan-kakei-catalogs", "data/themes/japan/kakei-catalogs.json", "master", "data", "data", "全国 (/japan/<slug>) の家計調査のテーマ (slug をキーにした仕様。ラベルは指標の題から読み込み口が結ぶ)。読み込みは packages/data-configs/src/geo-scope/kakei-japan-catalog.ts", {
    schema: "config/schema/themes.japan-kakei-catalogs.schema.json",
    refs: [{ field: "themes.*.metricKeys[]", to: "registry:metrics" }],
  }),
  d("themes.japan-derived-metrics", "data/themes/japan/derived-metric-decisions.json", "ledger", "data", "data", "全国値を都道府県の値から導く指標の採否 (採用は加算できるものだけ。却下の理由と根拠を持つ恒久判断)。読み込みは packages/data-configs/src/geo-scope/japan-derived-metrics.ts", {
    schema: "config/schema/themes.japan-derived-metrics.schema.json",
    refs: [
      { field: "decisions[].metricKey", to: "registry:metrics" },
      { field: "decisions[].sourceMetricKey", to: "registry:metrics" },
    ],
  }),
  d("themes.public-dashboards", "data/themes/research/public-dashboards.json", "ledger", "data", "data", "公式ダッシュボードの研究カタログ (調べた公式ダッシュボードと、その問い・指標・可視化・ストーリー構成。調査日と検証日を持つ記録)。検査は check-public-dashboard-catalog.mjs、読み手は管理画面の研究ページ", {
    schema: "config/schema/themes.public-dashboards.schema.json",
    refs: [
      { field: "stats47ThemeKeys[]", to: "themes.catalogs", key: "key" },
      { field: "stories[].stats47ThemeKeys[]", to: "themes.catalogs", key: "key" },
      { field: "stories[].dashboardId", to: "themes.public-dashboards", key: "dashboards[].id" },
    ],
  }),
  d("themes.sources", "data/themes/sources/{name}.json", "ledger", "data", "data", "テーマの出典の固定 (1 テーマ 1 ファイル。原典の URL・SHA-256・R2 のキー・対象の一覧・承認した入力ファイル・注意書き。観測値は R2)。取り込み (.claude/scripts/themes/ingest-*) とページの読み手が読む。読み込みは packages/data-configs/src/theme-catalog/<名前>-source.ts (ファイル名の <名前> と同じ。公開 R2 の基点はそこで足す)", {
    schema: "config/schema/themes.sources.schema.json",
    refs: [
      { field: "metrics[].key", to: "registry:metrics" },
      { field: "*.datasetId", to: "geo.ksj-datasets", key: "datasets.$keys" },
      { field: "*.licenseKey", to: "geo.ksj-license-policy", key: "policies.$keys" },
    ],
  }),
  d("seo.keywords", "data/seo/keywords.json", "state", "site", "data", "キーワード改善サイクルの対象キーワード"),
  d("seo.selections", "data/seo/selections/{date}.json", "series", "site", "data", "週ごとの対象キーワードの選定"),
  d("seo.rank-history", "data/seo/rank-history/{date}.json", "series", "site", "data", "対象キーワードの順位の観測"),
  d("seo.rank-history-summary", "data/seo/rank-history.json", "state", "site", "data", "順位の観測の要約"),
  d("seo.proposals", "data/seo/proposals/{name}.json", "evidence", "site", "data", "キーワードごとの改善提案"),
  d("seo.improvement-log", "data/seo/improvement-log.json", "ledger", "site", "data", "キーワード改善の実施記録", { schema: "config/schema/seo.improvement-log.schema.json" }),
  d("seo.latest-report", "data/seo/latest-report.json", "report", "site", "data", "キーワード改善サイクルの最新報告"),
  d("seo.latest-review", "data/seo/latest-review.json", "report", "site", "data", "キーワード改善サイクルの最新レビュー"),
  d("seo.automation-rollout", "data/seo/automation-rollout.json", "state", "site", "data", "キーワード改善の自動化の展開状況"),
  d("seo.area-theme-audits", "data/seo/audits/{date}-area-theme-audit.md", "report", "site", "data", "area と theme の責務分離の棚卸しの報告 (page-components-audit.cjs が書く。手動・不定期)", { retain: "seo-audit-area-theme" }),
  d("ai-content.staging", "data/ai-content-staging/{**}", "state", "data", "data", "ランキング AI 解説の公開待ち (develop への push で publish-ai-content が監査して R2 へ公開し、ファイルを消す outbox。正本は R2 で、普段は空)", { planned: true }),

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
  d("gsc.resubmit-history", "data/gsc/resubmit-history.json", "ledger", "site", "data", "カバレッジ是正の再送信の記録", { schema: "config/schema/gsc.resubmit-history.schema.json" }),
  d("gsc.operations-cycle", "data/gsc/operations-cycle-LATEST.{name}", "state", "site", "data", "GSC 週次運用サイクルの配線検査の結果"),
  d("gsc.ui-audits", "data/gsc/ui-audits/{date}.json", "evidence", "site", "data", "GSC UI の理由別件数・例示URL・HTTP・メッセージの監査証跡", { retain: "gsc-ui-audits" }),
  d("gsc.remediation-evidence", "data/gsc/ui-audits/{date}-remediation.json", "evidence", "site", "data", "GSC 是正の内容確認・公開URLテスト・本番検証の証跡", { retain: "gsc-remediation-evidence" }),
  d("ga4.history", "data/ga4/history.csv", "series", "site", "data", "GA4 の週次集約"),
  d("ga4.history-finalized", "data/ga4/history-finalized7d.csv", "series", "site", "data", "GA4 の確定 7 日集約"),
  d("ga4.reconciliations", "data/ga4/reconciliations/{date}-{week}.json", "ledger", "site", "data", "GA4 の週次集計定義の照合証拠", { schema: "config/schema/ga4.reconciliations.schema.json", retain: "ga4-reconciliations" }),
  d("ga4.latest", "data/ga4/LATEST.md", "report", "site", "data", "GA4 の前週比の要約"),
  d("psi.batch", "data/psi/psi-batch-{ts}.json", "series", "site", "data", "PSI 日次計測の生 JSON", { retain: "psi" }),
  d("psi.history", "data/psi/history.csv", "series", "site", "data", "PSI の長期履歴"),
  d("psi.latest", "data/psi/LATEST.md", "report", "site", "data", "PSI の最新要約"),
  d("cloudflare.snapshots", "data/cloudflare/snapshots/{date}.json", "series", "ops", "data", "Cloudflare 日次 usage", { retain: "cloudflare" }),
  d("cloudflare.history", "data/cloudflare/history.csv", "series", "ops", "data", "Cloudflare usage の推移"),
  d("cloudflare.latest", "data/cloudflare/LATEST.md", "report", "ops", "data", "Cloudflare usage の最新要約"),
  d("adsense.history", "data/adsense/history{name}", "series", "affiliate", "data", "AdSense の週次履歴 (2026-08-29〜10-10 は配信停止、2026-10-11 に手動枠で再開)"),
  d("adsense.reports", "data/adsense/{name}.md", "report", "affiliate", "data", "AdSense の要約・施策 before/after"),
  d("adsense.candidates", "data/adsense/candidates-latest.json", "state", "affiliate", "data", "AdSense の改善候補 (adsense-diagnostics・最大 3 件)"),
  d("adsense.past-effects", "data/adsense/past-effects.json", "ledger", "affiliate", "data", "AdSense 施策の効果判定", { schema: "config/schema/adsense.past-effects.schema.json" }),
  d("a8.report-log", "data/affiliate/a8-report-log.json", "ledger", "affiliate", "data", "A8 の月次レポート (成果・報酬)", { schema: "config/schema/a8.report-log.schema.json" }),
  d("a8.results", "data/affiliate/a8-results.json", "state", "affiliate", "data", "A8 の確定成果", { schema: "config/schema/a8.results.schema.json" }),
  d("a8.ui-last-run", "data/affiliate/a8-ui-last-run.json", "state", "affiliate", "data", "A8 の画面取得を最後に回した記録"),
  d("moshimo.results", "data/affiliate/moshimo-results.json", "state", "affiliate", "data", "もしもアフィリエイトの成果"),
  d("rakuten.results", "data/affiliate/rakuten-results.json", "state", "affiliate", "data", "楽天アフィリエイトの成果", { schema: "config/schema/rakuten.results.schema.json" }),
  d("revenue.authenticated", "data/authenticated/latest.json", "state", "strategy", "data", "認証付き計測 (土曜の Mac) の取得元ごとの最新の成否", { schema: "config/schema/revenue.authenticated.schema.json" }),
  d("revenue.daily", "data/revenue/daily/{name}.json", "ledger", "strategy", "data", "収益の明細 (日 × 商品 × 種類。<チャネル>-<年月>.json)。週・月・年の集計の正本", {
    planned: true,
    schema: "config/schema/revenue.daily.schema.json",
    refs: [{ field: "rows[].productId", where: { channel: "kdp" }, to: "kdp.listings", key: "listings.$keys" }],
  }),
  d("revenue.rollup", "data/revenue/rollup/{name}.json", "state", "strategy", "data", "収益の週・月・年の集計 (明細から revenue-rollup.mjs が作る生成物。手で編集しない)", { planned: true }),
  d("revenue.authenticated-history","data/authenticated/revenue-history.json", "series", "strategy", "data", "認証付き計測が取る売上の推移", { schema: "config/schema/revenue.authenticated-history.schema.json" }),
  d("business.measurement-cycle", "data/measurement-cycle/latest.json", "state", "strategy", "data", "週次の計測→記録→改善サイクルのまとめ", { schema: "config/schema/business.measurement-cycle.schema.json" }),
  d("business.measurement-cycle-summary", "data/measurement-cycle/LATEST.md", "report", "strategy", "data", "週次サイクルのまとめの要約"),
  d("business.measurement-cycle-history", "data/measurement-cycle/history.csv", "series", "strategy", "data", "週次サイクルの推移"),
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
  d("ops.ci-requests", "data/{name}-requests.json", "state", "ops", "data", "cloud セッションが CI に頼む実行依頼 (workflow の代理起動など)。CI が消費して git rm するので普段は 0 件"),
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
  d("affiliate.experiments", "data/affiliate/experiments.json", "ledger", "affiliate", "data", "アフィリエイト実験の台帳", { schema: "config/schema/affiliate.experiments.schema.json" }),
  d("affiliate.ads", "data/affiliate/ledger/ads.json", "ledger", "affiliate", "data", "アフィリエイト広告 (クリエイティブ) の台帳 (登録順。意図軸 vertical・置き場所・案件の参照・A/B 実験)。案件の判断の写しと配信の保留は読み込み口が結合する。R2 の app/affiliate-ads/all.json はここから作る (publish-affiliate-ads)。A8 の機械追記は append-affiliate-ads.ts。読み込みは apps/web/scripts/affiliate-ads-data.ts (AFFILIATE_ADS)", {
    schema: "config/schema/affiliate.ads.schema.json",
    refs: [
      { field: "ads[].programRef", to: "affiliate.offer-profiles", key: "profiles[].programRef" },
      { field: "ads[].categoryKey", to: "categories.master", key: "categories[].key" },
      { field: "ads[].targetCategories", to: "categories.master", key: "categories[].key" },
      { field: "ads[].targetRankingKeys[]", to: "registry:metrics" },
      // 広告の実験は実験台帳に停止条件を事前登録してから回す。未登録は R2 反映時 (build-affiliate-operations-state) にしか
      // 見えなかったので、PR の時点で止める (2026-10-26)
      { field: "ads[].experimentId", to: "affiliate.experiments", key: "experiments[].experimentId" },
    ],
  }),
  d("affiliate.offer-profiles", "data/affiliate/ledger/offer-profiles.json", "ledger", "affiliate", "data", "アフィリエイト案件の台帳 (案件ごとの成果条件・負担・lane・掲載してよいページの種類と、案件の参照を持たない広告 → 案件)。報酬・EPC などの変動値は持たない。読み込みは apps/web/scripts/affiliate-offer-profiles-data.ts (AFFILIATE_OFFER_PROFILES・AFFILIATE_PROGRAM_REF_BY_AD_ID)", {
    schema: "config/schema/affiliate.offer-profiles.schema.json",
    refs: [
      { field: "programRefByAdId.$keys", to: "affiliate.ads", key: "ads[].id" },
      { field: "programRefByAdId.*", to: "affiliate.offer-profiles", key: "profiles[].programRef" },
    ],
  }),
  d("affiliate.direct-placements", "data/affiliate/ledger/direct-placements.json", "ledger", "affiliate", "data", "記事本文に直書きしたアフィリエイト配置の台帳 (監査用。アプリと R2 の配信は読まない。notes は配置ごとの判断の記録)。読み込みは apps/web/scripts/affiliate-direct-placements-data.ts (AFFILIATE_DIRECT_PLACEMENTS)", {
    schema: "config/schema/affiliate.direct-placements.schema.json",
    refs: [
      { field: "placements[].placements[].slug", where: { channel: "blog" }, to: "blog.articles", key: "articles[].slug" },
      { field: "placements[].placements[].slug", where: { channel: "note" }, to: "note.articles", key: "articles[].key" },
      { field: "notes.$keys", to: "affiliate.direct-placements", key: "placements[].id" },
    ],
  }),
  d("affiliate.vertical-map", "data/affiliate/ledger/vertical-map.json", "master", "affiliate", "data", "ページの内容 → 広告の意図軸 (vertical の 10 軸) の対応表 6 つ (カテゴリ・カテゴリ一覧の枠・テーマ・タグ・市区町村テーマ・出典調査)。notes は判断の記録。読み込みは apps/web/src/features/ads/constants/affiliate-category.ts (解決の関数もそこ)", {
    schema: "config/schema/affiliate.vertical-map.schema.json",
    refs: [
      { field: "category.$keys", to: "categories.master", key: "categories[].key" },
      { field: "categoryPagePolicy.$keys", to: "categories.master", key: "categories[].key" },
      { field: "theme.$keys", to: "themes.catalogs", key: "key" },
      { field: "survey.$keys", to: "surveys.master", key: "[].id" },
    ],
  }),
  d("affiliate.experiment-history", "data/affiliate/affiliate-experiment-history.csv", "series", "affiliate", "data", "アフィリエイト実験の推移"),
  d("ga4.affiliate-history", "data/affiliate/ga4-affiliate-history.csv", "series", "affiliate", "data", "GA4 のアフィリエイト実測の週次集約"),
  d("ga4.affiliate-snapshots", "data/affiliate/ga4-affiliate-{date}.json", "series", "affiliate", "data", "GA4 のアフィリエイト実測の生 JSON (2026-09-14 以降は R2)"),
  d("affiliate.inventory", "data/affiliate/inventory-{date}.json", "state", "affiliate", "data", "広告在庫の棚卸しの日付ごとの記録 (最新は affiliate.audits)"),
  d("affiliate.audits", "data/affiliate/{name}-latest.json", "state", "affiliate", "data", "広告の compliance・配置・関連度・突合などの最新の検査結果"),
  d("sales.ledger", "data/products/sales-ledger.json", "ledger", "product", "data", "商品の販売台帳", {
    schema: "config/schema/sales.ledger.schema.json",
    // 販売の観測は出品台帳にある商品だけを指す。CLI の手入力 (sales/cli.ts) は書くときに確かめるが、自動記録と手編集は通らない
    refs: [
      { field: "observations[].productId", where: { channel: "kdp" }, to: "kdp.listings", key: "listings.$keys" },
    ],
  }),
  d("products.strategy", "data/products/product-strategy.json", "ledger", "product", "data", "商品戦略の台帳 (商品群の判断・決定の記録・次の論点。価格と実績は持たない)", { schema: "config/schema/products.strategy.schema.json" }),
  d("products.note-pack-deliveries", "data/products/note-pack-deliveries.json", "ledger", "product", "data", "note 有料データパックの納品物の固定値 (置き場・manifest の SHA・指標数)。2026-11-08 にココナラの出品台帳から移した", {
    schema: "config/schema/products.note-pack-deliveries.schema.json",
    refs: [{ field: "packs.$keys", to: "products.packs", key: "packs.$keys" }],
  }),
  d("products.packs", "data/products/packs/packs.json", "master", "product", "data", "商品ファクトリーのテーマパック P-01〜P-14 (パック ID をキーにした定義。ID とテーマは 1:1 で、EXPECTED_PACK_IDS と THEME_BY_ID は読み込み口がここから導く。rankingKeys は持たず生成物から注入する。notes は判断の記録)。読み込みは packages/product-factory/src/catalog/products/packs.ts (PACKS)", {
    schema: "config/schema/products.packs.schema.json",
    refs: [
      { field: "packs.*.licenseId", to: "products.licenses", key: "licenses.$keys" },
      { field: "packs.*.datasets[]", to: "products.pack-datasets", key: "key" },
    ],
  }),
  d("products.pack-datasets", "data/products/packs/datasets/{name}.json", "evidence", "product", "data", "商品に焼く基準年固定の実データ (1 指標 1 ファイル。ファイル名と key は R2 の app/ranking/<key>/values.json の指標キー。47 県の値と手で書いた出典の行。正規化の前の入力)。読み込みは packages/product-factory/src/data/datasets/<key>.ts (正規化と export の組み立て)", {
    schema: "config/schema/products.pack-datasets.schema.json",
  }),
  d("products.licenses", "data/products/packs/licenses.json", "master", "product", "data", "商品のライセンス定義 (ライセンス ID をキーにした利用範囲・クライアントワーク可否。再販売は常に不可)。読み込みは packages/product-factory/src/catalog/licenses.ts (LICENSE_REGISTRY)", {
    schema: "config/schema/products.licenses.schema.json",
  }),
  d("products.kindle-books", "data/products/kindle/books.json", "master", "product", "data", "Kindle 書籍の企画 (書籍 ID をキーにした書名・章立て・編集設計・状態。表紙設計と ranking の章のキーは読み込み口が結合する。notes は書籍ごとの判断の記録)。読み込みは packages/product-factory/src/channels/kindle/book-catalog.ts (KINDLE_BOOKS)", {
    schema: "config/schema/products.kindle-books.schema.json",
    refs: [{ field: "books.*.chapters[].blogSlug", to: "blog.articles", key: "articles[].slug" }],
  }),
  d("products.kindle-region-codes", "data/products/kindle/region-codes.json", "master", "product", "data", "Kindle S3 (地域別) の 8 地方ブロックの構成県コード (キーは書籍 K-S3-<キー> の接尾辞)。読み込みは packages/product-factory/src/channels/kindle/book-catalog.ts (S3_REGION_CODES)", {
    schema: "config/schema/products.kindle-region-codes.schema.json",
  }),
  d("products.kindle-book-ranking-keys", "data/products/kindle/book-ranking-keys.json", "ledger", "product", "data", "Kindle 書籍の章に載せる指標の採否 (書籍 ID ごとの指標キーと選定理由・『日本国勢図会』の論点の接続結果)。読み込みは packages/product-factory/src/channels/kindle/book-ranking-keys.ts", {
    schema: "config/schema/products.kindle-book-ranking-keys.schema.json",
    refs: [
      { field: "books.*.[]", to: "registry:metrics" },
      { field: "books.$keys", to: "products.kindle-books", key: "books.$keys" },
      { field: "japanZueCoverage.included.*.[]", to: "registry:metrics" },
      { field: "japanZueCoverage.included.$keys", to: "products.kindle-books", key: "books.$keys" },
      { field: "japanZueCoverage.excluded.$keys", to: "registry:metrics" },
      { field: "notes.$keys", to: "products.kindle-books", key: "books.$keys" },
    ],
  }),
  d("products.kindle-editorial-corrections", "data/products/kindle/editorial-corrections.json", "ledger", "product", "data", "Kindle 書籍版だけの本文の校訂 (ブログ記事の slug ごとの置換前後と理由。公開ブログは書き換えない)。読み込みは packages/product-factory/src/channels/kindle/editorial-corrections.ts (correctBookArticle)", {
    schema: "config/schema/products.kindle-editorial-corrections.schema.json",
    refs: [
      { field: "corrections.$keys", to: "blog.articles", key: "articles[].slug" },
      { field: "notes.$keys", to: "products.kindle-editorial-corrections", key: "corrections.$keys" },
    ],
  }),
  d("products.kindle-figure-corrections", "data/products/kindle/figure-corrections.json", "ledger", "product", "data", "Kindle 書籍版だけの図の中の文字の校訂 (<記事 slug>/<図の名前> ごとの置換前後と理由。PNG 化の直前に当てる)。読み込みは packages/product-factory/src/channels/kindle/figure-corrections.ts (correctBookFigure)", {
    schema: "config/schema/products.kindle-figure-corrections.schema.json",
    refs: [{ field: "notes.$keys", to: "products.kindle-figure-corrections", key: "corrections.$keys" }],
  }),
  d("products.ledger", "data/products/product-ledger.json", "state", "product", "data", "商品の台帳 (価格・状態・閲覧・売上を既存の記録から集めたもの)"),
  d("products.ledger-summary", "data/products/PRODUCT-LEDGER.md", "report", "product", "data", "商品の台帳の要約 (週次・月次レビューが読む)"),
  d("products.note-cover-urls", "data/products/note-cover-urls.json", "state", "product", "data", "note の販売記事の表紙画像の URL。サイトの商品カードが使う"),
  d("products.landings", "data/products/landings/{name}.json", "master", "product", "data", "データ商品の共通LPコピー。サイトとnote無料部分の入力", {
    schema: "config/schema/products.landings.schema.json",
    refs: [
      { field: "articleKey", to: "note.articles", key: "articles[].key" },
      { field: "examples[].metricKeys[]", to: "registry:metrics" },
      { field: "examples[].themeRefs[].themeKey", to: "themes.catalogs", key: "key" },
      { field: "analysisRevision.recipes[].themeRefs[].themeKey", to: "themes.catalogs", key: "key" },
      { field: "analysisPlan.inputs[].metricKey", to: "registry:metrics" },
      { field: "analysisPlan.inputs[].variantId", to: "metrics.analysis-source-variants", key: "variants[].id" },
      { field: "analysisPlan.analysisRefs[]", to: "content.analyses", key: "analyses[].id" },
      { field: "analysisPlan.figureRefs[]", to: "content.figures", key: "figures[].id" },
      { field: "analysisPlan.reuseProducts[]", to: "products.landings", key: "productId" },
      { field: "analysisReuse.examples[].productId", to: "products.landings", key: "productId" },
      { field: "analysisRevision.sources[].inputs[].metricKey", to: "registry:metrics" },
      { field: "analysisRevision.sources[].inputs[].variantId", to: "metrics.analysis-source-variants", key: "variants[].id" },
      { field: "analysisRevision.recipes[].metricIds[]", to: "registry:metrics" },
      { field: "analysisRevision.recipes[].denominatorId", to: "registry:metrics" },
    ],
  }),
  d("metrics.analysis-source-variants", "data/metrics/analysis-source-variants.json", "master", "data", "data", "既存指標と粒度・精度が異なる原典の明示定義。通常の指標の出典は複製せず、指標IDで接続する", {
    schema: "data/metrics/schema/analysis-source-variants.schema.json",
    refs: [{ field: "variants[].metricKey", to: "registry:metrics" }],
  }),
  d("products.landing-evidence", "data/products/landing-evidence/{name}.json", "evidence", "product", "data", "固定納品由来の作成例・共通画像型・画像SHA・収録形式。観測値は保存しない", {
    schema: "config/schema/products.landing-evidence.schema.json",
    refs: [{ field: "sourceArticle.articleKey", to: "note.articles", key: "articles[].key" }],
  }),
  d("products.standalone-note", "data/products/standalone-note-products.json", "master", "product", "data", "商品ファクトリー外の商品IDとnote記事の対応。説明は共通LP台帳、公開状態・正式名・価格は記事台帳", {
    schema: "config/schema/products.standalone-note.schema.json",
    refs: [{ field: "products[].articleKey", to: "note.articles", key: "articles[].key" },
      { field: "products[].licenseId", to: "products.licenses", key: "licenses.$keys" }],
  }),
  d("products.competitor-scan", "data/products/competitor-scan.csv", "series", "product", "data", "販売面ごとの競合の観測 (出品・価格・関心の目安。関心の目安は販売数ではない。再調査は行を追記する。category は納品物の分類で stats-data=公的統計や公開データの表・データセット / map=既製の地図データ・素材・ツール / commission=依頼ごとに作る受注 / other=どれでもない。読む画面は管理画面 /strategy/competitors)"),
  d("products.price-history", "data/products/price-history.json", "ledger", "product", "data", "商品の価格実験と価格変更の履歴", { schema: "config/schema/products.price-history.schema.json" }),
  d("products.free-sample-delivery", "data/products/free-sample-delivery.json", "ledger", "product", "data", "無料見本の配布の記録", { schema: "config/schema/products.free-sample-delivery.schema.json" }),
  d("products.interviews", "data/products/admin-stat-interviews.json", "evidence", "product", "data", "行政実務向け商品の聞き取り"),
  d("kindle.archives", "data/products/kindle-archives.json", "ledger", "product", "data", "KDP へ送った版の暗号化保全の台帳", { schema: "config/schema/kindle.archives.schema.json" }),
  d("products.publication-receipts", "data/products/{name}-{date}.json", "evidence", "product", "data", "商品の公開・準備の受領記録"),
  d("kdp.weekly-publication", "data/products/kdp-weekly-publication.json", "state", "product", "data", "KDP 週次公開の判定"),
  d("kindle.figure-reviews", "data/products/kindle-figure-reviews.json", "state", "product", "data", "既刊 Kindle の図の評価 (図の sha256 ごと。同じ図を二度評価しない。KINDLE-QUALITY-LOOP-01)"),
  d("kdp.search-ranks", "data/products/kdp-search-ranks/{date}.json", "series", "product", "data", "KDP の本の Kindle 検索 1 ページ目の順位"),
  d("kindle.quality", "data/products/kindle-quality.json", "state", "product", "data", "既刊 Kindle の中身の機械の検査 (章ごとの図・全県表・リンクと印。KINDLE-QUALITY-LOOP-01)"),
  d("products.status", "data/products/{name}-status.json", "state", "product", "data", "商品・書籍・note の生成と販売準備の状態"),
  d("kindle.verification", "data/products/kindle-{name}-verification.json", "evidence", "product", "data", "Kindle 版ごとの検証記録"),
  d("sns.posts", "data/sns/posts.json", "ledger", "sns", "data", "SNS 投稿台帳 (投稿履歴の正本)", {
    schema: "data/sns/posts.schema.json",
    refs: [
      { field: "posts[].parent_post_id", to: "sns.posts", key: "posts[].id" },
      // X・Threads の投稿のキャプションの型は X カタログの templates[].id。Instagram・YouTube の template (ranking・area-carousel・bcr など) は別の体系なので対象にしない。
      // 下書きも対象にする。素材の取り込み (planning.origin=material-import) は型が無い素材の template を空にし、domain 名 (ranking・buzz-map) を入れない
      { field: "posts[].template", where: { platform: ["x", "threads"] }, to: "sns.x-catalog", key: "templates[].id" },
      // 投稿が使った指標。外部公開物の索引 (data/content/external.json) が指標へ関係を張る入力。参照先は domain で分ける
      // (2026-10-27。それまでは全 domain を指標の registry と照合し、Geo の集計値名などで 92 件を warn にしていた)。
      //   geo         Geo 分析の集計値の名前 (floodExposureShare2050 など) か都道府県の指標
      //   それ以外     都道府県の指標
      { field: "posts[].metric_keys", parse: "list", unless: { domain: "geo" }, to: "registry:metrics" },
      { field: "posts[].metric_keys", parse: "list", where: { domain: "geo" }, to: "registry:geo-post-metric-keys" },
      // content_key が指標の key そのものである domain (棒グラフレース・クイズ・地図カルーセル)
      {
        field: "posts[].content_key", where: { domain: ["bar-chart-race", "ranking-quiz", "ranking-quiz-reel", "map-carousel"] },
        to: "registry:metrics",
      },
      // ranking の domain は、これから出す投稿 (draft・scheduled) を現行の指標と照合する
      { field: "posts[].content_key", where: { domain: "ranking" }, unless: { status: ["posted", "deleted"] }, to: "registry:metrics" },
      // 外に出た記録 (posted・deleted) は書き換えないので、旧 slug (301 で現行の指標へ届く) も許す。
      // YouTube の動画 key (棒グラフレースの bcr-<指標>-<始年>-<終年>は指標を metric_keys 側で照合する) と note の記事 key は、指標の key ではないので照合しない
      {
        field: "posts[].content_key", where: { domain: "ranking", status: ["posted", "deleted"] }, unless: { platform: ["youtube", "note"] },
        to: "registry:ranking-content-keys",
        severity: "warn",
        why: "投稿済みの記録は書き換えない。YouTube の動画 key (bcr-<指標>-<始年>-<終年>・yoy-landscape-v2) と note の記事 key は別の体系で、ranking の key と照合しない。X などの投稿は照合する",
      },
    ],
  }),
  d("sns.x-catalog", "data/sns/x-catalog.json", "master", "sns", "data", "X の量産カタログ (投稿上限 quota・キャプションの型 templates・カテゴリと切り口の相性 affinity・添付できる画像種 imageKinds)。頻度ガード・候補選定・lint・下書き登録が読む。改訂は .claude/rules/sns-content-standards.md §2-10 の承認を経る。読み込みは .claude/scripts/lib/x-catalog.cjs", {
    schema: "config/schema/sns.x-catalog.schema.json",
    refs: [
      { field: "templates[].imageKind", to: "sns.x-catalog", key: "imageKinds[].id" },
      { field: "affinity.$keys", to: "categories.master", key: "categories[].key" },
    ],
  }),
  d("sns.post-log", "data/sns/post-log.md", "report", "sns", "data", "SNS 投稿の人が読む記録"),
  d("sns.weekly-reports", "data/sns/weekly-reports/{week}.md", "report", "sns", "data", "SNS 横断の週次レポート (プラットフォーム別の集計と上位の投稿。sns-weekly-report.mjs が日曜の workflow で書き、分析の節は /sns-weekly-report が足す)"),
  d("sns.competitor-scans", "data/sns/competitor-scans/{date}.md", "report", "sns", "data", "競合アカウントの定点観測のレポート (/competitor-scan が書く。月次レビューの実施状況が対象月の日付のものを読む)"),
  d("sns.x-winning-pattern-reports", "data/sns/x-winning-pattern-reports/{date}.md", "report", "sns", "data", "X の勝ち要因の比較用レポート (analyze-x-winning-patterns.mjs の月次レポートと /x-viral-research の調査レポート。最新の状態は同じスクリプトが書く x-winning-patterns.json)", { planned: true }),
  d("sns.image-replacements", "data/sns/image-replacements/{name}.json", "evidence", "sns", "data", "予約済み投稿の画像差し替えの記録 (決定・対象 ID・差し替え前後)"),
  d("sns.material-reconciliation", "data/sns/material-reconciliation-{date}.json", "series", "sns", "data", "素材キーから投稿IDへの照合証跡。候補の正本はposts.json"),
  d("sns.posts-schema", "data/sns/posts.schema.json", "schema", "sns", "data", "SNS 投稿台帳の JSON Schema"),
  d("sns.scripts", "data/sns/scripts/{name}.json", "ledger", "sns", "data", "長尺投稿 (YouTube 等) の台本。台帳の script_path から参照", { planned: true, schema: "data/sns/scripts.schema.json" }),
  d("sns.scripts-schema", "data/sns/scripts.schema.json", "schema", "sns", "data", "長尺投稿の台本の JSON Schema"),
  d("sns.buzz-map-attribution", "data/sns/buzz-map-attribution-{name}.json", "series", "sns", "data", "バズマップ投稿の流入の計測"),
  d("sns.buzz-map-catalog", "data/sns/buzz-map{name}catalog.json", "state", "sns", "data", "バズマップの作例カタログ"),
  d("sns.buzz-map-specs", "data/sns/buzz-map/specs/{name}.json", "ledger", "sns", "data", "地図カード (buzz-map) の制作の仕様 (1 枚 1 ファイル。ファイル名は spec.id。題・出典・凡例・使うデータで、そのまま Remotion の --props に渡す)。書き手は .claude/scripts/sns/build-buzz-map-spec*.ts と merge-buzz-map-specs.ts。見本の sample-*.json は Remotion の specs/ に残す", {
    schema: "config/schema/sns.buzz-map-specs.schema.json",
  }),
  d("sns.drafts", "data/sns/{name}-drafts.md", "state", "sns", "data", "SNS シリーズの下書き"),
  d("gsc.coverage-queue", "data/gsc/coverage-remediation/coverage-remediation-queue.json", "state", "site", "data", "GSC カバレッジ是正キュー"),
  d("gsc.coverage-queue-latest", "data/gsc/coverage-remediation/LATEST.md", "report", "site", "data", "是正キューの要約"),
  d("gsc.coverage-backlog-batches", "data/gsc/coverage-remediation/backlog-batches/{**}", "state", "site", "data", "是正キューを backlog カードへ束ねた URL の一覧"),
  d("gsc.coverage-submitted", "data/gsc/coverage-submitted-history.csv", "series", "site", "data", "カバレッジ「すべての送信済みページ」ビューの週次件数 (未取得週は status=missing・空欄)", { planned: true }),
  d("gsc.coverage-totals", "data/gsc/coverage-totals-history.csv", "series", "site", "data", "カバレッジ件数の推移 (是正キュー側)"),
  d("search-growth.state", "data/search-growth/{name}.json", "state", "site", "data", "検索成長の候補・健全性・抑制台帳"),
  d("search-growth.manifests", "data/search-growth/manifests/{week}.json", "evidence", "site", "data", "検索成長の週次入力の固定", { retain: "search-growth-manifests" }),
  d("search-growth.archives", "data/search-growth/archives/{name}.json", "evidence", "site", "data", "旧検索実績の非公開R2保全先と復元用ハッシュ"),
  d("effect.reassessments", "data/effect-verdict/reassessments/{week}/{name}.json", "ledger", "strategy", "data", "原本hashに結んだ効果判定契約の再評価 (append-only)", { schema: "config/schema/effect.verdicts.schema.json" }),
  d("effect.verdicts", "data/effect-verdict/verdicts-{week}.json", "ledger", "strategy", "data", "改善施策の効果判定 (閾値エンジン)", { schema: "config/schema/effect.verdicts.schema.json" }),
  d("page-quality.findings", "data/page-quality/{name}", "state", "site", "data", "UI 指摘のキュー"),
  d("page-quality.backlog-batches", "data/page-quality/backlog-batches/{**}", "state", "site", "data", "UI 指摘を backlog カードへ束ねた記録"),
  d("business-plan.state", "data/business-plan/{name}.json", "state", "strategy", "data", "事業計画 SSOT から派生した最新状態と KPI ツリー"),
  d("business-plan.history", "data/business-plan/history/{date}.json", "series", "strategy", "data", "事業計画の派生状態の履歴", { retain: "business-plan" }),
  d("business-plan.documents", "data/business-plan/plan/documents.json", "master", "strategy", "data", "事業計画が拠り所にする正典文書の一覧。読み込みは packages/data-configs/src/business-plan/catalog.ts (BUSINESS_PLAN_DOCUMENTS)", { schema: "config/schema/business-plan.documents.schema.json" }),
  d("business-plan.decisions", "data/business-plan/plan/decisions.json", "ledger", "strategy", "data", "外部の事業計画書 25 章の章ごとの採否 (採用・適合変更・保留・不採用と理由・正典・担当)。読み込みは packages/data-configs/src/business-plan/catalog.ts (BUSINESS_PLAN_DECISIONS)", {
    schema: "config/schema/business-plan.decisions.schema.json",
    refs: [{ field: "decisions[].metricIds[]", to: "business-plan.metrics", key: "metrics[].id" }],
  }),
  d("business-plan.metrics", "data/business-plan/plan/metrics.json", "master", "strategy", "data", "事業計画の指標と KPI ツリーの階層 (kpiTier を持つものが data/business-plan/kpi-tree.json に載り、施策とレーンが [kpi: id] で指せる)。読み込みは packages/data-configs/src/business-plan/catalog.ts (BUSINESS_PLAN_METRICS・buildKpiTree)", { schema: "config/schema/business-plan.metrics.schema.json" }),
  d("business-plan.events", "data/business-plan/plan/events.json", "master", "strategy", "data", "事業計画が測る行動イベントと計測状況。読み込みは packages/data-configs/src/business-plan/catalog.ts (BUSINESS_PLAN_EVENTS)", { schema: "config/schema/business-plan.events.schema.json" }),
  d("business-plan.initiatives", "data/business-plan/plan/initiatives.json", "master", "strategy", "data", "事業計画の施策 (段階・着手の条件・測る指標)。読み込みは packages/data-configs/src/business-plan/catalog.ts (BUSINESS_PLAN_INITIATIVES)", {
    schema: "config/schema/business-plan.initiatives.schema.json",
    refs: [{ field: "initiatives[].metricIds[]", to: "business-plan.metrics", key: "metrics[].id" }],
  }),
  d("business-plan.pilot-specs", "data/business-plan/plan/pilot-specs.json", "ledger", "strategy", "data", "最初に実行するコンテンツの機会ごとの問い・使うデータ・方法・出し先・品質ゲート。読み込みは packages/data-configs/src/business-plan/catalog.ts (BUSINESS_PLAN_PILOT_SPECS)", {
    schema: "config/schema/business-plan.pilot-specs.schema.json",
    refs: [
      { field: "pilotSpecs[].contentId", to: "business-plan.content-opportunities", key: "contentOpportunities[].id" },
      { field: "pilotSpecs[].dataRefs[].id", where: { kind: "metric" }, to: "registry:metrics" },
      { field: "pilotSpecs[].dataRefs[].id", where: { kind: "gis" }, to: "geo.ksj-datasets", key: "datasets.$keys" },
      { field: "pilotSpecs[].dataRefs[].id", where: { kind: "open-data" }, to: "open-data.datasets", key: "datasets[].id" },
    ],
  }),
  d("business-plan.content-opportunities", "data/business-plan/plan/content-opportunities.json", "ledger", "strategy", "data", "事業計画書のコンテンツの機会 (geo-NNN)・X の投稿の案・note の商品の案。ID は明示して固定する (2026-11-11 まで配列の位置から作っていた)。読み込みは packages/data-configs/src/business-plan/content-opportunities.ts", { schema: "config/schema/business-plan.content-opportunities.schema.json" }),
  d("business-plan.m1", "data/business-plan/plan/m1.json", "ledger", "strategy", "data", "M1 (2026 年 9 月) の実行計画 (基準分析・Geo 分析の並び・X の初期投稿・note の商品・経路と作業と公開ゲート)。Geo 分析と商品の題・価格は読み込み口が結ぶ。読み込みは packages/data-configs/src/business-plan/m1.ts (BUSINESS_PLAN_M1)", {
    schema: "config/schema/business-plan.m1.schema.json",
    refs: [
      { field: "baselineAnalysis.contentId", to: "business-plan.content-opportunities", key: "contentOpportunities[].id" },
      { field: "baselineAnalysis.rankingKey", to: "registry:metrics" },
      { field: "baselineAnalysis.metricKeys[]", to: "registry:metrics" },
      { field: "geoAnalysisSlugs[]", to: "geo.analyses", key: "analyses.$keys" },
      { field: "xPosts[].campaign", to: "business-plan.content-opportunities", key: "contentOpportunities[].id" },
      { field: "xPosts[].claimMetricKey", to: "registry:geo-post-metric-keys" },
      { field: "xPosts[].metricKeys[]", to: "registry:geo-post-metric-keys" },
      { field: "noteProducts[].id", to: "business-plan.content-opportunities", key: "noteProducts[].id" },
      { field: "noteProducts[].sourceContentIds[]", to: "business-plan.content-opportunities", key: "contentOpportunities[].id" },
      { field: "noteProducts[].articleKey", to: "note.articles", key: "articles[].key" },
      { field: "plan.eventIds[]", to: "business-plan.events", key: "events[].id" },
    ],
  }),
  d("business.experiments", "data/business/experiments.json", "ledger", "strategy", "data", "実験の台帳 (PDCA)", { schema: "config/schema/business.experiments.schema.json" }),
  d("business.pilot-board", "data/business/pilot-board.json", "ledger", "strategy", "data", "収益化 pilot の判定ボードの入力 (開始日・窓・判定に使う指標)", { schema: "config/schema/business.pilot-board.schema.json" }),
  d("business.domain-stances", "data/business/domain-stances.json", "ledger", "strategy", "data", "領域ごとの構え・狙い・構えを変える条件・改善 Metric・KPI (優先順位の正本。月次の重点・週次 Must・backlog の領域タグが従う)", {
    schema: "config/schema/business.domain-stances.schema.json",
    refs: [
      { field: "lanes[].domain", to: "admin.domains", key: "domains[].id" },
      { field: "lanes[].kpis[]", to: "business-plan.metrics", key: "metrics[].id" },
    ],
  }),
  d("business.issue-map", "data/business/issue-map.json", "ledger", "strategy", "data", "事業イシューマップの入力 (主イシュー・仮説・前提・4 型 × 3 収益源の 12 マス・ストーリーライン・注記)。判定日と進み具合は写さず ID で台帳を指す", {
    schema: "config/schema/business.issue-map.schema.json",
    refs: [{ field: "rows[].contentType", to: "content.types", key: "types[].id" }],
  }),

  // ── data/ : 2026-10-06 の第 2 段階で .claude/state から移した事業の記録・運用状態 ──
  d("blog.operations", "data/blog/{name}", "state", "site", "data", "ブログの週次指標・是正キュー・トピックキュー・図の系譜と監査・勝ち要因"),
  d("blog.articles", "data/blog/ledger/articles.json", "ledger", "site", "data", "ブログ記事の ID 台帳 (slug・題・状態・公開日・更新日・使う指標・タグ・本文の所在)。記事の一覧の正本で、ページの索引 (content.pages の blog) はここから作る。本文と図の実体は R2。sync-content-catalog が R2 の app/blog/all.json を読んだときだけ upsert し、一覧から消えた記事は消さず状態を gone にする", {
    schema: "data/blog/ledger/articles.schema.json",
    refs: [
      { field: "articles[].rankingKeys[]", to: "registry:metrics" },
      { field: "articles[].tagIds[]", to: "content.tags", key: "tags[].id" },
    ],
  }),
  d("blog.articles-schema", "data/blog/ledger/articles.schema.json", "schema", "site", "data", "上の台帳の JSON Schema"),
  d("blog.winning-pattern-reports", "data/blog/winning-pattern-reports/{date}.md", "report", "site", "data", "ブログの勝ち要因の比較用レポート (analyze-winning-patterns.mjs が書く。最新の状態は data/blog/winning-patterns.json)"),
  d("blog.critic-findings", "data/blog/critic-findings/{date}.jsonl", "series", "site", "data", "ブログの審査 (critic) の BLOCK・MAJOR の指摘。日付ごとに追記し、型ごとに数えて規約・gate への格上げに使う", { retain: "blog-critic-findings" }),
  d("ci.health", "data/ci/{name}", "state", "ops", "data", "workflow の健全性・R2 の鮮度・認証付き計測の追いつき"),
  d("content.quality", "data/content-operations/quality.json", "ledger", "product", "data", "記事と画像の改善方針・目視確認・候補の参照", { schema: "data/content-operations/quality.schema.json" }),
  d("content.quality-schema", "data/content-operations/quality.schema.json", "schema", "product", "data", "記事と画像の改善台帳のJSON Schema"),
  d("content.image-templates-schema", "data/content-operations/image-templates.schema.json", "schema", "ops", "data", "図の型と媒体方針のJSON Schema"),
  d("content.image-templates", "data/content-operations/image-templates.json", "master", "ops", "data", "媒体共通の図の型・改善方針と版履歴", { schema: "data/content-operations/image-templates.schema.json" }),
  d("content.image-inventory", "data/content-operations/live/image-inventory.json", "state", "ops", "data", "R2のnote本文manifestから派生した画像・入力の索引", { r2State: "state/content-operations/" }),
  d("content.web-image-inventory", "data/content-operations/live/web-image-inventory.json", "state", "ops", "data", "OGP・ブログSVG・静的素材の派生索引と元データ参照・棚卸し範囲", { r2State: "state/content-operations/" }),
  d("content.web-image-parts", "data/content-operations/live/web-images/{name}.json", "state", "ops", "data", "画像索引のowner別ハッシュ分割。索引のSHAで照合し、1ファイル1MB未満に保つ", { r2State: "state/content-operations/" }),
  d("content.image-migration", "data/content-operations/live/image-migration.json", "state", "ops", "data", "旧SNS画像のR2移行とハッシュ照合の結果", { r2State: "state/content-operations/" }),
  d("content.storage-sync", "data/content-operations/storage-sync-{name}.json", "evidence", "ops", "data", "端末の画像素材・入力の非公開R2保全と内容照合の記録"),
  d("content.note-blockers", "data/content-operations/note-generation-blockers.json", "state", "product", "data", "note 記事生成の止まっている理由"),
  d("data-quality.state", "data/data-quality/{name}", "state", "data", "data", "データ品質の要約・再取り込みキュー・ページ横断の事前検査・SEO メタの基準"),
  d("data-quality.checks", "data/data-quality/checks/{name}", "state", "data", "data", "データ品質の検査キュー"),
  d("data-quality.expected-empty", "data/data-quality/allowlists/expected-empty.json", "ledger", "data", "data", "観測値が 0 件でよいと明示的に認めた指標 (理由・追跡先・失効日つき。取り込み・snapshot の生成・週次の live 監査が同じ定義を読む)。読み込みと判定の関数は packages/data-configs/src/expected-empty.ts", {
    schema: "config/schema/data-quality.expected-empty.schema.json",
    refs: [{ field: "entries[].key", to: "registry:metrics" }],
  }),
  d("estat.candidates", "data/estat/{name}", "state", "data", "data", "e-Stat の拡充キュー・候補の要約・テーマ拡充の検証"),
  d("estat.meta", "data/estat/meta/{**}", "evidence", "data", "data", "e-Stat 統計表のメタ情報の控え"),
  d("estat.kakei-classification", "data/estat/kakei-classification/{**}", "evidence", "data", "data", "総務省 家計調査の収支項目分類と内容例示 (品目に何が含まれ何が含まれないか) の控え"),
  d("estat.kakei-ledger", "data/estat/kakei-ledger/ledger.json", "state", "data", "data", "家計調査の全表と年次品目表の品目ごとの指標の有無・採否 (e-Stat カタログ・metric config・判断から npm run estat:kakei-ledger:build が生成。手で編集しない)", { schema: "data/estat/kakei-ledger/ledger.schema.json" }),
  d("estat.kakei-ledger-schema", "data/estat/kakei-ledger/ledger.schema.json", "schema", "data", "data", "上の台帳の JSON Schema"),
  d("estat.kakei-decisions", "data/estat/kakei-ledger/decisions.json", "ledger", "data", "data", "家計調査の表・品目の採否判断 (指標を作らない excluded / 作る予定の planned と理由。指標があるものは書かない)", { schema: "data/estat/kakei-ledger/decisions.schema.json" }),
  d("estat.kakei-decisions-schema", "data/estat/kakei-ledger/decisions.schema.json", "schema", "data", "data", "上の判断の JSON Schema"),
  d("estat.ssds-definitions", "data/estat/ssds-year-format/definitions.json", "evidence", "data", "data", "e-Stat「統計項目の定義」「指標計算式」(社会・人口統計体系 13 分野) の控え。項目符号ごとの時点又は期間・調査名と、指標の計算式の基礎項目 (build-ssds-definitions.mjs の生成物。手で編集しない)"),
  d("estat.ssds-year-format-decisions", "data/estat/ssds-year-format/decisions.json", "ledger", "data", "data", "SSDS の指標の年の区切り (暦年 / 年度) の判断。期間で決まらない調査の年の呼び方・定義ページの誤りの上書き・都道府県の指標と同じ定義だと確かめた市区町村の指標・判定できない指標の一覧 (理由付き・縮小専用)。検査は npm run estat:ssds-year-format:check", { schema: "data/estat/ssds-year-format/decisions.schema.json" }),
  d("estat.ssds-year-format-decisions-schema", "data/estat/ssds-year-format/decisions.schema.json", "schema", "data", "data", "上の判断の JSON Schema"),
  d("estat.monthly-decisions", "data/estat/monthly/decisions.json", "ledger", "data", "data", "月次の統計の採否・使い道・問い。サイトの指標は年単位なので、月別の図と季節の話題の入口をここで管理する", {
    schema: "data/estat/monthly/decisions.schema.json",
    refs: [{ field: "decisions[].issues[]", to: "content.issues", key: "issues[].id" }],
  }),
  d("estat.monthly-decisions-schema", "data/estat/monthly/decisions.schema.json", "schema", "data", "data", "上の判断の JSON Schema"),
  d("estat.monthly-ledger", "data/estat/monthly/ledger.json", "state", "data", "data", "e-Stat カタログから作る調査ごとの月次の表の数 (build-monthly-ledger.mjs の生成物)", { schema: "data/estat/monthly/ledger.schema.json" }),
  d("estat.monthly-ledger-schema", "data/estat/monthly/ledger.schema.json", "schema", "data", "data", "上の台帳の JSON Schema"),
  d("estat.year-coverage", "data/estat/year-coverage/{**}", "state", "data", "data", "指標ごとの e-Stat 実在年の確認記録 (正本) と、単年設定の年カバレッジ監査キュー"),
  d("estat.availability", "data/estat/availability/{**}", "state", "data", "data", "e-Stat の表・取り出し条件ごとの実在年 (年ごとの値のある県の数) と、metric config の years との差分"),
  d("geo.sources", "data/geo/{name}", "state", "data", "data", "Geo 分析の出典ページとサムネイルの監査・公開"),
  d("geo.scope", "data/geo/scope/{name}", "evidence", "data", "data", "Geo の対象範囲の棚卸しと拡充の検証"),
  d("geo.subjects", "data/geo/subjects/subjects.json", "master", "data", "data", "主題の台帳 (主題 = 原典のデータ 1 つを地図にどう描くかの定義。英語 subject)。交通網の変遷・単体 GIS ページ・重ね合わせ (/geo/map?subjects=) が参照し、表示名・区分のまとめ方・色を揃える (2026-10-29 オーナー決定)", {
    schema: "data/geo/subjects/subjects.schema.json",
    refs: [
      { field: "subjects[].source.dataId", to: "geo.ksj-datasets", key: "datasets.$keys" },
      { field: "subjects[].source.metricKey", to: "registry:metrics" },
    ],
  }),
  d("geo.subjects-schema", "data/geo/subjects/subjects.schema.json", "schema", "data", "data", "上の台帳の JSON Schema"),
  d("geo.ksj-datasets", "data/geo/ksj/datasets.json", "master", "data", "data", "国土数値情報 (KSJ) の登録データセット (dataId をキーにした純メタと ranking 定義。notes は判断の記録)。技術設定は registry.ts。読み込みは packages/gis/src/mlit-ksj/datasets.ts", {
    schema: "config/schema/geo.ksj-datasets.schema.json",
    refs: [
      { field: "datasets.*.rankingConfig[].rankingKey", to: "registry:metrics" },
      { field: "datasets.*.stats47Category", to: "categories.master", key: "categories[].key" },
      { field: "datasets.*.rankingConfig[].categoryKey", to: "categories.master", key: "categories[].key" },
      { field: "datasets.*.license", to: "geo.ksj-license-policy", key: "policies.$keys" },
      { field: "notes.$keys", to: "geo.ksj-datasets", key: "datasets.$keys" },
    ],
  }),
  d("geo.ksj-license-policy", "data/geo/ksj/license-policy.json", "master", "data", "data", "KSJ の利用条件の区分 (license) ごとの判定表 (元データの公開と商用成果物の 2 軸)。読み込みは packages/gis/src/mlit-ksj/license-policy.ts", { schema: "config/schema/geo.ksj-license-policy.schema.json" }),
  d("geo.ksj-official-policy", "data/geo/ksj/official-policy.json", "ledger", "data", "data", "KSJ の公式利用条件の監査 (未登録データセットの利用条件と取得判断・公開取得対象の期待アーカイブ数)。読み込みは packages/gis/src/mlit-ksj/official-policy.ts", {
    schema: "config/schema/geo.ksj-official-policy.schema.json",
    refs: [
      { field: "policies.*.license", to: "geo.ksj-license-policy", key: "policies.$keys" },
      { field: "expectedArchiveCounts.$keys", to: "geo.ksj-datasets", key: "datasets.$keys" },
    ],
  }),
  d("geo.ksj-classifications", "data/geo/ksj/classifications.json", "master", "data", "data", "KSJ の属性で地物を色分けする区分 (原典のコード → 表示の区分・色トークンのコード表と、dataId ごとに引く属性とコード表。交通網の変遷と単体 GIS ページの地図・凡例が共有する。notes はコード表ごとの判断の記録)。読み込みは packages/gis/src/mlit-ksj/classifications.ts", {
    schema: "config/schema/geo.ksj-classifications.schema.json",
    refs: [
      { field: "classifications.$keys", to: "geo.ksj-datasets", key: "datasets.$keys" },
      { field: "classifications.*.codeTable", to: "geo.ksj-classifications", key: "codeTables.$keys" },
      { field: "notes.$keys", to: "geo.ksj-classifications", key: "codeTables.$keys" },
    ],
  }),
  d("geo.ksj-license-retention", "data/geo/ksj/license-retention-20260905.json", "evidence", "data", "data", "利用条件の是正 (2026-09-05) で撤去を承認した R2 の KSJ オブジェクトの記録 (対象ごとの prefix とキー・バイト数・ETag。撤去の前に全件の一致を求める)。読み込みは packages/r2-storage/src/scripts/lib/license-retention.ts"),
  d("geo.infra-history-networks", "data/geo/infra-history/networks.json", "ledger", "data", "data", "交通網の変遷ページ (/geo/history/<key>) の台帳 (原典の版・SHA-256・使い方・公開の状態と了承の根拠・原典の属性名・年の範囲・注意書き。並びがページの順。利用条件と公式ページの URL は geo.ksj-datasets、種別と色は geo.ksj-classifications から結ぶ。notes は判断の記録)。読み込みは packages/gis/src/infra-history/networks.ts", {
    schema: "config/schema/geo.infra-history-networks.schema.json",
    refs: [
      { field: "networks[].source.dataId", to: "geo.ksj-datasets", key: "datasets.$keys" },
      { field: "networks[].source.dataId", to: "geo.ksj-classifications", key: "classifications.$keys" },
      { field: "networks[].currentDataId", to: "geo.ksj-datasets", key: "datasets.$keys" },
      { field: "notes.$keys", to: "geo.infra-history-networks", key: "networks[].key" },
    ],
  }),
  d("geo.analyses", "data/geo/analyses/analyses.json", "master", "data", "data", "Geo 分析の台帳 (slug をキーにした定義。公開 URL /geo/<slug> と R2 の app/geo/<slug>/ を決める。計算入力・空間演算・集計値の名前・出典と限界。豪雪と土砂は themeSource で出典 7 項目を読み込み口が結ぶ。notes は判断の記録)。読み込みは packages/data-configs/src/business-plan/geo-analyses.ts", {
    schema: "config/schema/geo.analyses.schema.json",
    refs: [
      { field: "analyses.*.relatedRankingKey", to: "registry:metrics" },
      {
        field: "analyses.*.contentId", to: "business-plan.content-opportunities", key: "contentOpportunities[].id", severity: "warn",
        why: "土砂・低標高・公共施設の 3 分析の contentId (geo-107・geo-128・geo-129) が事業計画のコンテンツの機会 (geo-001〜geo-100) に無い (2026-11-11 の段 11 で宣言して判明)。機会を足すか contentId を直すかは事業計画の担当が決める",
      },
      { field: "notes.$keys", to: "geo.analyses", key: "analyses.$keys" },
    ],
  }),
  d("geo.layers", "data/geo/analyses/layers.json", "master", "data", "data", "Geo の単一レイヤー表示の台帳 (slug をキーにした定義。公開 URL /geo/layers/<slug>)。読み込みは packages/data-configs/src/business-plan/geo-layers.ts", {
    schema: "config/schema/geo.layers.schema.json",
    refs: [
      { field: "layers.*.dataId", to: "geo.ksj-datasets", key: "datasets.$keys" },
      { field: "layers.*.sourceAnalysis", to: "geo.analyses", key: "analyses.$keys" },
      { field: "layers.*.related[]", to: "geo.analyses", key: "analyses.$keys" },
    ],
  }),
  d("geo.content-lifecycle", "data/geo/analyses/content-lifecycle.json", "ledger", "data", "data", "Geo コンテンツの公開ライフサイクルの手書き部分 (contentId ごとのテーマ・記事の slug と題案・公開計画。無料面・SNS・有料面の結合は読み込み口)。読み込みは packages/data-configs/src/business-plan/geo-content-lifecycle.ts", {
    schema: "config/schema/geo.content-lifecycle.schema.json",
    refs: [
      { field: "contents.$keys", to: "business-plan.content-opportunities", key: "contentOpportunities[].id" },
      { field: "contents.*.themeKeys[]", to: "themes.catalogs", key: "key" },
      { field: "contents.*.blogSlug", to: "blog.articles", key: "articles[].slug" },
    ],
  }),
  d("geo.source-pages", "data/geo/source-pages/pages.json", "ledger", "data", "data", "Geo 原典ページ (単体 GIS /geo/datasets/<dataId>) の読み方の台帳 (版付きの要約・対象時点・範囲・注意点・属性の単位。並びが公開と監査の順)。読み込みは packages/data-configs/src/business-plan/geo-source-pages.ts", {
    schema: "config/schema/geo.source-pages.schema.json",
    refs: [
      { field: "pages[].dataId", to: "geo.ksj-datasets", key: "datasets.$keys" },
      { field: "pages[].relatedIds[]", to: "geo.ksj-datasets", key: "datasets.$keys" },
    ],
  }),
  d("open-data.sources", "data/open-data/catalog/sources.json", "master", "data", "data", "e-Stat 外の政府・自治体オープンデータの提供元 (公式のみ。データセット ID の一覧は持たず読み込み口が導く)。読み込みは packages/data-configs/src/open-data-catalog/sources.ts", {
    schema: "config/schema/open-data.sources.schema.json",
  }),
  d("open-data.datasets", "data/open-data/catalog/datasets.json", "ledger", "data", "data", "e-Stat 外オープンデータのデータセットの台帳 (取得方式・粒度・ライセンス・stats47 での使い道・検証記録。ID は固定)。読み込みは packages/data-configs/src/open-data-catalog/datasets.ts", {
    schema: "config/schema/open-data.datasets.schema.json",
    refs: [
      { field: "datasets[].sourceId", to: "open-data.sources", key: "sources[].id" },
      { field: "datasets[].existingGisDataIds[]", to: "geo.ksj-datasets", key: "datasets.$keys" },
      { field: "datasets[].existingMetricKeys[]", to: "registry:metrics" },
      { field: "datasets[].suggestedCategories[]", to: "categories.master", key: "categories[].key" },
    ],
  }),
  d("open-data.prefecture-statistics", "data/open-data/prefecture-statistics/resources.json", "ledger", "data", "data", "都道府県が公式に公開する統計ポータル・ダッシュボード・年鑑のリンク (県名は持たず読み込み口が県のマスタで結ぶ)。読み込みは packages/data-configs/src/prefecture-statistics-catalog/index.ts", {
    schema: "config/schema/open-data.prefecture-statistics.schema.json",
  }),
  d("open-data.world-provider-evaluations", "data/open-data/world/provider-evaluations.json", "ledger", "data", "data", "/world (国際比較) の候補となる国際データ源の机上評価 (ライセンス・カバレッジ・アクセス日)。読み込みは packages/data-configs/src/geo-scope/world-types.ts", {
    schema: "config/schema/open-data.world-provider-evaluations.schema.json",
  }),
  d("open-data.world-catalogs", "data/open-data/world/catalogs.json", "master", "data", "data", "/world (国際比較) のテーマ (意図的に空。足す前に日本の行を値のレベルで確かめる)。読み込みは packages/data-configs/src/geo-scope/world-types.ts", {
    schema: "config/schema/open-data.world-catalogs.schema.json",
  }),
  d("business.goals", "data/goals/{**}", "state", "strategy", "data", "/goal の目標とサイクル"),
  d("ai-content.remediation", "data/ai-content/remediation/{name}", "state", "data", "data", "ランキング AI 解説の是正キュー・生成失敗・進捗"),
  d("municipalities.expansion", "data/municipalities/{name}", "state", "data", "data", "市区町村データの拡充調査と棚卸し"),
  d("municipalities.ai-content", "data/municipalities/ai-content/{name}.json", "ledger", "data", "data", "市区町村ランキングの解説の本文 (1 指標 1 ファイル。デプロイ時に配信値で監査して通ったものだけ R2 へ)", { schema: "data/municipalities/schema/ai-content.schema.json" }),
  d("municipalities.ai-content-schema", "data/municipalities/schema/ai-content.schema.json", "schema", "data", "data", "上の解説の JSON Schema"),
  d("municipalities.metric-availability", "data/municipalities/catalog/metric-availability.json", "ledger", "data", "data", "市区町村の指標を公開するかの人手の判断 (指標のキーをキーにした公開・非公開の別・順位に入れる値の範囲・理由。batches はまとめて判断した共通の根拠、notes は指標ごとの判断の記録)。社会・人口統計体系と住宅・土地統計調査の拡充分は読み込み口が記録から足す。読み込みは packages/data-configs/src/geo-scope/municipality-catalog.ts", {
    schema: "config/schema/municipalities.metric-availability.schema.json",
    refs: [
      { field: "metrics.$keys", to: "registry:metrics" },
      { field: "batches[].metricKeys[]", to: "municipalities.metric-availability", key: "metrics.$keys" },
      { field: "notes.$keys", to: "municipalities.metric-availability", key: "metrics.$keys" },
    ],
  }),
  d("municipalities.themes", "data/municipalities/catalog/themes.json", "master", "data", "data", "市区町村のテーマ (slug をキーにした手書きの題・指標の表示順・既定の指標・公開状態。拡充分は municipalities.ssds-expansion と municipalities.housing-survey-expansion が足す)。読み込みは packages/data-configs/src/geo-scope/municipality-catalog.ts", {
    schema: "config/schema/municipalities.themes.schema.json",
    refs: [
      { field: "themes.*.metricKeys[]", to: "registry:metrics" },
      { field: "themes.*.defaultMetricKey", to: "registry:metrics" },
      { field: "appendedMetrics.*.[]", to: "registry:metrics" },
    ],
  }),
  d("municipalities.ssds-expansion", "data/municipalities/catalog/ssds-expansion.json", "ledger", "data", "data", "社会・人口統計体系 (SSDS) の市区町村コードのうち未使用だったものの公開判断 (新設テーマ・テーマごとに足す指標・0 を除いて順位を付ける指標・データブックに載せる指標)。読み込みは packages/data-configs/src/geo-scope/municipality-ssds-expansion.ts", {
    schema: "config/schema/municipalities.ssds-expansion.schema.json",
    refs: [
      { field: "newThemes.*.defaultMetricKey", to: "registry:metrics" },
      { field: "themeMetrics.*.[]", to: "registry:metrics" },
      { field: "positiveOnlyKeys[]", to: "registry:metrics" },
      { field: "databookPicks[]", to: "registry:metrics" },
    ],
  }),
  d("municipalities.housing-survey-expansion", "data/municipalities/catalog/housing-survey-expansion.json", "ledger", "data", "data", "住宅・土地統計調査の市区町村表から足す指標 (キー・公開状態・テーマ・指標ごとの判定の記録)。読み込みは packages/data-configs/src/geo-scope/municipality-housing-survey-expansion.ts", {
    schema: "config/schema/municipalities.housing-survey-expansion.schema.json",
    refs: [
      { field: "keys[]", to: "registry:metrics" },
      { field: "theme.defaultMetricKey", to: "registry:metrics" },
      { field: "notes.$keys", to: "municipalities.housing-survey-expansion", key: "keys[]" },
    ],
  }),
  d("municipalities.prefecture-ranking", "data/municipalities/catalog/prefecture-ranking.json", "ledger", "data", "data", "県名×市区町村ランキング (/municipalities/ranking/<指標>/<県コード>) を作る指標の選定 (全指標 × 47 県にしない。外した指標の理由を notes に持つ)。読み込みは packages/data-configs/src/geo-scope/municipality-prefecture-ranking.ts", {
    schema: "config/schema/municipalities.prefecture-ranking.schema.json",
    refs: [
      { field: "keys[]", to: "registry:metrics" },
      { field: "notes.$keys", to: "municipalities.prefecture-ranking", key: "keys[]" },
    ],
  }),
  d("areas.prefectures", "data/areas/master/prefectures.json", "master", "data", "data", "都道府県のマスタ (5 桁の都道府県コード・名前・ローマ字。JIS 順の 47 件)。読み込みは packages/area/src/data/index.ts (PREFECTURES)", {
    schema: "config/schema/areas.prefectures.schema.json",
  }),
  d("areas.capital-cities", "data/areas/master/capital-cities.json", "master", "data", "data", "県庁所在市の名称と家計調査の原地域コード。サイト配信と商品分析が共用する", {
    schema: "config/schema/areas.capital-cities.schema.json",
    refs: [{ field: "[].prefectureCode", to: "areas.prefectures", key: "[].prefCode" }],
  }),
  d("areas.cities", "data/areas/master/cities.json", "master", "data", "data", "市区町村のマスタ (e-Stat の地域メタの市区町村と政令指定都市の行政区。level 2 の prefCode は都道府県、level 3 の prefCode は親の政令指定都市)。読み込みは packages/area/src/data/index.ts (CITIES)", {
    schema: "config/schema/areas.cities.schema.json",
    refs: [
      { field: "[].prefCode", to: "areas.prefectures", key: "[].prefCode", where: { level: "2" } },
      { field: "[].prefCode", to: "areas.cities", key: "[].cityCode", where: { level: "3" } },
    ],
  }),
  d("areas.ports", "data/areas/master/ports.json", "master", "data", "data", "港湾のマスタ (港湾コード・名前・所在の都道府県・位置・港格・管理者。都道府県は 2 桁のコードで持つので refs では結べない)。読み込みは packages/database/src/utils/area-master.ts", {
    schema: "config/schema/areas.ports.schema.json",
  }),
  d("areas.databook-template", "data/areas/databook/template.json", "master", "data", "data", "47 県共通の県データブックのセクション構成 (どの指標をどのブロックでどの順に見せるか。数値は持たず指標のキーで参照する。chart ブロックは page-components の生成物になる)。読み込みは packages/data-configs/src/area-databook/template.ts", {
    schema: "config/schema/areas.databook-template.schema.json",
    refs: [
      { field: "sections[].blocks[].metrics[].rankingKey", to: "registry:metrics" },
      { field: "sections[].blocks[].pairs[].maleKey", to: "registry:metrics" },
      { field: "sections[].blocks[].pairs[].femaleKey", to: "registry:metrics" },
      { field: "sections[].blocks[].chart.relatedRankingKeys[]", to: "registry:metrics" },
    ],
  }),
  d("areas.editorial", "data/areas/editorial/{name}.json", "ledger", "data", "data", "県ごとの本文 (県のシンボルと特産品 5〜9 件。1 県 1 ファイル、ファイル名は areaCode。特産品の slug は R2 のイラストのキー)。読み込みは packages/data-configs/src/area-databook/editorial/index.ts (generate-editorial-index が作る)", {
    schema: "config/schema/areas.editorial.schema.json",
    refs: [
      { field: "areaCode", to: "areas.prefectures", key: "[].prefCode" },
    ],
  }),
  d("note.draft-index", "data/note/note-draft-index.json", "state", "product", "data", "note 下書きの索引"),
  d("note.published-urls", "data/note/note-published-urls.json", "state", "product", "data", "note の公開 URL の派生索引 (記事台帳 data/note/articles.json から generate-note-catalog.ts が作る。手編集しない)", { schema: "config/schema/note.published-urls.schema.json" }),
  d("note.r2-missing", "data/note/r2-missing-inventory.md", "report", "product", "data", "R2 に無い note 素材の一覧"),
  d("ogp.inventory", "data/ogp/{name}", "state", "site", "data", "OGP・カード画像の棚卸し"),
  d("provenance.reference-sources", "data/provenance/reference-sources/sources.json", "master", "data", "data", "調査以外の共通出典 (編成統計・地図データ) の名前・機関・URL。指標の原典調査は surveys.master と既存の導出辞書を使い、このマスタには重複登録しない", { schema: "data/provenance/reference-sources/sources.schema.json" }),
  d("provenance.reference-sources-schema", "data/provenance/reference-sources/sources.schema.json", "schema", "data", "data", "調査以外の共通出典の JSON Schema"),
  d("provenance.queue", "data/provenance/{name}", "state", "data", "data", "出典・再現性の是正キュー"),
  d("ranking.color-policies", "data/ranking/color-policies/policies.json", "state", "data", "data", "指標 × 粒度の配色 (連続か 5 段階か・一方向か発散か)。R2 の値から作る生成物 (build-color-policies.ts)。結合は metricPresentation", {
    schema: "data/ranking/color-policies/policies.schema.json",
    refs: [{ field: "policies[].metricKey", to: "registry:metrics" }],
  }),
  d("ranking.color-policies-schema", "data/ranking/color-policies/policies.schema.json", "schema", "data", "data", "上の台帳の JSON Schema"),
  d("ranking.hook-overrides", "data/ranking/hooks/overrides.json", "ledger", "data", "data", "ランキングの問いかけコピー (hook) と表示名の手動上書き (導出規則では意味が変わる・長すぎる例外だけ。notes は上書きごとの判断)。読み込みは packages/data-configs/src/prominence/ranking-hook-overrides.ts", {
    schema: "config/schema/ranking.hook-overrides.schema.json",
    refs: [
      { field: "hooks.$keys", to: "registry:metrics" },
      { field: "readerLabels.$keys", to: "registry:metrics" },
      { field: "notes.$keys", to: "ranking.hook-overrides", key: "hooks.$keys" },
    ],
  }),
  d("ranking.audits", "data/ranking/{name}", "state", "data", "data", "ランキングの整合性監査・拡充 wave の索引"),
  d("ranking.wave-drafts", "data/ranking/wave-r1-drafts/{**}", "evidence", "data", "data", "ランキング拡充 wave の下書き"),
  d("site.link-audit", "data/site/{name}", "state", "site", "data", "サイト内リンクの監査"),
  d("site.ranking-redirects", "data/site/url-history/ranking-redirects.json", "ledger", "site", "data", "公開後に置き換えた旧 ranking slug の 301 転送 (X・外部記事に残る旧 URL を現行ページへ一段で届ける)。middleware と SNS の投稿台帳の参照 (registry:ranking-slug-redirects) が読む", {
    schema: "config/schema/site.ranking-redirects.schema.json",
    refs: [{ field: "redirects[].to", to: "registry:metrics" }],
  }),
  d("site.blog-redirects", "data/site/url-history/blog-redirects.json", "ledger", "site", "data", "slug を変えたブログ記事の旧 slug → 新 slug の 301 転送 (middleware が読む)", {
    schema: "config/schema/site.blog-redirects.schema.json",
    refs: [{ field: "redirects[].to", to: "blog.articles", key: "articles[].slug" }],
  }),
  d("site.theme-redirects", "data/site/url-history/theme-redirects.json", "ledger", "site", "data", "廃止したページ・旧カテゴリ URL からテーマページへの 301 転送 (パスの正規表現の表と、/areas の旧カテゴリ → テーマの対応。middleware が読む)", {
    schema: "config/schema/site.theme-redirects.schema.json",
    refs: [
      { field: "pathRedirects[].themeSlug", to: "themes.catalogs", key: "key" },
      { field: "areaCategoryRedirects[].themeSlug", to: "themes.catalogs", key: "key" },
    ],
  }),
  d("site.gone-blog-slugs", "data/site/url-history/gone-blog-slugs.json", "ledger", "site", "data", "完全削除したブログ slug (410 Gone を返す。退役の日付と理由を持つ。middleware と公開前の検査が読む)", {
    schema: "config/schema/site.gone-blog-slugs.schema.json",
    refs: [{ field: "slugs[].slug", to: "blog.articles", key: "articles[].slug" }],
  }),
  d("site.gone-tag-keys", "data/site/url-history/gone-tag-keys.json", "ledger", "site", "data", "削除済みの旧タグ slug (410 Gone を返す。middleware が読む)", {
    schema: "config/schema/site.gone-tag-keys.schema.json",
  }),
  d("site.gone-ranking-keys", "data/site/url-history/gone-ranking-keys.json", "ledger", "site", "data", "退役した ranking キー (410 Gone を返し、一覧・sitemap のリンクからも外す。追加は KNOWN 再生成と指標の isActive:false とセット。middleware と packages/ranking の R2 リーダが読む)", {
    schema: "config/schema/site.gone-ranking-keys.schema.json",
  }),
  d("sns.ig-posted-log", "data/sns/ig-posted-log.jsonl", "ledger", "sns", "data", "Instagram の投稿済みログ (二重投稿の防止)"),
  d("sns.instagram-schedules", "data/sns/instagram-w{name}-schedule.json", "state", "sns", "data", "Instagram の週ごとの予約表"),
  d("sns.threads-schedule", "data/sns/threads-schedule.json", "state", "sns", "data", "Threads の予約表"),
  d("sns.port-bubble-captions", "data/sns/port-bubble-captions/{name}", "state", "sns", "data", "港湾バブルチャート投稿のキャプション"),
  d("source-inventory.manifests", "data/source-inventory/{name}/{name}/source-bundle-manifest.json", "evidence", "data", "data", "参考文献 (教材) の資料・版ごとの source bundle manifest (Drive の版 folder の全 file の SHA)"),
  d("source-inventory.analyses", "data/source-inventory/{name}/{name}/analyses.json", "master", "data", "data", "参考文献 (教材) の分析企画。1 冊・1 版の問い・主張・採否・一次資料・展開先 (人と agent が判断して書く正本。展開先ごとの結果は expansion.json)", {
    schema: "data/source-inventory/analyses.schema.json",
    refs: [
      { field: "analyses[].issueIds[]", to: "content.issues", key: "issues[].id" },
      { field: "analyses[].lensIds[]", to: "surveys.lenses", key: "lenses[].id" },
    ],
  }),
  d("source-inventory.analyses-schema", "data/source-inventory/analyses.schema.json", "schema", "data", "data", "上の分析企画の JSON Schema"),
  d("source-inventory.inventory", "data/source-inventory/{name}/{name}/inventory.json", "state", "data", "data", "参考文献のページ・項目単位の解決台帳 (source-inventory build が分析企画から生成)"),
  d("source-inventory.summary", "data/source-inventory/{name}/{name}/summary.json", "state", "data", "data", "上の解決台帳の集計"),
  d("source-inventory.items", "data/source-inventory/{name}/{name}/items.{name}.json", "state", "data", "data", "日本国勢図会の項目抽出 (分割ファイル)"),
  d("source-inventory.candidates", "data/source-inventory/{name}/{name}/candidates.json", "state", "data", "data", "日本国勢図会の公開候補"),
  d("source-inventory.evidence-summary", "data/source-inventory/{name}/{name}/evidence-summary.json", "state", "data", "data", "日本国勢図会の根拠の集計 (管理画面が読む)"),
  d("source-inventory.expansion", "data/source-inventory/expansion.json", "ledger", "data", "data", "教材の分析企画 × 展開先の記録 (済み=公開中のページ ID・企画中・見送り=理由)。書き込みは npm run reference:expansion -- record", { schema: "data/source-inventory/expansion.schema.json" }),
  d("source-inventory.expansion-schema", "data/source-inventory/expansion.schema.json", "schema", "data", "data", "上の展開記録の JSON Schema"),
  d("source-inventory.placement-decisions", "data/source-inventory/placement-decisions.json", "ledger", "data", "data", "参考文献由来の指標の展開判断 (展開先ごとの planned / rejected / blocked と理由)", { schema: "data/source-inventory/placement-decisions.schema.json" }),
  d("source-inventory.placement-decisions-schema", "data/source-inventory/placement-decisions.schema.json", "schema", "data", "data", "上の展開判断の JSON Schema"),
  d("source-inventory.reference-source-policies", "data/source-inventory/policies/reference-sources.json", "ledger", "data", "data", "参考文献 (資料と版) ごとの解決方針 (解決台帳の場所・入力単位・既定の解決と理由) と、Claude の skill の手引きから採択した内部運用原則。読み込みは packages/data-configs/src/evidence-inventory/reference-sources.ts", { schema: "config/schema/source-inventory.reference-source-policies.schema.json" }),
  d("source-inventory.japan-zue-pilot", "data/source-inventory/japan-zue/pilot.json", "ledger", "data", "data", "日本国勢図会の試行 (人が確かめた最初の 10 件と、最初に作るコンテンツの企画)。読み込みは packages/data-configs/src/evidence-inventory/japan-zue/pilot.ts", {
    schema: "config/schema/source-inventory.japan-zue-pilot.schema.json",
    refs: [
      { field: "items[].metricKeys[]", to: "registry:metrics" },
      { field: "items[].surveyIds[]", to: "surveys.master", key: "[].id" },
      { field: "masterContent.metricKeys[]", to: "registry:metrics" },
      { field: "masterContent.surveyIds[]", to: "surveys.master", key: "[].id" },
      { field: "masterContent.article.sections[].metricKeys[]", to: "registry:metrics" },
      { field: "masterContent.youtube.experimentId", to: "business.experiments", key: "experiments[].id" },
    ],
  }),
  d("source-inventory.japan-zue-policy", "data/source-inventory/japan-zue/policy.json", "ledger", "data", "data", "日本国勢図会の解決方針 (版・確認日・規約の URL・所管機関の方針・人が決めた解決)。所管機関の名前に当てる正規表現と解決の関数は読み込み口 packages/data-configs/src/evidence-inventory/japan-zue/policy.ts にあり、organization で結ぶ", {
    schema: "config/schema/source-inventory.japan-zue-policy.schema.json",
    refs: [{ field: "manualOverrides.*.metricKeys[]", to: "registry:metrics" }],
  }),
  d("surveys.portfolio", "data/surveys/portfolio.json", "ledger", "data", "data", "調査ポートフォリオ (調査ごとの紐付け・在庫・編集状態・GSC/GA4 の計測と、編集ハブ化の判断)。機械項目は build-survey-portfolio.ts が再導出し、意味項目は同スクリプトの --set で変える。手で編集しない", {
    schema: "config/schema/surveys.portfolio.schema.json",
    refs: [{ field: "surveys[].surveyId", to: "surveys.master", key: "[].id" }],
  }),
  d("surveys.experiments", "data/surveys/experiments.json", "ledger", "data", "data", "調査ハブの改善実験台帳 (baseline・7/28/56 日の観測・判定)。観測と判定は evaluate-survey-experiments.mjs が書く", {
    schema: "config/schema/surveys.experiments.schema.json",
    refs: [{ field: "experiments[].surveyId", to: "surveys.master", key: "[].id" }],
  }),
  d("categories.master", "data/categories/categories.json", "master", "data", "data", "カテゴリマスタ (/category/<key> の 17 軸。key・表示名・アイコン・SEO 概要。配列の順が表示順)。指標の category・トピックの categoryKey・回遊の categoryTags が key で指す。キーの型 CategoryKey はこの JSON から packages/data-configs/scripts/build-category-keys.ts が生成する (src/category-keys.generated.ts)。読み込みは packages/data-configs/src/categories.ts", { schema: "data/categories/categories.schema.json" }),
  d("categories.master-schema", "data/categories/categories.schema.json", "schema", "data", "data", "上のカテゴリマスタの JSON Schema"),
  d("categories.topics", "data/categories/topics/{name}.json", "master", "data", "data", "カテゴリ内のトピック (/category/<key> の一覧を束ねる見出し。1 カテゴリ 1 ファイル。指標を割り当てる規則 matchers を持つ)。解決の関数は packages/data-configs/src/topics/resolve-topic.ts", {
    schema: "data/categories/topics.schema.json",
    refs: [{ field: "categoryKey", to: "categories.master", key: "categories[].key" }, { field: "overrides.$keys", to: "registry:metrics" }],
  }),
  d("categories.topics-schema", "data/categories/topics.schema.json", "schema", "data", "data", "上のトピックの JSON Schema"),
  d("surveys.reviews", "data/surveys/reviews/{date}-survey-{name}.md", "evidence", "data", "data", "調査ハブを編集する前の事前監査 (query の実測・在庫の構造・一次資料の確認)。build-survey-portfolio.ts が最新の日付のものを lastReviewedAt と evidenceRefs に結ぶ"),
  d("surveys.audits", "data/surveys/audits/{date}-survey-portfolio-audit.md", "report", "data", "data", "調査ポートフォリオの四半期の監査の報告 (survey-curator が書く)"),
  d("surveys.taxonomy", "data/surveys/taxonomy.json", "state", "data", "data", "ranking・テーマ・ブログの全量から調査への紐付けを横断監査した結果と、調査から各面への逆引き (audit-survey-taxonomy.ts が作る。手で編集しない)"),
  d("surveys.kakei-coverage", "data/surveys/kakei-coverage.json", "state", "data", "data", "家計調査の表・品目の展開の到達状況 (report-kakei-coverage.ts が作る。未到達があっても監査は失敗にしない)"),
  d("surveys.lenses", "data/surveys/lenses/{name}.json", "master", "data", "data", "統計調査の切り口台帳 (調査ごとの分析の切り口・使う表と軸・粒度・誤読の注意・チャネルの役割。資料の問いと分析単位はここを参照する。展開の状況は持たない)", {
    schema: "config/schema/surveys.lenses.schema.json",
    refs: [
      { field: "surveyId", to: "surveys.master", key: "[].id" },
      { field: "relatedSurveyIds[]", to: "surveys.master", key: "[].id" },
    ],
  }),
  d("surveys.analysis-units", "data/surveys/analysis-units/kakei-chousa.json", "master", "data", "data", "家計調査の分析単位 (どの表のどの軸を、どのページで答えるか。問いの軸 series がこの id で指す)。切り口は surveys.lenses が持ち、指標の出典・値は metric config と R2 が持つ。読み込みと整合検査は packages/data-configs/src/kakei-analysis-catalog.ts", {
    schema: "data/surveys/analysis-units/analysis-units.schema.json",
    refs: [
      { field: "surveyId", to: "surveys.master", key: "[].id" },
      { field: "units[].lensId", to: "surveys.lenses", key: "lenses[].id" },
      { field: "units[].placement.pageId", to: "content.pages", key: "pages[].id" },
      { field: "units[].placement.metricKey", to: "registry:metrics" },
    ],
  }),
  d("surveys.analysis-units-schema", "data/surveys/analysis-units/analysis-units.schema.json", "schema", "data", "data", "上の分析単位の JSON Schema"),
  d("surveys.editorial", "data/surveys/editorial/editorial.json", "ledger", "data", "data", "調査ハブ (/survey/<id>) の本文 (要約・分かること・読者の問い・数字を読む注意・関連記事)。1 調査 1 件。調査の名前・機関・URL は持たず、ranking への導線は指標キー、記事は slug で指す。読み込みは packages/data-configs/src/survey-editorial.ts", {
    schema: "data/surveys/editorial/editorial.schema.json",
    refs: [
      { field: "entries[].surveyId", to: "surveys.master", key: "[].id" },
      { field: "entries[].readerQuestions[].rankingKey", to: "registry:metrics" },
      { field: "entries[].relatedArticleSlugs[]", to: "blog.articles", key: "articles[].slug" },
    ],
  }),
  d("surveys.editorial-schema", "data/surveys/editorial/editorial.schema.json", "schema", "data", "data", "上の調査ハブの本文の JSON Schema"),
  d("surveys.master", "data/surveys/master/surveys.json", "master", "data", "data", "調査マスタ (/survey/<id> の正本。id・名前・機関・URL・親の出典。調査の名前・機関・URL を持つのはここだけで、出典名の対応表や切り口台帳は id で指す)", { schema: "data/surveys/master/surveys.schema.json" }),
  d("surveys.master-schema", "data/surveys/master/surveys.schema.json", "schema", "data", "data", "上の調査マスタの JSON Schema"),
  d("surveys.source-names", "data/surveys/master/source-names.json", "master", "data", "data", "出典の書き方 (SSDS の原典名・指標の displayName・e-Stat の統計表 ID) から調査マスタの id への対応表。調査の名前・機関・URL は持たない。解決の関数は packages/data-configs/src/ssds/source-name-to-survey.ts", {
    schema: "data/surveys/master/source-names.schema.json",
    refs: [
      { field: "knownSourceToSurvey.*", to: "surveys.master", key: "[].id" },
      { field: "proposedSourceToSurvey.*", to: "surveys.master", key: "[].id" },
      { field: "displayNameToSurvey.*", to: "surveys.master", key: "[].id" },
      { field: "statsDataIdToSurveyOverride.*.id", to: "surveys.master", key: "[].id" },
    ],
  }),
  d("surveys.source-names-schema", "data/surveys/master/source-names.schema.json", "schema", "data", "data", "上の対応表の JSON Schema"),
  d("themes.portfolio", "data/themes/portfolio.json", "ledger", "data", "data", "テーマポートフォリオ (テーマごとの指標数・チャート数・レビューの有無・GSC/GA4 の計測・データ品質・ライフサイクル判定)。機械項目は build-theme-portfolio.ts と aggregate-theme-metrics.ts が再導出し、意味項目は build-theme-portfolio.ts の --set で変える。ThemeCatalog には計測値を書かない。手で編集しない", {
    schema: "config/schema/themes.portfolio.schema.json",
    refs: [{ field: "themes[].themeKey", to: "themes.catalogs", key: "key" }],
  }),
  d("themes.experiments", "data/themes/experiments.json", "ledger", "data", "data", "テーマの改善実験台帳 (baseline・7/28/56 日の観測・判定。新規 URL の初回公開 launch を含む)。書き込みは evaluate-theme-experiments.mjs だけ", {
    schema: "config/schema/themes.experiments.schema.json",
    refs: [{ field: "experiments[].themeKey", to: "themes.catalogs", key: "key" }],
  }),
  d("themes.quality", "data/themes/quality.json", "state", "data", "data", "テーマの週次の品質監査 (章・登録・期間・単位・有限値・重複・履歴退行の観測の要約と、下の 3 つの詳細ファイルの件数と SHA-256)。audit-theme-quality.ts が theme-quality-state.mjs 経由で 4 ファイルを一括で書き、読むときに SHA-256 と件数が合わなければ止まる"),
  d("themes.quality-parts", "data/themes/quality.{name}.json", "state", "data", "data", "上の品質監査の詳細 (definitions・observations・lastGoodObservations。前回の正常値を持ち、異常が続く間に比較の基準をすり替えない)。各 1 MiB 以内"),
  d("themes.ci-followup", "data/themes/ci-followup.json", "state", "data", "data", "テーマの継続フォローの機械観測 (全テーマの PC/mobile の表示・期日の checkpoint・レビューの入力 hash)。theme-followup.mjs が quality-suite-weekly.yml で毎週書く"),
  d("themes.ci-review", "data/themes/ci-review.json", "state", "data", "data", "月次の公式資料の確認と改善判断の結果 (CI の Claude の構造化出力を record-theme-review.mjs が検証して保存。月内の sourceReviews を累積する)"),
  d("themes.viewpoint-history", "data/themes/viewpoint-history.csv", "series", "data", "data", "テーマの指標を選ぶ視点 (themes.selection-viewpoints) の週ごとの該当件数。record-theme-viewpoints.ts が週次監査で追記する"),
  d("themes.role-review", "data/themes/role-review/{name}", "state", "data", "data", "テーマの指標の役割レビューキュー"),
  d("themes.reviews", "data/themes/reviews/{date}-theme-{name}.md", "evidence", "data", "data", "テーマごとのレビュー (公式資料の根拠・構成の確認・リリース gate の結論)。build-theme-portfolio.ts が最新の日付のものを reviewDocRef に結び、管理画面の視点の一覧が読む。未完了の対策は本文に溜めず backlog のカードにする"),
  d("themes.audits", "data/themes/audits/{date}-{name}.md", "report", "data", "data", "テーマポートフォリオの監査の報告 (四半期の監査・月次の確認・テーマの深掘り・selection の夜間 backfill の報告)。selection-backfill.mjs と theme-portfolio-manager が書き、build-role-review-queue.mjs が backfill の報告を読む"),
  d("themes.live-audit", "data/themes/charts/live-audit.json", "state", "data", "data", "テーマのチャートの本番監査 (全チャートの依存を R2 の配信値で実測した結果。theme-chart-live-audit.mjs が週次で書く)"),

  // ── .claude/state : エージェント運用の状態 (エージェントの運用をやめたら不要になるものだけ) ──
  d("agent.backlog-loop", ".claude/state/backlog-loop/ledger.json", "ledger", "ops", "state", "バックログ自動処理の実行台帳 (gate の証拠)", { schema: "config/schema/agent.backlog-loop.schema.json" }),
  d("agent.consistency", ".claude/state/consistency/audited.json", "state", "ops", "state", "整合性監査の印 (Stop hook が読む)"),
  d("agent.triggers", ".claude/state/triggers.json", "state", "ops", "state", "RemoteTrigger の記録"),
  d("agent.mail-inbox", ".claude/state/inbox/mail-events.json", "state", "ops", "state", "obsidian の mail-triage がメールから拾ったイベント (売上の正本ではない。正本は各スクレイパーのログ)"),

  // ── assets/ : 画像などの素材の原本 ──
  d("blog.outbox", "contents/blog/{**}", "outbox", "site", "contents", "ブログの公開待ち原稿 (develop への push で blog-auto-publish が R2 へ公開し、公開した slug を消す)"),
  d("blog.article-backgrounds", "assets/blog/article-backgrounds/{**}", "asset", "site", "assets", "ブログ記事のサムネイル背景の原本 (サムネイル生成が読む)"),
  d("blog.fullbleed-backgrounds", "assets/blog/fullbleed-backgrounds/{**}", "asset", "site", "assets", "ブログ記事の全面構図サムネイル背景の原本 (サムネイル生成が読む)"),
  d("blog.codex-backgrounds", "assets/blog/codex-backgrounds/{**}", "asset", "site", "assets", "Codex で生成したブログ背景の原本と採用状態"),
  d("ogp.backgrounds", "assets/ogp/{**}", "asset", "site", "assets", "OGP・サムネイルのブランド背景と、その元画像"),
  d("area.specialty-illustrations", "assets/area-specialty/{**}", "asset", "site", "assets", "県ページの特産品イラストの原本 (sync-snapshots が R2 へ反映)"),
  d("site.page-heroes", "assets/page-heroes/{name}", "asset", "site", "assets", "カテゴリ・ホーム・テーマのヒーロー画像の原本 (webp にして apps/web/public へ)"),
  d("design.proposals", "assets/design-proposals/{name}", "asset", "site", "assets", "デザイン提案の画像"),
  d("design.reference", "assets/design-reference/{**}", "asset", "site", "assets", "参考サイト (shadcndashboard・Flowly など) の撮影と部品ごとの実測値。どれを参考にするかは台帳 design.references"),
  d("design.references", "data/design-references/references.json", "ledger", "site", "data", "参考サイトの台帳 (URL・採否と理由・撮影と実測の置き場・反映先)。管理画面「サイト > 参考サイト」が読む", { schema: "config/schema/design.references.schema.json" }),
  d("ads.placements", P.ADS_PLACEMENTS, "master", "site", "data", "広告の枠の台帳 (大きさの語彙・枠の種類と箱の寸法・ページごとの置き方・共通のルール)。ページの置き方は apps/web の ad-placements テストがコードと照合する", { schema: "config/schema/ads.placements.schema.json" }),
  d("design.components", "data/design/components.json", "ledger", "site", "data", "部品の台帳 (部品の種類ごとの役割・正典の実装・枠・寸法・見本の採用元・使わない場面・検査)。props との一致は apps/web の design-components-ledger テストが照合する", { schema: "config/schema/design.components.schema.json" }),
  d("note.assets", "assets/note/{**}", "asset", "product", "assets", "note の背景・見出し・マガジン表紙の原本と生成の説明・マニフェスト"),
  d("affiliate.banners", "assets/affiliate-banners/{name}", "asset", "affiliate", "assets", "note 記事に貼るアフィリエイトのバナー画像"),

  // ── data/ : 改善ログ・計測スナップショット・レビュー ──
  d("improvement.logs", "data/improvement/{name}/improvement-log.md", "ledger", "strategy", "data", "改善施策の詳細ログ (検証コマンド・仮説・判定)"),
  d("improvement.log-archives", "data/improvement/{name}/archive/{**}", "ledger", "strategy", "data", "改善ログの過去分"),
  d("improvement.closed-waves", "data/improvement/gsc-improvement/closed-waves.json", "ledger", "strategy", "data", "効果判定を判定不能のまま終了したブログ是正 wave (オーナー判断・理由付き)。閾値エンジンの対象から外す", { schema: "config/schema/improvement.closed-waves.schema.json" }),
  d("improvement.budgets", ".claude/config/budgets/{name}/budgets{name}", "config", "site", "agent-config", "計測値の警告閾値"),
  d("gsc.snapshots", "data/gsc/snapshots/{week}/{**}", "series", "site", "data", "GSC の週次生 CSV。長期の需要推移に使うため削除しない (2026-10-29 オーナー判断)"),
  d("ga4.snapshots", "data/ga4/snapshots/{week}/{**}", "series", "site", "data", "GA4 の週次生 CSV", { retain: "analytics-ga4" }),
  d("ga4.admin-audits", "data/google-admin/audits/{week}.json", "series", "site", "data", "GA4 Admin の週次監査の記録 (custom dimension・キーイベント。前の週との差分は計測の記録に出る。履歴なので削除しない)"),
  d("adsense.snapshots", "data/adsense/snapshots/{week}/{**}", "series", "affiliate", "data", "AdSense の週次生 CSV", { retain: "analytics-adsense" }),
  d("cloudflare.cost-snapshots", "data/cloudflare/{name}-snapshots/{name}", "series", "ops", "data", "Cloudflare の月次・週次コストの snapshot"),
  d("psi.metric-snapshots", "data/psi/metric-snapshots/{date}/{name}", "series", "site", "data", "性能指標の snapshot"),
  d("sns.metric-snapshots", "data/sns/metric-snapshots/{date}/{name}", "series", "sns", "data", "SNS 投稿の指標の時系列"),
  d("business.nsm-weekly", "data/nsm/weekly-snapshots/{name}.json", "series", "strategy", "data", "週次収益 (NSM) の snapshot", { schema: "config/schema/business.nsm-weekly.schema.json" }),
  d("business.weekly-reviews", "data/reviews/weekly/{week}.md", "report", "strategy", "data", "週次レビュー"),
  d("business.monthly-reviews", "data/reviews/monthly/{month}.md", "report", "strategy", "data", "月次レビュー"),
];

/**
 * 移した旧置き場 ({ from, to, since })。コード・workflow・package.json に from が残っていたら check-datasets が止める
 * (旧パスを読んで黙って空になる・旧パスへ書き続けて記録が割れるのを防ぐ)。履歴の記録 (json の出典・md) は対象外。
 */
export const RETIRED = [
  // ブログの公開待ち原稿 (2026-10-08 に docs/ から。docs/ は人が読み返す文書の置き場で、公開後に消える原稿と性質が合わない)
  { from: "docs/21_ブログ記事原稿", to: "contents/blog", since: "2026-10-08" },
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
  // 監査・レビューの全文 (2026-11-14 に skill の reference/ から data/<領域>/ へ。GOVERNED が同じ置き場への新規を止める)
  // 定期レポート (2026-11-14 に skill の reference/reports/ から data/<取得元>/ へ。GOVERNED が同じ置き場への新規を止める)
  { from: ".claude/skills/blog/analyze-winning-patterns/reference/reports", to: "data/blog/winning-pattern-reports", since: "2026-11-14" },
  { from: ".claude/skills/sns/competitor-scan/reference/reports", to: "data/sns/competitor-scans", since: "2026-11-14" },
  { from: ".claude/skills/sns/sns-weekly-report/reference/reports", to: "data/sns/weekly-reports", since: "2026-11-14" },
  { from: ".claude/skills/sns/x-viral-research/reference/reports", to: "data/sns/x-winning-pattern-reports", since: "2026-11-14" },
  { from: ".claude/skills/analytics/seo-audit/reference/audits", to: "data/seo/audits", since: "2026-11-14" },
  { from: ".claude/skills/survey/manage-survey-portfolio/reference/audits", to: "data/surveys/audits", since: "2026-11-14" },
  { from: ".claude/skills/survey/manage-survey-portfolio/reference/reviews", to: "data/surveys/reviews", since: "2026-11-14" },
  { from: ".claude/skills/theme/manage-theme-portfolio/reference/audits", to: "data/themes/audits", since: "2026-11-14" },
  { from: ".claude/skills/theme/manage-theme-portfolio/reference/reviews", to: "data/themes/reviews", since: "2026-11-14" },
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
  // 調査マスタ (2026-11-10 に packages/ から data/surveys/master/ へ。出典名の対応も同じ場所に JSON で置いた)
  { from: "packages/ranking/src/data/surveys", to: "data/surveys/master", since: "2026-11-10" },
  // カテゴリ・トピックのマスタ (2026-11-10 に packages/data-configs/src から data/categories/ へ。キーの型は JSON から生成する)
  { from: "packages/data-configs/src/topics/catalogs", to: "data/categories/topics", since: "2026-11-10" },
  // config/ の業務マスタ・台帳と、skill 内の研究カタログ (2026-11-10 に data/ へ。config/ はシステムの設定だけ)
  { from: "config/domains.json", to: "data/business/domains.json", since: "2026-11-10" },
  { from: "config/kdp-listings.json", to: "data/products/kdp/listings.json", since: "2026-11-10" },
  { from: "config/note-hashtags", to: "data/note/hashtags.json", since: "2026-11-10" },
  { from: "config/ads/placements.json", to: "data/ads/placements.json", since: "2026-11-10" },
  { from: "config/theme-selection-viewpoints.json", to: "data/themes/viewpoints/selection.json", since: "2026-11-10" },
  { from: "research-theme-catalog/reference/public-dashboard-catalog.json", to: "data/themes/research/public-dashboards.json", since: "2026-11-10" },
  { from: "sync-survey-master", to: "(廃止。対応表は調査の id だけを持つので、調査マスタへ同期するものが無い)", since: "2026-11-10" },
  { from: "business-plan/snow-designation-analysis", to: "data/geo/analyses/analyses.json (themeSource)", since: "2026-11-11" },
  { from: "business-plan/landslide-exposure-analysis", to: "data/geo/analyses/analyses.json (themeSource)", since: "2026-11-11" },
  { from: "business-plan/low-elevation-population-analysis", to: "data/geo/analyses/analyses.json", since: "2026-11-11" },
  // 原典ページ・公開データ (2026-11-11 に data/geo/source-pages/ と data/open-data/ へ)
  { from: "business-plan/geo-source-policy-pages", to: "data/geo/source-pages/pages.json", since: "2026-11-11" },
  { from: "business-plan/geo-source-service-pages", to: "data/geo/source-pages/pages.json", since: "2026-11-11" },
  { from: "open-data-catalog/datasets/", to: "data/open-data/catalog/datasets.json", since: "2026-11-11" },
  // 県・市区町村・港湾のマスタ (2026-11-11 に packages/area/src/data/ から data/areas/master/ へ)
  { from: "area/src/data/prefectures.json", to: "data/areas/master/prefectures.json", since: "2026-11-11" },
  { from: "area/src/data/cities.json", to: "data/areas/master/cities.json", since: "2026-11-11" },
  { from: "area/src/data/ports.json", to: "data/areas/master/ports.json", since: "2026-11-11" },
  // 県データブックの県の本文 47 件 (2026-11-11 に editorial/<code>.ts から data/areas/editorial/<code>.json へ。テンプレートは template.ts が JSON を読む)
  { from: "area-databook/editorial/", to: "data/areas/editorial/", since: "2026-11-11" },
  // 段 12b (2026-11-11): 撤去の記録・地図カードの仕様・GES の港の写し
  { from: "r2-storage/src/scripts/lib/license-retention-20260905.json", to: "data/geo/ksj/license-retention-20260905.json", since: "2026-11-11" },
  { from: "features/buzz-map/specs/", to: "data/sns/buzz-map/specs/ (見本の sample-*.json だけ Remotion に残す)", since: "2026-11-11" },
  { from: "ges/scripts/data/ports.json", to: "data/areas/master/ports.json (台帳 areas.ports を読む)", since: "2026-11-11" },
  // 段 13 (2026-11-12): note のハッシュタグ 286 ファイルを、記事の ID をキーにした 1 つの表へ (題・URL・系統の写しは持たない)
  { from: "data/note/hashtags/", to: "data/note/hashtags.json", since: "2026-11-12" },
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
