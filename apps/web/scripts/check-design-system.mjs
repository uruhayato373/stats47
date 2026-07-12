import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const cwd = process.cwd();
// Phase 0-6 (2026-06-23) で src/app の既存債務 (Card 直 import / bg-white) を是正し、
// app も全ルール対象に昇格。components / features / app を一律で検査する。
// 2026-07-11 (DR-AUDIT-03): src/lib も走査対象に追加 (CookieConsentBanner 等のサイト chrome)。
const scanRoots = ["src/components", "src/features", "src/app", "src/lib"];
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
      ["src/features/ads/components/TechSchoolPromoCard.tsx"].includes(
        relativePath,
      ),
  },
  {
    id: "no-hardcoded-surface-card",
    message:
      "Avoid hardcoded surface card classes. Use SurfaceCard/SurfaceLinkCard/getSurfaceCardClassName/ChartPanel.",
    pattern:
      /rounded-none\s+border\s+bg-card\s+p-4\s+shadow-sm|bg-card\s+border\s+rounded|rounded-(?:lg|md)\s+border\s+border-border\s+bg-card|border\s+border-border\s+bg-card.*shadow-sm/,
    // SurfaceCard 実装本体は許可。また rounded-full 要素はカードでなくピル/トグル/アバターなので除外
    // (コンテンツカードは rounded-full にしない)。
    allow: (relativePath, line) =>
      relativePath === "src/components/surface/SurfaceCard.tsx" ||
      /\brounded-full\b/.test(line),
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
  {
    id: "no-rounded-xl",
    message:
      "Flat design (--radius:0). Do not hand-add rounded-xl/2xl/3xl. Use rounded-none, or rounded-full only for circular elements.",
    pattern: /\brounded-(?:xl|2xl|3xl)\b/,
  },
  {
    id: "no-arbitrary-radius",
    message:
      "Do not add arbitrary rounded-[…] values. Cards and panels use rounded-none; circular UI uses rounded-full.",
    pattern: /\brounded-\[[^\]]+\]/,
  },
  {
    id: "no-text-black",
    message:
      "Avoid text-black. Use text-foreground or text-slate-900 (see .claude/design-system/prohibited.md).",
    pattern: /\btext-black\b/,
  },
  {
    // PageShell が幅・レール・余白の唯一の入口。page.tsx で container/max-w を直書きしない。
    // 正典: docs/01_技術設計/15_デザインシステムSSOT.md / 13_統一レイアウト設計.md
    id: "no-direct-width-in-page",
    message:
      "page.tsx must not hardcode width. Use PageShell (sole width/rail/padding source). No max-w-[…]. (container mx-auto is covered by no-container-mx-auto)",
    pattern: /max-w-\[/,
    // page.tsx だけを対象にする（PageShell.tsx 等の正当な max-w 定義は許可）。
    allow: (relativePath) => !relativePath.endsWith("page.tsx"),
  },
  {
    // 4px アクセントバー (カラーバー) は melta-ui で禁止 (全周 border / 余白 / 背景差で表現する)。
    // 例外は Markdown 散文中の引用/注記の左バーのみ (ブランドアクセントではなく typography)。
    // 正典: .claude/design-system/prohibited.md
    id: "no-thick-accent-border",
    message:
      "Do not hand-add 4px accent borders (border-t/l/r/b-4). Use SurfaceCard border or spacing/background contrast.",
    pattern: /\bborder-[tlrb]-4\b/,
    allow: (relativePath) =>
      [
        "src/features/blog/components/md-content.tsx", // blockquote 左バー = Markdown 引用の一般 typography
        "src/features/blog/components/md-preprocessor.ts", // callout ([!NOTE] 等) の admonition 左バー
      ].includes(relativePath),
  },
  {
    // 横幅は PageShell (ページ) / SHELL_WIDTH_CLASS (Header/Footer/固定バナー等の chrome) が SSOT。
    id: "no-container-mx-auto",
    message:
      "container mx-auto is prohibited. Width comes from PageShell (pages) or SHELL_WIDTH_CLASS (site chrome).",
    pattern: /container\s+mx-auto/,
    allow: (relativePath) => relativePath === "src/components/layout/PageShell.tsx",
  },
  {
    // features/redesign は 2026-07 に解体済み。再作成・再 import を禁止する。
    // RightRailWidgets → @/components/rail、SectionHeader → @/components/section、
    // InContentAdSlot/FooterAdSlot/RailAdSlot/NativeAffiliateRow → @/features/ads。
    id: "no-redesign-import",
    message:
      "features/redesign was dissolved. Use @/components/rail (RightRailWidgets), @/components/section (SectionHeader), or @/features/ads (InContentAdSlot/FooterAdSlot/RailAdSlot/NativeAffiliateRow).",
    pattern: /@\/features\/redesign/,
  },
  {
    // page.tsx のセクション見出し（h2）は SectionHeader（@/components/section）経由にする。
    // 生の <h2> はセクション見出しのドリフト（compare 型の独自ヘッダ・text-lg/base 混在）の温床。
    // カード/項目タイトルは h3 以下にする。prose/法務ページと未移行の content ページは grandfather。
    id: "no-raw-h2-in-page",
    message:
      "Section headings in page.tsx must use SectionHeader (@/components/section). Card/item titles should be h3 or lower.",
    pattern: /<h2[\s>]/,
    allow: (relativePath) =>
      !relativePath.endsWith("page.tsx") ||
      RAW_HEADING_GRANDFATHER_H2.has(relativePath),
  },
  {
    // page.tsx の h1 は PageHeader が唯一の出所。記事レンダラ（blog/[slug]）と未移行の
    // areas 索引だけ grandfather。compare 型の独自 <h1> ヘッダ再発を防ぐ。
    id: "no-raw-h1-outside-header",
    message:
      "Page <h1> must come from PageHeader (@/components/layout). Article renderers are the only exception.",
    pattern: /<h1[\s>]/,
    allow: (relativePath) =>
      !relativePath.endsWith("page.tsx") ||
      RAW_HEADING_GRANDFATHER_H1.has(relativePath),
  },
];

