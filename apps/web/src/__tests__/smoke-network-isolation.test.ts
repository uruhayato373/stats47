import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { AD_REQUESTS, ANALYTICS_REQUESTS } from '../../tests/smoke/network-policy';

describe('production smoke network isolation', () => {
  it.each([
    'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',
    'https://googleads.g.doubleclick.net/pagead/ads',
    'https://www.googleadservices.com/pagead/conversion',
  ])('blocks ad traffic: %s', url => {
    expect(AD_REQUESTS.test(url)).toBe(true);
    expect(ANALYTICS_REQUESTS.test(url)).toBe(false);
  });

  it.each([
    'https://www.googletagmanager.com/gtag/js?id=test',
    'https://region1.google-analytics.com/g/collect',
    'https://google-analytics.com/g/collect',
  ])('blocks measurement even when ads are enabled: %s', url => {
    expect(ANALYTICS_REQUESTS.test(url)).toBe(true);
    expect(AD_REQUESTS.test(url)).toBe(false);
  });

  it.each([
    'https://stats47.jp/products/data-p-01',
    'https://r2.stats47.jp/app/products/data-p-01/showcase/population.png',
    'http://127.0.0.1:3000/api/data',
    'https://stats47.jp/api/google-analytics.com/collect',
    'https://notgooglesyndication.com/example',
    'https://googlesyndication.com.example.org/example',
  ])('preserves application traffic and unrelated hosts: %s', url => {
    expect(AD_REQUESTS.test(url)).toBe(false);
    expect(ANALYTICS_REQUESTS.test(url)).toBe(false);
  });

  const smokeDir = resolve(__dirname, '../../tests/smoke');
  it.each(readdirSync(smokeDir).filter(name => name.endsWith('.spec.ts')))(
    '%s uses the shared fixture; only ad injection monitoring permits ads', name => {
      const source = ts.createSourceFile(name, readFileSync(resolve(smokeDir, name), 'utf8'), ts.ScriptTarget.Latest, true);
      const testImports = source.statements.filter(ts.isImportDeclaration).filter(node =>
        node.importClause?.namedBindings && ts.isNamedImports(node.importClause.namedBindings)
          && node.importClause.namedBindings.elements.some(item => (item.propertyName ?? item.name).text === 'test'),
      );
      expect(testImports.map(node => (node.moduleSpecifier as ts.StringLiteral).text)).toEqual(['./fixtures']);
      const adOptions: string[] = [];
      function visit(node: ts.Node) {
        if (ts.isPropertyAssignment(node) && node.name.getText(source) === 'allowAds') adOptions.push(node.initializer.getText(source));
        ts.forEachChild(node, visit);
      }
      visit(source);
      expect(adOptions).toEqual(name === 'third-party-dom-injection.spec.ts' ? ['true'] : []);
    },
  );
});
