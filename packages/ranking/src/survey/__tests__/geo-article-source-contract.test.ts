import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

import ts from 'typescript';
import { test } from 'vitest';

import { resolveBlogChartSurveyTaxonomy } from '../survey-taxonomy';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');

interface SourceManifest {
  kind: string;
  surveyScope: string;
  surveyScopeReason: string;
  inputs?: { sha256: string }[];
  sourceSha256?: string;
}

// Execute the actual source-writing statements, without regenerating numerical data or SVGs.
// This catches metadata lost on regeneration; fixtures alone would only test the old output.
function generatedSources(relative: string, variableName: string) {
  const filename = path.join(root, relative);
  const source = ts.createSourceFile(filename, fs.readFileSync(filename, 'utf8'), ts.ScriptTarget.Latest, true);
  const statements = source.statements.filter((statement) => {
    if (ts.isVariableStatement(statement)) {
      return statement.declarationList.declarations.some((declaration) => declaration.name.getText(source) === variableName);
    }
    if (!ts.isExpressionStatement(statement) || !ts.isCallExpression(statement.expression)) return false;
    const call = statement.expression;
    return call.expression.getText(source) === 'sourceFor'
      || (call.expression.getText(source) === 'write' && ts.isStringLiteral(call.arguments[0])
        && call.arguments[0].text.endsWith('.source.json'));
  });
  const output = new Map<string, SourceManifest>();
  const inputs = [{ key: 'app/geo/test/item.json', sha256: 'a'.repeat(64), bytes: 100 }];
  const code = ts.transpileModule(statements.map((statement) => statement.getText(source)).join('\n'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, {
    write: (name: string, value: SourceManifest) => output.set(name, JSON.parse(JSON.stringify(value))),
    prefix: 'app/geo/population-flood-risk', sources: inputs, refs: inputs,
    item: { generatedAt: '2026-09-04T00:00:00.000Z' },
  });
  return output;
}

const flood = generatedSources('.claude/scripts/blog/generate-flood-exposure-article.ts', 'sourceFor');

test('flood producer preserves the exact three figure-specific GIS scope contracts', () => {
  assert.deepEqual([...flood.keys()].sort(), ['flood-lineage.source.json', 'flood-tile-grid.source.json', 'tokyo-mesh-evidence.source.json']);
  assert.equal(new Set([...flood.values()].map((value) => value.surveyScopeReason)).size, 3);
});

// Land/station article sources live in the ephemeral outbox and are checked against
// their exact published manifests during release; CI must survive outbox pruning.
for (const [name, manifest] of flood) {
  test(`${name}: explicit GIS scope resolves without weakening missing/short-reason rejection`, () => {
    assert.equal(manifest.kind, 'derived');
    assert.equal(manifest.surveyScope, 'not-applicable');
    assert.ok(manifest.surveyScopeReason.length >= 10);
    assert.ok(manifest.inputs?.[0].sha256 || manifest.sourceSha256);
    assert.equal(resolveBlogChartSurveyTaxonomy(manifest, {}).status, 'not-applicable');
    for (const reason of [undefined, '', 'GIS']) {
      assert.notEqual(resolveBlogChartSurveyTaxonomy({ ...manifest, surveyScopeReason: reason }, {}).status, 'not-applicable');
    }
  });
}
