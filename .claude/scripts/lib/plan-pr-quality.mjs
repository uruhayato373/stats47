import process from 'node:process';
import { pathToFileURL } from 'node:url';

const CODE_EXTENSION = /\.(?:cjs|cts|js|jsx|json|mjs|mts|ts|tsx|ya?ml)$/;
const ROOT_BUILD_FILES = new Set([
  'package.json',
  'package-lock.json',
  'turbo.json',
  'tsconfig.json',
  'vitest.config.ts',
]);

function matchesAny(path, patterns) {
  return patterns.some((pattern) => pattern.test(path));
}

/** PR差分を、独立jobを実行すべき範囲へ決定的に分類する。 */
export function classifyPrQualityPaths(inputPaths) {
  const paths = [...new Set(inputPaths.map((path) => path.trim()).filter(Boolean))];
  const ciCore = paths.some(
    (path) =>
      ROOT_BUILD_FILES.has(path) ||
      path === '.github/workflows/pr-quality-check.yml' ||
      path === '.claude/scripts/lib/plan-pr-quality.mjs'
  );
  const source = paths.some(
    (path) =>
      CODE_EXTENSION.test(path) &&
      !matchesAny(path, [/^docs\//, /^\.claude\/(?:state|todo)\//])
  );
  const packageSource = paths.some((path) => /^packages\/[^/]+\//.test(path));
  const webSource = paths.some((path) => /^apps\/web\//.test(path));
  const adminSource = paths.some((path) => /^apps\/admin\//.test(path));
  const remotionSource = paths.some((path) => /^apps\/remotion\//.test(path));
  const sharedAdmin = paths.some((path) =>
    /^packages\/(?:components|data-configs|types)\//.test(path)
  );
  const sharedRemotion = paths.some((path) =>
    /^packages\/(?:area|migration-flow|ranking|station-passengers|types|utils)\//.test(path)
  );
  const chartSource = paths.some((path) =>
    matchesAny(path, [
      /^packages\/visualization\//,
      /^apps\/web\/src\/components\/(?:charts|stat-charts)\//,
      /^\.claude\/rules\/chart-component-standards\.md$/,
    ])
  );
  // sync-snapshots / generate-ogp-images の bash step をシム付きで実行する重い契約 (69 test・実測 76 秒)。
  // 依存は workflow YAML とテスト自身だけなので、それらが変わった PR だけ走らせる。
  const workflowContracts = paths.some((path) =>
    matchesAny(path, [
      /^\.github\/workflows\/[^/]+\.ya?ml$/,
      /^\.claude\/scripts\/lib\/__tests__\/[^/]*scoped-workflow\.test\.mjs$/,
    ])
  );
  const remoteAssets = paths.some((path) =>
    matchesAny(path, [
      /^apps\/web\/scripts\/.*(?:image|ogp|thumbnail)/,
      /^apps\/web\/src\/features\/ogp\//,
      /^docs\/21_.*\/.*\/images\//,
      /^packages\/(?:r2-storage|svg-builder)\//,
    ])
  );

  return {
    type_check: ciCore || source,
    tests: ciCore || source,
    packages: ciCore || packageSource,
    web: ciCore || webSource || packageSource,
    admin: ciCore || adminSource || sharedAdmin,
    remotion: ciCore || remotionSource || sharedRemotion,
    visualization: ciCore || chartSource,
    remote_assets: ciCore || remoteAssets,
    workflow_contracts: ciCore || workflowContracts,
  };
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

async function main() {
  const raw = await readStdin();
  const separator = process.argv.includes('--stdin0') ? '\0' : /\r?\n/;
  const result = classifyPrQualityPaths(raw.split(separator));
  for (const [key, value] of Object.entries(result)) {
    process.stdout.write(`${key}=${value}\n`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void main();
}
