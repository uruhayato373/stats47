import * as cheerio from "cheerio";

import type { MetricKey, MetricValue } from "../types";
import { resolveDispatcher } from "./http-dispatcher";

export interface StaticMeasurement {
  http_status: number;
  html_bytes: number;
  rsc_bytes: MetricValue;
  dom_nodes: number;
  total_links: number;
  unique_links: number;
  duplicate_links: number;
  duplicate_link_ratio: number;
  jsonld_count: number;
  jsonld_bytes: number;
  jsonld_syntax_errors: number;
  jsonld_type_counts: Record<string, number>;
  jsonld_errors: string[];
  ad_slots: number;
  ad_duplicate_count: number;
}

const unmeasured = (reason: string): MetricValue => ({ value: null, reason });

function normalizeHref(href: string, baseUrl: string): string {
  try {
    const u = new URL(href, baseUrl);
    u.hash = "";
    return u.toString();
  } catch {
    return href.trim();
  }
}

/** ページのHTMLを取得し、cheerioで静的解析する (DOM数・リンク重複・広告重複・JSON-LD)。 */
export async function fetchHtml(
  url: string
): Promise<{ status: number; html: string; bytes: number }> {
  const res = await fetch(url, {
    headers: { "User-Agent": "stats47-page-quality-audit/1.0" },
    signal: AbortSignal.timeout(45_000),
    // @ts-expect-error undiciのdispatcherはfetchのRequestInit型に無いが実行時は解釈される
    dispatcher: resolveDispatcher(url),
  });
  const html = await res.text();
  return { status: res.status, html, bytes: Buffer.byteLength(html, "utf-8") };
}

/**
 * Next.js App Router の RSC flight payload を取得する。
 * `RSC: 1` ヘッダを付けると、Server Component は完全なHTMLではなくflight形式のペイロードを返す。
 * 取得できない場合 (dev modeでの応答形式差異等) は null + 理由を返す。
 */
export async function fetchRscBytes(url: string): Promise<MetricValue> {
  try {
    const res = await fetch(url, {
      headers: { RSC: "1", "User-Agent": "stats47-page-quality-audit/1.0" },
      signal: AbortSignal.timeout(45_000),
      // @ts-expect-error undiciのdispatcherはfetchのRequestInit型に無いが実行時は解釈される
      dispatcher: resolveDispatcher(url),
    });
    if (!res.ok) return unmeasured(`RSC fetch HTTP ${res.status}`);
    const text = await res.text();
    if (!text || text.length === 0) return unmeasured("RSC payload empty");
    return Buffer.byteLength(text, "utf-8");
  } catch (e) {
    return unmeasured(`RSC fetch failed: ${(e as Error).message}`);
  }
}

export function analyzeHtml(html: string, baseUrl: string): StaticMeasurement {
  const $ = cheerio.load(html);

  const domNodes = $("*").length;

  const hrefs = $("a[href]")
    .map((_, el) => $(el).attr("href"))
    .get()
    .filter((href): href is string => Boolean(href) && !href.startsWith("#"))
    .map((href) => normalizeHref(href, baseUrl));
  const totalLinks = hrefs.length;
  const uniqueLinks = new Set(hrefs).size;
  const duplicateLinks = totalLinks - uniqueLinks;
  const duplicateLinkRatio = totalLinks > 0 ? duplicateLinks / totalLinks : 0;

  const jsonldErrors: string[] = [];
  const jsonldTypeCounts: Record<string, number> = {};
  let jsonldBytes = 0;
  const jsonldScripts = $('script[type="application/ld+json"]');
  jsonldScripts.each((i, el) => {
    const raw = $(el).contents().text();
    jsonldBytes += Buffer.byteLength(raw, "utf-8");
    try {
      const parsed = JSON.parse(raw);
      countTypes(parsed, jsonldTypeCounts);
    } catch (e) {
      jsonldErrors.push(`script[${i}]: ${(e as Error).message}`);
    }
  });

  // 広告リンク = rel="sponsored" を含むアフィリエイトリンク (TrackedAffiliateLink の既存規約)。
  // + AdSense の ins.adsbygoogle スロット。マークアップ変更なしで検出できる安定した既存signal。
  const sponsoredHrefs = $('a[rel~="sponsored"]')
    .map((_, el) => $(el).attr("href"))
    .get()
    .filter((href): href is string => Boolean(href))
    .map((href) => normalizeHref(href, baseUrl));
  const adSenseSlots = $("ins.adsbygoogle").length;
  const adSlots = sponsoredHrefs.length + adSenseSlots;
  const adHrefCounts = new Map<string, number>();
  for (const href of sponsoredHrefs) {
    adHrefCounts.set(href, (adHrefCounts.get(href) ?? 0) + 1);
  }
  const adDuplicateCount = [...adHrefCounts.values()].reduce(
    (sum, count) => sum + Math.max(0, count - 1),
    0
  );

  return {
    http_status: 0, // 呼び出し側で埋める
    html_bytes: 0, // 呼び出し側で埋める
    rsc_bytes: unmeasured("caller fills in"),
    dom_nodes: domNodes,
    total_links: totalLinks,
    unique_links: uniqueLinks,
    duplicate_links: duplicateLinks,
    duplicate_link_ratio: Number(duplicateLinkRatio.toFixed(4)),
    jsonld_count: jsonldScripts.length,
    jsonld_bytes: jsonldBytes,
    jsonld_syntax_errors: jsonldErrors.length,
    jsonld_type_counts: jsonldTypeCounts,
    jsonld_errors: jsonldErrors,
    ad_slots: adSlots,
    ad_duplicate_count: adDuplicateCount,
  };
}

function countTypes(node: unknown, counts: Record<string, number>): void {
  if (Array.isArray(node)) {
    for (const item of node) countTypes(item, counts);
    return;
  }
  if (node && typeof node === "object") {
    const obj = node as Record<string, unknown>;
    const type = obj["@type"];
    if (typeof type === "string") counts[type] = (counts[type] ?? 0) + 1;
    else if (Array.isArray(type)) {
      for (const t of type) if (typeof t === "string") counts[t] = (counts[t] ?? 0) + 1;
    }
    for (const value of Object.values(obj)) countTypes(value, counts);
  }
}

export const STATIC_METRIC_KEYS: MetricKey[] = [
  "html_bytes",
  "rsc_bytes",
  "dom_nodes",
  "total_links",
  "unique_links",
  "duplicate_links",
  "duplicate_link_ratio",
  "jsonld_count",
  "jsonld_bytes",
  "jsonld_syntax_errors",
  "ad_slots",
  "ad_duplicate_count",
];
