import type { PageAuditResult } from "../types";
import { resolveDispatcher } from "./http-dispatcher";

export type ImageStatus = { ok: true } | { ok: false; status: number } | { ok: null; reason: string };

export type ImageProbe = (url: string) => Promise<ImageStatus>;

const MAX_FINDINGS_PER_PAGE = 10;

/**
 * 画面側に代替表示がある画像。欠けても読者に壊れた画像は見えないので broken_images (error) ではなく
 * degraded_images (warning) に数える。代替の実装が変わったらこの一覧も直す。
 * - 特産品画像: SpecialtyImage.tsx が onError で頭文字のタイルに切り替える (未生成の県がある)
 */
const FALLBACK_IMAGE_PATTERNS: RegExp[] = [/\/app\/areas\/\d{5}\/specialty\/[^/]+$/];

export function hasDisplayFallback(url: string): boolean {
  return FALLBACK_IMAGE_PATTERNS.some((pattern) => pattern.test(new URL(url).pathname));
}

async function request(url: string, method: "HEAD" | "GET"): Promise<Response> {
  return fetch(url, {
    method,
    headers: { "User-Agent": "stats47-page-quality-audit/1.0" },
    signal: AbortSignal.timeout(20_000),
    // @ts-expect-error undiciのdispatcherはfetchのRequestInit型に無いが実行時は解釈される
    dispatcher: resolveDispatcher(url),
  });
}

/** HEAD で存在を確認する。HEAD を受け付けない配信 (405/501) だけ GET で確かめ直す。 */
export const probeImage: ImageProbe = async (url) => {
  let lastError = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      let res = await request(url, "HEAD");
      if (res.status === 405 || res.status === 501) {
        res = await request(url, "GET");
        await res.body?.cancel();
      }
      return res.status < 400 ? { ok: true } : { ok: false, status: res.status };
    } catch (e) {
      lastError = (e as Error).message;
    }
  }
  // 通信失敗は「画像が無い」証拠ではないので壊れた画像に数えない (未確認として件数だけ報告する)。
  return { ok: null, reason: lastError };
};

/**
 * 全ページの画像 URL を重複なく 1 回ずつ確認し、ページごとの broken_images と ui_findings を埋める。
 * image_urls は検査の入力なので、確認後に結果から取り除く (スナップショットを肥大させない)。
 */
export async function checkImages(
  results: PageAuditResult[],
  { concurrency = 16, probe = probeImage }: { concurrency?: number; probe?: ImageProbe } = {}
): Promise<{ checked: number; broken: number; unverified: number }> {
  const unique = [...new Set(results.flatMap((r) => r.image_urls ?? []))];
  const statuses = new Map<string, ImageStatus>();
  let cursor = 0;
  async function worker() {
    while (cursor < unique.length) {
      const url = unique[cursor++];
      statuses.set(url, await probe(url));
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, unique.length) }, worker));

  for (const result of results) {
    const urls = result.image_urls;
    delete result.image_urls;
    if (!urls) continue;
    const missing = urls.filter((url) => statuses.get(url)?.ok === false);
    const broken = missing.filter((url) => !hasDisplayFallback(url));
    const degraded = missing.filter((url) => hasDisplayFallback(url));
    result.metrics.broken_images = broken.length;
    result.metrics.degraded_images = degraded.length;
    if (missing.length === 0) continue;
    const describe = (label: string, url: string) => {
      const status = statuses.get(url) as { ok: false; status: number };
      return `${label}: ${url} (HTTP ${status.status})`;
    };
    const findings = [
      ...broken.map((url) => describe("broken_image", url)),
      ...degraded.map((url) => describe("degraded_image", url)),
    ].slice(0, MAX_FINDINGS_PER_PAGE);
    result.ui_findings = [...(result.ui_findings ?? []), ...findings];
  }

  const values = [...statuses.values()];
  return {
    checked: unique.length,
    broken: values.filter((s) => s.ok === false).length,
    unverified: values.filter((s) => s.ok === null).length,
  };
}
