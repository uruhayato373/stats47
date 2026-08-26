import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export const OPT_IN_RENDER_TEST_FILES = [
  "src/d3/components/BarChart/__tests__/BarChartImage.test.tsx",
  "src/d3/components/BarChartRace/__tests__/D3BarChartRaceImage.test.tsx",
  "src/d3/components/ColumnChart/__tests__/ColumnChartImage.test.tsx",
  "src/d3/components/DonutChart/__tests__/DonutChartImage.test.tsx",
  "src/d3/components/PyramidChart/__tests__/PyramidChartImage.test.tsx",
  "src/d3/components/Scatterplot/__tests__/Scatterplot.test.tsx",
  "src/d3/components/Scatterplot/__tests__/ScatterplotImage.test.tsx",
  "src/d3/components/SunburstChart/__tests__/SunburstChartImage.test.tsx",
  "src/d3/components/TreemapChart/__tests__/TreemapChartImage.test.tsx",
] as const;

export const DETERMINISTIC_RENDER_ENV = Object.freeze({
  timezone: "UTC",
  language: "C",
  locale: "en-US",
  viewportWidth: 1920,
  viewportHeight: 1080,
  devicePixelRatio: 1,
});

const FONT_ASSETS = [
  {
    path: resolve(
      __dirname,
      "../../../../../../apps/remotion/public/buzz-map/fonts/noto-sans-jp-latin-400-normal.woff2",
    ),
    sha256: "058bfeaaa344201b26733e369258f948b4a8cf445a90300a1ac139cf625d779c",
    unicodeRange:
      "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD",
  },
  {
    path: resolve(
      __dirname,
      "../../../../../../apps/remotion/public/buzz-map/fonts/noto-sans-jp-japanese-400-normal.woff2",
    ),
    sha256: "3b6390a57bcaa305baed97397c61e332701aee6bf312ad0ff8c16cab7d821922",
    unicodeRange: "U+3000-30FF,U+31F0-31FF,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FF00-FFEF",
  },
] as const;

export function renderTestExcludes(optedIn: boolean): string[] {
  return optedIn ? [] : [...OPT_IN_RENDER_TEST_FILES];
}

function verifiedFontData(): Array<{ data: string; unicodeRange: string }> {
  return FONT_ASSETS.map((asset) => {
    const bytes = readFileSync(asset.path);
    const actual = createHash("sha256").update(bytes).digest("hex");
    if (actual !== asset.sha256) {
      throw new Error(`render font asset drift: ${asset.path} (${actual})`);
    }
    return { data: bytes.toString("base64"), unicodeRange: asset.unicodeRange };
  });
}

export function assertDeterministicRenderEnvironment(): void {
  const expected = {
    TZ: DETERMINISTIC_RENDER_ENV.timezone,
    LANG: DETERMINISTIC_RENDER_ENV.language,
    LC_ALL: DETERMINISTIC_RENDER_ENV.language,
  } as const;
  for (const [key, value] of Object.entries(expected)) {
    if (process.env[key] !== value) {
      throw new Error(`render environment ${key} must be ${value}, got ${String(process.env[key])}`);
    }
  }
  verifiedFontData();
}

export function installDeterministicDomEnvironment(): void {
  assertDeterministicRenderEnvironment();
  if (typeof window === "undefined") return;

  for (const [key, value] of [
    ["innerWidth", DETERMINISTIC_RENDER_ENV.viewportWidth],
    ["outerWidth", DETERMINISTIC_RENDER_ENV.viewportWidth],
    ["innerHeight", DETERMINISTIC_RENDER_ENV.viewportHeight],
    ["outerHeight", DETERMINISTIC_RENDER_ENV.viewportHeight],
    ["devicePixelRatio", DETERMINISTIC_RENDER_ENV.devicePixelRatio],
  ] as const) {
    Object.defineProperty(window, key, { configurable: true, value });
  }
  Object.defineProperty(window.navigator, "language", {
    configurable: true,
    value: DETERMINISTIC_RENDER_ENV.locale,
  });
  Object.defineProperty(window.navigator, "languages", {
    configurable: true,
    value: [DETERMINISTIC_RENDER_ENV.locale],
  });
  document.documentElement.lang = DETERMINISTIC_RENDER_ENV.locale;
}

export function prepareSvgForDeterministicRender(svg: string): string {
  if (!svg.startsWith("<svg")) return svg;
  const fontFaces = verifiedFontData()
    .map(
      ({ data, unicodeRange }) =>
        `@font-face{font-family:'Stats47Render';src:url(data:font/woff2;base64,${data}) format('woff2');font-style:normal;font-weight:400;unicode-range:${unicodeRange};}`,
    )
    .join("");
  const style = `<defs><style>${fontFaces}svg,text{font-family:'Stats47Render',sans-serif!important;}</style></defs>`;
  return svg.replace(/<svg([^>]*)>/, `<svg$1>${style}`);
}
