#!/usr/bin/env tsx
/**
 * ranking / areas の静的 OGP 画像を Satori (Node) でレンダリングして cloud R2 へ push。
 *
 * 背景: ランタイムの next/og ImageResponse は Cloudflare Worker で例外を投げ 500 になる
 * (error 1101)。OGP は Node/CI で事前生成して R2 に保存し、配信時は静的 URL を参照する
 * (完全DBレス / R2 snapshot 方針)。blog は generate-blog-thumbnails-cloud.ts が既に
 * `app/blog/<slug>/ogp/ogp.png` を生成済み。本スクリプトは ranking / areas を担う。
 * 正典: `.claude/rules/ogp-image-standards.md`。
 *
 * 読み=公開 R2 URL (storage.stats47.jp) + 本番 sitemap、書き=wrangler CLI (S3 鍵不要)。
 * 生成物は /tmp に出して push するだけでローカルに残らない。render lib はブログと共有
 * (apps/web/scripts/lib/blog-thumbnail-render.ts、ローカル npm フォントを使うため Worker と違い健全)。
 *
 * Usage:
 *   # 監査のみ (R2 で ogp.png が 404 の対象を一覧、read-only・native binding 不要)
 *   npx tsx apps/web/scripts/generate-ogp-images.ts --type ranking --audit
 *   npx tsx apps/web/scripts/generate-ogp-images.ts --type areas --audit
 *
 *   # 欠落分を生成 (dry-run、/tmp に出すだけ)
 *   npx tsx apps/web/scripts/generate-ogp-images.ts --type ranking
 *
 *   # 欠落分を生成して cloud R2 へ push
 *   npx tsx apps/web/scripts/generate-ogp-images.ts --type ranking --apply
 *   npx tsx apps/web/scripts/generate-ogp-images.ts --type areas --apply
 *
 *   # 特定キーのみ / 既存も強制再生成 / 件数上限
 *   npx tsx apps/web/scripts/generate-ogp-images.ts --type ranking --key annual-sunshine-duration --apply
 *   npx tsx apps/web/scripts/generate-ogp-images.ts --type ranking --force --limit 50 --apply
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const PUBLIC_URL = process.env.R2_PUBLIC_FETCH_URL ?? "https://storage.stats47.jp";
const SITE = process.env.SITE_ORIGIN ?? "https://stats47.jp";
const BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME ?? "stats47";
const PROJECT_ROOT = join(import.meta.dirname ?? __dirname, "../../..");

type OgpType = "ranking" | "areas";

interface CliOptions {
  type: OgpType;
  audit: boolean;
  apply: boolean;
  force: boolean;
  keys: string[] | null;
  limit: number | null;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const val = (name: string): string | null => {
    const i = args.indexOf(name);
    return i !== -1 ? (args[i + 1] ?? null) : null;
  };
  const rawKey = val("--key");
  const rawType = val("--type");
  if (rawType !== "ranking" && rawType !== "areas") {
    throw new Error("--type は ranking | areas を指定してください");
  }
  const rawLimit = val("--limit");
  return {
    type: rawType,
    audit: args.includes("--audit"),
    apply: args.includes("--apply"),
    force: args.includes("--force"),
    keys: rawKey ? rawKey.split(",").map((s) => s.trim()).filter(Boolean) : null,
    limit: rawLimit ? Number(rawLimit) : null,
  };
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** 本番 sitemap から ranking キーを列挙 (live で indexable なもの)。 */
async function listRankingKeys(): Promise<string[]> {
  const index = await fetch(`${SITE}/sitemap.xml`).then((r) => r.text());
  const parts = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const keys = new Set<string>();
  for (const part of parts) {
    const xml = await fetch(part).then((r) => r.text());
    for (const m of xml.matchAll(/stats47\.jp\/ranking\/([a-z0-9-]+)</g)) {
      keys.add(m[1]);
    }
  }
  return [...keys].sort();
}

/** 47 都道府県コード。 */
function listAreaCodes(): string[] {
  return Array.from({ length: 47 }, (_, i) => `${String(i + 1).padStart(2, "0")}000`);
}

/** R2 の ogp.png が 200 かつ画像か。 */
async function cloudOgpOk(r2Key: string): Promise<boolean> {
  try {
    const res = await fetch(`${PUBLIC_URL}/${r2Key}`, { method: "HEAD" });
    return res.ok && (res.headers.get("content-type") ?? "").includes("image");
  } catch {
    return false;
  }
}

interface RankingItemPayload {
  item?: {
    title?: string;
    rankingName?: string;
    latestYear?: { yearName?: string };
  };
}
interface AreaProfilePayload {
  areaName?: string;
  strengths?: { indicator?: string; rank?: number }[];
}

