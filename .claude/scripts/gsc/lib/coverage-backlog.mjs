/**
 * GSC カバレッジ是正キューから、判断が要る URL をバックログカードにする (純粋関数)。
 *
 * 機械で決まるもの (observe-after-fix の観測・404 の放置判定・5xx の再測定) は
 * build-coverage-queue.mjs が自動で処理する。ここで扱うのは「このページを検索に出すべきか」
 * のような判断とコード変更を伴うものだけで、処理は backlog-loop-daily (CI の Claude) が行う。
 * CLI: .claude/scripts/gsc/sync-coverage-backlog.mjs
 */

export const CARD_PREFIX = "GSC-COV";
export const BATCH_SIZE = 10;
export const BATCH_DIR = ".claude/state/gsc/backlog-batches";

const QUEUE_CLI = "node .claude/scripts/gsc/build-coverage-queue.mjs";
const RUNBOOK = ".claude/skills/analytics/gsc-coverage-remediation/SKILL.md";

/**
 * 判断が要る action → カードの型。tier / kind は todo-standards の語彙。
 * observe-after-fix (Google の再クロール待ち) / recheck / none はカードにしない。
 */
export const CARD_ACTIONS = {
  "fix-5xx": {
    slug: "5XX",
    tier: "🔴",
    kind: "不具合",
    title: (n) => `本番で 5xx を返し続ける ${n} URL を直す`,
    next: "`--probe <url>` で 5xx が続くことを確かめ、該当ルート (`apps/web/src/app/`) と R2 データの読み込みから原因を特定して直す。3 回の再測定を経ても 5xx なので単発の障害ではない。",
  },
  "restore-gone-key": {
    slug: "GONE",
    tier: "🔴",
    kind: "不具合",
    title: (n) => `誤って 410 にしている公開中ランキング ${n} 件を戻す`,
    next: "KNOWN_RANKING_KEYS と metric config が isActive:true なのに 410 を返している。`packages/ranking/src/config/gone-ranking-keys.ts` から外すのが正しいかを config で確かめて直す。",
  },
  "verify-intent": {
    slug: "404",
    tier: "🟡",
    kind: "不具合",
    title: (n) => `sitemap に載っているのに 404 を返す ${n} URL を直す`,
    next: "sitemap が 404 の URL を載せている。ページを復活させるか、sitemap の生成元 (`apps/web/src/app/sitemap.ts` と参照している config) から外す。",
  },
  "sitemap-gap": {
    slug: "SITEMAP",
    tier: "🟡",
    kind: "改善",
    title: (n) => `sitemap に無い未登録ページ ${n} 件を sitemap へ載せるか noindex にする`,
    next: "200 を返すが sitemap に無く、Google も登録していない。sitemap の生成元 (`apps/web/src/app/sitemap.ts` と参照している config) で除外している理由を読み、`--probe <url>` で本文量を見て、検索に出す価値があれば sitemap へ載せ、薄い・重複なら noindex にする。同じ種類の URL は同じ規則で揃える。",
  },
  "content-check": {
    slug: "SOFT404",
    tier: "🟡",
    kind: "改善",
    title: (n) => `Google がソフト 404 と見ている ${n} ページの中身を補強するか noindex にする`,
    next: "`--probe <url>` で本文量と見出しを見て、県・指標に固有の値が本文にあるかを確かめる。無ければ補強し、補強できないなら noindex にする。",
  },
  deactivate: {
    slug: "EMPTY",
    tier: "🟡",
    kind: "改善",
    title: (n) => `データが無いのに 200 を返す ${n} ページを止める`,
    next: "本文に「見つかりません」相当しか出ていない。データが無い理由を config / R2 で確かめ、isActive:false か 404/410 にする。",
  },
  noindex: {
    slug: "NOINDEX",
    tier: "🟡",
    kind: "改善",
    title: (n) => `検索に出さない ${n} ページへ noindex を付ける`,
    next: "空テンプレ・検索結果・重複と判定されたページ。該当ルートの metadata に `robots: noindex, follow` を付ける。",
  },
  enrich: {
    slug: "ENRICH",
    tier: "🟡",
    kind: "改善",
    title: (n) => `全国テンプレと区別が付かない ${n} ページへ固有の値を足す`,
    next: "県名以外が全国共通の文面になっている。`--probe <url>` で本文を見て、県固有の観測値を server HTML の本文に出す。",
  },
};

