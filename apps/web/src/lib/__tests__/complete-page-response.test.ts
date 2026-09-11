import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fetchCompletePageResponse, MAX_BUFFERED_HTML_BYTES } from "../complete-page-response";

const request = new Request("https://stats47.jp/themes/population-dynamics");
const complete = "<!doctype html><html><body>人口動態<script>self.__next_f.push([1, 'complete'])</script></body></html>";
const html = (body: BodyInit) => new Response(body, {
  headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, s-maxage=86400", "Cache-Tag": "page:population-dynamics" },
});

describe("complete HTML before Workers Cache", () => {
  beforeEach(() => { vi.spyOn(console, "warn").mockImplementation(() => {}); });
  afterEach(() => { vi.restoreAllMocks(); });

  it("re-renders an incomplete Flight document before it can become a cached 200", async () => {
    const fetchPage = vi.fn().mockResolvedValueOnce(html("<html><body>shell<script>self.__next_f.push([1, 'partial'])</script>"))
      .mockResolvedValueOnce(html(complete));
    const response = await fetchCompletePageResponse(request, fetchPage);
    expect(await response.text()).toBe(complete);
    expect(response.headers.get("Cache-Control")).toBe("public, s-maxage=86400");
    expect(response.headers.get("Cache-Tag")).toBe("page:population-dynamics");
    expect(fetchPage).toHaveBeenCalledTimes(2);
  });

  it("returns an uncached 503 after two incomplete attempts", async () => {
    const fetchPage = vi.fn().mockImplementation(() => Promise.resolve(html("<html><body>incomplete")));
    const response = await fetchCompletePageResponse(request, fetchPage);
    expect(response.status).toBe(503);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(response.headers.get("Retry-After")).toBe("1");
    expect(await response.text()).not.toContain("<html>");
    expect(fetchPage).toHaveBeenCalledTimes(2);
  });

  it("recovers when reading the first response body fails", async () => {
    const broken = new ReadableStream({ start(controller) { controller.error(new Error("stream disconnected")); } });
    const fetchPage = vi.fn().mockResolvedValueOnce(html(broken)).mockResolvedValueOnce(html(complete));
    expect(await (await fetchCompletePageResponse(request, fetchPage)).text()).toBe(complete);
    expect(fetchPage).toHaveBeenCalledTimes(2);
  });

  it("recognizes the closing marker across chunks and preserves UTF-8 bytes", async () => {
    const bytes = new TextEncoder().encode(complete);
    const body = new ReadableStream({ start(controller) {
      for (let i = 0; i < bytes.length; i += 3) controller.enqueue(bytes.slice(i, i + 3));
      controller.close();
    } });
    const fetchPage = vi.fn().mockResolvedValue(html(body));
    expect(await (await fetchCompletePageResponse(request, fetchPage)).text()).toBe(complete);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it("cancels oversized HTML before unbounded buffering and returns no-store", async () => {
    const cancel = vi.fn();
    const fetchPage = vi.fn().mockImplementation(() => Promise.resolve(html(new ReadableStream({ start(controller) {
      controller.enqueue(new Uint8Array(MAX_BUFFERED_HTML_BYTES + 1));
    }, cancel }))));
    const response = await fetchCompletePageResponse(request, fetchPage);
    expect(response.status).toBe(503);
    expect(cancel).toHaveBeenCalledTimes(2);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });

  it.each([
    ["GET", "text/x-component", 200], ["GET", "application/json", 200],
    ["GET", "text/html", 404], ["GET", "text/html", 503], ["HEAD", "text/html", 200],
  ])("leaves %s %s %s outside the HTML buffer", async (method, type, status) => {
    const response = new Response("unchanged", { status: Number(status), headers: { "Content-Type": String(type) } });
    const fetchPage = vi.fn().mockResolvedValue(response);
    const actual = await fetchCompletePageResponse(new Request(request.url, { method: String(method) }), fetchPage);
    expect(actual).toBe(response);
    expect(response.bodyUsed).toBe(false);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });
});
