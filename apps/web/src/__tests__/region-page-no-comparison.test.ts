/**
 * テーマ・地域・全国のページに 47 都道府県を比べる図・表を置かない (2026-10-31 オーナー決定)。
 *
 * テーマ (`/themes/*`)・地域 (`/areas/*`)・全国 (`/japan/*`) のページは 1 つの地域 (全国・県・市区町村) の値・推移・内訳・男女差を
 * 見せる。県の比較はランキングのページ (`/ranking/*`) と Geo の分析ページが受け持つ。ここでは各ページの入口から import を
 * たどり、届くファイルが比較の部品を使っていないか、「47都道府県の〜」のような比較の見出しを持っていないかを調べる。
 * 正典: docs/01_技術設計/03_情報設計.md「地理スコープ」・.claude/rules/theme-catalog-standards.md §3.0
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { ANALYSIS_PREVIEWS } from '@/features/products/analysis-previews.generated';
import { STOREFRONT_PRODUCTS } from '@/features/products/storefront';
import { collectThemeProducts } from '@/features/products/theme-products';
import type { StorefrontProduct } from '@/features/products/types';

const SRC = resolve(__dirname, '..');

/** 入口: テーマ・地域・全国のページと、テーマに埋め込む節の登録簿 */
const ENTRY_DIRS = ['app/themes', 'app/areas', 'app/japan'];
const ENTRY_FILES = ['features/theme-dashboard/config/all-themes.ts'];

/** 47 都道府県 (や全国の市区町村) を並べて比べる部品。ランキング・Geo の分析ページ・市区町村の比較ページだけが使う */
const COMPARISON_COMPONENTS = [
  'RankingVisualizationSection',
  'TileGridMap',
  'RankingAllPrefecturesChart',
  'RankingBoxplotChart',
  'BarChartRace',
  'DistributionHistogram',
  'ValueDotPlot',
  'MiniDistributionBars',
  'FixedYearComparisonPanel',
  'ThemeComparisonSection',
];

/** 比較を前提にした見出し・説明の文言 (コメントは見ない) */
const COMPARISON_TEXT = /47\s?都道府県(の(?!計|合計)|を比べる|に戻す)|全国・47\s?都道府県/;

/**
 * 届くが、テーマ・地域のページでは比較を出さないことを別の仕組みで守っているファイル (理由つき・縮小専用)。
 * Geo の分析ページと共有する集計の部品は、テーマからは `regionOnly` で今の地域の行だけを出す。
 */
const TEXT_ALLOWLIST: Record<string, string> = {
  'app/areas/page.tsx': '地域の一覧 (47 県のプロフィールへの入口) の説明。比較の図は持たない',
  'components/layout/page-heroes.ts': '分野のハブ (/category) の紹介文の台帳。テーマ・地域のページには出ない',
  'features/geo-analysis/components/GeoPublicFacilitySummary.tsx':
    '47 都道府県の表は Geo の分析ページ用。テーマは regionOnly で隠す',
};

const sourcePath = (file: string) => relative(SRC, file).replaceAll('\\', '/');

function listFiles(dir: string): string[] {
  const abs = join(SRC, dir);
  if (!existsSync(abs)) return [];
  return readdirSync(abs).flatMap((name) => {
    const path = join(abs, name);
    if (statSync(path).isDirectory()) return name === '__tests__' ? [] : listFiles(sourcePath(path));
    return /\.(tsx?)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [sourcePath(path)] : [];
  });
}

const IMPORT_RE = /(?:from\s+|import\s*\(\s*)['"]((?:\.{1,2}|@)\/[^'"]+)['"]/g;

function resolveImport(fromFile: string, spec: string): string | null {
  const base = spec.startsWith('@/') ? join(SRC, spec.slice(2)) : resolve(dirname(join(SRC, fromFile)), spec);
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, join(base, 'index.ts'), join(base, 'index.tsx')]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return sourcePath(candidate);
  }
  return null;
}

function reachableFiles(): string[] {
  const seen = new Set<string>();
  const queue = [...ENTRY_DIRS.flatMap(listFiles), ...ENTRY_FILES];
  while (queue.length > 0) {
    const file = queue.pop()!;
    if (seen.has(file)) continue;
    seen.add(file);
    const source = readFileSync(join(SRC, file), 'utf8');
    for (const match of source.matchAll(IMPORT_RE)) {
      const target = resolveImport(file, match[1]);
      if (target && !/__tests__|\.test\.tsx?$/.test(target)) queue.push(target);
    }
  }
  return [...seen].sort();
}

/** コメント (// と /* *\/) を除いたソース */
function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
}

