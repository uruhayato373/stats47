#!/usr/bin/env node
/**
 * Production apps/web -> e-Stat import boundary guard.
 *
 * Two ratchets deliberately coexist during CROSS-PAGE-DATA-SSOT-01 migration:
 *   1. the original direct static-import ALLOWLIST (shrink-only, target = zero), and
 *   2. a merge-base comparison of every value import edge that can transitively
 *      reach the e-Stat provider.
 *
 * The graph is parsed with the TypeScript AST. It follows static imports, value
 * dynamic imports, re-exports, require(), relative wrappers, and tsconfig aliases.
 * Type-only imports/exports and inline import types do not create runtime edges.
 * Existing indirect reachability is not copied into a second allowlist: a PR may
 * remove an edge, but any newly reachable edge fails against the PR base commit.
 */
'use strict';

const childProcess = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const PROJECT_ROOT = path.resolve(__dirname, '../../..');
const WEB_SRC = path.join(PROJECT_ROOT, 'apps/web/src');
const WEB_TSCONFIG = path.join(PROJECT_ROOT, 'apps/web/tsconfig.json');
const FORBIDDEN_NODE = '<@stats47/estat-api>';
const SOURCE_EXTENSIONS = [
  '.ts',
  '.tsx',
  '.mts',
  '.cts',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
];

/** Original direct static-import baseline (2026-08-13). Do not add entries. */
const ALLOWLIST = [
  'components/stat-charts/adapters/toBarChartData.ts',
  'components/stat-charts/adapters/toKpiCardData.ts',
  'components/stat-charts/adapters/toStatsTableData.ts',
  'components/stat-charts/adapters/toSunburstData.ts',
  'components/stat-charts/services/fetchEstatData.ts',
  'components/stat-charts/utils/computeSharedYDomain.ts',
  'components/stat-charts/utils/computeYAxisDomain.ts',
  'features/theme-dashboard/actions/fetch-indicator-for-year.ts',
  'features/theme-dashboard/actions/fetch-metric-timeseries.ts',
  'features/theme-dashboard/actions/fetch-population-pyramid.ts',
];

function normalize(file) {
  return file.split(path.sep).join('/');
}

function isProductionSource(relPath) {
  if (!SOURCE_EXTENSIONS.includes(path.extname(relPath))) return false;
  return (
    !/(^|\/)__tests__\//.test(relPath) &&
    !/\.(test|spec|stories)\.[cm]?[jt]sx?$/.test(relPath) &&
    !/(^|\/)(__mocks__|__fixtures__)\//.test(relPath)
  );
}

function scriptKind(fileName) {
  if (/\.tsx$/i.test(fileName)) return ts.ScriptKind.TSX;
  if (/\.jsx$/i.test(fileName)) return ts.ScriptKind.JSX;
  if (/\.[cm]?js$/i.test(fileName)) return ts.ScriptKind.JS;
  return ts.ScriptKind.TS;
}

function importClauseIsTypeOnly(clause) {
  if (!clause) return false;
  if (clause.isTypeOnly) return true;
  if (clause.name) return false;
  const bindings = clause.namedBindings;
  return Boolean(
    bindings &&
    ts.isNamedImports(bindings) &&
    bindings.elements.length > 0 &&
    bindings.elements.every((element) => element.isTypeOnly)
  );
}

function exportClauseIsTypeOnly(node) {
  if (node.isTypeOnly) return true;
  const clause = node.exportClause;
  return Boolean(
    clause &&
    ts.isNamedExports(clause) &&
    clause.elements.length > 0 &&
    clause.elements.every((element) => element.isTypeOnly)
  );
}

