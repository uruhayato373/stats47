/**
 * build-wp0-inventory — 市区町村スコープ分離 WP0 の read-only 棚卸し (doc 44 §WP0)
 * ---------------------------------------------------------------------------
 * コード・R2・URL を一切変更しない。事実だけを集めて
 * `.claude/state/municipalities/wp0-inventory.json` と `LATEST.md` に出す。
 *
 * 集めるもの:
 *   1. active MetricConfig の entity 分類 (pref-only / city-only / both / other)
 *   2. 市区町村候補ごとの R2 artifact 実在・年・単位・entity 数・null/zero 率
 *   3. 現行 route / sitemap / 公開 city allowlist の対応
 *   4. entity 母集団の機械分類 (自治体 / 政令市の行政区 / 特別区部 / 重複 / 親不一致)
 *
 * ★「取れなかった」を「無い」と混同しない。R2 が読めなかった候補は `undetermined` にする
 *   (存在しないことの証明と、確認できなかったことは別物)。
 *
 * usage:
 *   npx tsx .claude/scripts/municipalities/build-wp0-inventory.ts [--limit N] [--no-r2]
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";

import { METRICS_REGISTRY } from "@stats47/data-configs/registry";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const OUT_DIR = join(REPO_ROOT, ".claude/state/municipalities");
const R2_BASE = process.env.R2_PUBLIC_FETCH_URL ?? "https://storage.stats47.jp";

/** 社内プロキシ配下では Node の素の fetch が外に出られない (local-environment.md)。 */
function resolveDispatcher() {
  const proxy = process.env.HTTPS_PROXY ?? process.env.https_proxy ?? process.env.HTTP_PROXY;
  if (!proxy) return undefined;
  try {
    const { ProxyAgent } = createRequire(import.meta.url)("undici");
    return new ProxyAgent(proxy);
  } catch {
    return undefined;
  }
}
const dispatcher = resolveDispatcher();

type Fetched =
  | { status: "ok"; body: unknown }
  | { status: "absent" }
  | { status: "undetermined"; reason: string };

async function getJson(key: string): Promise<Fetched> {
  try {
    const res = await fetch(`${R2_BASE}/${key}`, dispatcher ? ({ dispatcher } as RequestInit) : undefined);
    if (res.status === 404) return { status: "absent" };
    if (!res.ok) return { status: "undetermined", reason: `HTTP ${res.status}` };
    return { status: "ok", body: await res.json() };
  } catch (e) {
    return { status: "undetermined", reason: String((e as Error)?.message ?? e).slice(0, 120) };
  }
}

type Bucket = "pref-only" | "city-only" | "both" | "other";

function classifyMetrics() {
  const buckets: Record<Bucket, string[]> = { "pref-only": [], "city-only": [], both: [], other: [] };
  const meta: Record<string, unknown> = {};
  for (const m of Object.values(METRICS_REGISTRY)) {
    if (!m.isActive) continue;
    const e = new Set<string>(m.entities ?? []);
    const bucket: Bucket =
      e.has("prefecture") && e.has("city")
        ? "both"
        : e.has("city")
          ? "city-only"
          : e.has("prefecture")
            ? "pref-only"
            : "other";
    buckets[bucket].push(m.key);
    if (bucket === "city-only" || bucket === "both") {
      meta[m.key] = {
        bucket,
        title: m.title,
        unit: m.unit,
        category: m.category,
        entities: [...e],
        years: m.years,
        sourceKind: m.source?.kind ?? null,
        surveyId: m.surveyId ?? null,
      };
    }
  }
  return { buckets, meta };
}

