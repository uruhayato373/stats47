import type { Page } from "@playwright/test";

/**
 * ページ内の全 JSON-LD スクリプトを取得する
 */
export async function getJsonLdScripts(page: Page): Promise<Record<string, unknown>[]> {
  return page.$$eval(
    'script[type="application/ld+json"]',
    (scripts) =>
      scripts.map((s) => JSON.parse(s.textContent || "{}")) as Record<string, unknown>[]
  );
}

/**
 * 特定の @type を持つ JSON-LD を取得する
 */
export async function getJsonLdByType(
  page: Page,
  type: string
): Promise<Record<string, unknown> | null> {
  const scripts = await getJsonLdScripts(page);
  return scripts.find((s) => s["@type"] === type) ?? null;
}
