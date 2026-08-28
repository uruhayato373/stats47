/**
 * check-open-data-links.ts — open-data-catalog の URL 到達性・鮮度監査 (PR-3)。
 * 正典: .claude/agents/open-data-curator.md §運用 (初期実装仕様 doc 37 は消化済・git 履歴参照)
 *
 * 外部サイト障害で CI を不安定にしないため、通常の type-check / validator から分離した
 * オンデマンド実行専用。結果分類:
 *   - ok        : 2xx/3xx
 *   - bot-block : 403 (公式サイトの bot 拒否。404/410 と同一視しない。到達扱い)
 *   - gone      : 404/410 (移転・廃止の疑い。人間が調査して catalog の status を更新する)
 *   - server-err: 5xx (3回再試行後も失敗した場合にalert)
 *   - timeout   : タイムアウト / ネットワークエラー (3回再試行後にalert)
 *   - stale     : catalog の一次資料確認日が120日超過
 *                 (注: www.gsi.go.jp は Node fetch(undici) が fetch failed になる環境があるが
 *                  curl では 200。timeout は dead link と断定せず curl で再確認する。2026-07-18 実測)
 *
 * bot-block 以外の異常は exit 1。status への反映は open-data-curator が判断して catalog を編集する
 * (このスクリプトは catalog を書き換えない)。
 *
 * 実行: npm run check:open-data-links --workspace packages/data-configs
 */
import { OPEN_DATA_SOURCES, OPEN_DATASETS } from "../src/open-data-catalog";
import {
  isAlertVerdict,
  probeLinkWithRetry,
  type LinkProbeResult,
  type LinkProbeTarget,
} from "../src/link-audit/link-check-core";

const MAX_CONCURRENCY = 6;

const targets: LinkProbeTarget[] = [];
for (const s of OPEN_DATA_SOURCES) {
  const common = { targetId: `source:${s.id}`, verifiedAt: s.lastVerifiedAt, alertOwner: "open-data-curator" };
  targets.push({ ...common, label: "homepage", url: s.homepageUrl });
  targets.push({ ...common, label: "terms", url: s.termsUrl });
  if (s.catalogUrl) targets.push({ ...common, label: "catalog", url: s.catalogUrl });
  if (s.apiDocsUrl) targets.push({ ...common, label: "apiDocs", url: s.apiDocsUrl });
}
for (const d of OPEN_DATASETS) {
  const common = { targetId: `dataset:${d.id}`, verifiedAt: d.verification.verifiedAt, alertOwner: "open-data-curator" };
  targets.push({ ...common, label: "landing", url: d.landingPageUrl });
  if (d.downloadUrl) targets.push({ ...common, label: "download", url: d.downloadUrl });
}
// 同一 URL の重複チェックを省く
const seen = new Set<string>();
const unique = targets.filter((t) => {
  if (seen.has(t.url)) return false;
  seen.add(t.url);
  return true;
});

async function main(): Promise<void> {
  const results: LinkProbeResult[] = [];
  for (let offset = 0; offset < unique.length; offset += MAX_CONCURRENCY) {
    const batch = unique.slice(offset, offset + MAX_CONCURRENCY);
    results.push(...(await Promise.all(batch.map((target) => probeLinkWithRetry(target)))));
  }

  const byVerdict = new Map<LinkProbeResult["verdict"], typeof results>();
  for (const r of results) {
    const list = byVerdict.get(r.verdict) || [];
    list.push(r);
    byVerdict.set(r.verdict, list);
  }
  for (const verdict of ["gone", "server-err", "timeout", "stale", "bot-block"] as const) {
    for (const r of byVerdict.get(verdict) || []) {
      console.log(`[${verdict}] ${r.target.targetId} ${r.target.label}: ${r.detail} ${r.target.url} attempts=${r.attempts}`);
    }
  }
  const counts = (["ok", "bot-block", "gone", "server-err", "timeout", "stale"] as const)
    .map((v) => `${v}=${byVerdict.get(v)?.length || 0}`)
    .join(" / ");
  console.log(`\nopen-data links: ${unique.length} URLs → ${counts}`);
  if (results.some((result) => isAlertVerdict(result.verdict))) {
    console.error("link異常または検証期限超過を検出。一次資料を再確認して catalog を更新すること");
    process.exitCode = 1;
  }
}

void main();