/**
 * 生の見出し許可リスト（grandfather）。
 * prose/法務ページ（privacy/terms/about）は文書見出しとして <h2> を正当に使う。
 * areas 索引・市区町村ページは未移行（将来 SectionHeader/PageHeader へ移行予定）。
 * blog/[slug] は記事タイトル <h1>（記事レンダラ）。
 */
const RAW_HEADING_GRANDFATHER_H2 = new Set([
  "src/app/privacy/page.tsx",
  "src/app/terms/page.tsx",
  "src/app/about/page.tsx",
  "src/app/areas/page.tsx",
  "src/app/areas/[areaCode]/cities/[cityCode]/page.tsx",
]);
const RAW_HEADING_GRANDFATHER_H1 = new Set([
  "src/app/blog/[slug]/page.tsx",
  "src/app/areas/page.tsx",
  // home の hero バナー内 h1 (色付き全幅バナーのキャッチコピー)。
  // ui-components.md「例外: hero バナー内の h1（home のみ text-3xl sm:text-4xl lg:text-5xl）」に準拠。
  "src/app/page.tsx",
]);

function listFiles(dir) {
  const absoluteDir = path.join(cwd, dir);
  const entries = readdirSync(absoluteDir);
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(absoluteDir, entry);
    const relativePath = path.relative(cwd, absolutePath);
    const stats = statSync(absolutePath);

    if (stats.isDirectory()) {
      if ([".next", "node_modules", "__tests__"].includes(entry)) continue;
      files.push(...listFiles(relativePath));
      continue;
    }

    // テストはルール文字列を期待値として含むため除外 (knip.config.ts の ignore と同基準)
    if (/\.test\.[jt]sx?$/.test(entry)) continue;

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

// カード角丸の SSOT は globals.css の --radius: 0。
// 通常領域・reading-zone のどちらかへ非ゼロ値が再導入された場合、見た目がページ種別で
// ドリフトするため、class 名の静的検査とは別にトークン自体を決定的に検査する。
const globalsPath = "src/app/globals.css";
const globalsText = readFileSync(path.join(cwd, globalsPath), "utf8");
const radiusPattern = /--radius:\s*([^;]+);/g;
for (const match of globalsText.matchAll(radiusPattern)) {
  const value = match[1].trim();
  if (/^0(?:px|rem)?$/.test(value)) continue;
  const lineNumber = globalsText.slice(0, match.index).split(/\r?\n/).length;
  violations.push({
    ruleId: "no-nonzero-radius-token",
    message:
      "Card radius is globally flat. Keep every --radius token at 0; circular UI must use rounded-full explicitly.",
    file: globalsPath,
    lineNumber,
    line: match[0],
  });
}

// CSS の固定 border-radius は Tailwind token を迂回するため別検査にする。
// スクロールバー thumb はカード/パネルではなく、形状として円形が必要な唯一のCSS例外。
const cssBorderRadiusPattern = /border-radius:\s*([^;]+);/g;
for (const match of globalsText.matchAll(cssBorderRadiusPattern)) {
  const value = match[1].trim();
  const lineNumber = globalsText.slice(0, match.index).split(/\r?\n/).length;
  const isZero = /^0(?:px|rem)?$/.test(value);
  const isScrollbarThumb =
    value === "9999px" &&
    globalsText.slice(Math.max(0, match.index - 180), match.index).includes("::-webkit-scrollbar-thumb");
  if (isZero || isScrollbarThumb) continue;
  violations.push({
    ruleId: "no-fixed-css-border-radius",
    message:
      "Do not bypass the flat-card policy with a fixed CSS border-radius. Use 0; circular controls must use an explicit reviewed exception.",
    file: globalsPath,
    lineNumber,
    line: match[0],
  });
}

// ArticleCard は本文カードの正典。CSS token に加えて明示的 rounded-none を要求し、
// reading-zone のみ角丸へ戻る再発を二重に防ぐ。
const surfacePath = "src/components/surface/SurfaceCard.tsx";
const surfaceText = readFileSync(path.join(cwd, surfacePath), "utf8");
const articleCardBody = surfaceText.match(
  /export function ArticleCard[\s\S]*?(?=\nexport function RailCard)/,
)?.[0];
if (!articleCardBody?.includes('"rounded-none border bg-card shadow-sm"')) {
  violations.push({
    ruleId: "article-card-must-be-square",
    message:
      "ArticleCard must explicitly use rounded-none so article pages follow the site-wide square-card policy.",
    file: surfacePath,
    lineNumber: 1,
    line: "ArticleCard",
  });
}

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
