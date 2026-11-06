import { describe, expect, it } from 'vitest';
import { reviewRowsOf, SAMPLED_TEMPLATES } from '@/lib/template-review-rows';
import ledger from '../../../../data/content-operations/image-templates.json';

const drawn = Object.fromEntries(SAMPLED_TEMPLATES.map((id) => [id, [{ label: '見本' }]]));
const row = (id: string, status: string) => ({ id, label: id, review: { status, summary: '要約' } });

describe('型の確認ページの行', () => {
  it('台帳の全ての型が、見本か方針未定のどちらかで画面に出る', () => {
    const rows = reviewRowsOf(ledger.templates, drawn);
    expect(rows.map((r) => r.id)).toEqual(ledger.templates.filter((t) => t.id !== 'unclassified').map((t) => t.id));
    expect(rows.filter((r) => r.samples.length === 0).map((r) => r.status)).toEqual(rows.filter((r) => r.status === 'undecided').map(() => 'undecided'));
  });
  it('題名と状態は台帳から取る', () => {
    expect(reviewRowsOf([{ ...row('bar', 'done'), label: '台帳の題名' }], { bar: [{ label: '見本' }] })[0]).toMatchObject({ title: '台帳の題名', status: 'done' });
  });
  it('台帳に無い見本を止める', () => {
    expect(() => reviewRowsOf([row('bar', 'done')], { bar: [{ label: '見本' }], tile: [{ label: '見本' }] })).toThrow('型の台帳に無い見本: tile');
  });
  it('決めた型に見本が無ければ止め、未定の型に見本があっても止める', () => {
    expect(() => reviewRowsOf([row('bar', 'done')], {})).toThrow('型の状態と見本が合わない: bar');
    expect(() => reviewRowsOf([row('radar', 'undecided')], { radar: [{ label: '見本' }] })).toThrow('型の状態と見本が合わない: radar');
  });
});
