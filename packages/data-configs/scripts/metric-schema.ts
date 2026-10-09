import { METRIC_SCHEMA } from '../../../config/paths.mjs';
import ts from 'typescript';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { REPO_ROOT } from './_lib';

type Schema = Record<string, unknown>;
export const METRIC_SCHEMA_PATH = resolve(REPO_ROOT, METRIC_SCHEMA);

/** Generate the external validation contract from the same types used to author metrics. */
export function generateTypeSchemas(
  relativeFile: string,
  names: string[]
): Record<string, Schema> {
  const file = resolve(REPO_ROOT, relativeFile);
  const configPath = resolve(REPO_ROOT, 'tsconfig.base.json');
  const parsed = ts.parseJsonConfigFileContent(
    ts.readConfigFile(configPath, ts.sys.readFile).config,
    ts.sys,
    REPO_ROOT
  );
  const program = ts.createProgram([file], parsed.options);
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(file);
  if (!source) throw new Error('Metric type source missing');
  const active = new Set<ts.Type>();
  function convert(type: ts.Type): Schema {
    if (type.flags & ts.TypeFlags.StringLiteral)
      return { type: 'string', const: (type as ts.StringLiteralType).value };
    if (type.flags & ts.TypeFlags.NumberLiteral)
      return { type: 'number', const: (type as ts.NumberLiteralType).value };
    if (type.flags & ts.TypeFlags.BooleanLiteral)
      return { type: 'boolean', const: checker.typeToString(type) === 'true' };
    if (type.isUnion()) {
      const members = type.types.filter(
        (t) => !(t.flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Never))
      );
      if (members.length === 1) return convert(members[0]);
      const schemas = members.map(convert);
      if (schemas.every((s) => 'const' in s))
        return { enum: schemas.map((s) => s.const) };
      return { anyOf: schemas };
    }
    if (type.flags & ts.TypeFlags.String) return { type: 'string' };
    if (type.flags & ts.TypeFlags.Number) return { type: 'number' };
    if (type.flags & ts.TypeFlags.Boolean) return { type: 'boolean' };
    if (type.flags & ts.TypeFlags.Null) return { type: 'null' };
    if (type.flags & ts.TypeFlags.Unknown) return {}; // Deliberately opaque fetcher-specific JSON payloads.
    if (type.flags & ts.TypeFlags.Any)
      throw new Error(
        'any is forbidden in the metric schema: ' + checker.typeToString(type)
      );
    if (
      checker.isArrayType(type) ||
      type.getSymbol()?.name === 'ReadonlyArray'
    ) {
      return {
        type: 'array',
        items: convert(checker.getTypeArguments(type as ts.TypeReference)[0]),
      };
    }
    if (checker.isTupleType(type)) {
      const members = checker.getTypeArguments(type as ts.TypeReference);
      return {
        type: 'array',
        items: members.map(convert),
        minItems: members.length,
        maxItems: members.length,
      };
    }
    if (!(type.flags & ts.TypeFlags.Object) || active.has(type))
      throw new Error('Unsupported metric type: ' + checker.typeToString(type));
    active.add(type);
    const properties: Record<string, Schema> = {};
    const required: string[] = [];
    for (const symbol of checker.getPropertiesOfType(type)) {
      const declaration = symbol.valueDeclaration ?? symbol.declarations?.[0];
      if (!declaration)
        throw new Error('Property declaration missing: ' + symbol.name);
      properties[symbol.name] = convert(
        checker.getTypeOfSymbolAtLocation(symbol, declaration)
      );
      if (!(symbol.flags & ts.SymbolFlags.Optional)) required.push(symbol.name);
    }
    const indexType = checker.getIndexTypeOfType(type, ts.IndexKind.String);
    active.delete(type);
    return {
      type: 'object',
      properties,
      ...(required.length ? { required } : {}),
      additionalProperties: indexType ? convert(indexType) : false,
    };
  }
  return Object.fromEntries(
    names.map((name) => {
      const declaration = source.statements.find(
        (node) =>
          (ts.isInterfaceDeclaration(node) ||
            ts.isTypeAliasDeclaration(node)) &&
          node.name.text === name
      );
      if (!declaration) throw new Error('Type declaration missing: ' + name);
      return [name, convert(checker.getTypeAtLocation(declaration))];
    })
  );
}

export function generateMetricSchema(): Schema {
  const schema = generateTypeSchemas('packages/data-configs/src/types.ts', [
    'MetricConfig',
  ]).MetricConfig;
  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    $id: 'https://stats47.jp/schemas/metric.schema.json',
    title: 'MetricConfig (generated from TypeScript; do not edit)',
    ...schema,
  };
}

export function checkMetricSchema(check: boolean) {
  const schemas = [
    { path: METRIC_SCHEMA_PATH, schema: generateMetricSchema() },
    {
      path: resolve(dirname(METRIC_SCHEMA_PATH), 'linkage.schema.json'),
      schema: {
        $schema: 'http://json-schema.org/draft-07/schema#',
        title: 'MetricLinkageIndex (generated from TypeScript)',
        ...generateTypeSchemas('packages/data-configs/src/metric-linkage.ts', [
          'MetricLinkageIndex',
        ]).MetricLinkageIndex,
      },
    },
  ];
  for (const { path, schema } of schemas) {
    const content = JSON.stringify(schema, null, 2) + '\n';
    if (check) {
      if (readFileSync(path, 'utf8') !== content)
        throw new Error('Stale metric schema. Run metrics:generate-schema.');
    } else if (
      !ts.sys.fileExists(path) ||
      readFileSync(path, 'utf8') !== content
    )
      writeFileSync(path, content);
  }
}