const dateId = (today) => today.replaceAll("-", "");

export const batchPath = (id) => `${BATCH_DIR}/${id}.txt`;

/**
 * 起票するカードを決める。action ごとに開いているカードは 1 枚までにし、
 * ループが消化してから次の batch を出す (同じ URL を 2 枚のカードに載せない)。
 */
export function planCoverageCards({ queue, openIds, today }) {
  const open = [...openIds];
  const cards = [];
  for (const [action, def] of Object.entries(CARD_ACTIONS)) {
    const prefix = `${CARD_PREFIX}-${def.slug}-`;
    if (open.some((id) => id.startsWith(prefix))) continue;
    const urls = queue
      .filter((entry) => entry.action === action && entry.status === "pending")
      .map((entry) => entry.url)
      .sort()
      .slice(0, BATCH_SIZE);
    if (!urls.length) continue;
    const id = `${prefix}${dateId(today)}`;
    cards.push({ id, action, tier: def.tier, urls, markdown: renderCard({ id, def, urls, queue, today }) });
  }
  return cards;
}

function describe(entry) {
  const parts = [`HTTP ${entry.current_http ?? "?"}`, `GSC: ${entry.gsc_category}`];
  if (entry.in_sitemap != null) parts.push(entry.in_sitemap ? "sitemap 掲載" : "sitemap 未掲載");
  if (entry.gsc_last_crawl) parts.push(`最終クロール ${entry.gsc_last_crawl}`);
  return parts.join(" / ");
}

function renderCard({ id, def, urls, queue, today }) {
  const byUrl = new Map(queue.map((entry) => [entry.url, entry]));
  const file = batchPath(id);
  return [
    `### [${id}] GSC 是正: ${def.title(urls.length)}`,
    "",
    `タグ: [インフラ・計測] [種類:${def.kind}] [実行:sweep] [検証:${QUEUE_CLI} --assert-handled ${file}] [起票:${today}]`,
    "",
    `- **自動起票**: \`sync-coverage-backlog.mjs\` が是正キュー (\`.claude/state/gsc/coverage-remediation-queue.json\`) の pending から作った。対象 URL の一覧は \`${file}\`。手順の正典は \`${RUNBOOK}\` Phase 4。`,
    "- **対象**:",
    ...urls.map((url) => `  - ${url} (${describe(byUrl.get(url) ?? {})})`),
    `- **次**: ${def.next}`,
    `- **記録**: 直した URL は \`${QUEUE_CLI} --mark-in-progress <url> --note "<何を変えたか>"\`、対応不要と判断した URL は \`--mark-by-design <url> --note "<理由>"\`。まとめて付けるときは \`@${file}\` を渡す。本番反映後は日次の URL Inspection が登録を確かめて done にする。`,
    "- **停止条件**: Indexing API を使わない。本番 deploy・R2 push をしない。判断できない URL は pending のまま残し、このカードを消さない。",
    "- **完了条件**: 検証コマンドが exit 0 (全 URL が pending でなく、done 以外は理由 note 付き)。",
  ].join("\n");
}

/** tier 見出しの直後にカードを差し込む。見出しが無い tier のカードは差し込まない。 */
export function insertCards(backlogText, cards) {
  const lines = backlogText.split("\n");
  const inserted = [];
  for (const card of cards) {
    const heading = lines.findIndex((line) => line.startsWith(`## ${card.tier}`));
    if (heading < 0) continue;
    lines.splice(heading + 1, 0, "", ...card.markdown.split("\n"));
    inserted.push(card.id);
  }
  return { text: lines.join("\n"), inserted };
}

/** 対応するカードが消えた (完了した) batch ファイル名を返す。 */
export function staleBatchFiles(fileNames, openIds) {
  const open = new Set(openIds);
  return fileNames.filter(
    (name) => name.startsWith(`${CARD_PREFIX}-`) && name.endsWith(".txt") && !open.has(name.slice(0, -4))
  );
}