function classifyEntities() {
  const cities: Array<{ cityCode: string; cityName: string; level: string; prefCode: string }> = JSON.parse(
    readFileSync(join(REPO_ROOT, "packages/area/src/data/cities.json"), "utf-8"),
  );
  const byCode = new Map<string, (typeof cities)[number]>();
  const duplicates: string[] = [];
  for (const c of cities) {
    if (byCode.has(c.cityCode)) duplicates.push(c.cityCode);
    byCode.set(c.cityCode, c);
  }
  const municipalities = cities.filter((c) => c.level === "2");
  const wards = cities.filter((c) => c.level === "3");
  const wardParentIsCity = wards.filter((w) => byCode.get(w.prefCode)?.level === "2").length;
  const orphanWards = wards.filter((w) => !byCode.has(w.prefCode)).map((w) => w.cityCode);
  const designatedCityCodes = new Set(wards.map((w) => w.prefCode));
  const tokyoAggregate = municipalities.filter((c) => c.prefCode === "13000" && c.cityName.includes("特別区部"));

  return {
    total: cities.length,
    municipalities: municipalities.length,
    administrativeWards: wards.length,
    designatedCityBodies: designatedCityCodes.size,
    duplicateCodes: duplicates,
    orphanWards,
    wardParentResolvesToCity: wardParentIsCity === wards.length,
    tokyoSpecialWards: {
      individualEntities: 0,
      aggregateEntity: tokyoAggregate.map((c) => `${c.cityCode} ${c.cityName}`),
      note: "cities.json に 23 区は個別に無く「特別区部」1 件へ集約されている。doc 44 の pilot 規則が言う『東京23特別区を含む』は現状のデータでは満たせない",
    },
    publishableEntityCount: municipalities.length,
  };
}

function readCurrentSurface() {
  const read = (p: string) => (existsSync(join(REPO_ROOT, p)) ? readFileSync(join(REPO_ROOT, p), "utf-8") : null);
  const toPosix = (p: string) => p.split("\\").join("/");

  const routes: string[] = [];
  const walkRoutes = (rel: string) => {
    const abs = join(REPO_ROOT, rel);
    if (!existsSync(abs)) return;
    for (const e of readdirSync(abs, { withFileTypes: true })) {
      if (e.isDirectory()) walkRoutes(join(rel, e.name));
      else if (e.name === "page.tsx") routes.push(toPosix(rel));
    }
  };
  walkRoutes("apps/web/src/app/areas");
  walkRoutes("apps/web/src/app/municipalities");

  const ssgHits: string[] = [];
  const grepSsg = (rel: string) => {
    const abs = join(REPO_ROOT, rel);
    if (!existsSync(abs)) return;
    for (const e of readdirSync(abs, { withFileTypes: true })) {
      const child = join(rel, e.name);
      if (e.isDirectory()) grepSsg(child);
      else if (/\.tsx?$/.test(e.name) && (read(child) ?? "").includes("PHASE_1_SSG_CITIES")) ssgHits.push(toPosix(child));
    }
  };
  grepSsg("apps/web/src");

  return {
    areaRoutes: routes,
    municipalityRoutesExist: routes.some((r) => r.includes("/municipalities")),
    ssgCityAllowlistDefinedIn: ssgHits,
    sitemapMentionsCities: (read("apps/web/src/app/sitemap.ts") ?? "").includes("cities"),
  };
}

