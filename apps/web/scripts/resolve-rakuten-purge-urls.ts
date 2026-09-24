/**
 * 楽天カタログ同期 (`sync-rakuten-catalog.yml`) で表示が変わるページの URL を 1 行 1 件で書き出す。
 *
 * 以前は同期のたびに `purge-worker-cache.ts --all` で全ページの HTML を消していた (毎日 JST 04:00)。
 * 2026-09-11 にパージが HTML キャッシュへ実際に効くようになってから、楽天カードと無関係なページまで
 * 毎日作り直しになり、Workers CPU ms の従量課金が増えた。ここでは表示が変わった snapshot を読む
 * ページだけを選ぶ (写像は `lib/rakuten-purge-targets.ts`)。
 *
 * **R2 へ push する前に実行する。** 新しい snapshot (`--dir`) と本番 R2 の現行版を比べるため。
 * 本番 R2 を読めなかったときは exit 1 にし、workflow 側が `--all` へ倒す (古いカードを残さない側)。
 *
 * npx tsx -r ./packages/ranking/src/scripts/setup-cli.js apps/web/scripts/resolve-rakuten-purge-urls.ts \
 *   --dir .local/r2/app/rakuten --out .local/ci/rakuten-purge-urls.txt
 */
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

import {
  isSnapshotContentChanged,
  resolveRakutenPurgePaths,
  type BlogIndexEntry,
} from "./lib/rakuten-purge-targets";

const SITE_ORIGIN = "https://stats47.jp";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_FETCH_URL || "https://storage.stats47.jp";
const FETCH_CONCURRENCY = 16;

const argv = process.argv.slice(2);
const arg = (key: string) => {
  const index = argv.indexOf(`--${key}`);
  return index < 0 ? undefined : argv[index + 1];
};
const dir = arg("dir");
const out = arg("out");
if (!dir || !out) throw new Error("--dir / --out が必要です");

/** 本番 R2 の JSON。404 は null (新規)、それ以外の失敗は throw (比較不能)。 */
async function fetchPublishedJson(key: string): Promise<unknown> {
  const path = key.split("/").map(encodeURIComponent).join("/");
  // 公開ドメインの CDN キャッシュに古い版が残っていても、比較元は最新の R2 にする
  const response = await fetch(`${R2_PUBLIC_URL}/${path}?purge-check=${Date.now()}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`${key}: HTTP ${response.status}`);
  return response.json();
}

async function listChanged(kind: "furusato" | "items"): Promise<string[]> {
  const kindDir = join(resolve(dir!), kind);
  const files = (await readdir(kindDir).catch(() => [])).filter((name) => name.endsWith(".json"));
  const changed: string[] = [];
  for (let start = 0; start < files.length; start += FETCH_CONCURRENCY) {
    await Promise.all(
      files.slice(start, start + FETCH_CONCURRENCY).map(async (name) => {
        const next = JSON.parse(await readFile(join(kindDir, name), "utf8"));
        const previous = await fetchPublishedJson(`app/rakuten/${kind}/${name}`);
        if (isSnapshotContentChanged(previous, next)) changed.push(name.slice(0, -".json".length));
      }),
    );
  }
  return changed.sort();
}

async function main() {
  const [furusatoPrefCodes, itemTerms] = await Promise.all([listChanged("furusato"), listChanged("items")]);

  const kakei = (await fetchPublishedJson("app/survey/kakei-chousa/items.json")) as {
    items?: Array<{ rankingKey: string; areaType?: string }>;
  } | null;
  const blogIndex = (await fetchPublishedJson("app/blog/all.json")) as { articles?: BlogIndexEntry[] } | null;
  if (!kakei?.items || !blogIndex?.articles) {
    throw new Error("家計調査ランキング一覧または blog 索引を本番 R2 から読めない");
  }

  const paths = resolveRakutenPurgePaths({
    change: { furusatoPrefCodes, itemTerms },
    kakeiRankingKeys: kakei.items.filter((item) => item.areaType === "prefecture").map((item) => item.rankingKey),
    blogs: blogIndex.articles,
  });

  await mkdir(dirname(resolve(out!)), { recursive: true });
  await writeFile(resolve(out!), paths.map((path) => `${SITE_ORIGIN}${path}\n`).join(""));

  const count = (prefix: string) => paths.filter((path) => path.startsWith(prefix)).length;
  console.log(
    `表示が変わった snapshot: 返礼品 ${furusatoPrefCodes.length} 県 / 商品 ${itemTerms.length} 品目 → ` +
      `purge ${paths.length} URL (ranking ${count("/ranking/")} / blog ${count("/blog/")} / ` +
      `県 ${paths.filter((path) => /^\/areas\/\d+$/.test(path)).length} / 市区町村 ${count("/areas/") - paths.filter((path) => /^\/areas\/\d+$/.test(path)).length})`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
