/**
 * 広告の配置の一覧の撮影 (2026-11-03)。広告の枠の台帳 (data/ads/placements.json) の全てのページの種類を、
 * モバイル 390・タブレット 768・デスクトップ 1440 の 3 幅で撮り、広告の枠に色付きの枠線とラベルを重ねる。
 * 管理画面の「広告の配置」(/affiliate/layout) が manifest を読み、台帳の定義と並べて見せる。
 *
 * 枠の見つけ方 (描画された DOM から決定的に取る):
 *   - AdSense: 開発中の代わりの表示 `[data-ad-placeholder]` か本番の `ins.adsbygoogle` を含む枠。ユニットは
 *     代わりの表示の枠の名前 (台帳の slotTypes の name) から、そのページの台帳の行を出現順に当てる
 *   - PR: 本文の広告のセル `[data-ad-cell]` (AdSense を含まないもの)、セルの外の「PR」の表記の付いた塊、
 *     どれにも入らない `a[rel*=sponsored]`
 * 撮れなかったページは manifest にエラーとして残す (飛ばさない)。
 *
 * 前提: 開発サーバー (`npm run dev:web`、在庫を代わりの広告で満たすなら `npm run dev:web:ad-preview`)。
 * 出力はローカルだけ (.local/ad-layout/<YYYY-MM-DD>/。git にも R2 にも置かない)。
 *
 * 広告・計測の通信 (AD-LAYOUT-WEEKLY-CAPTURE-01): 手元の開発サーバー以外 (本番) を `--base-url` に指定すると、
 * AdSense・GA4・アフィリエイトの host への要求をブラウザから出る前に必ず中断する (lib/ad-traffic-block.mjs)。
 * 自動の閲覧を広告の表示と計測の記録に混ぜないためで、外す引数は無い。止めた件数・通った件数・一覧に無い外部の host を
 * 最後の 1 行と manifest の `adTraffic` に出し、通った通信が 1 件でもあれば失敗 (exit 1) にする。
 * 開発サーバーでも止めて確かめるときは `--block-ad-traffic` を付ける。
 *
 * Usage:
 *   npx tsx .claude/scripts/ads/capture-ad-layout.ts [--base-url http://localhost:3000] [--pages survey,theme] [--widths 390,1440] [--block-ad-traffic]
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { chromium, type Page } from "playwright";

import { VIEWPORTS, type ViewportSpec } from "../page-quality/lib/screenshots";
import { scrollThroughPage } from "../page-quality/lib/ui-probe";

import { ADS_PLACEMENTS } from "../../../config/paths.mjs";
import { adsenseUnitNames, unitOfEntry } from "./lib/ad-layout-ledger";
import {
  AD_TRAFFIC_CONTEXT_OPTIONS,
  createAdTrafficTally,
  formatAdTrafficSummary,
  installAdTrafficBlock,
  requiresAdTrafficBlock,
  summarizeAdTraffic,
} from "./lib/ad-traffic-block.mjs";

const REPO_ROOT = resolve(__dirname, "../../..");
const PLACEMENTS_PATH = join(REPO_ROOT, ADS_PLACEMENTS);
const OUT_ROOT = join(REPO_ROOT, ".local/ad-layout");
/** slotId (番号) → ユニットの定数名 */
const unitNames = adsenseUnitNames(REPO_ROOT);

/** 撮る幅 (page-quality の VIEWPORTS の id) */
const VIEWPORT_IDS = ["mobile-390", "tablet-768", "desktop-1440"] as const;
/** 撮影の高さの上限。これより長いページは上から上限までを撮り、truncated を立てる (枠の位置は全て記録する) */
const MAX_SHOT_HEIGHT = 16000;
const GOTO_TIMEOUT_MS = 180_000;
/** 枠の数が変わらなくなるまで待つ (R2 の取得が遅い開発サーバーで、広告の枠が描かれる前に撮らない) */
const STABLE_POLLS = 3;
const POLL_INTERVAL_MS = 1000;
const MAX_WAIT_MS = 45_000;
/** 開発サーバーがページを読み直させたときに検出をやり直す回数 */
const NAVIGATION_RETRIES = 3;

