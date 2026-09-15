import ts from 'typescript';

const UNIT_AWARE_CHARTS = new Set([
  'BarChart',
  'D3BarChartRace',
  'D3LineChart',
  'D3StackedAreaChart',
  'PyramidChart',
  'SunburstChart',
  'TreemapChart',
]);

function tagName(node) {
  if (ts.isIdentifier(node)) return node.text;
  if (ts.isPropertyAccessExpression(node)) return node.name.text;
  return node.getText();
}

function lineNumber(sourceFile, node) {
  return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
}

function hasUnitContract(attributes) {
  return attributes.properties.some(
    (property) =>
      ts.isJsxSpreadAttribute(property) ||
      (ts.isJsxAttribute(property) && property.name.text === 'unit')
  );
}

function hasAttribute(attributes, names) {
  return attributes.properties.some(
    (property) =>
      ts.isJsxSpreadAttribute(property) ||
      (ts.isJsxAttribute(property) && names.has(property.name.text))
  );
}

/**
 * 統計チャートの表示契約を静的に検査する。
 * 軸は短い表記、完全値と単位は共通ツールチップへ置く。
 */
export function findChartContractViolations(sourceText, fileName = 'source.tsx') {
  const sourceFile = ts.createSourceFile(
    fileName,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );
  const violations = [];

  function visit(node) {
    if (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) {
      const name = tagName(node.tagName);
      if (UNIT_AWARE_CHARTS.has(name) && !hasUnitContract(node.attributes)) {
        violations.push({
          ruleId: 'chart-unit-must-reach-primitive',
          lineNumber: lineNumber(sourceFile, node),
          detail: `${name} に unit を渡してください`,
        });
      }
      if (
        name === 'svg' &&
        (!hasAttribute(node.attributes, new Set(['role', 'aria-hidden'])) ||
          !hasAttribute(
            node.attributes,
            new Set(['aria-label', 'aria-labelledby', 'aria-hidden'])
          ))
      ) {
        violations.push({
          ruleId: 'chart-svg-needs-accessible-name',
          lineNumber: lineNumber(sourceFile, node),
          detail: 'チャート SVG に role="img" と内容を説明する aria-label を付けてください',
        });
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);

  const lineRules = [
    {
      ruleId: 'chart-tooltip-must-use-shared-hook',
      pattern: /document\.createElement\(["']div["']\)|\.innerHTML\s*=/,
      detail: 'チャート内でツールチップ DOM を自作せず useD3Tooltip を使ってください',
    },
    {
      ruleId: 'chart-axis-must-use-compact-format',
      pattern: /tickFormat\([^\n]*toLocaleString|valueFormat=\{[^\n]*toLocaleString/,
      detail: '軸の完全桁表示ははみ出すため compactAxisFormat を使ってください',
    },
  ];
  sourceText.split(/\r?\n/).forEach((line, index) => {
    for (const rule of lineRules) {
      if (!rule.pattern.test(line)) continue;
      violations.push({
        ruleId: rule.ruleId,
        lineNumber: index + 1,
        detail: rule.detail,
      });
    }
  });

  return violations;
}
