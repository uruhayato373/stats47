export const MAX_BUFFERED_HTML_BYTES = 8 * 1024 * 1024;
const MAX_RENDER_ATTEMPTS = 2;
const HTML_TAIL_BYTES = 2048;

async function readCompleteHtml(response: Response): Promise<Uint8Array<ArrayBuffer>> {
  if (!response.body) throw new Error("Missing HTML body");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_BUFFERED_HTML_BYTES) throw new Error("HTML buffer limit exceeded");
      chunks.push(value);
    }
    const body = new Uint8Array(bytes);
    let offset = 0;
    for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
    const tail = new TextDecoder().decode(body.subarray(Math.max(0, bytes - HTML_TAIL_BYTES)));
    if (!/<\/html>/i.test(tail)) throw new Error("HTML stream ended before the document closed");
    return body;
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  } finally {
    reader.releaseLock();
  }
}

/** Validate GET HTML before returning cacheable headers; RSC/assets/HEAD retain streaming. */
export async function fetchCompletePageResponse(
  request: Request,
  fetchPage: () => Promise<Response>,
): Promise<Response> {
  for (let attempt = 1; attempt <= MAX_RENDER_ATTEMPTS; attempt++) {
    const response = await fetchPage();
    if (request.method !== "GET" || response.status !== 200
      || !response.headers.get("Content-Type")?.toLowerCase().startsWith("text/html")) return response;
    try {
      const body = await readCompleteHtml(response);
      const headers = new Headers(response.headers);
      headers.set("X-HTML-Integrity", "complete");
      return new Response(body, { status: response.status, statusText: response.statusText, headers });
    } catch {
      // Do not expose upstream errors or payloads. This event can be joined to the request trace.
      logger.warn({ path: new URL(request.url).pathname, attempt }, "Incomplete HTML response");
    }
  }
  return new Response("ページを読み込めませんでした。もう一度お試しください。", {
    status: 503,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "private, no-store", "Retry-After": "1" },
  });
}
import { logger } from "./logger";
