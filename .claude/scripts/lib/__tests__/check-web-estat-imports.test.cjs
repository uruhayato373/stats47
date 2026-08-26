const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { describe, it } = require('node:test');

const {
  ALLOWLIST,
  collectForbiddenReachability,
  collectValueImportFiles,
  diffAgainstAllowlist,
  diffAllowlistGrowth,
  findNewRelevantEdges,
  hasEstatValueImport,
  hasForbiddenProviderDependency,
  parseValueDependencies,
} = require('../check-web-estat-imports.cjs');

function createFixture(files, paths = { '@/*': ['./src/*'] }) {
  const root = fs.mkdtempSync(
    path.join(os.tmpdir(), 'stats47-web-estat-import-')
  );
  const webRoot = path.join(root, 'apps/web');
  const webSrc = path.join(webRoot, 'src');
  fs.mkdirSync(webSrc, { recursive: true });
  fs.writeFileSync(
    path.join(webRoot, 'tsconfig.json'),
    `${JSON.stringify({ compilerOptions: { baseUrl: '.', paths } }, null, 2)}\n`
  );
  for (const [relative, content] of Object.entries(files)) {
    const target = path.join(webSrc, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
  }
  return {
    root,
    graph: () => collectForbiddenReachability({ projectRoot: root }),
    remove: () => fs.rmSync(root, { recursive: true, force: true }),
  };
}

function assertReachable(files, expectedEntries, paths) {
  const fixture = createFixture(files, paths);
  try {
    const graph = fixture.graph();
    assert.deepEqual(graph.reachableEntries, expectedEntries);
    assert.ok(
      graph.relevantEdges.length > 0,
      'forbidden path must contain a runtime edge'
    );
    return graph;
  } finally {
    fixture.remove();
  }
}

describe('TypeScript AST runtime-edge classification', () => {
  it('detects a static value import', () => {
    const text = `import { fetchFormattedStats } from "@stats47/estat-api/server";`;
    assert.equal(hasEstatValueImport(text), true);
    assert.equal(hasForbiddenProviderDependency(text), true);
  });

  it('detects a multiline mixed type/value import', () => {
    const text = `import {\n type GetStatsDataParams,\n fetchFormattedStats,\n} from "@stats47/estat-api/server";`;
    assert.equal(hasEstatValueImport(text), true);
  });

  it('detects dynamic import, re-export, and require', () => {
    assert.deepEqual(
      parseValueDependencies(
        `const api = await import("@stats47/estat-api/server");\n` +
          `export { fetchFormattedStats } from "@stats47/estat-api/server";\n` +
          `const legacy = require("@stats47/estat-api/server");`
      ).map((edge) => edge.kind),
      ['dynamic-import', 're-export', 'require']
    );
  });

  it('allows import type, type-only named imports/exports, and inline import types', () => {
    const text = [
      `import type { GetStatsDataParams } from "@stats47/estat-api/server";`,
      `import { type EstatStatsDataResponse } from "@stats47/estat-api";`,
      `export type { GetStatsDataParams } from "@stats47/estat-api/server";`,
      `export { type EstatStatsDataResponse } from "@stats47/estat-api";`,
      `type Params = import("@stats47/estat-api/server").GetStatsDataParams;`,
    ].join('\n');
    assert.deepEqual(parseValueDependencies(text), []);
    assert.equal(hasForbiddenProviderDependency(text), false);
  });

  it('does not match comments or ordinary string literals', () => {
    const text = `// import("@stats47/estat-api/server")\nconst docs = "require('@stats47/estat-api')";`;
    assert.deepEqual(parseValueDependencies(text), []);
  });
});

describe('production web -> e-Stat transitive reachability fixtures', () => {
  it('static import is red', () => {
    assertReachable(
      {
        'page.ts': `import { fetchFormattedStats } from "@stats47/estat-api/server";`,
      },
      ['page.ts']
    );
  });

  it('dynamic import is red', () => {
    assertReachable(
      {
        'page.ts': `export async function load() { return import("@stats47/estat-api/server"); }`,
      },
      ['page.ts']
    );
  });

  it('re-export is red', () => {
    assertReachable(
      {
        'page.ts': `export { fetchFormattedStats } from "@stats47/estat-api/server";`,
      },
      ['page.ts']
    );
  });

  it('require is red', () => {
    assertReachable(
      {
        'page.ts': `const api = require("@stats47/estat-api/server"); export { api };`,
      },
      ['page.ts']
    );
  });

  it('local wrapper is red for both caller and boundary', () => {
    assertReachable(
      {
        'page.ts': `import { load } from "./wrapper"; export { load };`,
        'wrapper.ts': `export { fetchFormattedStats as load } from "@stats47/estat-api/server";`,
      },
      ['page.ts', 'wrapper.ts']
    );
  });

  it('tsconfig alias to a local wrapper is red', () => {
    assertReachable(
      {
        'page.ts': `import { load } from "@local/wrapper"; export { load };`,
        'wrapper.ts': `export { fetchFormattedStats as load } from "@stats47/estat-api/server";`,
      },
      ['page.ts', 'wrapper.ts'],
      { '@local/*': ['./src/*'] }
    );
  });

  it('cyclic local wrappers cannot hide a provider path', () => {
    assertReachable(
      {
        'a.ts': `export * from "./b";`,
        'b.ts': `export * from "./a"; export * from "./provider";`,
        'provider.ts': `export { fetchFormattedStats } from "@stats47/estat-api/server";`,
      },
      ['a.ts', 'b.ts', 'provider.ts']
    );
  });

  it('type-only dependency is green', () => {
    const fixture = createFixture({
      'page.ts': `import type { GetStatsDataParams } from "@stats47/estat-api/server";`,
    });
    try {
      const graph = fixture.graph();
      assert.deepEqual(graph.reachableEntries, []);
      assert.deepEqual(graph.relevantEdges, []);
    } finally {
      fixture.remove();
    }
  });

  it('test/spec/story files are outside production roots', () => {
    const fixture = createFixture({
      'page.test.ts': `import { fetchFormattedStats } from "@stats47/estat-api/server";`,
      'component.stories.tsx': `export { fetchFormattedStats } from "@stats47/estat-api/server";`,
    });
    try {
      assert.deepEqual(fixture.graph().reachableEntries, []);
    } finally {
      fixture.remove();
    }
  });
});

describe('shrink-only ratchets', () => {
  it('legacy direct static allowlist still rejects a new file', () => {
    const { newOnes } = diffAgainstAllowlist([
      ...ALLOWLIST,
      'features/new/leak.ts',
    ]);
    assert.deepEqual(newOnes, ['features/new/leak.ts']);
  });

  it('ALLOWLIST additions are rejected while removals are allowed', () => {
    assert.deepEqual(diffAllowlistGrowth(['a.ts'], ['a.ts', 'b.ts']), []);
    assert.deepEqual(diffAllowlistGrowth(['a.ts', 'new.ts'], ['a.ts']), [
      'new.ts',
    ]);
  });

  it('a newly reachable edge is red and an existing edge is green', () => {
    const fixture = createFixture({
      'page.ts': `import { load } from "./wrapper"; export { load };`,
      'wrapper.ts': `export { fetchFormattedStats as load } from "@stats47/estat-api/server";`,
    });
    try {
      const graph = fixture.graph();
      const source = (repoPath) => {
        if (repoPath.endsWith('page.ts'))
          return `import { load } from "./wrapper"; export { load };`;
        if (repoPath.endsWith('wrapper.ts')) {
          return `export { fetchFormattedStats as load } from "@stats47/estat-api/server";`;
        }
        return null;
      };
      const existing = findNewRelevantEdges(
        graph.relevantEdges,
        source,
        graph.aliases,
        graph.aliases,
        fixture.root
      );
      assert.deepEqual(existing, []);
      const newlyIntroduced = findNewRelevantEdges(
        graph.relevantEdges,
        () => 'export {};',
        graph.aliases,
        graph.aliases,
        fixture.root
      );
      assert.equal(newlyIntroduced.length, graph.relevantEdges.length);
    } finally {
      fixture.remove();
    }
  });
});

describe('real repository baseline', () => {
  it('legacy static imports remain exactly inside the original allowlist', () => {
    const found = collectValueImportFiles();
    const { newOnes, resolved } = diffAgainstAllowlist(found);
    assert.deepEqual(newOnes, [], `new direct imports: ${newOnes.join(', ')}`);
    assert.deepEqual(
      resolved,
      [],
      `remove migrated entries: ${resolved.join(', ')}`
    );
  });
});
