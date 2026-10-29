import { readFileSync } from 'node:fs';
import path from 'node:path';

import * as components from '@stats47/components';
import { describe, expect, it } from 'vitest';

import * as surface from '@/components/surface';

/**
 * 部品の台帳 (data/design/components.json) と実装の一致 (2026-10-29 新設)。
 *
 * 台帳は部品の種類ごとの正本で、枠 (slots) は props の写しになる。写しは手で直すと必ずずれるので、
 * 次の食い違いをここで止める:
 *  (a) 台帳が指す export が @stats47/components に無い
 *  (b) 枠と props の型 (propsType の interface) の名前・必須/任意が違う (見た目の上書き用の props は除く)
 *  (c) 見本の採用元 (references.json の adoptions[].part)・代わりに使う部品・検査の規則名が実在しない
 */

const ROOT = path.resolve(__dirname, '../../../../../..');
const readJson = <T>(rel: string): T => JSON.parse(readFileSync(path.join(ROOT, rel), 'utf8')) as T;

interface Slot { prop: string; required: boolean }
interface LedgerComponent {
  id: string;
  name: string;
  implementation: { package: string; export: string; source: string; propsType?: string };
  slots: Slot[];
  reference?: { referenceId: string; adoptionPart: string };
  avoidWhen: { use: string }[];
  checks: string[];
}
interface Reference { id: string; adoptions: { part: string }[] }

const ledger = readJson<{ components: LedgerComponent[] }>('data/design/components.json').components;
const references = readJson<{ references: Reference[] }>('data/design-references/references.json').references;
const designRules = readFileSync(path.join(ROOT, 'apps/web/scripts/check-design-system.mjs'), 'utf8');

/** 見た目の上書き・識別のための props。部品の枠 (何を入れるか) ではないので台帳に書かない */
const NON_SLOT_PROPS = new Set(['className', 'contentClassName', 'id']);

/** source の `interface <name> { ... }` から props の名前と必須かを読む (1 段の入れ子まで) */
function readProps(source: string, typeName: string): Slot[] {
  const start = source.search(new RegExp(`interface ${typeName}\\b[^{]*\\{`));
  expect(start, `${typeName} が見つからない`).toBeGreaterThanOrEqual(0);
  const body = source.slice(source.indexOf('{', start) + 1);
  const props: Slot[] = [];
  let depth = 0;
  for (const line of body.split('\n')) {
    if (depth === 0 && /^\s*\}/.test(line)) break;
    const match = depth === 0 ? line.match(/^\s*([a-zA-Z][A-Za-z0-9]*)(\?)?:/) : null;
    if (match) props.push({ prop: match[1], required: !match[2] });
    depth += (line.match(/\{/g) ?? []).length - (line.match(/\}/g) ?? []).length;
  }
  return props;
}

describe('部品の台帳 (data/design/components.json)', () => {
  it('id と名前が重複しない', () => {
    expect(new Set(ledger.map((c) => c.id)).size).toBe(ledger.length);
    expect(new Set(ledger.map((c) => c.name)).size).toBe(ledger.length);
  });

  /** 台帳の package ごとの実体 (パッケージ共有の部品と、公開サイト共有の部品) */
  const MODULES: Record<string, Record<string, unknown>> = {
    '@stats47/components': components,
    '@/components/surface': surface,
  };

  it.each(ledger.map((c) => [c.id, c] as const))('%s: 台帳の export が実在する', (_id, component) => {
    const mod = MODULES[component.implementation.package];
    expect(mod, `未知の package ${component.implementation.package}`).toBeDefined();
    expect(typeof mod[component.implementation.export]).toBe('function');
  });

  it.each(ledger.filter((c) => c.implementation.propsType).map((c) => [c.id, c] as const))(
    '%s: 枠と props の名前・必須が一致する',
    (_id, component) => {
      const source = readFileSync(path.join(ROOT, component.implementation.source), 'utf8');
      const props = readProps(source, component.implementation.propsType!)
        .filter((p) => !NON_SLOT_PROPS.has(p.prop))
        .sort((a, b) => a.prop.localeCompare(b.prop));
      const slots = component.slots
        .map(({ prop, required }) => ({ prop, required }))
        .sort((a, b) => a.prop.localeCompare(b.prop));
      expect(slots).toEqual(props);
    }
  );

  it.each(ledger.map((c) => [c.id, c] as const))('%s: 参照 (見本の採用元・代わりの部品・検査) が実在する', (_id, component) => {
    if (component.reference) {
      const reference = references.find((r) => r.id === component.reference!.referenceId);
      expect(reference, `references.json に ${component.reference.referenceId} が無い`).toBeDefined();
      expect(reference!.adoptions.map((a) => a.part)).toContain(component.reference.adoptionPart);
    }
    const ids = new Set(ledger.map((c) => c.id));
    for (const { use } of component.avoidWhen) expect(ids, `代わりの部品 ${use} が台帳に無い`).toContain(use);
    for (const rule of component.checks) expect(designRules, `検査の規則 ${rule} が無い`).toContain(`'${rule}'`);
  });

  it('[mutation] props に無い枠を台帳に書くと食い違いとして見つかる', () => {
    const source = 'interface P {\n  label: string;\n  footer?: string;\n}';
    expect(readProps(source, 'P')).toEqual([
      { prop: 'label', required: true },
      { prop: 'footer', required: false },
    ]);
    expect([{ prop: 'label', required: true }, { prop: 'chart', required: false }]).not.toEqual(readProps(source, 'P'));
  });
});
