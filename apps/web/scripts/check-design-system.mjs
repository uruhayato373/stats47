import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const cwd = process.cwd();
// Phase 0-6 (2026-06-23) で src/app の既存債務 (Card 直 import / bg-white) を是正し、
// app も全ルール対象に昇格。components / features / app を一律で検査する。
// 2026-07-11 (DR-AUDIT-03): src/lib も走査対象に追加 (CookieConsentBanner 等のサイト chrome)。
const scanRoots = ['src/components', 'src/features', 'src/app', 'src/lib'];
const extensions = new Set(['.ts', '.tsx']);

const rules = [
  {
    id: 'no-outline-none-without-focus-ring',
    message:
      'Do not remove the focus outline unless the same control provides a visible focus ring.',
    pattern: /\b(?:focus-visible:|focus:)?outline-none\b/,
    allow: (_relativePath, line) =>
      /\b(?:focus-visible:|focus:)ring-(?:1|2|4|\[)/.test(line),
  },
  {
    id: 'no-manual-page-rail-grid',
    message:
      'Page rail columns belong to PageShell. Use leftRail/rightRail instead of hardcoding the shell grid in page.tsx.',
    pattern: /grid-cols-\[264px_minmax\(0,1fr\)\]/,
    allow: (relativePath) =>
      relativePath === 'src/components/layout/PageShell.tsx',
  },
  {
    id: 'no-generic-only-right-rail',
    message:
      'Do not narrow a page for an ad-only RightRailWidgets rail. Keep the page full width or pass contextual widgets.',
    pattern: /rightRail=\{<RightRailWidgets\s*\/>\}/,
  },
  {
    id: 'no-direct-shadcn-card',
    message:
      'Do not import shadcn Card directly from app components/features. Use SurfaceCard, SurfaceLinkCard, SurfaceSection, or ChartPanel.',
    pattern: /from\s+["']@stats47\/components\/atoms\/ui\/card["']/,
  },
  {
    id: 'no-legacy-dashboard-card',
    message:
      'DashboardCard/LegacyDashboardCard was removed. Use ChartPanel for charts/maps and ChartCard for compact KPI cards.',
    pattern: /\b(?:DashboardCard|LegacyDashboardCard)\b/,
  },
  {
    id: 'no-legacy-chart-footer',
    message:
      'LegacyChartFooter was replaced by ChartFooter. Use apps/web/src/components/charts/ChartFooter.tsx.',
    pattern: /\bLegacyChartFooter\b/,
  },
  {
    id: 'no-bg-white-in-normal-ui',
    message:
      'Avoid bg-white in normal UI. Use bg-card/bg-background, or document a brand/contrast exception in the allowlist.',
    pattern: /(?:^|\s)bg-white(?:[\/\s"`}]|$)/,
  },
  {
    id: 'no-hardcoded-surface-card',
    message:
      'Avoid hardcoded surface card classes. Use SurfaceCard/SurfaceLinkCard/getSurfaceCardClassName/ChartPanel.',
    pattern:
      /rounded-none\s+border\s+bg-card\s+p-4\s+shadow-sm|bg-card\s+border\s+rounded|rounded-(?:lg|md)\s+border\s+border-border\s+bg-card|border\s+border-border\s+bg-card.*shadow-sm/,
    // SurfaceCard 実装本体は許可。また rounded-full 要素はカードでなくピル/トグル/アバターなので除外
    // (コンテンツカードは rounded-full にしない)。
    allow: (relativePath, line) =>
      relativePath === 'src/components/surface/SurfaceCard.tsx' ||
      /\brounded-full\b/.test(line),
  },
  {
    id: 'no-map-panel',
    message:
      'Do not reintroduce MapPanel. Use ChartPanel for map and chart visualization panels.',
    pattern: /\bMapPanel\b/,
  },
  {
    id: 'no-direct-leaflet-tile-options',
    message:
      'Do not pin Leaflet tile options in feature components. Use useThemedLeafletTile(theme).',
    pattern: /\bTILE_OPTIONS_(?:LIGHT|DARK)\b/,
    allow: (relativePath) =>
      relativePath ===
      'src/features/map-visualization/utils/use-themed-leaflet-tile.ts',
  },
  {
    id: 'no-legacy-leaflet-border-color-constants',
    message:
      'Leaflet map colors live in map-palette.ts. Use LEAFLET_MAP_COLORS/getLeafletBorderColor.',
    pattern: /\bLEAFLET_BORDER_COLOR_(?:LIGHT|DARK)\b/,
  },
  {
    id: 'no-ogp-raw-color-outside-brand',
    message:
      'OGP fixed colors/shadows must be centralized in features/ogp/brand.ts.',
    pattern: /#[0-9A-Fa-f]{3,8}|rgba\(/,
    allow: (relativePath) =>
      !relativePath.startsWith('src/features/ogp/') ||
      relativePath === 'src/features/ogp/brand.ts',
  },
  {
    id: 'no-large-card-shadow',
    message:
      'Avoid large shadows on normal cards. Use no shadow, shadow-sm, or shadow-md.',
    pattern: /\bshadow-(?:lg|2xl)\b/,
  },
  {
    id: 'no-rounded-xl',
    message:
      'Flat design (--radius:0). Do not hand-add rounded-xl/2xl/3xl. Use rounded-none, or rounded-full only for circular elements.',
    pattern: /\brounded-(?:xl|2xl|3xl)\b/,
  },
  {
    id: 'no-arbitrary-radius',
    message:
      'Do not add arbitrary rounded-[…] values. Cards and panels use rounded-none; circular UI uses rounded-full.',
    pattern: /\brounded-\[[^\]]+\]/,
  },
  {
    id: 'no-text-black',
    message:
      'Avoid text-black. Use text-foreground or text-slate-900 (see .claude/design-system/prohibited.md).',
    pattern: /\btext-black\b/,
  },
  {
    // PageShell が幅・レール・余白の唯一の入口。page.tsx で container/max-w を直書きしない。
    // 正典: docs/01_技術設計/04_デザインシステム.md
    id: 'no-direct-width-in-page',
    message:
      'page.tsx must not hardcode width. Use PageShell (sole width/rail/padding source). No max-w-[…]. (container mx-auto is covered by no-container-mx-auto)',
    pattern: /max-w-\[/,
    // page.tsx だけを対象にする（PageShell.tsx 等の正当な max-w 定義は許可）。
    allow: (relativePath) => !relativePath.endsWith('page.tsx'),
  },
  {
    // 4px アクセントバー (カラーバー) は melta-ui で禁止 (全周 border / 余白 / 背景差で表現する)。
    // 例外は Markdown 散文中の引用/注記の左バーのみ (ブランドアクセントではなく typography)。
    // 正典: .claude/design-system/prohibited.md
    id: 'no-thick-accent-border',
    message:
      'Do not hand-add 4px accent borders (border-t/l/r/b-4). Use SurfaceCard border or spacing/background contrast.',
    pattern: /\bborder-[tlrb]-4\b/,
    allow: (relativePath) =>
      [
        'src/features/blog/components/md-content.tsx', // blockquote 左バー = Markdown 引用の一般 typography
        'src/features/blog/components/md-preprocessor.ts', // callout ([!NOTE] 等) の admonition 左バー
      ].includes(relativePath),
  },
  {
    // 横幅は PageShell (ページ) / SHELL_WIDTH_CLASS (Header/Footer/固定バナー等の chrome) が SSOT。
    id: 'no-container-mx-auto',
    message:
      'container mx-auto is prohibited. Width comes from PageShell (pages) or SHELL_WIDTH_CLASS (site chrome).',
    pattern: /container\s+mx-auto/,
    allow: (relativePath) =>
      relativePath === 'src/components/layout/PageShell.tsx',
  },
  {
    // features/redesign は 2026-07 に解体済み。再作成・再 import を禁止する。
    // RightRailWidgets → @/components/rail、SectionHeader → @/components/section、
    // InContentAdSlot/FooterAdSlot/RailAdSlot/NativeAffiliateRow → @/features/ads。
    id: 'no-redesign-import',
    message:
      'features/redesign was dissolved. Use @/components/rail (RightRailWidgets), @/components/section (SectionHeader), or @/features/ads (InContentAdSlot/FooterAdSlot/RailAdSlot/NativeAffiliateRow).',
    pattern: /@\/features\/redesign/,
  },
  {
    // 表の密度・罫線・アクセシビリティは @stats47/components の Table が SSOT。
    // DataTable / Markdown renderer を含め、生の table 要素による再実装を禁止する。
    id: 'no-raw-table',
    message:
      'Use Table primitives from @stats47/components instead of raw <table>. Shared primitives own table typography, spacing, borders, and scrolling.',
    pattern: /<table[\s>]/,
  },
  {
    // page.tsx のセクション見出し（h2）は SectionHeader（@/components/section）経由にする。
    // 生の <h2> はセクション見出しのドリフト（compare 型の独自ヘッダ・text-lg/base 混在）の温床。
    // カード/項目タイトルは h3 以下にする。prose/法務ページと未移行の content ページは grandfather。
    id: 'no-raw-h2-in-page',
    message:
      'Section headings in page.tsx must use SectionHeader (@/components/section). Card/item titles should be h3 or lower.',
    pattern: /<h2[\s>]/,
    allow: (relativePath) =>
      !relativePath.endsWith('page.tsx') ||
      RAW_HEADING_GRANDFATHER_H2.has(relativePath),
  },
  {
    // page.tsx の h1 は PageHeader が唯一の出所。記事レンダラ（blog/[slug]）と未移行の
    // areas 索引だけ grandfather。compare 型の独自 <h1> ヘッダ再発を防ぐ。
    id: 'no-raw-h1-outside-header',
    message:
      'Page <h1> must come from PageHeader (@/components/layout). Article renderers are the only exception.',
    pattern: /<h1[\s>]/,
    allow: (relativePath) =>
      !relativePath.endsWith('page.tsx') ||
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
  'src/app/privacy/page.tsx',
  'src/app/terms/page.tsx',
  'src/app/about/page.tsx',
  'src/app/areas/page.tsx',
  'src/app/areas/[areaCode]/cities/[cityCode]/page.tsx',
]);
const RAW_HEADING_GRANDFATHER_H1 = new Set([
  'src/app/blog/[slug]/page.tsx',
  'src/app/areas/page.tsx',
  // home の hero バナー内 h1 (色付き全幅バナーのキャッチコピー)。
  // ui-components.md「例外: hero バナー内の h1（home のみ text-3xl sm:text-4xl lg:text-5xl）」に準拠。
  'src/app/page.tsx',
]);

function listFiles(dir) {
  const absoluteDir = path.join(cwd, dir);
  const entries = readdirSync(absoluteDir);
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(absoluteDir, entry);
    // Checker rules and allowlists use POSIX separators. Normalize once so Windows does not
    // turn every allowlisted path into a false positive (src\\... vs src/...).
    const relativePath = path
      .relative(cwd, absolutePath)
      .split(path.sep)
      .join('/');
    const stats = statSync(absolutePath);

    if (stats.isDirectory()) {
      if (['.next', 'node_modules', '__tests__'].includes(entry)) continue;
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
  const text = readFileSync(path.join(cwd, relativePath), 'utf8');
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
const globalsPath = 'src/app/globals.css';
const globalsText = readFileSync(path.join(cwd, globalsPath), 'utf8');
const radiusPattern = /--radius:\s*([^;]+);/g;
for (const match of globalsText.matchAll(radiusPattern)) {
  const value = match[1].trim();
  if (/^0(?:px|rem)?$/.test(value)) continue;
  const lineNumber = globalsText.slice(0, match.index).split(/\r?\n/).length;
  violations.push({
    ruleId: 'no-nonzero-radius-token',
    message:
      'Card radius is globally flat. Keep every --radius token at 0; circular UI must use rounded-full explicitly.',
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
    value === '9999px' &&
    globalsText
      .slice(Math.max(0, match.index - 180), match.index)
      .includes('::-webkit-scrollbar-thumb');
  if (isZero || isScrollbarThumb) continue;
  violations.push({
    ruleId: 'no-fixed-css-border-radius',
    message:
      'Do not bypass the flat-card policy with a fixed CSS border-radius. Use 0; circular controls must use an explicit reviewed exception.',
    file: globalsPath,
    lineNumber,
    line: match[0],
  });
}

// ArticleCard は本文カードの正典。CSS token に加えて明示的 rounded-none を要求し、
// reading-zone のみ角丸へ戻る再発を二重に防ぐ。
const surfacePath = 'src/components/surface/SurfaceCard.tsx';
const surfaceText = readFileSync(path.join(cwd, surfacePath), 'utf8');
const articleCardBody = surfaceText.match(
  /export function ArticleCard[\s\S]*?(?=\nexport function RailCard)/
)?.[0];
if (!articleCardBody?.includes('rounded-none border bg-card shadow-sm')) {
  violations.push({
    ruleId: 'article-card-must-be-square',
    message:
      'ArticleCard must explicitly use rounded-none so article pages follow the site-wide square-card policy.',
    file: surfacePath,
    lineNumber: 1,
    line: 'ArticleCard',
  });
}

// --- 固定高 div で「幅から高さが決まる」D3 チャートを包むのを禁止する ---
//
// ★packages/visualization の D3 チャートは `viewBox` + `h-auto w-full` で描画されるため、
//   実際の高さは「コンテナ幅 × (viewBox 高 / viewBox 幅)」で決まり、親の CSS 高さを守れない。
//   `<div className="h-[200px]">` で包むと SVG がはみ出して footer やその下の要素に重なる。
//   実測 (2026-08-04 /themes/population-dynamics): 枠 200px に対し SVG 349px、重なり 154px。
//   高さは CSS ではなく `height` prop (= viewBox のアスペクト比) で制御すること。
//
//   対象コンポーネントは packages/visualization を読んで導出する (手動リストはドリフトする)。
//   `height="100%"` を持つものは親高さに追従できるので対象外。
const VISUALIZATION_COMPONENTS_DIR = path.resolve(
  cwd,
  '../../packages/visualization/src/d3/components'
);

function listTsxFilesDeep(dir) {
  const out = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) out.push(...listTsxFilesDeep(full));
    else if (full.endsWith('.tsx')) out.push(full);
  }
  return out;
}

/** 幅からしか高さが決まらない (= 親の固定高を守れない) チャート名の集合 */
function collectAspectRatioChartNames() {
  const names = new Set();
  for (const file of listTsxFilesDeep(VISUALIZATION_COMPONENTS_DIR)) {
    const text = readFileSync(file, 'utf8');
    const sizesByWidth = /className="(?:h-auto\s+w-full|w-full\s+h-auto)"/.test(
      text
    );
    if (!sizesByWidth) continue;
    if (/height="100%"/.test(text)) continue; // 親高さに追従できるので安全
    for (const match of text.matchAll(/export function (\w+)/g))
      names.add(match[1]);
  }
  return names;
}

/** `D3` 接頭辞の別名 export (D3LineChart 等) を吸収して照合する */
function isAspectRatioChart(names, imported) {
  return names.has(imported) || names.has(imported.replace(/^D3/, ''));
}

const aspectRatioCharts = collectAspectRatioChartNames();

function checkFixedHeightChartWrapper(relativePath, names) {
  if (names.size === 0) return [];
  const text = readFileSync(path.join(cwd, relativePath), 'utf8');
  if (!text.includes('@stats47/visualization/d3')) return [];

  // このファイル内でアスペクト比チャートを指すローカル識別子を集める
  const locals = new Set();
  for (const match of text.matchAll(
    /import\s*\{([^}]*)\}\s*from\s*["']@stats47\/visualization\/d3[^"']*["']/g
  )) {
    for (const part of match[1].split(',')) {
      const [original, alias] = part.split(/\s+as\s+/).map((s) => s.trim());
      if (!original) continue;
      if (isAspectRatioChart(names, original)) locals.add(alias || original);
    }
  }
  // next/dynamic 経由 (const D3MixedChart = dynamic(() => import("...").then((mod) => mod.MixedChart)))
  for (const match of text.matchAll(
    /const\s+(\w+)\s*=\s*dynamic\([\s\S]{0,300}?@stats47\/visualization\/d3[\s\S]{0,200}?mod\.(\w+)/g
  )) {
    if (isAspectRatioChart(names, match[2])) locals.add(match[1]);
  }
  if (locals.size === 0) return [];

  const lines = text.split(/\r?\n/);
  const found = [];
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    // コメント行 (この規約自体を説明している行を含む) は対象外
    if (
      trimmed.startsWith('//') ||
      trimmed.startsWith('*') ||
      trimmed.startsWith('/*')
    )
      return;
    // min-h- は下限なので子の高さを縛らない (はみ出さない)。h- / max-h- は縛るので対象。
    if (!/(?<!min-)h-\[\d+px\]/.test(line)) return;
    // 固定高 div の直後にチャートが来るか (JSX の入れ子は数行以内)
    const window = lines.slice(index, index + 6).join('\n');
    for (const local of locals) {
      if (!new RegExp(`<${local}\\b`).test(window)) continue;
      found.push({
        ruleId: 'no-fixed-height-around-aspect-ratio-chart',
        message: `${local} は viewBox + h-auto w-full で幅から高さが決まるため、固定高 div の高さを守れずはみ出す。CSS 高さではなく height prop で制御すること。`,
        file: relativePath,
        lineNumber: index + 1,
        line: line.trim(),
      });
      break;
    }
  });
  return found;
}

violations.push(
  ...scanRoots
    .flatMap((root) => listFiles(root))
    .flatMap((file) => checkFixedHeightChartWrapper(file, aspectRatioCharts))
);

if (violations.length > 0) {
  console.error('Design system check failed:');
  for (const violation of violations) {
    console.error(
      `- ${violation.file}:${violation.lineNumber} [${violation.ruleId}] ${violation.message}`
    );
    console.error(`  ${violation.line}`);
  }
  process.exit(1);
}

console.log('Design system check passed.');