/** JSON相当の生成台帳は表示コードではない。実行式・値import・JSXがあれば除外しない。 */
function isLiteralCatalog(file: string, source: string): boolean {
  if (!file.endsWith('.generated.ts')) return false;
  const literal = (node: ts.Expression): boolean => {
    if (ts.isAsExpression(node) || ts.isSatisfiesExpression(node)) return literal(node.expression);
    if (ts.isStringLiteral(node) || ts.isNumericLiteral(node) ||
      [ts.SyntaxKind.TrueKeyword, ts.SyntaxKind.FalseKeyword, ts.SyntaxKind.NullKeyword].includes(node.kind)) return true;
    if (ts.isArrayLiteralExpression(node)) return node.elements.every(literal);
    if (ts.isObjectLiteralExpression(node)) return node.properties.every(property =>
      ts.isPropertyAssignment(property) && !ts.isComputedPropertyName(property.name) && literal(property.initializer));
    return false;
  };
  const statements = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true).statements;
  return statements.some(ts.isVariableStatement) && statements.every(statement =>
    ts.isImportDeclaration(statement) ? statement.importClause?.isTypeOnly === true :
      ts.isVariableStatement(statement) && Boolean(statement.declarationList.flags & ts.NodeFlags.Const) &&
      statement.declarationList.declarations.every(declaration => declaration.initializer && literal(declaration.initializer)));
}

describe('テーマ・地域・全国のページに 47 都道府県の比較を置かない', () => {
  const files = reachableFiles();

  it('入口から import をたどれている (テーマの埋め込み節まで届く)', () => {
    expect(files.length).toBeGreaterThan(100);
    expect(files).toContain('features/theme-dashboard/components/ThemeMetricsDashboard.tsx');
    expect(files).toContain('features/depopulation-medical/components/DepopulationMedicalMapClient.tsx');
  });

  it('比較の部品を import しない', () => {
    const offenders = files.flatMap((file) => {
      const source = withoutComments(readFileSync(join(SRC, file), 'utf8'));
      return COMPARISON_COMPONENTS.filter((name) =>
        new RegExp(`import[^;]*\\b${name}\\b[^;]*from|import\\([^)]*${name}`).test(source)
      ).map((name) => `${file}: ${name}`);
    });
    // 引っかかったファイルを全部読めるよう 1 つの文字列で比べる
    expect(offenders.join('\n')).toBe('');
  });

  it('「47都道府県の〜」のような比較の見出し・説明を持たない', () => {
    const offenders = files.filter(file => {
      const source = readFileSync(join(SRC, file), 'utf8');
      return !TEXT_ALLOWLIST[file] && !isLiteralCatalog(file, source) && COMPARISON_TEXT.test(withoutComments(source));
    });
    expect(offenders.join('\n')).toBe('');
  });

  it('生成台帳でも実行式・値import・表示コードを含めば見出しの検査を省かない', () => {
    const data = 'export const DATA = [{ title: "47都道府県の比較" }] as const;';
    expect(isLiteralCatalog('catalog.generated.ts', data)).toBe(true);
    expect(isLiteralCatalog('component.ts', data)).toBe(false);
    for (const code of [
      data + ' export function Heading() { return "47都道府県の比較"; }',
      'import { render } from "./view"; ' + data,
      'export const DATA = [{ title: render() }];',
      'export const DATA = [{ ...otherData }];',
      'export const DATA = <h2>47都道府県の比較</h2>;',
    ]) expect(isLiteralCatalog('catalog.generated.ts', code), code).toBe(false);
  });

  it('商品台帳の説明文・図をテーマへ渡さず、販売版・改訂案とも案内文だけを検査する', () => {
    const entries = STOREFRONT_PRODUCTS.map(product => ({ product, slug: product.slug, preview: false,
      revision: ANALYSIS_PREVIEWS.find(revision => revision.id === product.id) }));
    const products: readonly StorefrontProduct[] = [...STOREFRONT_PRODUCTS, ...ANALYSIS_PREVIEWS];
    const themes = new Set(products.flatMap(product =>
      product.showcase?.flatMap(section => section.themeRefs?.map(ref => ref.themeKey) ?? []) ?? []));
    expect(themes.size).toBeGreaterThan(10);
    for (const theme of themes) {
      const chapters = collectThemeProducts(theme, entries);
      expect(JSON.stringify(chapters), theme).not.toMatch(COMPARISON_TEXT);
      for (const link of Object.values(chapters).flat()) {
        expect(link.product).not.toHaveProperty('description');
        expect(link.product).not.toHaveProperty('showcase');
        for (const example of link.examples) expect(Object.keys(example).sort()).toEqual(['heading', 'href']);
      }
    }
  });

  it('許可の一覧は実在し、今も該当する (使われなくなった許可を残さない)', () => {
    for (const file of Object.keys(TEXT_ALLOWLIST)) {
      expect(files, file).toContain(file);
      expect(COMPARISON_TEXT.test(withoutComments(readFileSync(join(SRC, file), 'utf8'))), file).toBe(true);
    }
  });
});