/**
 * ページの種類ごとの代表 URL (台帳の pages のキーと 1 対 1)。page-quality の代表 URL
 * (.claude/scripts/page-quality/templates.ts) を優先し、無い種類は route から実在する URL を選んだ。
 */
/** ページの種類の中の地域の単位 (テーマの全国・県別・日本・市区町村)。単位ごとに代表 URL を 1 つ撮る */
interface PageScope {
  id: string;
  label: string;
  path: string;
}

const PAGE_URLS: Record<string, { label: string; path: string; scopes?: PageScope[] }> = {
  home: { label: "ホーム", path: "/" },
  ranking: { label: "ランキング", path: "/ranking/total-population" },
  "ranking-index": { label: "ランキング一覧", path: "/ranking" },
  // テーマは 1 つのページの種類で、地域の単位は横串の分類 (2026-11-12 オーナー決定。旧: 日本全体・市区町村のテーマは別の種類で、県別は撮っていなかった)
  theme: {
    label: "テーマ",
    path: "/themes/labor-wages",
    scopes: [
      { id: "national", label: "全国", path: "/themes/labor-wages" },
      { id: "area", label: "県別", path: "/areas/13000/labor-wages" },
      { id: "municipalities", label: "市区町村", path: "/municipalities/themes/aging-society" },
    ],
  },
  "themes-index": { label: "テーマ一覧", path: "/themes" },
  blog: { label: "ブログ記事", path: "/blog/beer-peak-month-july-to-december" },
  "blog-index": { label: "ブログ一覧", path: "/blog" },
  "blog-tags": { label: "ブログのタグ一覧", path: "/blog/tags" },
  category: { label: "カテゴリ", path: "/category/population" },
  "category-compare": { label: "カテゴリの比較", path: "/category/population/compare" },
  survey: { label: "調査 (家計調査)", path: "/survey/kakei-chousa" },
  "survey-index": { label: "調査一覧", path: "/survey" },
  tag: { label: "タグ", path: "/tag/population" },
  area: { label: "都道府県", path: "/areas/13000" },
  "areas-index": { label: "都道府県一覧", path: "/areas" },
  city: { label: "市区町村", path: "/areas/13000/cities/13101" },
  search: { label: "検索", path: "/search?q=人口" },
  "municipality-ranking": { label: "市区町村ランキング", path: "/municipalities/ranking/junior-high-school-count" },
  "municipalities-index": { label: "市区町村のハブ", path: "/municipalities" },
};

interface PlacementEntry {
  slot: string;
  /** この枠が出る地域の単位。無ければ全ての単位 */
  scopes?: string[];
  region: string;
  position: string;
  marker: string;
  adsenseSlot?: string;
  condition?: string;
}
interface PlacementsLedger {
  slotTypes: { id: string; name: string; provider: string }[];
  pages: Record<string, PlacementEntry[]>;
}