const r2KeyFor = (type: OgpType, id: string): string =>
  type === "ranking" ? `app/ranking/${id}/ogp/ogp.png` : `app/areas/${id}/ogp/ogp.png`;

/** 対象 id から OGP の {title, subtitle, category, domainPath} を導出。取得不可なら null。 */
async function deriveOgpData(
  type: OgpType,
  id: string,
): Promise<{ title: string; subtitle: string | null; category: string; domainPath: string } | null> {
  if (type === "ranking") {
    const payload = await fetchJson<RankingItemPayload>(`${PUBLIC_URL}/app/ranking/${id}/item.json`);
    const it = payload?.item;
    if (!it?.title && !it?.rankingName) return null;
    const title = (it.title ?? it.rankingName) as string;
    const year = it.latestYear?.yearName ?? "";
    return {
      title,
      subtitle: year ? `都道府県ランキング（${year}）` : "都道府県ランキング",
      category: "RANKING",
      domainPath: "stats47.jp/ranking",
    };
  }
  const profile = await fetchJson<AreaProfilePayload>(`${PUBLIC_URL}/app/areas/${id}/profile.json`);
  if (!profile?.areaName) return null;
  const topStrength = profile.strengths?.find((s) => s.rank === 1)?.indicator;
  return {
    title: profile.areaName,
    subtitle: topStrength ? `${topStrength} 全国1位ほか、統計で見る地域プロフィール` : "統計で見る地域プロフィール",
    category: "AREA",
    domainPath: "stats47.jp/areas",
  };
}

function putToR2(key: string, filePath: string): void {
  execFileSync(
    "npx",
    [
      "wrangler",
      "r2",
      "object",
      "put",
      `${BUCKET}/${key}`,
      `--file=${filePath}`,
      "--content-type=image/png",
      "--remote",
    ],
    { stdio: "inherit", cwd: PROJECT_ROOT },
  );
}

async function main() {
  const opts = parseArgs();
  console.log(`type=${opts.type} 公開URL=${PUBLIC_URL} bucket=${BUCKET}`);

  let ids =
    opts.keys ?? (opts.type === "ranking" ? await listRankingKeys() : listAreaCodes());
  if (opts.limit) ids = ids.slice(0, opts.limit);
  console.log(`候補: ${ids.length} 件`);

  const missing: string[] = [];
  const targets: string[] = [];
  for (const id of ids) {
    const ok = await cloudOgpOk(r2KeyFor(opts.type, id));
    if (!ok) missing.push(id);
    if (!ok || opts.force) targets.push(id);
  }
  console.log(`欠落 (R2 ogp.png 非200/非画像): ${missing.length} 件 / 生成対象: ${targets.length} 件`);
  if (missing.length > 0) console.log(`  例: ${missing.slice(0, 10).join(", ")}${missing.length > 10 ? " …" : ""}`);

  if (opts.audit) {
    console.log("\n--audit のため生成しません。生成は --audit を外して実行 (push は --apply)。");
    process.exit(missing.length > 0 ? 1 : 0);
  }
  if (targets.length === 0) {
    console.log("生成対象なし。完了。");
    return;
  }

  // 生成パスに入ってから render lib (satori/sharp) を読み込む
  const { buildElement, loadFonts, renderToPng } = await import("./lib/blog-thumbnail-render");
  console.log("フォント読み込み中...");
  const fonts = loadFonts(PROJECT_ROOT);

  const stage = mkdtempSync(join(tmpdir(), `ogp-${opts.type}-`));
  let generated = 0;
  let pushed = 0;

  for (const id of targets) {
    const data = await deriveOgpData(opts.type, id);
    if (!data) {
      console.log(`  [skip] ${id}: データ取得不可`);
      continue;
    }
    const dir = join(stage, id);
    mkdirSync(dir, { recursive: true });
    const pngOut = join(dir, "ogp.png");
    process.stdout.write(`  ${id} ... 生成`);
    await renderToPng(buildElement(data, false), fonts, pngOut);
    generated++;

    if (opts.apply) {
      process.stdout.write(" → push");
      putToR2(r2KeyFor(opts.type, id), pngOut);
      pushed++;
      console.log(" ✓");
    } else {
      console.log(` (dry-run: ${pngOut})`);
    }
  }

  console.log(`\n生成: ${generated} 件 / push: ${pushed} 件 (stage: ${stage})`);
  if (opts.apply && pushed > 0) {
    console.log("\ncloud 反映確認 (CDN キャッシュで遅延の可能性あり)...");
    for (const id of targets) {
      const ok = await cloudOgpOk(r2KeyFor(opts.type, id));
      console.log(`  ${ok ? "200 ✓" : "まだ404 (要 CDN purge)"}  ${id}`);
    }
  } else if (!opts.apply) {
    console.log("\n--apply を付けると cloud R2 へ push します。");
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
