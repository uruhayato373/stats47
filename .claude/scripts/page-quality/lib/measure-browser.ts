import { chromium } from "playwright";

import type { MetricValue } from "../types";

export interface BrowserMeasurement {
  lcp_ms: MetricValue;
  cls: MetricValue;
  inp_ms: MetricValue;
  ttfb_ms: MetricValue;
  request_count: MetricValue;
  transfer_bytes: MetricValue;
  console_errors: number;
  page_errors: number;
  mobile_horizontal_scroll: boolean;
  small_tap_targets: number;
}

const unmeasured = (reason: string): MetricValue => ({ value: null, reason });

// 標準監査条件 (.claude/skills/analytics/performance-improvement/SKILL.md と同一のモバイル再現条件)。
const VIEWPORT = { width: 412, height: 915 };
const DEVICE_SCALE_FACTOR = 2.625;
type BrowserInstance = Awaited<ReturnType<typeof chromium.launch>>;

export interface BrowserMeasurementOptions {
  runs?: number;
  timeoutMs?: number;
}

export interface BrowserMeasurementSession {
  measure(url: string, options?: BrowserMeasurementOptions): Promise<BrowserMeasurement>;
  close(): Promise<void>;
}

const IN_PAGE_COLLECTOR = `
window.__pageQuality = { lcp: 0, cls: 0, inpCandidates: [] };
try {
  new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const last = entries[entries.length - 1];
    if (last) window.__pageQuality.lcp = last.startTime;
  }).observe({ type: "largest-contentful-paint", buffered: true });
} catch (e) {}
try {
  new PerformanceObserver((list) => {
    const nav = list.getEntries()[0];
    if (nav) window.__pageQuality.ttfb = nav.responseStart - nav.startTime;
  }).observe({ type: "navigation", buffered: true });
} catch (e) {}
try {
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!entry.hadRecentInput) window.__pageQuality.cls += entry.value;
    }
  }).observe({ type: "layout-shift", buffered: true });
} catch (e) {}
try {
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      window.__pageQuality.inpCandidates.push(entry.duration);
    }
  }).observe({ type: "event", buffered: true, durationThreshold: 40 });
} catch (e) {}
`;

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function launchFailure(reason: string): BrowserMeasurement {
  return {
    lcp_ms: unmeasured(reason),
    cls: unmeasured(reason),
    inp_ms: unmeasured(reason),
    ttfb_ms: unmeasured(reason),
    request_count: unmeasured(reason),
    transfer_bytes: unmeasured(reason),
    console_errors: 0,
    page_errors: 0,
    mobile_horizontal_scroll: false,
    small_tap_targets: 0,
  };
}