/** ブラウザから返す枠 (位置はページ先頭からの CSS px) */
interface RawAd {
  kind: "adsense" | "pr";
  /** AdSense の代わりの表示に書かれた枠の名前 (台帳の slotTypes の name)。本番の ins では null */
  slotTypeName: string | null;
  /** 本番の ins の data-ad-slot */
  slotId: string | null;
  region: "body" | "rail";
  banners: number;
  textLinks: number;
  /** PR の中身の名前 (バナーの画像の alt と、テキストリンクの文字)。どの案件が出ているかを画面で読むため */
  titles: string[];
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DetectedAd {
  kind: "adsense" | "pr";
  /** AdSense の枠の種類 (台帳の slotTypes の id)。PR は null */
  slotType: string | null;
  /** AdSense のユニット (台帳の adsenseSlot か marker の定数名) */
  unit: string | null;
  label: string;
  /** PR の中身の名前 (案件のバナーの題)。AdSense は空 */
  titles: string[];
  region: "body" | "rail";
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AdLayoutShot {
  pageType: string;
  /** ページの種類の中の地域の単位。単位を持たない種類は null */
  scope: string | null;
  label: string;
  url: string;
  viewport: string;
  width: number;
  /** .local/ad-layout/<date>/ からの相対パス。撮れなかったときは null */
  image: string | null;
  imageHeight: number | null;
  pageHeight: number | null;
  truncated: boolean;
  httpStatus: number | null;
  ads: DetectedAd[];
  capturedAt: string;
  error: string | null;
}

export interface AdLayoutManifest {
  generatedAt: string;
  date: string;
  baseUrl: string;
  widths: number[];
  pageTypes: { id: string; label: string; url: string; scopes?: { id: string; label: string; url: string }[] }[];
  /** この回の撮影で止めた広告・計測の通信 (撮り直しで残した前の撮影の分は含まない)。止めなかった回は null */
  adTraffic: ReturnType<typeof summarizeAdTraffic> | null;
  shots: AdLayoutShot[];
}

/** 検出した AdSense の枠に、そのページの台帳の同じ種類の行を出現順に当ててユニットを決める */
export function assignUnits(
  raw: RawAd[],
  pageType: string,
  ledger: PlacementsLedger,
  unitNames: Map<string, string> = new Map(),
  scope: string | null = null,
): DetectedAd[] {
  const typeByName = new Map(ledger.slotTypes.map((t) => [t.name, t.id]));
  const entries = (ledger.pages[pageType] ?? []).filter((e) => !scope || !e.scopes || e.scopes.includes(scope));
  const seen = new Map<string, number>();
  return raw
    .slice()
    .sort((a, b) => a.y - b.y || a.x - b.x)
    .map((ad) => {
      const base = { kind: ad.kind, titles: ad.kind === "pr" ? ad.titles : [], region: ad.region, x: ad.x, y: ad.y, width: ad.width, height: ad.height };
      if (ad.kind === "pr") {
        const parts = [ad.banners ? `バナー ${ad.banners}` : "", ad.textLinks ? `テキスト ${ad.textLinks}` : ""].filter(Boolean);
        const what = ad.titles.length ? ad.titles.join("・") : parts.join("・");
        return { ...base, slotType: null, unit: null, label: what ? `PR (${what})` : "PR" };
      }
      const slotType = ad.slotTypeName ? (typeByName.get(ad.slotTypeName) ?? null) : null;
      // 番号は台帳と同じ定数名に直す (広告の段は番号でしか枠を記録できない)
      let unit: string | null = ad.slotId ? (unitNames.get(ad.slotId) ?? ad.slotId) : null;
      if (slotType && !unit) {
        const index = seen.get(slotType) ?? 0;
        seen.set(slotType, index + 1);
        const ordered = entries.filter((e) => e.slot === slotType);
        // 台帳の同じ種類の行より多く出た枠は、ユニットを推測せず「台帳に無い」と書く
        if (index >= ordered.length) {
          return { ...base, slotType, unit: null, label: `広告 (AdSense: ${ad.slotTypeName}・台帳に無い)` };
        }
        unit = unitOfEntry(ordered[index]);
      }
      const name = unit ?? ad.slotTypeName ?? "不明";
      return { ...base, slotType, unit, label: `広告 (AdSense: ${name})` };
    });
}

/**
 * ブラウザ側で広告の枠を集める。tsx (esbuild keepNames) が差し込む __name を避けるため、
 * 文字列化して評価する (ui-probe の evaluateLayoutIssues と同じ方式)。
 */
function collectAds(): RawAd[] {
  // 開発中の表示は hidden の写し (body > div[id^="S:"]) を持つので、可視の木に絞る
  const root = document.querySelector("body > div.relative") ?? document.body;
  const main = root.querySelector("[data-slot=shell-main]");
  const isVisible = (el: Element) => {
    const r = el.getBoundingClientRect();
    return r.width > 2 && r.height > 2 && getComputedStyle(el).visibility !== "hidden";
  };
  const containers: Element[] = [];
  for (const el of Array.from(root.querySelectorAll("[data-ad-cell]"))) {
    if (!el.parentElement?.closest("[data-ad-cell]")) containers.push(el);
  }
  for (const el of Array.from(root.querySelectorAll("[data-ad-placeholder], ins.adsbygoogle"))) {
    if (!el.closest("[data-ad-cell]")) containers.push(el);
  }
  // セルの外の「PR」表記 (BannerAd・楽天・ふるさと納税のカード・関連書籍): リンクを含むところまで上る
  const prLabels = Array.from(root.querySelectorAll("span, p")).filter((el) => {
    const text = (el.textContent ?? "").trim();
    return el.children.length === 0 && (text === "PR" || text.startsWith("PR・")) && !el.closest("[data-ad-cell]");
  });
  for (const el of prLabels) {
    let box: Element | null = el.parentElement;
    while (box && box !== root && !box.querySelector("a[href]")) box = box.parentElement;
    if (box && box !== root) containers.push(box);
  }
  // 広告のリンクは、同じ「PR」表記を持つ塊 (楽天の商品カードの見出しと商品の並び) までまとめる
  for (const el of Array.from(root.querySelectorAll("a[rel*='sponsored']"))) {
    if (containers.some((c) => c.contains(el))) continue;
    let box: Element | null = el.parentElement;
    while (box && box !== root && box !== main && !prLabels.some((label) => box?.contains(label))) box = box.parentElement;
    containers.push(box && box !== root && box !== main ? box : el);
  }
  const unique = containers.filter((c, i) => containers.indexOf(c) === i);
  const outermost = unique.filter((c) => !unique.some((o) => o !== c && o.contains(c)));
  return outermost.filter(isVisible).map((el) => {
    const r = el.getBoundingClientRect();
    const placeholder = el.matches("[data-ad-placeholder]") ? el : el.querySelector("[data-ad-placeholder]");
    const ins = el.matches("ins.adsbygoogle") ? el : el.querySelector("ins.adsbygoogle");
    const nameMatch = (placeholder?.textContent ?? "").match(/AdSense・(.+?)(?:\d|幅いっぱい|$)/);
    const images = Array.from(el.querySelectorAll("a[href] img")).filter((img) => img.getBoundingClientRect().width > 2);
    const links = Array.from(el.querySelectorAll("a[href]")).filter((a) => !a.querySelector("img"));
    const titles = [
      ...images.map((img) => img.getAttribute("alt") ?? ""),
      ...links.map((a) => (a.textContent ?? "").trim().slice(0, 30)),
    ].filter((t, i, all) => t && all.indexOf(t) === i);
    return {
      kind: placeholder || ins ? "adsense" : "pr",
      slotTypeName: nameMatch ? nameMatch[1].trim() : null,
      // 広告の段 (AdRow) は開発中でもセルに slotId を載せる
      slotId: ins?.getAttribute("data-ad-slot") ?? el.getAttribute("data-ad-slot-id"),
      region: main && !main.contains(el) ? "rail" : "body",
      banners: images.length,
      textLinks: links.length,
      titles,
      x: Math.round(r.left + window.scrollX),
      y: Math.round(r.top + window.scrollY),
      width: Math.round(r.width),
      height: Math.round(r.height),
    } as RawAd;
  });
}

/** 枠線とラベルを重ねる (ページ先頭からの絶対位置で body の直下に置く) */
function drawOverlays(ads: { kind: string; label: string; x: number; y: number; width: number; height: number }[]) {
  const layer = document.createElement("div");
  layer.setAttribute("data-ad-layout-overlay", "");
  Object.assign(layer.style, { position: "absolute", left: "0", top: "0", width: "0", height: "0", zIndex: "2147483647", pointerEvents: "none" });
  for (const ad of ads) {
    const color = ad.kind === "adsense" ? "#dc2626" : "#ea580c";
    const box = document.createElement("div");
    Object.assign(box.style, {
      position: "absolute",
      left: `${ad.x}px`,
      top: `${ad.y}px`,
      width: `${ad.width}px`,
      height: `${ad.height}px`,
      outline: `4px solid ${color}`,
      outlineOffset: "-2px",
      background: ad.kind === "adsense" ? "rgba(220,38,38,.08)" : "rgba(234,88,12,.08)",
    });
    const tag = document.createElement("div");
    tag.textContent = ad.label;
    Object.assign(tag.style, {
      position: "absolute",
      left: "0",
      top: "0",
      background: color,
      color: "#fff",
      font: "bold 13px/1.4 sans-serif",
      padding: "2px 6px",
      whiteSpace: "nowrap",
    });
    box.appendChild(tag);
    layer.appendChild(box);
  }
  document.body.appendChild(layer);
}

function inBrowser<T>(page: Page, fn: (...args: never[]) => T, arg?: unknown): Promise<T> {
  const call = arg === undefined ? "()" : `(${JSON.stringify(arg)})`;
  return page.evaluate(`(() => { const __name = (f) => f; return (${fn.toString()})${call}; })()`) as Promise<T>;
}

/** 枠の数が STABLE_POLLS 回続けて変わらなくなるまで待つ (上限 MAX_WAIT_MS) */
async function waitForStableAds(page: Page): Promise<RawAd[]> {
  const started = Date.now();
  let last = -1;
  let stable = 0;
  let ads: RawAd[] = [];
  while (Date.now() - started < MAX_WAIT_MS) {
    ads = await inBrowser(page, collectAds);
    stable = ads.length === last ? stable + 1 : 0;
    last = ads.length;
    if (stable >= STABLE_POLLS - 1 && ads.length > 0) break;
    // 枠が 0 の幅 (モバイルで手置きの AdSense を出さないページ等) も、上限まで待ってから 0 と記録する
    await page.waitForTimeout(POLL_INTERVAL_MS);
  }
  return ads;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const i = args.indexOf(flag);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const list = (flag: string) => get(flag)?.split(",").map((s) => s.trim()).filter(Boolean);
  const pageIds = list("--pages");
  const widths = list("--widths")?.map(Number);
  const viewports = VIEWPORT_IDS.map((id) => VIEWPORTS.find((v) => v.id === id)).filter((v): v is ViewportSpec => Boolean(v));
  if (viewports.length !== VIEWPORT_IDS.length) throw new Error(`VIEWPORTS に無い幅があります: ${VIEWPORT_IDS.join(",")}`);
  const baseUrl = get("--base-url") ?? "http://localhost:3000";
  return {
    baseUrl,
    // 本番は必ず止める。開発サーバーは頼まれたときだけ止める
    blockAdTraffic: requiresAdTrafficBlock(baseUrl) || args.includes("--block-ad-traffic"),
    pageIds,
    viewports: widths ? viewports.filter((v) => widths.includes(v.width)) : viewports,
  };
}

function today(): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(new Date());
}

async function captureOne(
  page: Page,
  url: string,
  pageType: string,
  viewport: ViewportSpec,
  outDir: string,
  ledger: PlacementsLedger,
  scope: string | null = null,
): Promise<Omit<AdLayoutShot, "pageType" | "scope" | "label" | "url" | "viewport" | "width" | "capturedAt" | "error">> {
  const response = await page.goto(url, { waitUntil: "load", timeout: GOTO_TIMEOUT_MS });
  const httpStatus = response?.status() ?? null;
  if (httpStatus !== null && httpStatus >= 400) throw new Error(`HTTP ${httpStatus}`);
  // 起動直後の開発サーバーは初回のコンパイル後にページを読み直させることがある (Execution context was destroyed)。
  // 読み直しを待ってから枠の検出をやり直す
  for (let attempt = 1; ; attempt += 1) {
    try {
      await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => undefined);
      await scrollThroughPage(page, MAX_SHOT_HEIGHT);
      const raw = await waitForStableAds(page);
      const ads = assignUnits(raw, pageType, ledger, unitNames, scope);
      await inBrowser(page, drawOverlays, ads);
      const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
      const imageHeight = Math.min(pageHeight, MAX_SHOT_HEIGHT);
      const image = `${pageType}${scope ? `-${scope}` : ""}-${viewport.width}.png`;
      await page.screenshot({ path: join(outDir, image), fullPage: true, clip: { x: 0, y: 0, width: viewport.width, height: imageHeight } });
      return { image, imageHeight, pageHeight, truncated: pageHeight > MAX_SHOT_HEIGHT, httpStatus, ads };
    } catch (e) {
      if (attempt >= NAVIGATION_RETRIES || !/Execution context was destroyed/.test((e as Error).message)) throw e;
      await page.waitForLoadState("load", { timeout: GOTO_TIMEOUT_MS });
    }
  }
}