async function main() {
  const argv = process.argv.slice(2);
  const limit = argv.includes("--limit") ? Number(argv[argv.indexOf("--limit") + 1]) : Infinity;
  const skipR2 = argv.includes("--no-r2");

  const { buckets, meta } = classifyMetrics();
  const entities = classifyEntities();
  const surface = readCurrentSurface();

  const candidates = [...buckets["city-only"], ...buckets.both];
  const artifacts: Record<string, Record<string, unknown>> = {};
  let checked = 0;

  // entity code → level / 親市。R2 payload の母集団を機械的に分類するのに使う。
  const cityRows: Array<{ cityCode: string; level: string; prefCode: string }> = JSON.parse(
    readFileSync(join(REPO_ROOT, "packages/area/src/data/cities.json"), "utf-8"),
  );
  const entityLevel = new Map(cityRows.map((c) => [c.cityCode, c.level]));
  const wardParent = new Map(cityRows.filter((c) => c.level === "3").map((c) => [c.cityCode, c.prefCode]));

  if (!skipR2) {
    for (const key of candidates) {
      if (checked >= limit) break;
      checked++;
      const r = await getJson(`app/stats/${key}/cities.json`);
      if (r.status !== "ok") {
        artifacts[key] = { availability: r.status, reason: r.status === "undetermined" ? r.reason : null };
        continue;
      }
      // ★payload は `rows` を持つ (`values` / `data` ではない)。ここを取り違えると
      //   全件 present・0 行という「何も見ていないのに緑」の棚卸しになる (実装中に踏んだ)。
      const body = r.body as { rows?: unknown[] };
      const rows = (Array.isArray(r.body) ? r.body : (body?.rows ?? [])) as Array<Record<string, unknown>>;
      if (!Array.isArray(body?.rows) && !Array.isArray(r.body)) {
        artifacts[key] = { availability: "undetermined", reason: `想定外の payload 形状: ${Object.keys(r.body as object).join(",")}` };
        continue;
      }
      const yearOf = (x: Record<string, unknown>) => String(x.yearCode ?? x.year ?? "");
      const years = [...new Set(rows.map(yearOf))].filter(Boolean).sort();
      const latest = years[years.length - 1] ?? null;
      const latestRows = rows.filter((x) => yearOf(x) === latest);
      const codes = [...new Set(latestRows.map((x) => String(x.areaCode ?? x.cityCode ?? "")))].filter(Boolean);
      const finite = latestRows.map((x) => x.value).filter((v): v is number => typeof v === "number" && Number.isFinite(v));

      // 母集団の中身を分類する。政令市は「本体 (01100)」と「行政区 (01101…)」が
      // 同じ payload に同居しうるので、素の件数だけを見ると二重計上に気づけない。
      const levelOf = (code: string) => entityLevel.get(code) ?? "unknown";
      const wards = codes.filter((c) => levelOf(c) === "3");
      const bodies = codes.filter((c) => levelOf(c) === "2");
      const unknownCodes = codes.filter((c) => levelOf(c) === "unknown");
      const wardParents = new Set(wards.map((w) => wardParent.get(w)).filter(Boolean) as string[]);
      const bodyAndWardOverlap = [...wardParents].filter((p) => codes.includes(p));

      artifacts[key] = {
        availability: "present",
        years,
        latestYear: latest,
        rowsTotal: rows.length,
        rowsLatest: latestRows.length,
        entitiesLatest: codes.length,
        duplicateEntities: latestRows.length - codes.length,
        municipalityCount: bodies.length,
        administrativeWardCount: wards.length,
        unknownCodeCount: unknownCodes.length,
        unknownCodeSample: unknownCodes.slice(0, 5),
        designatedCityDoubleCount: bodyAndWardOverlap.length,
        nullRate: latestRows.length ? Number((1 - finite.length / latestRows.length).toFixed(4)) : null,
        zeroRate: finite.length ? Number((finite.filter((v) => v === 0).length / finite.length).toFixed(4)) : null,
      };
    }
  }

  const by = (s: string) => Object.entries(artifacts).filter(([, a]) => a.availability === s);
  const inventory = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    r2Base: R2_BASE,
    metricCounts: Object.fromEntries(Object.entries(buckets).map(([k, v]) => [k, v.length])),
    candidateCount: candidates.length,
    entities,
    surface,
    artifactSummary: {
      checked,
      present: by("present").length,
      absent: by("absent").length,
      undetermined: by("undetermined").length,
    },
    metrics: meta,
    artifacts,
  };

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(join(OUT_DIR, "wp0-inventory.json"), JSON.stringify(inventory, null, 2) + "\n", "utf-8");
  writeFileSync(join(OUT_DIR, "LATEST.md"), renderMarkdown(inventory), "utf-8");
  console.log(`WP0 inventory -> ${join(OUT_DIR, "wp0-inventory.json")}`);
  console.log(`  metric: ${JSON.stringify(inventory.metricCounts)} / candidates ${candidates.length}`);
  console.log(
    `  artifact: present ${inventory.artifactSummary.present} / absent ${inventory.artifactSummary.absent} / undetermined ${inventory.artifactSummary.undetermined} (checked ${checked})`,
  );
  console.log(
    `  entity: municipalities ${entities.municipalities} / wards ${entities.administrativeWards} / designated ${entities.designatedCityBodies}`,
  );
}

