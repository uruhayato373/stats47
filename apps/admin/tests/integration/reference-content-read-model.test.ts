import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { REFERENCE_PRODUCTION_CHANNELS } from '@/lib/content-operations/reference';
import { loadContentOperations } from '@/lib/content-operations/load';

describe('reference content read model', () => {
  it('全inventoryを制作単位12チャネルとcontext補強へ欠落なく正規化する', () => {
    const root = path.resolve(process.cwd(), '../..');
    const result = loadContentOperations(root, '2026-08-30T00:00:00.000Z');
    const portfolio = result.references;

    expect(
      portfolio.summary.productionEvidence +
        portfolio.summary.contextEvidence +
        portfolio.summary.blockedEvidence +
        portfolio.summary.notApplicable
    ).toBe(portfolio.summary.sourceItems);
    expect(
      portfolio.contextGroups.reduce(
        (sum, group) => sum + group.evidenceCount,
        0
      )
    ).toBe(portfolio.summary.contextEvidence);
    expect(portfolio.units.every((unit) => unit.channels.length === 12)).toBe(
      true
    );
    expect(
      portfolio.units.every(
        (unit) =>
          new Set(unit.channels.map((channel) => channel.channel)).size ===
          REFERENCE_PRODUCTION_CHANNELS.length
      )
    ).toBe(true);
    expect(Object.keys(portfolio.summary.byChannel).sort()).toEqual(
      [...REFERENCE_PRODUCTION_CHANNELS].sort()
    );
    expect(portfolio.summary.byChannel.theme.ready).toBe(0);
    expect(
      portfolio.units.every((unit) =>
        unit.channels
          .filter((channel) => channel.stage !== 'not-applicable')
          .every((channel) => channel.detail.length > 0)
      )
    ).toBe(true);
    expect(
      portfolio.audit.findings.filter((finding) => finding.severity === 'error')
    ).toEqual([]);

    const student = portfolio.units.find(
      (unit) => unit.id === 'metric:students-requiring-japanese-instruction'
    );
    expect(student).toMatchObject({
      label: '日本語指導が必要な児童生徒数',
      surveyIds: ['japanese-language-instruction-survey'],
    });
    expect(
      student?.channels
        .filter((channel) =>
          ['blog', 'note', 'youtube', 'instagram', 'x'].includes(
            channel.channel
          )
        )
        .map((channel) => [channel.channel, channel.stage])
    ).toEqual([
      ['blog', 'draft'],
      ['note', 'draft'],
      ['youtube', 'draft'],
      ['instagram', 'draft'],
      ['x', 'draft'],
    ]);
  });
});
