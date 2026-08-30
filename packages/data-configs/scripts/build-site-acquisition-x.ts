/**
 * Theme / area X acquisition drafts.
 *
 * The source catalogs and canonical landing pages are git TS SSOT. This script
 * only derives local posting assets and a captions queue; it never publishes.
 *
 * Usage:
 *   npx tsx packages/data-configs/scripts/build-site-acquisition-x.ts build
 *   npx tsx packages/data-configs/scripts/build-site-acquisition-x.ts audit
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PREFECTURES } from "../src/area-axis";
import { AREA_EDITORIALS } from "../src/area-databook/editorial";
import { THEME_CATALOGS } from "../src/theme-catalog";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const LOCAL_SNS_ROOT = path.join(PROJECT_ROOT, ".local/r2/sns");
const QUEUE_PATH = path.join(LOCAL_SNS_ROOT, "_queue/site-acquisition-x.json");
const EXPECTED_WIDTH = 1200;
const EXPECTED_HEIGHT = 630;

type Draft = {
  key: string;
  domain: "theme" | "area";
  template: "theme-lens" | "area-profile";
  imageKind: "theme-overview-card" | "area-profile-card";
  caption: string;
  canonicalUrl: string;
  campaign: string;
  mediaPath: string;
  metricKeys: string[];
  sourceUrl: string;
};

type SourceManifest = {
  schemaVersion: 1;
  domain: Draft["domain"];
  contentKey: string;
  canonicalUrl: string;
  sourceUrl: string;
  landingStatus: number;
  finalLandingUrl: string;
  fetchedAt: string;
  contentType: string;
  sha256: string;
  width: number;
  height: number;
};

function pngDimensions(buffer: Buffer): { width: number; height: number } {
  const signature = buffer.subarray(0, 8).toString("hex");
  if (signature !== "89504e470d0a1a0a" || buffer.length < 24) {
    throw new Error("PNGではありません");
  }
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function clipped(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}

function themeCaption(
  index: number,
  title: string,
  description: string,
  metrics: string[],
  count: number,
): string {
  const first = metrics[0] ?? "主要指標";
  const second = metrics[1] ?? "関連指標";
  const bodies = [
    `${title}、1つの順位だけで説明できますか？\n${first}と${second}など全${count}指標を横断。結果と背景を分けて読めます。`,
    `「${title}」を見る物差しは1本では足りない。\n${first}、${second}などを同じ画面で47都道府県比較しました。`,
    `${title}の地域差を、順位の寄せ集めで終わらせない。\n${first}から${second}まで、関連する全${count}指標をまとめて確認できます。`,
    `${first}だけでは見落とす「${title}」の全体像。\n${second}など複数指標を重ね、地域差の背景までたどれます。`,
    `データを点ではなく線で読む「${title}」。\n${clipped(description, 46)}。気になる県からランキングへ深掘りできます。`,
    `47都道府県の${title}を多面的に比較。\n${first}と${second}を同じテーマで読み解く入口を整理しました。`,
  ];
  return `${bodies[index % bodies.length]}\n詳しくは👇\n{{url}}\n#都道府県 #地域データ #テーマ分析`;
}

function areaCaption(
  index: number,
  prefecture: string,
  tree: string,
  flower: string,
  bird: string,
  specialty: string,
  secondSpecialty: string,
): string {
  const s = clipped(specialty, 18);
  const s2 = clipped(secondSpecialty, 14);
  const bodies = [
    `${prefecture}を1位・47位だけで語らない。\n県木は${tree}、県鳥は${bird}。人口・産業・暮らしの県データブックへ。`,
    `${prefecture}の「らしさ」をデータでたどる。\n県花${flower}、${s}と${s2}、統計ランキングを1ページに整理しました。`,
    `あなたの知る${prefecture}は、データでも同じ姿ですか？\n${tree}や${s}から、人口・経済・暮らしまで横断できます。`,
    `${prefecture}を数字と地域文化の両方から見る。\n県鳥${bird}、特産${s}、全国順位をまとめた県別ページです。`,
    `旅先では見えにくい${prefecture}の輪郭。\n県木${tree}と特産${s}、暮らしの統計を同じページで確認できます。`,
    `${prefecture}のデータブックを公開中。\n${bird}と${s}、${s2}を入口に、人口・産業・消費の数字を県別に深掘り。`,
  ];
  return `${bodies[index % bodies.length]}\n続きは👇\n{{url}}\n#都道府県 #${prefecture} #県データ`;
}

function buildDrafts(): Draft[] {
  const themes = Object.values(THEME_CATALOGS)
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((theme, index): Draft => {
      const metricLabels = theme.metrics.map((metric) => metric.shortLabel);
      return {
        key: `theme-${theme.key}-overview`,
        domain: "theme",
        template: "theme-lens",
        imageKind: "theme-overview-card",
        caption: themeCaption(index, theme.title, theme.description, metricLabels, theme.metrics.length),
        canonicalUrl: `https://stats47.jp/themes/${theme.key}`,
        campaign: `theme-${theme.key}`,
        mediaPath: `.local/r2/sns/theme/${theme.key}/x/stills/${theme.key}.png`,
        metricKeys: theme.metrics.map((metric) => metric.rankingKey),
        sourceUrl: `https://stats47.jp/themes/${theme.key}/opengraph-image`,
      };
    });

  const areas = PREFECTURES.map((prefecture, index): Draft => {
    const editorial = AREA_EDITORIALS[prefecture.code];
    if (!editorial) throw new Error(`area editorial未登録: ${prefecture.code}`);
    return {
      key: `area-${prefecture.code}-profile`,
      domain: "area",
      template: "area-profile",
      imageKind: "area-profile-card",
      caption: areaCaption(
        index,
        prefecture.short,
        editorial.symbols.tree,
        editorial.symbols.flower,
        editorial.symbols.bird,
        editorial.specialties[0]?.name ?? "地域の特産",
        editorial.specialties[1]?.name ?? "地域の特産",
      ),
      canonicalUrl: `https://stats47.jp/areas/${prefecture.code}`,
      campaign: `area-${prefecture.code}`,
      mediaPath: `.local/r2/sns/area/${prefecture.code}/x/stills/${prefecture.code}.png`,
      metricKeys: [],
      sourceUrl: `https://storage.stats47.jp/app/areas/${prefecture.code}/ogp/ogp.png`,
    };
  });

  return [...themes, ...areas];
}

function absoluteMediaPath(draft: Draft): string {
  return path.join(PROJECT_ROOT, draft.mediaPath);
}

function manifestPath(draft: Draft): string {
  return path.join(path.dirname(absoluteMediaPath(draft)), "source.json");
}

async function fetchImage(draft: Draft): Promise<void> {
  const requestOptions = {
    headers: { "user-agent": "stats47-site-acquisition-builder/1.0" },
    signal: AbortSignal.timeout(30_000),
  } as const;
  const [response, landingResponse] = await Promise.all([
    fetch(draft.sourceUrl, requestOptions),
    fetch(draft.canonicalUrl, { ...requestOptions, method: "HEAD" }),
  ]);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${draft.sourceUrl}`);
  if (!landingResponse.ok) {
    throw new Error(`${landingResponse.status} ${landingResponse.statusText}: ${draft.canonicalUrl}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  const { width, height } = pngDimensions(buffer);
  if (width !== EXPECTED_WIDTH || height !== EXPECTED_HEIGHT) {
    throw new Error(`${draft.key}: ${width}x${height} (expected ${EXPECTED_WIDTH}x${EXPECTED_HEIGHT})`);
  }
  const target = absoluteMediaPath(draft);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, buffer);
  const manifest: SourceManifest = {
    schemaVersion: 1,
    domain: draft.domain,
    contentKey: draft.key,
    canonicalUrl: draft.canonicalUrl,
    sourceUrl: draft.sourceUrl,
    landingStatus: landingResponse.status,
    finalLandingUrl: landingResponse.url,
    fetchedAt: new Date().toISOString(),
    contentType: response.headers.get("content-type") ?? "image/png",
    sha256: createHash("sha256").update(buffer).digest("hex"),
    width,
    height,
  };
  await writeFile(manifestPath(draft), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

async function runWithConcurrency<T>(items: T[], limit: number, task: (item: T) => Promise<void>) {
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const item = items[cursor++];
      if (item !== undefined) await task(item);
    }
  });
  await Promise.all(workers);
}

async function audit(drafts: Draft[]): Promise<void> {
  const errors: string[] = [];
  const keys = new Set<string>();
  for (const draft of drafts) {
    if (keys.has(draft.key)) errors.push(`content key重複: ${draft.key}`);
    keys.add(draft.key);
    if (!draft.caption.includes("{{url}}")) errors.push(`URL tokenなし: ${draft.key}`);
    if (!draft.canonicalUrl.startsWith("https://stats47.jp/")) {
      errors.push(`canonical不正: ${draft.key}`);
    }
    try {
      const buffer = await readFile(absoluteMediaPath(draft));
      const dimensions = pngDimensions(buffer);
      const manifest = JSON.parse(await readFile(manifestPath(draft), "utf8")) as SourceManifest;
      const sha256 = createHash("sha256").update(buffer).digest("hex");
      if (dimensions.width !== EXPECTED_WIDTH || dimensions.height !== EXPECTED_HEIGHT) {
        errors.push(`画像寸法不正: ${draft.key}`);
      }
      if (manifest.sha256 !== sha256) errors.push(`SHA不一致: ${draft.key}`);
      if (manifest.canonicalUrl !== draft.canonicalUrl) errors.push(`manifest canonical不一致: ${draft.key}`);
      if (manifest.landingStatus !== 200) errors.push(`landing HTTP不正: ${draft.key}`);
      if (manifest.finalLandingUrl !== draft.canonicalUrl) errors.push(`landing redirect不正: ${draft.key}`);
    } catch (error) {
      errors.push(`${draft.key}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  if (errors.length > 0) throw new Error(`site X audit FAIL (${errors.length})\n${errors.join("\n")}`);
  console.log(`[site-acquisition-x] audit PASS: theme=${Object.keys(THEME_CATALOGS).length}, area=${PREFECTURES.length}, total=${drafts.length}`);
}

async function main() {
  const command = process.argv[2] ?? "build";
  if (command !== "build" && command !== "audit") {
    throw new Error(`unknown command: ${command}`);
  }
  const drafts = buildDrafts();
  if (command === "build") {
    await runWithConcurrency(drafts, 6, fetchImage);
    await mkdir(path.dirname(QUEUE_PATH), { recursive: true });
    await writeFile(QUEUE_PATH, `${JSON.stringify(drafts, null, 2)}\n`, "utf8");
  }
  await audit(drafts);
  console.log(`[site-acquisition-x] queue: ${path.relative(PROJECT_ROOT, QUEUE_PATH)}`);
}

main().catch((error) => {
  console.error(`[site-acquisition-x] ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
