const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '../../../..');
const IMAGE_SIZE_DISABLED_CODE = 'IMAGE_SIZE_PARSER_DISABLED';

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
}

test('the replacement image-size parser always fails before parsing input', () => {
  const imageSize = require(
    path.join(
      ROOT,
      'packages/product-factory/src/shims/image-size-disabled/index.cjs'
    )
  );

  assert.throws(
    () => imageSize(Buffer.from('icns\0\0\0\0', 'binary')),
    (error) => error instanceof Error && error.code === IMAGE_SIZE_DISABLED_CODE
  );
  assert.throws(
    () => imageSize.imageSize(Buffer.from('jxl \0\0\0\0', 'binary')),
    (error) => error instanceof Error && error.code === IMAGE_SIZE_DISABLED_CODE
  );
});

test('pptx generation has no route to image-size', () => {
  const productFactorySource = fs.readFileSync(
    path.join(ROOT, 'packages/product-factory/src/generators/pptx.ts'),
    'utf8'
  );
  const pptxDistDirectory = path.join(ROOT, 'node_modules/pptxgenjs/dist');
  const pptxDistSources = fs
    .readdirSync(pptxDistDirectory)
    .filter((fileName) => fileName.endsWith('.js'))
    .map((fileName) =>
      fs.readFileSync(path.join(pptxDistDirectory, fileName), 'utf8')
    )
    .join('\n');

  assert.doesNotMatch(productFactorySource, /\.addImage\s*\(/);
  assert.doesNotMatch(productFactorySource, /["']image-size["']/);
  assert.doesNotMatch(
    pptxDistSources,
    /(?:require\s*\(\s*|from\s+)["']image-size["']/
  );
});

test('the lockfile routes image-size to the audited fail-closed package', () => {
  const rootPackage = readJson('package.json');
  const lockfile = readJson('package-lock.json');

  assert.equal(
    rootPackage.dependencies['image-size'],
    'file:packages/product-factory/src/shims/image-size-disabled'
  );
  assert.equal(rootPackage.overrides['image-size'], '$image-size');
  assert.equal(lockfile.packages['node_modules/image-size'].link, true);
  assert.equal(
    lockfile.packages['packages/product-factory/src/shims/image-size-disabled']
      .version,
    '2.0.3'
  );
});

test('every resolved esbuild version is outside the vulnerable range', () => {
  const lockfile = readJson('package-lock.json');
  const esbuildVersions = Object.entries(lockfile.packages)
    .filter(([dependencyPath]) =>
      dependencyPath.endsWith('node_modules/esbuild')
    )
    .map(([, dependency]) => dependency.version);

  assert.ok(esbuildVersions.length > 0);
  assert.ok(
    esbuildVersions.every((version) => {
      const [major, minor, patch] = version.split('.').map(Number);
      return major > 0 || minor > 24 || (minor === 24 && patch > 2);
    })
  );
});

test('the lockfile includes every native binding used by Linux CI', () => {
  const lockfile = readJson('package-lock.json');
  const linuxBindings = [
    '@ast-grep/napi-linux-x64-gnu',
    '@img/sharp-libvips-linux-x64',
    '@img/sharp-linux-x64',
    '@oxc-resolver/binding-linux-x64-gnu',
    '@remotion/compositor-linux-x64-gnu',
    '@rolldown/binding-linux-x64-gnu',
    '@rspack/binding-linux-x64-gnu',
    '@unrs/resolver-binding-linux-x64-gnu',
    'lightningcss-linux-x64-gnu',
  ];

  for (const dependencyName of linuxBindings) {
    const linuxBinding =
      lockfile.packages[`node_modules/${dependencyName}`];
    assert.ok(linuxBinding, `${dependencyName} is absent from package-lock.json`);
    assert.deepEqual(linuxBinding.cpu, ['x64']);
    assert.deepEqual(linuxBinding.os, ['linux']);
    assert.equal(linuxBinding.optional, true);
  }
});

test('CI rejects high-risk development findings and every runtime finding', () => {
  const workflow = fs.readFileSync(
    path.join(ROOT, '.github/workflows/security-scan.yml'),
    'utf8'
  );

  assert.match(workflow, /npm audit --audit-level=high/);
  assert.match(workflow, /npm audit --omit=dev --audit-level=low/);
  assert.doesNotMatch(
    workflow,
    /npm audit[^\n]*\n\s*continue-on-error:\s*true/
  );
});