/** Parse runtime module edges without matching comments or string literals. */
function parseValueDependencies(text, fileName = 'source.ts') {
  const source = ts.createSourceFile(
    fileName,
    text,
    ts.ScriptTarget.Latest,
    true,
    scriptKind(fileName)
  );
  const dependencies = [];
  const add = (specifier, kind) => {
    if (typeof specifier !== 'string' || specifier.length === 0) return;
    dependencies.push({ specifier, kind });
  };

  const visit = (node) => {
    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteralLike(node.moduleSpecifier) &&
      !importClauseIsTypeOnly(node.importClause)
    ) {
      add(node.moduleSpecifier.text, 'import');
    } else if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteralLike(node.moduleSpecifier) &&
      !exportClauseIsTypeOnly(node)
    ) {
      add(node.moduleSpecifier.text, 're-export');
    } else if (
      ts.isImportEqualsDeclaration(node) &&
      !node.isTypeOnly &&
      ts.isExternalModuleReference(node.moduleReference) &&
      node.moduleReference.expression &&
      ts.isStringLiteralLike(node.moduleReference.expression)
    ) {
      add(node.moduleReference.expression.text, 'require');
    } else if (ts.isCallExpression(node) && node.arguments.length === 1) {
      const argument = node.arguments[0];
      if (
        ts.isStringLiteralLike(argument) &&
        node.expression.kind === ts.SyntaxKind.ImportKeyword
      ) {
        add(argument.text, 'dynamic-import');
      } else if (
        ts.isStringLiteralLike(argument) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === 'require'
      ) {
        add(argument.text, 'require');
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);

  const seen = new Set();
  return dependencies.filter((dependency) => {
    const key = `${dependency.kind}\0${dependency.specifier}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function isForbiddenSpecifier(specifier) {
  return /^@stats47\/estat-api(?:\/|$)/.test(specifier);
}

/** Backward-compatible classifier for the original direct static-import ratchet. */
function hasEstatValueImport(text, fileName = 'source.ts') {
  return parseValueDependencies(text, fileName).some(
    (dependency) =>
      dependency.kind === 'import' && isForbiddenSpecifier(dependency.specifier)
  );
}

function hasForbiddenProviderDependency(text, fileName = 'source.ts') {
  return parseValueDependencies(text, fileName).some((dependency) =>
    isForbiddenSpecifier(dependency.specifier)
  );
}

function walkProductionFiles(root) {
  const files = [];
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (['node_modules', '.next', 'out', '.local'].includes(entry.name))
        continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      const rel = normalize(path.relative(root, full));
      if (isProductionSource(rel)) files.push(full);
    }
  };
  walk(root);
  return files.sort();
}

function collectValueImportFiles(root = WEB_SRC) {
  return walkProductionFiles(root)
    .filter((file) => hasEstatValueImport(fs.readFileSync(file, 'utf8'), file))
    .map((file) => normalize(path.relative(root, file)))
    .sort();
}

function diffAgainstAllowlist(found, allowlist = ALLOWLIST) {
  const allow = new Set(allowlist);
  const foundSet = new Set(found);
  return {
    newOnes: found.filter((file) => !allow.has(file)),
    resolved: allowlist.filter((file) => !foundSet.has(file)),
  };
}

function parseTsconfigAliases(text, tsconfigPath) {
  const parsed = ts.parseConfigFileTextToJson(tsconfigPath, text);
  if (parsed.error || !parsed.config || typeof parsed.config !== 'object')
    return [];
  const compilerOptions = parsed.config.compilerOptions ?? {};
  const paths = compilerOptions.paths ?? {};
  const baseUrl = path.resolve(
    path.dirname(tsconfigPath),
    compilerOptions.baseUrl ?? '.'
  );
  return Object.entries(paths)
    .filter(([, targets]) => Array.isArray(targets))
    .map(([pattern, targets]) => ({
      pattern,
      targets: targets.filter((target) => typeof target === 'string'),
      baseUrl,
    }))
    .sort(
      (a, b) =>
        b.pattern.replace('*', '').length - a.pattern.replace('*', '').length
    );
}

function readTsconfigAliases(tsconfigPath = WEB_TSCONFIG) {
  return parseTsconfigAliases(
    fs.readFileSync(tsconfigPath, 'utf8'),
    tsconfigPath
  );
}

function matchAlias(pattern, specifier) {
  const star = pattern.indexOf('*');
  if (star === -1) return pattern === specifier ? '' : null;
  const prefix = pattern.slice(0, star);
  const suffix = pattern.slice(star + 1);
  if (!specifier.startsWith(prefix) || !specifier.endsWith(suffix)) return null;
  return specifier.slice(prefix.length, specifier.length - suffix.length);
}

function aliasCandidates(specifier, aliases) {
  const candidates = [];
  for (const alias of aliases) {
    const matched = matchAlias(alias.pattern, specifier);
    if (matched === null) continue;
    for (const target of alias.targets) {
      candidates.push(
        path.resolve(alias.baseUrl, target.replace('*', matched))
      );
    }
  }
  return candidates;
}

function sourceCandidates(base) {
  const ext = path.extname(base);
  const withoutJs = /\.[cm]?jsx?$/.test(ext)
    ? base.slice(0, -ext.length)
    : null;
  return [
    base,
    ...(withoutJs
      ? SOURCE_EXTENSIONS.map((candidateExt) => `${withoutJs}${candidateExt}`)
      : []),
    ...SOURCE_EXTENSIONS.map((candidateExt) => `${base}${candidateExt}`),
    ...SOURCE_EXTENSIONS.map((candidateExt) =>
      path.join(base, `index${candidateExt}`)
    ),
  ];
}

function resolveExistingSource(base) {
  for (const candidate of sourceCandidates(base)) {
    try {
      if (fs.statSync(candidate).isFile()) return path.resolve(candidate);
    } catch {
      // Try the next extension/index form.
    }
  }
  return null;
}

function isInside(parent, child) {
  const rel = path.relative(parent, child);
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

function logicalTarget(fromFile, specifier, aliases) {
  if (isForbiddenSpecifier(specifier)) return FORBIDDEN_NODE;
  if (specifier.startsWith('.') || specifier.startsWith('/')) {
    return normalize(path.resolve(path.dirname(fromFile), specifier));
  }
  const candidates = aliasCandidates(specifier, aliases);
  return candidates.length > 0 ? normalize(candidates[0]) : specifier;
}

function resolveDependency(
  fromFile,
  specifier,
  aliases,
  projectRoot,
  estatSourceRoot
) {
  if (isForbiddenSpecifier(specifier)) return FORBIDDEN_NODE;
  const bases =
    specifier.startsWith('.') || specifier.startsWith('/')
      ? [path.resolve(path.dirname(fromFile), specifier)]
      : aliasCandidates(specifier, aliases);
  for (const base of bases) {
    const resolved = resolveExistingSource(base);
    if (!resolved || !isInside(projectRoot, resolved)) continue;
    if (isInside(estatSourceRoot, resolved)) return FORBIDDEN_NODE;
    return resolved;
  }
  return null;
}

/** Build the production import graph and retain only paths that reach e-Stat. */
function collectForbiddenReachability(options = {}) {
  const projectRoot = path.resolve(options.projectRoot ?? PROJECT_ROOT);
  const webSrc = path.resolve(
    options.webSrc ?? path.join(projectRoot, 'apps/web/src')
  );
  const tsconfigPath = path.resolve(
    options.tsconfigPath ?? path.join(projectRoot, 'apps/web/tsconfig.json')
  );
  const estatSourceRoot = path.resolve(
    options.estatSourceRoot ?? path.join(projectRoot, 'packages/estat-api/src')
  );
  const aliases = options.aliases ?? readTsconfigAliases(tsconfigPath);
  const entries = walkProductionFiles(webSrc);
  const adjacency = new Map();
  const loading = new Set();

  const load = (file) => {
    if (adjacency.has(file) || loading.has(file)) return;
    loading.add(file);
    const dependencies = parseValueDependencies(
      fs.readFileSync(file, 'utf8'),
      file
    );
    const edges = dependencies.map((dependency) => ({
      ...dependency,
      source: file,
      sourceRepoPath: normalize(path.relative(projectRoot, file)),
      logicalTarget: logicalTarget(file, dependency.specifier, aliases),
      target: resolveDependency(
        file,
        dependency.specifier,
        aliases,
        projectRoot,
        estatSourceRoot
      ),
    }));
    adjacency.set(file, edges);
    for (const edge of edges) {
      if (edge.target && edge.target !== FORBIDDEN_NODE) load(edge.target);
    }
    loading.delete(file);
  };
  entries.forEach(load);

  // Reverse traversal is cycle-safe: seed direct provider boundaries, then mark
  // every importer of a reachable node until the fixed point is reached.
  const reverse = new Map();
  const reachableNodes = new Set();
  for (const [source, edges] of adjacency) {
    for (const edge of edges) {
      if (edge.target === FORBIDDEN_NODE) reachableNodes.add(source);
      else if (edge.target) {
        const importers = reverse.get(edge.target) ?? [];
        importers.push(source);
        reverse.set(edge.target, importers);
      }
    }
  }
  const queue = [...reachableNodes];
  for (let index = 0; index < queue.length; index += 1) {
    for (const importer of reverse.get(queue[index]) ?? []) {
      if (reachableNodes.has(importer)) continue;
      reachableNodes.add(importer);
      queue.push(importer);
    }
  }

  const reachableEntries = entries
    .filter((entry) => reachableNodes.has(entry))
    .map((entry) => normalize(path.relative(webSrc, entry)))
    .sort();
  const relevantEdges = [];
  for (const [source, edges] of adjacency) {
    if (!reachableNodes.has(source)) continue;
    for (const edge of edges) {
      if (
        edge.target === FORBIDDEN_NODE ||
        (edge.target && reachableNodes.has(edge.target))
      ) {
        relevantEdges.push(edge);
      }
    }
  }
  relevantEdges.sort((a, b) =>
    `${a.sourceRepoPath}\0${a.specifier}`.localeCompare(
      `${b.sourceRepoPath}\0${b.specifier}`
    )
  );
  const directBoundaryFiles = [
    ...new Set(
      relevantEdges
        .filter(
          (edge) =>
            edge.target === FORBIDDEN_NODE && isInside(webSrc, edge.source)
        )
        .map((edge) => normalize(path.relative(webSrc, edge.source)))
    ),
  ].sort();

  return { aliases, reachableEntries, relevantEdges, directBoundaryFiles };
}

function findNewRelevantEdges(
  currentEdges,
  readBaselineFile,
  currentAliases,
  baselineAliases,
  projectRoot
) {
  const baselineByFile = new Map();
  const newEdges = [];
  for (const edge of currentEdges) {
    if (!baselineByFile.has(edge.sourceRepoPath)) {
      const baselineText = readBaselineFile(edge.sourceRepoPath);
      const sourceAbsolute = path.join(projectRoot, edge.sourceRepoPath);
      const fingerprints = new Set(
        baselineText === null
          ? []
          : parseValueDependencies(baselineText, sourceAbsolute).map(
              (dependency) =>
                `${dependency.specifier}\0${logicalTarget(sourceAbsolute, dependency.specifier, baselineAliases)}`
            )
      );
      baselineByFile.set(edge.sourceRepoPath, fingerprints);
    }
    const fingerprint = `${edge.specifier}\0${logicalTarget(edge.source, edge.specifier, currentAliases)}`;
    if (!baselineByFile.get(edge.sourceRepoPath).has(fingerprint))
      newEdges.push(edge);
  }
  return newEdges;
}

function extractStringArrayConstant(text, constantName) {
  const source = ts.createSourceFile(
    'checker.cjs',
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.JS
  );
  for (const statement of source.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (
        !ts.isIdentifier(declaration.name) ||
        declaration.name.text !== constantName
      )
        continue;
      if (
        !declaration.initializer ||
        !ts.isArrayLiteralExpression(declaration.initializer)
      )
        return null;
      const values = [];
      for (const element of declaration.initializer.elements) {
        if (!ts.isStringLiteralLike(element)) return null;
        values.push(element.text);
      }
      return values;
    }
  }
  return null;
}

function diffAllowlistGrowth(current, baseline) {
  const baselineSet = new Set(baseline);
  return current.filter((entry) => !baselineSet.has(entry));
}

function git(args) {
  return childProcess
    .execFileSync('git', args, {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    .trim();
}

function resolveBaseRef(explicitBase) {
  if (explicitBase) return explicitBase;
  return git(['merge-base', 'HEAD', 'origin/main']);
}

function readGitFile(baseRef, repoPath) {
  try {
    return git(['show', `${baseRef}:${repoPath}`]);
  } catch {
    return null;
  }
}

module.exports = {
  ALLOWLIST,
  FORBIDDEN_NODE,
  collectForbiddenReachability,
  collectValueImportFiles,
  diffAgainstAllowlist,
  diffAllowlistGrowth,
  extractStringArrayConstant,
  findNewRelevantEdges,
  hasEstatValueImport,
  hasForbiddenProviderDependency,
  isProductionSource,
  parseTsconfigAliases,
  parseValueDependencies,
};

if (require.main === module) {
  const baseArgIndex = process.argv.indexOf('--base');
  const explicitBase =
    baseArgIndex >= 0 ? process.argv[baseArgIndex + 1] : null;
  if (baseArgIndex >= 0 && !explicitBase) {
    console.error('✗ --base requires a commit/ref');
    process.exit(2);
  }

  const found = collectValueImportFiles();
  const graph = collectForbiddenReachability();
  if (process.argv.includes('--list')) {
    console.log(found.join('\n'));
    process.exit(0);
  }
  if (process.argv.includes('--list-reachable')) {
    console.log(graph.reachableEntries.join('\n'));
    process.exit(0);
  }

  let baseRef;
  try {
    baseRef = resolveBaseRef(explicitBase);
  } catch (error) {
    console.error(
      `✗ comparison base unavailable (fail-closed): ${String(error)}`
    );
    process.exit(2);
  }
  const baselineChecker = readGitFile(
    baseRef,
    '.claude/scripts/lib/check-web-estat-imports.cjs'
  );
  const baselineAllowlist =
    baselineChecker && extractStringArrayConstant(baselineChecker, 'ALLOWLIST');
  if (!baselineAllowlist) {
    console.error(`✗ ${baseRef} から ALLOWLIST を読めない (fail-closed)`);
    process.exit(2);
  }
  const baselineTsconfig = readGitFile(baseRef, 'apps/web/tsconfig.json');
  if (baselineTsconfig === null) {
    console.error(
      `✗ ${baseRef} から apps/web/tsconfig.json を読めない (fail-closed)`
    );
    process.exit(2);
  }
  const baselineAliases = parseTsconfigAliases(baselineTsconfig, WEB_TSCONFIG);
  const newEdges = findNewRelevantEdges(
    graph.relevantEdges,
    (repoPath) => readGitFile(baseRef, repoPath),
    graph.aliases,
    baselineAliases,
    PROJECT_ROOT
  );
  const allowlistAdditions = diffAllowlistGrowth(ALLOWLIST, baselineAllowlist);
  const { newOnes, resolved } = diffAgainstAllowlist(found);

  if (resolved.length > 0) {
    console.log(
      `✓ direct static import migrated; remove ${resolved.length} ALLOWLIST entries:`
    );
    resolved.forEach((file) => console.log(`  - ${file}`));
  }
  if (allowlistAdditions.length > 0) {
    console.error(
      `✗ ALLOWLIST is shrink-only; ${allowlistAdditions.length} additions:`
    );
    allowlistAdditions.forEach((file) => console.error(`  + ${file}`));
  }
  if (newOnes.length > 0) {
    console.error(`✗ new direct static e-Stat imports (${newOnes.length}):`);
    newOnes.forEach((file) => console.error(`  + ${file}`));
  }
  if (newEdges.length > 0) {
    console.error(
      `✗ new production import-graph edges reaching e-Stat (${newEdges.length}):`
    );
    newEdges.forEach((edge) =>
      console.error(
        `  + ${edge.sourceRepoPath} --${edge.kind}:${edge.specifier}--> ${edge.logicalTarget}`
      )
    );
  }
  if (
    allowlistAdditions.length > 0 ||
    newOnes.length > 0 ||
    newEdges.length > 0
  ) {
    process.exit(1);
  }

  console.log(
    `✓ web→e-Stat boundary: direct static ${found.length}/${ALLOWLIST.length}, ` +
      `transitively reachable entries ${graph.reachableEntries.length}, new reachable edges 0 vs ${baseRef}`
  );
}