function renderMarkdown(inv: ReturnType<typeof Object> & Record<string, any>): string {
  const present = Object.entries(inv.artifacts).filter(([, a]: [string, any]) => a.availability === "present") as [string, any][];
  const ranked = present
    .filter(([, a]) => a.entitiesLatest >= 1000 && a.duplicateEntities === 0 && a.unknownCodeCount === 0)
    .sort((a, b) => b[1].entitiesLatest - a[1].entitiesLatest);
  const rows = ranked
    .slice(0, 12)
    .map(
      ([k, a]) =>
        `| ${k} | ${a.latestYear} | ${a.entitiesLatest} | ${a.municipalityCount} | ${a.administrativeWardCount} | ${a.designatedCityDoubleCount} | ${a.nullRate} | ${a.zeroRate} | ${inv.metrics[k]?.unit ?? ""} |`,
    )
    .join("\n");
  const withWards = present.filter(([, a]) => a.administrativeWardCount > 0).length;
  const withDouble = present.filter(([, a]) => a.designatedCityDoubleCount > 0).length;
  const withUnknown = present.filter(([, a]) => a.unknownCodeCount > 0).length;

  return `# 市区町村スコープ分離 WP0 棚卸し

生成: ${inv.generatedAt} (read-only・コード / R2 / URL は未変更)
再生成: \`npx tsx .claude/scripts/municipalities/build-wp0-inventory.ts\`

## metric 分類 (active)

| bucket | 件数 |
|---|---:|
${Object.entries(inv.metricCounts)
  .map(([k, v]) => `| ${k} | ${v} |`)
  .join("\n")}

市区町村候補 (city-only + both) = **${inv.candidateCount} 件**

## R2 artifact (\`app/stats/<key>/cities.json\`)

| availability | 件数 |
|---|---:|
| present | ${inv.artifactSummary.present} |
| absent | ${inv.artifactSummary.absent} |
| undetermined | ${inv.artifactSummary.undetermined} |

**\`undetermined\` は「取れなかった」であって「無い」ではない。** 母集団から外さずに再取得する。

## entity 母集団 (\`packages/area/src/data/cities.json\`)

- 総数 ${inv.entities.total} / 自治体 (level 2) **${inv.entities.municipalities}** / 政令市の行政区 (level 3) ${inv.entities.administrativeWards}
- 政令市本体 ${inv.entities.designatedCityBodies} 件
- 重複 code ${inv.entities.duplicateCodes.length} 件 / 親不明の行政区 ${inv.entities.orphanWards.length} 件
- 行政区の \`prefCode\` は親の県ではなく**親の市コード**を指す: ${inv.entities.wardParentResolvesToCity ? "全件で確認" : "**一致しない行がある**"}
- 東京23特別区: ${inv.entities.tokyoSpecialWards.note}

## 現行 URL 面

- \`/municipalities\` 系 route: ${inv.surface.municipalityRoutesExist ? "あり" : "**無い**"}
- areas 配下の page.tsx: ${inv.surface.areaRoutes.length} 件
- 公開 city allowlist の定義箇所: ${inv.surface.ssgCityAllowlistDefinedIn.join(", ") || "見つからない"}
- sitemap が city に言及: ${inv.surface.sitemapMentionsCities}

## 配信 payload の母集団 (present ${present.length} 件の最新年)

- 政令市の**行政区を含む** artifact: **${withWards} 件**
- 政令市の**本体と行政区が同居**する artifact: **${withDouble} 件** (素の件数だけ見ると二重計上に気づけない)
- cities.json に無い code を含む artifact: ${withUnknown} 件

行政区は自治体ではないので、municipality ランキングの母集団に入れると
「札幌市」と「札幌市中央区」が同じ表に並ぶ。WP1 の entity policy はここを機械的に落とす。

## pilot 候補 (entity 1000 以上・重複ゼロ・未知 code ゼロ)

| key | 最新年 | entity 数 | 自治体 | 行政区 | 本体と区の同居 | null 率 | zero 率 | 単位 |
|---|---|---:|---:|---:|---:|---:|---:|---|
${rows}

地方財政は財政主体の監査が終わるまで pilot にしない (doc 44 の pilot 規則)。
`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error("Fatal:", (e as Error)?.message ?? e);
    process.exit(1);
  });
}
