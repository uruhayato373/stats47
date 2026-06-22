import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const cwd = process.cwd();
const scanRoots = ["src/components", "src/features"];
const extensions = new Set([".ts", ".tsx"]);

const rules = [
  {
    id: "no-direct-shadcn-card",
    message:
      "Do not import shadcn Card directly from app components/features. Use SurfaceCard, SurfaceLinkCard, SurfaceSection, or ChartPanel.",
    pattern: /from\s+["']@stats47\/components\/atoms\/ui\/card["']/,
  },
  {
    id: "no-legacy-dashboard-card",
    message:
      "DashboardCard/LegacyDashboardCard was removed. Use ChartPanel for charts/maps and ChartCard for compact KPI cards.",
    pattern: /\b(?:DashboardCard|LegacyDashboardCard)\b/,
  },
  {
    id: "no-legacy-chart-footer",
    message:
      "LegacyChartFooter was replaced by ChartFooter. Use apps/web/src/components/charts/ChartFooter.tsx.",
    pattern: /\bLegacyChartFooter\b/,
  },
  {
    id: "no-bg-white-in-normal-ui",
    message:
      "Avoid bg-white in normal UI. Use bg-card/bg-background, or document a brand/contrast exception in the allowlist.",
    pattern: /(?:^|\s)bg-white(?:[\/\s"`}]|$)/,
    allow: (relativePath) =>
      [
        "src/features/ads/components/TechSchoolPromoCard.tsx",
        "src/features/ranking/components/RankingHeroCard/RankingHeroCard.tsx",
      ].includes(relativePath),
  },
  {
    id: "no-hardcoded-surface-card",
    message:
      "Avoid hardcoded surface card classes. Use SurfaceCard/SurfaceLinkCard/getSurfaceCardClassName/ChartPanel.",
    pattern:
      /rounded-none\s+border\s+bg-card\s+p-4\s+shadow-sm|bg-card\s+border\s+rounded|rounded-(?:lg|md)\s+border\s+border-border\s+bg-card|border\s+border-border\s+bg-card.*shadow-sm/,
    allow: (relativePath) => relativePath === "src/components/surface/SurfaceCard.tsx",
  },
  {
    id: "no-map-panel",
    message:
      "Do not reintroduce MapPanel. Use ChartPanel for map and chart visualization panels.",
    pattern: /\bMapPanel\b/,
  },
  {
    id: "no-direct-leaflet-tile-options",
    message:
      "Do not pin Leaflet tile options in feature components. Use useThemedLeafletTile(theme).",
    pattern: /\bTILE_OPTIONS_(?:LIGHT|DARK)\b/,
    allow: (relativePath) =>
      relativePath === "src/features/map-visualization/utils/use-themed-leaflet-tile.ts",
  },
  {
    id: "no-legacy-leaflet-border-color-constants",
    message:
      "Leaflet map colors live in map-palette.ts. Use LEAFLET_MAP_COLORS/getLeafletBorderColor.",
    pattern: /\bLEAFLET_BORDER_COLOR_(?:LIGHT|DARK)\b/,
  },
  {
    id: "no-ogp-raw-color-outside-brand",
    message:
      "OGP fixed colors/shadows must be centralized in features/ogp/brand.ts.",
    pattern: /#[0-9A-Fa-f]{3,8}|rgba\(/,
    allow: (relativePath) =>
      !relativePath.startsWith("src/features/ogp/") ||
      relativePath === "src/features/ogp/brand.ts",
  },
  {
    id: "no-large-card-shadow",
    message:
      "Avoid large shadows on normal cards. Use no shadow, shadow-sm, or shadow-md.",
    pattern: /\bshadow-(?:lg|2xl)\b/,
  },
];

function listFiles(dir) {
  const absoluteDir = path.join(cwd, dir);
  const entries = readdirSync(absoluteDir);
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(absoluteDir, entry);
    const relativePath = path.relative(cwd, absolutePath);
    const stats = statSync(absolutePath);

    if (stats.isDirectory()) {
      if ([".next", "node_modules"].includes(entry)) continue;
      files.push(...listFiles(relativePath));
      continue;
    }

    if (stats.isFile() && extensions.has(path.extname(entry))) {
      files.push(relativePath);
    }
  }

  return files;
}

function checkFile(relativePath) {
  const text = readFileSync(path.join(cwd, relativePath), "utf8");
  const lines = text.split(/\r?\n/);
  const violations = [];

  lines.forEach((line, index) => {
    for (const rule of rules) {
      rule.pattern.lastIndex = 0;
      if (!rule.pattern.test(line)) continue;
      if (rule.allow?.(relativePath, line)) continue;
      violations.push({
        ruleId: rule.id,
        message: rule.message,
        file: relativePath,
        lineNumber: index + 1,
        line: line.trim(),
      });
    }
  });

  return violations;
}

const violations = scanRoots
  .flatMap((root) => listFiles(root))
  .flatMap((file) => checkFile(file));

if (violations.length > 0) {
  console.error("Design system check failed:");
  for (const violation of violations) {
    console.error(
      `- ${violation.file}:${violation.lineNumber} [${violation.ruleId}] ${violation.message}`,
    );
    console.error(`  ${violation.line}`);
  }
  process.exit(1);
}

console.log("Design system check passed.");