/** 開発サーバーが応答するまで待つ (重いページの読み込みで落ちて立ち直る間を待つ。2026-11-03 に一括の撮影が 63 件中 2 件で止まった) */
const SERVER_WAIT_MS = 180_000;
async function waitForServer(baseUrl: string): Promise<void> {
  const deadline = Date.now() + SERVER_WAIT_MS;
  for (;;) {
    try {
      const res = await fetch(baseUrl, { signal: AbortSignal.timeout(60_000) });
      if (res.ok) return;
    } catch {
      // 応答なし: 待って試し直す
    }
    if (Date.now() > deadline) throw new Error(`開発サーバーが ${SERVER_WAIT_MS / 1000} 秒応答しない: ${baseUrl}`);
    await new Promise((resolve) => setTimeout(resolve, 3_000));
  }
}

/** 接続の失敗・時間切れ (サーバーが落ちた・詰まった) なら、応答を待って 1 回だけ撮り直す */
const SERVER_TROUBLE = /ERR_CONNECTION|ECONNREFUSED|ERR_EMPTY_RESPONSE|Timeout .*exceeded|socket hang up/i;

async function main() {
  const opts = parseArgs();
  const ledger = JSON.parse(readFileSync(PLACEMENTS_PATH, "utf8")) as PlacementsLedger;
  const ledgerTypes = Object.keys(ledger.pages);
  const missing = ledgerTypes.filter((t) => !PAGE_URLS[t]);
  if (missing.length) throw new Error(`台帳のページの種類に代表 URL がありません (PAGE_URLS に足す): ${missing.join(", ")}`);
  const pageTypes = opts.pageIds ? ledgerTypes.filter((t) => opts.pageIds?.includes(t)) : ledgerTypes;
  if (!pageTypes.length) throw new Error(`--pages に一致するページの種類がありません: ${opts.pageIds?.join(",")}`);

  const date = today();
  const outDir = join(OUT_ROOT, date);
  mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const shots: AdLayoutShot[] = [];
  const adTraffic = opts.blockAdTraffic ? createAdTrafficTally(opts.baseUrl) : null;
  try {
    const targets = pageTypes.flatMap((pageType) => {
      const { label, path, scopes } = PAGE_URLS[pageType];
      return scopes?.length
        ? scopes.map((sc) => ({ pageType, scope: sc.id, label: `${label}・${sc.label}`, path: sc.path }))
        : [{ pageType, scope: null as string | null, label, path }];
    });
    for (const { pageType, scope, label, path } of targets) {
      await waitForServer(opts.baseUrl);
      const url = new URL(encodeURI(path), opts.baseUrl).href;
      const tag = `${pageType}${scope ? `-${scope}` : ""}`;
      for (const viewport of opts.viewports) {
        const context = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
          isMobile: viewport.touch,
          hasTouch: viewport.touch,
          deviceScaleFactor: 1,
          ...(adTraffic ? AD_TRAFFIC_CONTEXT_OPTIONS : {}),
        });
        // 最初の要求から止めるため、ページを開く前に差し込む
        if (adTraffic) await installAdTrafficBlock(context, adTraffic);
        // Cookie 同意の帯 (sticky) が撮影の途中に重ならないよう、同意を断った状態で開く
        await context.addCookies([{ name: "stats47_consent", value: "denied", url: opts.baseUrl }]);
        const base = { pageType, scope, label, url: path, viewport: viewport.id, width: viewport.width };
        try {
          const page = await context.newPage();
          const result = await captureOne(page, url, pageType, viewport, outDir, ledger, scope).catch(async (e: Error) => {
            if (!SERVER_TROUBLE.test(e.message)) throw e;
            console.error(`${tag}-${viewport.width}: サーバーの応答待ちで撮り直す — ${e.message.split("\n")[0]}`);
            await waitForServer(opts.baseUrl);
            return captureOne(page, url, pageType, viewport, outDir, ledger, scope);
          });
          shots.push({ ...base, ...result, capturedAt: new Date().toISOString(), error: null });
          console.log(`${tag}-${viewport.width}: 枠 ${result.ads.length} (${result.imageHeight}px${result.truncated ? "・上限で切った" : ""})`);
        } catch (e) {
          const error = (e as Error).message.split("\n")[0];
          shots.push({ ...base, image: null, imageHeight: null, pageHeight: null, truncated: false, httpStatus: null, ads: [], capturedAt: new Date().toISOString(), error });
          console.error(`${tag}-${viewport.width}: 撮れなかった — ${error}`);
        } finally {
          await context.close();
        }
      }
    }
  } finally {
    await browser.close();
  }

  // 一部だけ撮り直したときは、同じ日の manifest の他のページの種類・幅を残す
  const manifestPath = join(outDir, "manifest.json");
  let previous: AdLayoutShot[] = [];
  try {
    previous = (JSON.parse(readFileSync(manifestPath, "utf8")) as AdLayoutManifest).shots;
  } catch {
    previous = [];
  }
  const key = (s: AdLayoutShot) => `${s.pageType}/${s.scope ?? ""}@${s.width}`;
  // 撮り直しで失敗した組は、同じ日に撮れていた前の撮影を残す (失敗で上書きして画像と枠の一覧を失わない)
  const keptPrevious = new Map(previous.filter((s) => !s.error).map((s) => [key(s), s]));
  const latest = shots.map((s) => (s.error && keptPrevious.has(key(s)) ? (keptPrevious.get(key(s)) as AdLayoutShot) : s));
  const fresh = new Set(latest.map(key));
  // 台帳から消えたページの種類 (2026-11-12 にテーマへまとめた japan-theme など) の前の撮影は残さない
  const merged = [...previous.filter((s) => ledgerTypes.includes(s.pageType) && !fresh.has(key(s))), ...latest].sort(
    (a, b) => ledgerTypes.indexOf(a.pageType) - ledgerTypes.indexOf(b.pageType) || a.width - b.width,
  );
  const manifest: AdLayoutManifest = {
    generatedAt: new Date().toISOString(),
    date,
    baseUrl: opts.baseUrl,
    widths: VIEWPORT_IDS.map((id) => VIEWPORTS.find((v) => v.id === id)?.width ?? 0),
    pageTypes: ledgerTypes.map((id) => ({
      id,
      label: PAGE_URLS[id].label,
      url: PAGE_URLS[id].path,
      ...(PAGE_URLS[id].scopes ? { scopes: PAGE_URLS[id].scopes.map((sc) => ({ id: sc.id, label: sc.label, url: sc.path })) } : {}),
    })),
    adTraffic: adTraffic ? summarizeAdTraffic(adTraffic) : null,
    shots: merged,
  };
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  const failed = shots.filter((s) => s.error);
  console.log(`${shots.length - failed.length}/${shots.length} 枚 → ${outDir}`);
  if (failed.length) process.exitCode = 1;
  if (adTraffic) {
    console.log(formatAdTrafficSummary(adTraffic));
    const leaked = summarizeAdTraffic(adTraffic).leaked;
    if (leaked.length) {
      console.error(`止めるはずの広告・計測の通信が通った (${leaked.length} 件): ${leaked.slice(0, 5).join(", ")}`);
      process.exitCode = 1;
    }
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
