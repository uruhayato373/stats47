import ts from 'typescript';

const SHARED_CONTROL = 'src/components/molecules/SingleSelectToggleGroup.tsx';

/** 単一選択の再実装と、共通部品の選択色・寸法の上書きを止める。 */
export function findSelectionControlViolations(source, fileName) {
  const file = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const violations = [];
  const imports = new Map();
  const initializers = new Map();
  const push = (node, ruleId, message) => {
    const lineNumber = file.getLineAndCharacterOfPosition(node.getStart(file)).line + 1;
    violations.push({ ruleId, lineNumber, line: source.split('\n')[lineNumber - 1].trim(), message });
  };
  function collect(node) {
    if (ts.isImportSpecifier(node)) imports.set(node.name.text, (node.propertyName ?? node.name).text);
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
      initializers.set(node.name.text, node.initializer);
    }
    ts.forEachChild(node, collect);
  }
  collect(file);
  function strings(node, seen = new Set()) {
    if (ts.isStringLiteralLike(node)) return [node.text];
    if (ts.isIdentifier(node) && initializers.has(node.text) && !seen.has(node.text)) {
      return strings(initializers.get(node.text), new Set([...seen, node.text]));
    }
    const result = [];
    ts.forEachChild(node, child => { result.push(...strings(child, seen)); });
    return result;
  }
  function visit(node) {
    if (ts.isImportDeclaration(node) && fileName !== SHARED_CONTROL) {
      const module = node.moduleSpecifier.text;
      const names = node.importClause?.namedBindings;
      if (/\/(?:toggle-group)$/.test(module) ||
          (module === '@stats47/components' && names && ts.isNamedImports(names) &&
            names.elements.some(item => /^ToggleGroup/.test((item.propertyName ?? item.name).text)))) {
        push(node, 'selection-use-shared-control', '単一選択は SingleSelectToggleGroup を使う。ToggleGroup を画面ごとに組み立てない。');
      }
    }
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const localName = node.tagName.getText(file).split('.').at(-1);
      const name = imports.get(localName) ?? localName;
      const attributes = new Map(node.attributes.properties.filter(ts.isJsxAttribute).map(attr => [attr.name.text, attr]));
      const pressed = attributes.get('aria-pressed')?.initializer;
      const variant = attributes.get('variant')?.initializer;
      if (['Button', 'button'].includes(name) && pressed &&
          ((variant && ts.isJsxExpression(variant) && variant.expression) || /={2,3}|!={1,2}/.test(pressed.getText(file)))) {
        push(node, 'selection-no-button-group', '選択状態で Button の variant を変える操作は SingleSelectToggleGroup にまとめる。');
      }
      if (name === 'SingleSelectToggleGroup') {
        const className = attributes.get('className')?.initializer;
        const customClasses = className ? strings(className).join(' ') : '';
        if (attributes.has('style') || /(?:^|\s)(?:[^\s:]+:)*!?(?:(?:h|min-h|max-h|size|p[xy]?|gap(?:-[xy])?|text|font|leading|border|rounded|shadow)-|bg-(?!background(?:\/|\b)|transparent\b))|(?:aria-pressed|data-pressed|data-\[state)[^\s]*:|\[&/.test(customClasses)) {
          push(node, 'selection-no-style-override', '切り替えの寸法・選択色は共通部品が持つ。className は配置だけに使う。');
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  return violations;
}
