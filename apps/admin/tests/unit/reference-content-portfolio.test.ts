import { describe, expect, it } from 'vitest';

import {
  buildReferenceContentPortfolio,
  type ReferenceContentInput,
} from '@/lib/content-operations/reference';

function fixture(
  overrides: Partial<ReferenceContentInput> = {}
): ReferenceContentInput {
  return {
    expectedSourceKeys: ['book-a', 'book-b'],
    inventories: [
      {
        sourceKey: 'book-a',
        edition: '2026',
        sourcePath: 'data/source-inventory/book-a/2026/inventory.json',
        items: [
          {
            id: 'metric-evidence',
            resolution: 'reuse-existing-metric',
            primarySource: { url: 'https://example.go.jp/stat' },
            mapping: {
              metricKeys: ['sample-metric'],
              contentRoles: ['ranking', 'blog', 'note'],
            },
          },
          {
            id: 'blocked-evidence',
            resolution: 'rights-hold',
            mapping: { metricKeys: ['must-not-appear'] },
          },
          {
            id: 'context-evidence',
            resolution: 'context-only',
            primarySource: {
              organization: '総務省',
              publicationOrDataset: '参考統計',
              url: 'https://example.go.jp/context',
            },
            mapping: {
              geoScopes: ['prefecture-set'],
              contentRoles: ['ranking', 'theme', 'blog'],
            },
          },
        ],
      },
      {
        sourceKey: 'book-b',
        edition: '2025',
        sourcePath: 'data/source-inventory/book-b/2025/inventory.json',
        items: [
          {
            id: 'area-evidence',
            resolution: 'combined-analysis',
            primarySource: { url: 'https://pref.example.jp/symbol' },
            mapping: { areaCodes: ['01000'], contentRoles: ['area'] },
          },
        ],
      },
    ],
    metrics: [
      {
        key: 'sample-metric',
        title: 'サンプル指標',
        active: true,
        sourcePath: 'data/metrics/sample-metric.ts',
      },
    ],
    blogs: [
      {
        slug: 'sample-analysis',
        title: '分析記事',
        published: true,
        rankingKeys: ['sample-metric'],
      },
    ],
    notes: [],
    kindleBooks: [
      {
        id: 'K-S1-01',
        status: 'generated',
        rankingKeys: [],
        blogSlugs: ['sample-analysis'],
      },
    ],
    areas: [
      {
        code: '01000',
        name: '北海道',
        editorialPath:
          'packages/data-configs/src/area-databook/editorial/01000.ts',
      },
    ],
    ...overrides,
  };
}

