/**
 * check-open-data-links.ts — open-data-catalog の URL 到達性・鮮度監査 (PR-3)。
 * 正典: .claude/agents/open-data-curator.md §運用 (初期実装仕様 doc 37 は消化済・git 履歴参照)
 *
 * 外部サイト障害で CI を不安定にしないため、通常の type-check / validator から分離した
 * オンデマンド実行専用。結果分類:
 *   - ok        : 2xx/3xx
 *   - bot-block : 403 (公式サイトの bot 拒否。404/410 と同一視しない。到達扱い)
 *   - gone      : 404/410 (移転・廃止の疑い。人間が調査して catalog の status を更新する)
 *   - server-err: 5xx (一時障害の可能性。再実行で確認)
 *   - timeout   : タイムアウト / ネットワークエラー
 *                 (注: www.gsi.go.jp は Node fetch(undici) が fetch failed になる環境があるが
 *                  curl では 200。timeout は dead link と断定せず curl で再確認する。2026-07-18 実測)
 *
 * gone のみ exit 1 (移転検知)。status への反映は open-data-curator が判断して catalog を編集する
 * (このスクリプトは catalog を書き換えない)。
 *
 * 実行: npm run check:open-data-links --workspace packages/data-configs
 */
import { OPEN_DATA_SOURCES, OPEN_DATASETS } from "../src/open-data-catalog";

const REQUEST_TIMEOUT_MS = 20_000;
const MAX_CONCURRENCY = 6;

interface Target {
  readonly owner: string;
  readonly label: string;
  readonly url: string;
}

const targets: Target[] = [];
for (const s of OPEN_DATA_SOURCES) {
  targets.push({ owner: `source:${s.id}`, label: "homepage", url: s.homepageUrl });
  targets.push({ owner: `source:${s.id}`, label: "terms", url: s.termsUrl });
  if (s.catalogUrl) targets.push({ owner: `source:${s.id}`, label: "catalog", url: s.catalogUrl });
  if (s.apiDocsUrl) targets.push({ owner: `source:${s.id}`, label: "apiDocs", url: s.apiDocsUrl });
}
for (const d of OPEN_DATASETS) {
  targets.push({ owner: `dataset:${d.id}`, label: "landing", url: d.landingPageUrl });
  if (d.downloadUrl) targets.push({ owner: `dataset:${d.id}`, label: "download", url: d.downloadUrl });
}
// 同一 URL の重複チェックを省く
const seen = new Set<string>();
const unique = targets.filter((t) => {
  if (seen.has(t.url)) return false;
  seen.add(t.url);
  return true;
});

type Verdict = "ok" | "bot-block" | "gone" | "server-err" | "timeout";

async function probe(t: Target): Promise<{ t: Target; verdict: Verdict; detail: string }> {
  try {
    // HEAD 非対応サイトがあるため GET (body は読み捨て)
    const res = await fetch(t.url, {
      redirect: "follow",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: { "user-agent": "stats47-open-data-link-check/1.0" },
    });
    await res.body?.cancel();
    if (res.status === 403) return { t, verdict: "bot-block", detail: "HTTP 403" };
    if (res.status === 404 || res.status === 410) return { t, verdict: "gone", detail: `HTTP ${res.status}` };
    if (res.status >= 500) return { t, verdict: "server-err", detail: `HTTP ${res.status}` };
    if (res.status >= 400) return { t, verdict: "gone", detail: `HTTP ${res.status}` };
    return { t, verdict: "ok", detail: `HTTP ${res.status}` };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return { t, verdict: "timeout", detail: message };
  }
}

async function main(): Promise<void> {
  const results: Awaited<ReturnType<typeof probe>>[] = [];
  for (let offset = 0; offset < unique.length; offset += MAX_CONCURRENCY) {
    const batch = unique.slice(offset, offset + MAX_CONCURRENCY);
    results.push(...(await Promise.all(batch.map(probe))));
  }

  const byVerdict = new Map<Verdict, typeof results>();
  for (const r of results) {
    const list = byVerdict.get(r.verdict) || [];
    list.push(r);
    byVerdict.set(r.verdict, list);
  }
  for (const verdict of ["gone", "server-err", "timeout", "bot-block"] as const) {
    for (const r of byVerdict.get(verdict) || []) {
      console.log(`[${verdict}] ${r.t.owner} ${r.t.label}: ${r.detail} ${r.t.url}`);
    }
  }
  const counts = (["ok", "bot-block", "gone", "server-err", "timeout"] as const)
    .map((v) => `${v}=${byVerdict.get(v)?.length || 0}`)
    .join(" / ");
  console.log(`\nopen-data links: ${unique.length} URLs → ${counts}`);
  if ((byVerdict.get("gone")?.length || 0) > 0) {
    console.error("gone (404/410) を検出。移転先を調査して catalog の URL / status を更新すること");
    process.exitCode = 1;
  }
}

void main();