async function measureWithBrowser(
  browser: BrowserInstance,
  url: string,
  { runs = 3, timeoutMs = 20000 }: BrowserMeasurementOptions = {}
): Promise<BrowserMeasurement> {
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: DEVICE_SCALE_FACTOR,
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 (KHTML, like Gecko) stats47-page-quality-audit",
  });
  try {
    let consoleErrors = 0;
    let pageErrors = 0;
    const lcpSamples: number[] = [];
    const clsSamples: number[] = [];
    const inpSamples: number[] = [];
    const ttfbSamples: number[] = [];
    let requestCount: number | null = null;
    let transferBytes: number | null = null;
    let navigationFailed: string | null = null;
    let horizontalScroll = false;
    let smallTapTargets = 0;

    for (let i = 0; i < runs; i++) {
      const page = await context.newPage();
      page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors += 1;
      });
      page.on("pageerror", () => {
        pageErrors += 1;
      });
      // リクエスト数・転送量は初回のnavigationだけ実測する (毎回集計してもキャッシュ挙動でぶれるだけ)。
      let requestCounter = 0;
      let bytesCounter = 0;
      if (i === 0) {
        page.on("response", (response) => {
          requestCounter += 1;
          const contentLength = response.headers()["content-length"];
          if (contentLength) bytesCounter += Number(contentLength) || 0;
        });
      }
      await page.addInitScript(IN_PAGE_COLLECTOR);
      try {
        await page.goto(url, {
          waitUntil: runs === 1 ? "domcontentloaded" : "networkidle",
          timeout: timeoutMs,
        });
        await page.waitForTimeout(500); // レイアウトシフト・LCP確定を待つ
        const metrics = await page.evaluate(
          () =>
            (
              window as unknown as {
                __pageQuality: { lcp: number; cls: number; inpCandidates: number[]; ttfb?: number };
              }
            ).__pageQuality
        );
        lcpSamples.push(metrics.lcp);
        clsSamples.push(metrics.cls);
        if (typeof metrics.ttfb === "number") ttfbSamples.push(metrics.ttfb);
        if (metrics.inpCandidates.length > 0) {
          inpSamples.push(Math.max(...metrics.inpCandidates));
        }
        if (i === 0) {
          requestCount = requestCounter;
          transferBytes = bytesCounter;
          const layout = await page.evaluate(() => {
            const scroll = document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
            const interactive = Array.from(
              document.querySelectorAll("a, button, input, select, textarea, [role='button']")
            );
            const small = interactive.filter((element) => {
              const rect = element.getBoundingClientRect();
              if (rect.width === 0 && rect.height === 0) return false;
              return rect.width < 44 || rect.height < 44;
            }).length;
            return { scroll, small };
          });
          horizontalScroll = layout.scroll;
          smallTapTargets = layout.small;
        }
      } catch (e) {
        navigationFailed = (e as Error).message;
      } finally {
        await page.close();
      }
    }

    if (navigationFailed && lcpSamples.length === 0) {
      const reason = `navigation failed: ${navigationFailed}`;
      return {
        lcp_ms: unmeasured(reason),
        cls: unmeasured(reason),
        inp_ms: unmeasured(reason),
        ttfb_ms: unmeasured(reason),
        request_count: requestCount ?? unmeasured(reason),
        transfer_bytes: transferBytes ?? unmeasured(reason),
        console_errors: consoleErrors,
        page_errors: pageErrors,
        mobile_horizontal_scroll: horizontalScroll,
        small_tap_targets: smallTapTargets,
      };
    }

    const lcpMedian = median(lcpSamples);
    const clsMedian = median(clsSamples);
    const inpMedian = median(inpSamples);
    const ttfbMedian = median(ttfbSamples);

    return {
      lcp_ms: lcpMedian ?? unmeasured("LCP not observed within timeout"),
      cls: clsMedian ?? unmeasured("no layout-shift entries observed"),
      inp_ms: inpMedian ?? unmeasured("no interaction events observed (no user input during measurement)"),
      ttfb_ms: ttfbMedian ?? unmeasured("navigation timing entry not observed"),
      request_count: requestCount ?? unmeasured("response listener did not capture any request"),
      transfer_bytes: transferBytes ?? unmeasured("response listener did not capture any request"),
      console_errors: consoleErrors,
      page_errors: pageErrors,
      mobile_horizontal_scroll: horizontalScroll,
      small_tap_targets: smallTapTargets,
    };
  } finally {
    await context.close();
  }
}

/** 1回起動したChromiumを複数URLで共有する。URLごとに独立contextを作るため状態は混在しない。 */
export async function createBrowserMeasurementSession(): Promise<BrowserMeasurementSession> {
  let browser: BrowserInstance | null = null;
  let failureReason: string | null = null;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (e) {
    failureReason = `chromium launch failed: ${(e as Error).message}`;
  }

  return {
    measure: (url, options) =>
      browser
        ? measureWithBrowser(browser, url, options)
        : Promise.resolve(launchFailure(failureReason ?? "chromium launch failed")),
    close: async () => {
      if (browser) await browser.close();
      browser = null;
    },
  };
}

/** 単独呼び出し向け互換API。複数URLではsessionを共有する。 */
export async function measureBrowserMetrics(
  url: string,
  options: BrowserMeasurementOptions = {}
): Promise<BrowserMeasurement> {
  const session = await createBrowserMeasurementSession();
  try {
    return await session.measure(url, options);
  } finally {
    await session.close();
  }
}