describe('reference content portfolio', () => {
  it('根拠候補を指標・地域の制作単位へ重複排除して既存成果物と突合する', () => {
    const result = buildReferenceContentPortfolio(fixture());

    expect(result.audit.status).toBe('pass');
    expect(result.summary).toMatchObject({
      sourceItems: 4,
      productionEvidence: 2,
      contextEvidence: 1,
      blockedEvidence: 1,
      productionUnits: 2,
    });
    expect(result.units.map((unit) => unit.id)).toEqual([
      'metric:sample-metric',
      'area:01000',
    ]);
    const metric = result.units.find(
      (unit) => unit.id === 'metric:sample-metric'
    )!;
    expect(
      metric.channels
        .filter((channel) => channel.stage !== 'not-applicable')
        .map((channel) => [channel.channel, channel.stage])
    ).toEqual([
      ['ranking', 'integrated'],
      ['blog', 'integrated'],
      ['note', 'ready'],
      ['kindle', 'integrated'],
    ]);
    expect(metric.channels).toHaveLength(12);
    expect(metric.nextAction).toBe('note記事を需要の高い順に制作へ送る');
    expect(result.contextGroups).toEqual([
      expect.objectContaining({
        sourceKey: 'book-a',
        evidenceCount: 1,
        stage: 'ready',
        targetPaths: expect.arrayContaining(['/ranking', '/themes', '/blog']),
      }),
    ]);
  });

  it('rights-holdを制作単位へ昇格せず、欠落inventoryと接続先を機械検出する', () => {
    const input = fixture({
      expectedSourceKeys: ['book-a', 'book-b', 'missing-book'],
      metrics: [],
      areas: [{ code: '01000', name: '北海道', editorialPath: null }],
    });
    const result = buildReferenceContentPortfolio(input);

    expect(
      result.units.some((unit) => unit.id.includes('must-not-appear'))
    ).toBe(false);
    expect(result.audit.status).toBe('fail');
    expect(result.audit.findings.map((finding) => finding.code)).toEqual(
      expect.arrayContaining([
        'REFERENCE_INVENTORY_MISSING',
        'REFERENCE_METRIC_MISSING',
        'REFERENCE_AREA_EDITORIAL_MISSING',
      ])
    );
  });

  it('県データブックのテンプレートに載った指標だけを県ページへ統合済みにする', () => {
    const withAreaRole = (
      areaDatabookMetricKeys: string[],
      contentRoles = ['ranking', 'area']
    ) =>
      buildReferenceContentPortfolio(
        fixture({
          areaDatabookMetricKeys,
          inventories: [
            {
              sourceKey: 'book-a',
              edition: '2026',
              sourcePath: 'data/source-inventory/book-a/2026/inventory.json',
              items: [
                {
                  id: 'metric-evidence',
                  resolution: 'reuse-existing-metric',
                  primarySource: { url: 'https://example.go.jp/stat' },
                  mapping: {
                    metricKeys: ['sample-metric'],
                    contentRoles,
                  },
                },
              ],
            },
          ],
          expectedSourceKeys: ['book-a'],
        })
      ).units
        .find((unit) => unit.id === 'metric:sample-metric')!
        .channels.find((channel) => channel.channel === 'area')!.stage;

    expect(withAreaRole([])).toBe('ready');
    expect(withAreaRole(['sample-metric'])).toBe('integrated');
    // 台帳に area 役割が無くても、県ページに載っていれば統合済み
    expect(withAreaRole(['sample-metric'], ['ranking'])).toBe('integrated');
    expect(withAreaRole([], ['ranking'])).toBe('not-applicable');
  });

  it('SNS は投稿台帳で投稿済みなら済み、ブログの着手できるは候補キューの候補を示し、見送りの記録は全展開先に効く', () => {
    const withRoles = (overrides: Partial<ReferenceContentInput>) =>
      buildReferenceContentPortfolio(
        fixture({
          inventories: [
            {
              sourceKey: 'book-a',
              edition: '2026',
              sourcePath: 'data/source-inventory/book-a/2026/inventory.json',
              items: [
                {
                  id: 'metric-evidence',
                  resolution: 'reuse-existing-metric',
                  primarySource: { url: 'https://example.go.jp/stat' },
                  mapping: { metricKeys: ['sample-metric'], contentRoles: ['ranking', 'blog', 'note', 'x', 'instagram'] },
                },
              ],
            },
          ],
          expectedSourceKeys: ['book-a'],
          blogs: [],
          ...overrides,
        })
      ).units.find((unit) => unit.id === 'metric:sample-metric')!;
    const stage = (unit: ReturnType<typeof withRoles>, channel: string) =>
      unit.channels.find((c) => c.channel === channel)!;

    // SNS: 投稿済みの行がある展開先だけ済み。投稿 ID が itemIds に入る
    const posted = withRoles({ snsPostedMetrics: { x: { 'sample-metric': [42] } } });
    expect(stage(posted, 'x')).toMatchObject({ stage: 'integrated', itemIds: ['sns:42'] });
    expect(stage(posted, 'instagram').stage).not.toBe('integrated');

    // ブログ: 着手できる指標が候補キューにあれば、候補を示す (段階は変えない)
    const queued = withRoles({ blogTopicQueue: [{ topicKey: 'topic-a', metricKeys: ['sample-metric', 'other'] }] });
    expect(stage(queued, 'blog').stage).toBe('ready');
    expect(stage(queued, 'blog').itemIds).toContain('topic:topic-a');
    expect(stage(withRoles({}), 'blog').itemIds.some((id) => id.startsWith('topic:'))).toBe(false);

    // 見送りの記録はブログ・note にも効き、企画中は下書きとして数える
    const decided = withRoles({
      placementDecisions: [
        { channel: 'blog', metricKey: 'sample-metric', status: 'rejected', reason: '記事にしない' },
        { channel: 'note', metricKey: 'sample-metric', status: 'planned', reason: 'note 企画', target: 'note-a' },
      ],
    });
    expect(stage(decided, 'blog')).toMatchObject({ stage: 'not-applicable' });
    expect(stage(decided, 'note')).toMatchObject({ stage: 'draft', itemIds: ['note-a'] });

    // 済みは記録より強い: 公開記事があれば、見送りの記録があっても済み
    const published = withRoles({
      blogs: [{ slug: 'post-a', title: 'A', published: true, rankingKeys: ['sample-metric'] }],
      placementDecisions: [{ channel: 'blog', metricKey: 'sample-metric', status: 'rejected', reason: 'x' }],
    });
    expect(stage(published, 'blog').stage).toBe('integrated');
  });

  it('展開先に載せないと決めた記録は、県ページを対象外・日本全体を停止中として数え、採用済みを上書きしない', () => {
    const stageOf = (
      channel: 'area' | 'japan',
      placementDecisions: Array<{ channel: 'area' | 'japan'; metricKey: string; status: 'rejected' | 'blocked'; reason: string }>,
      areaDatabookMetricKeys: string[] = []
    ) =>
      buildReferenceContentPortfolio(
        fixture({
          areaDatabookMetricKeys,
          placementDecisions,
          inventories: [
            {
              sourceKey: 'book-a',
              edition: '2026',
              sourcePath: 'data/source-inventory/book-a/2026/inventory.json',
              items: [
                {
                  id: 'metric-evidence',
                  resolution: 'reuse-existing-metric',
                  primarySource: { url: 'https://example.go.jp/stat' },
                  mapping: { metricKeys: ['sample-metric'], contentRoles: ['ranking', 'area', 'japan'] },
                },
              ],
            },
          ],
          expectedSourceKeys: ['book-a'],
        })
      ).units
        .find((unit) => unit.id === 'metric:sample-metric')!
        .channels.find((c) => c.channel === channel)!;

    expect(stageOf('area', []).stage).toBe('ready');
    const rejected = stageOf('area', [{ channel: 'area', metricKey: 'sample-metric', status: 'rejected', reason: '重複' }]);
    expect(rejected.stage).toBe('not-applicable');
    expect(rejected.detail).toContain('重複');
    expect(stageOf('japan', [{ channel: 'japan', metricKey: 'sample-metric', status: 'blocked', reason: '生成器が未対応' }]).stage).toBe('blocked');
    // 別の展開先の記録は効かない
    expect(stageOf('japan', [{ channel: 'area', metricKey: 'sample-metric', status: 'rejected', reason: 'x' }]).stage).toBe('ready');
    // テンプレートに載っていれば、記録があっても採用済みが勝つ
    expect(
      stageOf('area', [{ channel: 'area', metricKey: 'sample-metric', status: 'rejected', reason: 'x' }], ['sample-metric']).stage
    ).toBe('integrated');
  });

  it('非公開metricから下流制作をreadyにしない', () => {
    const input = fixture({
      metrics: [
        {
          key: 'sample-metric',
          title: 'サンプル指標',
          active: false,
          sourcePath: 'data/metrics/sample-metric.ts',
        },
      ],
      blogs: [],
      kindleBooks: [],
    });
    const result = buildReferenceContentPortfolio(input);
    const metric = result.units.find(
      (unit) => unit.id === 'metric:sample-metric'
    )!;

    expect(
      metric.channels
        .filter((channel) => channel.stage === 'blocked')
        .map((x) => x.channel)
    ).toEqual(['ranking', 'blog', 'note']);
    expect(result.summary.readySlots).toBe(0);
  });

  it('note生成の決定的blockerをreadyではなくblockedとして表示する', () => {
    const result = buildReferenceContentPortfolio(
      fixture({
        blogs: [],
        kindleBooks: [],
        noteBlockers: [
          {
            rankingKey: 'sample-metric',
            code: 'ZERO_DENOMINATOR',
            message: '最下位値が0のため倍率を計算できません',
            sourcePath:
              'data/content-operations/note-generation-blockers.json',
          },
        ],
      })
    );
    const metric = result.units.find(
      (unit) => unit.id === 'metric:sample-metric'
    )!;
    const note = metric.channels.find((channel) => channel.channel === 'note')!;

    expect(note.stage).toBe('blocked');
    expect(note.itemIds).toEqual(['ZERO_DENOMINATOR']);
    expect(result.summary.byChannel.note.blocked).toBe(1);
    expect(result.summary.byChannel.note.ready).toBe(0);
    expect(result.audit.findings).toContainEqual(
      expect.objectContaining({ code: 'REFERENCE_NOTE_GENERATION_BLOCKED' })
    );
  });

  it('全チャネルを省略せず、世界・動画・SNSの停止と下書きを区別する', () => {
    const result = buildReferenceContentPortfolio(
      fixture({
        inventories: [
          {
            sourceKey: 'book-a',
            edition: '2026',
            sourcePath: 'inventory.json',
            items: [
              {
                id: 'world-evidence',
                resolution: 'reuse-existing-metric',
                primarySource: { url: 'https://example.go.jp/stat' },
                mapping: {
                  metricKeys: ['sample-metric'],
                  geoScopes: ['world'],
                  contentRoles: ['theme', 'blog', 'note'],
                },
              },
            ],
          },
          {
            sourceKey: 'book-b',
            edition: '2025',
            sourcePath: 'empty.json',
            items: [],
          },
        ],
        blogs: [],
        kindleBooks: [],
        mediaPlans: [
          {
            id: 'master:youtube',
            metricKeys: ['sample-metric'],
            channel: 'youtube',
            stage: 'draft',
            detail: '8分brief保存済み',
            sourcePath: 'pilot.ts',
          },
          {
            id: 'master:instagram:1',
            metricKeys: ['sample-metric'],
            channel: 'instagram',
            stage: 'draft',
            detail: 'Reel派生保存済み',
            sourcePath: 'pilot.ts',
          },
        ],
      })
    );
    const metric = result.units[0];

    expect(metric.channels).toHaveLength(12);
    expect(
      metric.channels.find((entry) => entry.channel === 'world')?.stage
    ).toBe('blocked');
    expect(
      metric.channels.find((entry) => entry.channel === 'youtube')?.stage
    ).toBe('draft');
    expect(
      metric.channels.find((entry) => entry.channel === 'instagram')?.stage
    ).toBe('draft');
    expect(metric.channels.find((entry) => entry.channel === 'x')?.stage).toBe(
      'not-applicable'
    );
  });
});
