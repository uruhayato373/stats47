import fs from 'node:fs';
import path from 'node:path';
import { projectRoot } from './project-root';

/**
 * How far maps and videos share one base, read from the code on every view so that it cannot go stale. Each row says
 * what a drawing uses: the geometry base, the metric colour ledger, and the shared paper and ink.
 */
export interface MapRow { file: string; geometry: boolean; ledgerColor: boolean }
export interface VideoRow { id: string; feature: string; rendered: boolean; map: 'base' | 'own' | 'tile' | 'none'; ledgerColor: boolean; theme: boolean }

const GEOMETRY = /map\/geometry\.mjs|computeBuzzMapGeo|computeChoroplethPaths/;
const DRAWS_SHAPE = /geoPath|computeBuzzMapGeo|computeChoroplethPaths/;
const DRAWS_TILE = /renderTileMapBody|renderAll47TileSvg|TileGridMapScene|TILE_LAYOUT/;
const THIS_FILE = 'apps/admin/lib/server/media-unification.ts';
const LEDGER_COLOR = /resolveTileScale|resolveMetricColor|resolveColorEncoding|metricPresentation|applyColorPolicy|joinColorPolicy/;
const THEME = /chart-theme|COLOR_SCHEMES|CHART_THEMES/;
const MAP_ROOTS = ['apps/remotion/src', 'apps/admin/lib', '.claude/scripts/note', '.claude/scripts/sns', 'packages/migration-flow/src', 'packages/station-passengers/src', 'packages/visualization/src/server'];
const PIPELINES = ['apps/remotion/scripts', '.claude/scripts/sns'];
const SOURCE = /\.(ts|tsx|mjs)$/;
const NOT_SOURCE = /__tests__|\.test\.|\.d\.m?ts$/;
const STILL_FRAMES = '1';

function walk(root: string, directory: string): string[] {
  const absolute = path.join(root, directory);
  if (!fs.existsSync(absolute)) return [];
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const relative = `${directory}/${entry.name}`;
    if (entry.isDirectory()) return entry.name === 'node_modules' || entry.name === '__tests__' ? [] : walk(root, relative);
    return SOURCE.test(entry.name) && !NOT_SOURCE.test(entry.name) ? [relative] : [];
  });
}

/** Files that turn boundaries into a drawing, and whether each one goes through the base and the colour ledger. */
export function mapRows(root = projectRoot()): MapRow[] {
  return MAP_ROOTS.flatMap((directory) => walk(root, directory)).flatMap((file) => {
    const text = fs.readFileSync(path.join(root, file), 'utf8');
    if (file === THIS_FILE || file.endsWith('/index.ts') || !(DRAWS_SHAPE.test(text) || /map\/geometry\.mjs/.test(text))) return [];
    return [{ file, geometry: GEOMETRY.test(text), ledgerColor: LEDGER_COLOR.test(text) }];
  });
}

export interface CompositionBlock { id: string; component: string; frames: string }

/** Compositions in Root.tsx. A still has one frame. */
export function parseCompositions(source: string): CompositionBlock[] {
  return [...source.matchAll(/<Composition\b([\s\S]*?)\/>\n/g)].flatMap((match) => {
    const id = /\bid="([^"]+)"/.exec(match[1])?.[1], component = /\bcomponent=\{([^}]+)\}/.exec(match[1])?.[1], frames = /durationInFrames=\{([^}]+)\}/.exec(match[1])?.[1];
    return id && component && frames ? [{ id, component: component.split(' as ')[0].trim(), frames }] : [];
  });
}

const IMPORT = /(?:from|import)\s+['"]([^'"]+)['"]/g;

function resolveImport(root: string, from: string, specifier: string) {
  const base = (specifier.startsWith('@/') ? `apps/remotion/src/${specifier.slice(2)}` : specifier.startsWith('.') ? path.posix.join(path.posix.dirname(from), specifier) : null);
  if (!base) return null;
  return [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`].find((file) => /\.\w+$/.test(file) && fs.existsSync(path.join(root, file))) ?? null;
}

/** The file behind a name the shared barrel re-exports, or the barrel itself when it is not named there. */
function throughBarrel(root: string, file: string, name: string) {
  const target = new RegExp(`export \\{[^}]*\\b${name}\\b[^}]*\\} from ['"]([^'"]+)['"]`).exec(fs.readFileSync(path.join(root, file), 'utf8'))?.[1];
  return (target && resolveImport(root, file, target)) ?? file;
}

/** Every file a component reaches. The shared barrel is skipped: it would make every video reach everything. */
function reachable(root: string, start: string) {
  const seen = new Set<string>();
  const stack = [start];
  while (stack.length) {
    const file = stack.pop()!;
    if (seen.has(file)) continue;
    seen.add(file);
    for (const match of fs.readFileSync(path.join(root, file), 'utf8').matchAll(IMPORT)) {
      if (match[1] === '@/shared') continue;
      const next = resolveImport(root, file, match[1]);
      if (next) stack.push(next);
    }
  }
  return [...seen];
}

/** The videos in Root.tsx (more than one frame), with what they reach and whether a render script names them. */
export function videoRows(root = projectRoot()): VideoRow[] {
  const rootFile = 'apps/remotion/src/Root.tsx';
  const source = fs.readFileSync(path.join(root, rootFile), 'utf8');
  const scripts = PIPELINES.flatMap((directory) => walk(root, directory)).map((file) => fs.readFileSync(path.join(root, file), 'utf8')).join('\n');
  // A lazy component has no import line to follow: its name is not an identifier.
  return parseCompositions(source).filter((block) => block.frames !== STILL_FRAMES && /^\w+$/.test(block.component)).flatMap((block) => {
    const specifier = new RegExp(`import \\{[^}]*\\b${block.component}\\b[^}]*\\} from ['"]([^'"]+)['"]`).exec(source)?.[1];
    const entry = specifier && resolveImport(root, rootFile, specifier);
    if (!entry) return [];
    const start = /\/index\.tsx?$/.test(entry) ? throughBarrel(root, entry, block.component) : entry;
    const text = reachable(root, start).map((file) => fs.readFileSync(path.join(root, file), 'utf8')).join('\n');
    return [{
      id: block.id, feature: start.replace('apps/remotion/src/', '').split('/').slice(0, 2).join('/'),
      rendered: scripts.includes(block.id), map: DRAWS_SHAPE.test(text) ? (GEOMETRY.test(text) ? 'base' : 'own') : DRAWS_TILE.test(text) ? 'tile' : 'none', ledgerColor: LEDGER_COLOR.test(text), theme: THEME.test(text),
    }];
  });
}
