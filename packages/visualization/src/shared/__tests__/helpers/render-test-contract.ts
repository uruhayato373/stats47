import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

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

const moduleRequire = createRequire(import.meta.url);
const notoSansJpRoot = dirname(
  moduleRequire.resolve("@expo-google-fonts/noto-sans-jp/package.json"),
);

const FONT_ASSETS = [
  {
    path: join(notoSansJpRoot, "400Regular/NotoSansJP_400Regular.ttf"),
    sha256: "d930d5d52d15231c283089760f84584272ad5e37e14607ba0d19c798e7a9caec",
  },
  {
    path: join(notoSansJpRoot, "700Bold/NotoSansJP_700Bold.ttf"),
    sha256: "c5b7b9d6a6eb682b0d4e6bbb38509575fd2759a28f147daa74714d1359a7909e",
  },
] as const;

export function renderTestExcludes(optedIn: boolean): string[] {
  return optedIn ? [] : [...OPT_IN_RENDER_TEST_FILES];
}

export function deterministicRenderFontFiles(): string[] {
  return FONT_ASSETS.map((asset) => {
    const bytes = readFileSync(asset.path);
    const actual = createHash("sha256").update(bytes).digest("hex");
    if (actual !== asset.sha256) {
      throw new Error(`render font asset drift: ${asset.path} (${actual})`);
    }
    return asset.path;
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
  deterministicRenderFontFiles();
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
  deterministicRenderFontFiles();
  const style = `<defs><style>svg,text{font-family:'Noto Sans JP',sans-serif!important;}</style></defs>`;
  return svg.replace(/<svg([^>]*)>/, `<svg$1>${style}`);
}
