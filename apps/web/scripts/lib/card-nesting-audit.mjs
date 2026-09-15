import ts from 'typescript';

/** 見た目上の外枠を持つ共有 surface。これらの相互ネストを禁止する。 */
export const CARD_SURFACE_COMPONENTS = new Set([
  'ArticleCard',
  'Card',
  'ChartCard',
  'ChartPanel',
  'RailCard',
  'SurfaceCard',
  'SurfaceLinkCard',
  'SurfaceSection',
]);

function getJsxTagName(tagName) {
  if (ts.isIdentifier(tagName)) return tagName.text;
  if (ts.isPropertyAccessExpression(tagName)) return tagName.name.text;
  return tagName.getText();
}

function isCardSurface(name) {
  return CARD_SURFACE_COMPONENTS.has(name) || /^[A-Z][A-Za-z0-9]*Card$/.test(name);
}

function usesSurfaceClass(attributes) {
  return attributes.properties.some((property) => {
    if (!ts.isJsxAttribute(property) || property.name.text !== 'className') return false;
    const expression = property.initializer?.expression;
    if (!expression) return false;
    let found = false;
    function visit(node) {
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === 'getSurfaceCardClassName'
      ) {
        found = true;
        return;
      }
      ts.forEachChild(node, visit);
    }
    visit(expression);
    return found;
  });
}

function literalClassText(attributes) {
  const attribute = attributes.properties.find(
    (property) => ts.isJsxAttribute(property) && property.name.text === 'className'
  );
  if (!attribute || !ts.isJsxAttribute(attribute) || !attribute.initializer) return '';
  if (ts.isStringLiteral(attribute.initializer)) return attribute.initializer.text;
  const expression = attribute.initializer.expression;
  if (!expression) return '';
  const fragments = [];
  function visit(node) {
    if (ts.isStringLiteralLike(node)) fragments.push(node.text);
    ts.forEachChild(node, visit);
  }
  visit(expression);
  return fragments.join(' ');
}

function usesLiteralCardShell(name, attributes) {
  // a / Link の border + background はボタン表現にも使うため、card shell とは判定しない。
  if (!['article', 'div', 'li', 'section'].includes(name)) return false;
  const classes = literalClassText(attributes);
  return (
    /(?:^|\s)border(?:\s|$)/.test(classes) &&
    /(?:^|\s)bg-(?:card|console-card)(?:[\s/]|$)/.test(classes) &&
    /(?:^|\s)(?:p[trblxy]?-[^\s]+|overflow-hidden)(?:\s|$)/.test(classes)
  );
}

function surfaceName(name, attributes) {
  if (isCardSurface(name)) return name;
  if (usesSurfaceClass(attributes)) return `${name}[getSurfaceCardClassName]`;
  return usesLiteralCardShell(name, attributes) ? `${name}[card-classes]` : null;
}

function lineNumber(sourceFile, node) {
  return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
}

/**
 * TSX の実際の親子関係を解析し、共有 surface の内側に別の surface がある箇所を返す。
 * div/grid 等を挟むケースも検出する。文字列・コメント・別関数の JSX は誤検出しない。
 */
export function findNestedCardSurfaces(sourceText, fileName = 'source.tsx') {
  const sourceFile = ts.createSourceFile(
    fileName,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );
  const violations = [];

  function visit(node, surfaceAncestors) {
    let nextAncestors = surfaceAncestors;

    if (ts.isJsxElement(node)) {
      const name = getJsxTagName(node.openingElement.tagName);
      const surface = surfaceName(name, node.openingElement.attributes);
      if (surface) {
        const parent = surfaceAncestors.at(-1);
        if (parent) {
          violations.push({
            parent: parent.name,
            child: surface,
            lineNumber: lineNumber(sourceFile, node.openingElement),
          });
        }
        nextAncestors = [...surfaceAncestors, { name: surface }];
      }
    } else if (ts.isJsxSelfClosingElement(node)) {
      const name = getJsxTagName(node.tagName);
      const surface = surfaceName(name, node.attributes);
      if (surface) {
        const parent = surfaceAncestors.at(-1);
        if (parent) {
          violations.push({
            parent: parent.name,
            child: surface,
            lineNumber: lineNumber(sourceFile, node),
          });
        }
      }
    }

    ts.forEachChild(node, (child) => visit(child, nextAncestors));
  }

  visit(sourceFile, []);
  return violations;
}
