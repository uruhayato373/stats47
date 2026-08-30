import type {
  ReferenceChannelCoverageDTO,
  ReferenceContentPortfolioDTO,
  ReferenceContextGroupDTO,
  ReferenceProductionChannelDTO,
  ReferenceProductionStageDTO,
  ReferenceProductionUnitDTO,
} from '../contracts/types';

export interface SourceEvidenceItem {
  id: string;
  resolution: string;
  primarySource?: {
    organization?: string;
    publicationOrDataset?: string;
    url?: string;
  };
  mapping?: {
    metricKeys?: string[];
    areaCodes?: string[];
    surveyIds?: string[];
    geoScopes?: string[];
    contentRoles?: string[];
    internalFiles?: string[];
  };
}

export interface SourceEvidenceInventory {
  sourceKey: string;
  edition: string;
  sourcePath: string;
  items: SourceEvidenceItem[];
}

export interface ReferenceMetricSource {
  key: string;
  title: string;
  active: boolean;
  sourcePath: string;
}

export interface ReferenceBlogSource {
  slug: string;
  title: string;
  published: boolean;
  rankingKeys: string[];
}

export interface ReferenceNoteSource {
  key: string;
  status: string;
  stats47Targets?: string[];
}

export interface ReferenceNoteBlocker {
  rankingKey: string;
  code: string;
  message: string;
  sourcePath: string;
}

export interface ReferenceKindleSource {
  id: string;
  status: string;
  rankingKeys: string[];
  blogSlugs: string[];
}

export interface ReferenceAreaSource {
  code: string;
  name: string;
  editorialPath: string | null;
}

export interface ReferenceThemeSource {
  slug: string;
  metricKeys: string[];
}

export interface ReferenceThemePlanSource {
  metricKey: string;
  target: string;
  status: 'draft' | 'blocked';
  sourcePath: string;
}

export interface ReferenceMediaPlanSource {
  id: string;
  metricKeys: string[];
  channel: 'blog' | 'note' | 'youtube' | 'instagram' | 'x';
  stage: 'draft' | 'ready' | 'blocked';
  detail: string;
  sourcePath: string;
}

export interface ReferenceContentInput {
  expectedSourceKeys?: string[];
  inventories: SourceEvidenceInventory[];
  metrics: ReferenceMetricSource[];
  blogs: ReferenceBlogSource[];
  notes: ReferenceNoteSource[];
  noteBlockers?: ReferenceNoteBlocker[];
  kindleBooks: ReferenceKindleSource[];
  areas: ReferenceAreaSource[];
  surveys?: Array<{ id: string }>;
  themes?: ReferenceThemeSource[];
  japanThemes?: ReferenceThemeSource[];
  themePlans?: ReferenceThemePlanSource[];
  mediaPlans?: ReferenceMediaPlanSource[];
  integratedInternalFiles?: string[];
}

export const REFERENCE_PRODUCTION_CHANNELS = [
  'ranking',
  'survey',
  'theme',
  'area',
  'japan',
  'world',
  'blog',
  'note',
  'kindle',
  'youtube',
  'instagram',
  'x',
] as const satisfies readonly ReferenceProductionChannelDTO[];

const STAGES: ReferenceProductionStageDTO[] = [
  'integrated',
  'draft',
  'ready',
  'blocked',
  'not-applicable',
];
const PRODUCTION_RESOLUTIONS = new Set([
  'reuse-existing-metric',
  'new-metric',
  'combined-analysis',
]);
const CONTEXT_RESOLUTIONS = new Set(['context-only']);
const BLOCKED_RESOLUTIONS = new Set([
  'primary-source-unavailable',
  'rights-hold',
]);

function unique(values: Iterable<string>): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b, 'ja'));
}

function coverage(
  channel: ReferenceProductionChannelDTO,
  stage: ReferenceProductionStageDTO,
  itemIds: string[],
  detail: string
): ReferenceChannelCoverageDTO {
  return { channel, stage, itemIds: unique(itemIds), detail };
}

function sourceSummary(inventory: SourceEvidenceInventory) {
  const byResolution: Record<string, number> = {};
  for (const item of inventory.items) {
    byResolution[item.resolution] = (byResolution[item.resolution] ?? 0) + 1;
  }
  const count = (set: Set<string>) =>
    inventory.items.filter((item) => set.has(item.resolution)).length;
  return {
    sourceKey: inventory.sourceKey,
    edition: inventory.edition,
    itemCount: inventory.items.length,
    productionEvidence: count(PRODUCTION_RESOLUTIONS),
    contextEvidence: count(CONTEXT_RESOLUTIONS),
    blockedEvidence: count(BLOCKED_RESOLUTIONS),
    notApplicable: byResolution['not-applicable'] ?? 0,
    byResolution,
    sourcePath: inventory.sourcePath,
  };
}

function nextAction(channels: ReferenceChannelCoverageDTO[]): string {
  const drafts = channels.filter((channel) => channel.stage === 'draft');
  if (drafts.length > 0) {
    return `${drafts.map((channel) => channel.channel).join(' / ')} の下書きを品質ゲートまで進める`;
  }
  const ready = channels.filter((channel) => channel.stage === 'ready');
  if (ready.length > 0) {
    return `${ready.map((channel) => channel.channel).join(' / ')} を需要順に既存制作フローへ送る`;
  }
  if (channels.some((channel) => channel.stage === 'blocked')) {
    return '停止理由を解消するまで公開しない';
  }
  return '既存コンテンツの計測・更新を継続する';
}

function stableHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function contextTargetPaths(
  roles: string[],
  surveyIds: string[],
  geoScopes: string[],
  internalFiles: string[]
): string[] {
  const targets = [...internalFiles, ...surveyIds.map((id) => `/survey/${id}`)];
  if (roles.includes('ranking')) targets.push('/ranking');
  if (roles.includes('theme')) targets.push('/themes');
  if (roles.includes('area')) targets.push('/areas');
  if (roles.includes('japan')) targets.push('/japan');
  if (roles.includes('blog')) targets.push('/blog');
  if (roles.includes('note')) targets.push('note');
  if (roles.includes('youtube')) targets.push('YouTube');
  if (geoScopes.includes('world')) targets.push('/world（基盤完成後）');
  return unique(targets);
}

function buildContextGroups(
  inventories: SourceEvidenceInventory[],
  integratedInternalFiles: Set<string>
): ReferenceContextGroupDTO[] {
  const grouped = new Map<
    string,
    { inventory: SourceEvidenceInventory; items: SourceEvidenceItem[] }
  >();
  for (const inventory of inventories) {
    for (const item of inventory.items.filter((entry) =>
      CONTEXT_RESOLUTIONS.has(entry.resolution)
    )) {
      const roles = unique(item.mapping?.contentRoles ?? []);
      const surveyIds = unique(item.mapping?.surveyIds ?? []);
      const geoScopes = unique(item.mapping?.geoScopes ?? []);
      const internalFiles = unique(item.mapping?.internalFiles ?? []);
      const key = JSON.stringify([
        inventory.sourceKey,
        item.primarySource?.organization ?? '',
        item.primarySource?.publicationOrDataset ?? '',
        item.primarySource?.url ?? '',
        surveyIds,
        geoScopes,
        roles,
        internalFiles,
      ]);
      const group = grouped.get(key) ?? { inventory, items: [] };
      group.items.push(item);
      grouped.set(key, group);
    }
  }

  return [...grouped.entries()]
    .map(([key, group]) => {
      const first = group.items[0];
      const roles = unique(
        group.items.flatMap((item) => item.mapping?.contentRoles ?? [])
      );
      const surveyIds = unique(
        group.items.flatMap((item) => item.mapping?.surveyIds ?? [])
      );
      const geoScopes = unique(
        group.items.flatMap((item) => item.mapping?.geoScopes ?? [])
      );
      const internalFiles = unique(
        group.items.flatMap((item) => item.mapping?.internalFiles ?? [])
      );
      const targetPaths = contextTargetPaths(
        roles,
        surveyIds,
        geoScopes,
        internalFiles
      );
      const internalIntegrated =
        internalFiles.length > 0 &&
        internalFiles.every((file) => integratedInternalFiles.has(file));
      const stage = internalIntegrated
        ? 'integrated'
        : targetPaths.length > 0
          ? 'ready'
          : 'blocked';
      return {
        id: `context:${group.inventory.sourceKey}:${stableHash(key)}`,
        sourceKey: group.inventory.sourceKey,
        label:
          first.primarySource?.publicationOrDataset ?? '接続先未分類の文脈候補',
        organization: first.primarySource?.organization ?? '未分類',
        evidenceCount: group.items.length,
        primarySourceUrl: first.primarySource?.url ?? null,
        surveyIds,
        geoScopes,
        roles,
        internalFiles,
        targetPaths,
        stage,
        detail: internalIntegrated
          ? '公式仕様で再確認し、既存の内部SSOTへ統合済み'
          : targetPaths.length > 0
            ? '独立記事にはせず、対象面の定義・FAQ・考察・出典補強にだけ利用'
            : '具体的な既存接続先が確定するまで利用停止',
      } satisfies ReferenceContextGroupDTO;
    })
    .sort(
      (a, b) =>
        b.evidenceCount - a.evidenceCount ||
        a.sourceKey.localeCompare(b.sourceKey) ||
        a.label.localeCompare(b.label, 'ja')
    );
}

function mediaCoverage(
  input: ReferenceContentInput,
  key: string,
  channel: 'blog' | 'note' | 'youtube' | 'instagram' | 'x'
): ReferenceChannelCoverageDTO | null {
  const plans = (input.mediaPlans ?? []).filter(
    (plan) => plan.channel === channel && plan.metricKeys.includes(key)
  );
  if (plans.length === 0) return null;
  const order: Record<ReferenceMediaPlanSource['stage'], number> = {
    draft: 0,
    ready: 1,
    blocked: 2,
  };
  const stage = [...plans].sort((a, b) => order[a.stage] - order[b.stage])[0]
    .stage;
  return coverage(
    channel,
    stage,
    plans.map((plan) => plan.id),
    unique(plans.map((plan) => plan.detail)).join(' / ')
  );
}

export function buildReferenceContentPortfolio(
  input: ReferenceContentInput
): ReferenceContentPortfolioDTO {
  const findings: ReferenceContentPortfolioDTO['audit']['findings'] = [];
  const loadedSourceKeys = new Set(
    input.inventories.map((inventory) => inventory.sourceKey)
  );
  for (const sourceKey of input.expectedSourceKeys ?? []) {
    if (!loadedSourceKeys.has(sourceKey)) {
      findings.push({
        severity: 'error',
        code: 'REFERENCE_INVENTORY_MISSING',
        itemId: sourceKey,
        message: '登録済み参考文献の解決済みinventoryがありません',
      });
    }
  }

  const metricByKey = new Map(
    input.metrics.map((metric) => [metric.key, metric])
  );
  const areaByCode = new Map(input.areas.map((area) => [area.code, area]));
  const surveyIdsInMaster = new Set(
    (input.surveys ?? []).map((survey) => survey.id)
  );
  const allItems = input.inventories.flatMap((inventory) =>
    inventory.items.map((item) => ({ inventory, item }))
  );
  const productionItems = allItems.filter(({ item }) =>
    PRODUCTION_RESOLUTIONS.has(item.resolution)
  );

  for (const { inventory, item } of allItems.filter(({ item }) =>
    CONTEXT_RESOLUTIONS.has(item.resolution)
  )) {
    if (!item.primarySource?.url) {
      findings.push({
        severity: 'error',
        code: 'REFERENCE_CONTEXT_SOURCE_MISSING',
        itemId: item.id,
        message: `${inventory.sourceKey}のcontext-onlyに一次資料URLがありません`,
      });
    }
  }

  const metricKeys = unique(
    productionItems.flatMap(({ item }) => item.mapping?.metricKeys ?? [])
  );
  const areaCodes = unique(
    productionItems.flatMap(({ item }) => item.mapping?.areaCodes ?? [])
  );

  const units: ReferenceProductionUnitDTO[] = [];
  for (const key of metricKeys) {
    const evidence = productionItems.filter(({ item }) =>
      item.mapping?.metricKeys?.includes(key)
    );
    const metric = metricByKey.get(key);
    if (!metric) {
      findings.push({
        severity: 'error',
        code: 'REFERENCE_METRIC_MISSING',
        itemId: key,
        message: '参考文献から接続されたmetricがgit TSに存在しません',
      });
    } else if (!metric.active) {
      findings.push({
        severity: 'warning',
        code: 'REFERENCE_METRIC_INACTIVE',
        itemId: key,
        message: '参考文献から接続されたmetricが非公開です',
      });
    }

    const roles = unique(
      evidence.flatMap(({ item }) => item.mapping?.contentRoles ?? [])
    );
    const geoScopes = unique(
      evidence.flatMap(({ item }) => item.mapping?.geoScopes ?? [])
    );
    const surveyIds = unique(
      evidence.flatMap(({ item }) => item.mapping?.surveyIds ?? [])
    );
    const missingSurveyIds = surveyIds.filter(
      (id) => !surveyIdsInMaster.has(id)
    );
    if (missingSurveyIds.length > 0) {
      findings.push({
        severity: 'error',
        code: 'REFERENCE_SURVEY_MISSING',
        itemId: key,
        message: `surveys.jsonに存在しない調査ID: ${missingSurveyIds.join(' / ')}`,
      });
    }

    const blogHits = input.blogs.filter(
      (blog) =>
        blog.published && (blog.slug === key || blog.rankingKeys.includes(key))
    );
    const blogDrafts = input.blogs.filter(
      (blog) =>
        !blog.published && (blog.slug === key || blog.rankingKeys.includes(key))
    );
    const noteHits = input.notes.filter(
      (note) =>
        note.status === 'published' &&
        note.stats47Targets?.includes(`/ranking/${key}`)
    );
    const noteDrafts = input.notes.filter(
      (note) =>
        note.status !== 'published' &&
        note.stats47Targets?.includes(`/ranking/${key}`)
    );
    const allNoteHits = input.notes.filter((note) =>
      note.stats47Targets?.includes(`/ranking/${key}`)
    );
    const noteBlocker = input.noteBlockers?.find(
      (blocker) => blocker.rankingKey === key
    );
    if (noteBlocker) {
      findings.push({
        severity: 'warning',
        code: 'REFERENCE_NOTE_GENERATION_BLOCKED',
        itemId: key,
        message: noteBlocker.message,
      });
    }

    const themeHits = (input.themes ?? []).filter((theme) =>
      theme.metricKeys.includes(key)
    );
    const themePlan = input.themePlans?.find((plan) => plan.metricKey === key);
    const japanHits = (input.japanThemes ?? []).filter((theme) =>
      theme.metricKeys.includes(key)
    );
    const blogSlugs = new Set(blogHits.map((blog) => blog.slug));
    const kindleHits = input.kindleBooks.filter(
      (book) =>
        book.rankingKeys.includes(key) ||
        book.blogSlugs.some((slug) => blogSlugs.has(slug))
    );
    const siteReady = Boolean(metric?.active);
    const blogMedia = mediaCoverage(input, key, 'blog');
    const noteMedia = mediaCoverage(input, key, 'note');
    const youtube = mediaCoverage(input, key, 'youtube');
    const instagram = mediaCoverage(input, key, 'instagram');
    const x = mediaCoverage(input, key, 'x');

    const channels: ReferenceChannelCoverageDTO[] = [
      roles.includes('ranking')
        ? coverage(
            'ranking',
            siteReady ? 'integrated' : 'blocked',
            metric ? [key] : [],
            siteReady
              ? '既存ranking metricへ統合済み'
              : '公開中のmetricが無いため停止'
          )
        : coverage('ranking', 'not-applicable', [], '都道府県ranking対象外'),
      surveyIds.length > 0
        ? coverage(
            'survey',
            missingSurveyIds.length === 0 ? 'integrated' : 'blocked',
            surveyIds,
            missingSurveyIds.length === 0
              ? '登録済み統計調査へlineage接続済み'
              : '統計調査マスタとの接続が未解決'
          )
        : coverage('survey', 'not-applicable', [], '確定した統計調査IDなし'),
      roles.includes('theme')
        ? coverage(
            'theme',
            themeHits.length > 0
              ? 'integrated'
              : (themePlan?.status ?? (siteReady ? 'ready' : 'blocked')),
            themeHits.length > 0
              ? themeHits.map((theme) => theme.slug)
              : themePlan
                ? [themePlan.target]
                : [],
            themeHits.length > 0
              ? 'ThemeCatalogへ統合済み'
              : themePlan
                ? `テーマ企画を${themePlan.status === 'draft' ? '下書き保存済み' : '停止理由付きで保存済み'}`
                : siteReady
                  ? '既存ThemeCatalogへの採択判断が可能'
                  : '公開中のmetricが無いため停止'
          )
        : coverage('theme', 'not-applicable', [], 'テーマ展開対象外'),
      roles.includes('area')
        ? coverage(
            'area',
            siteReady ? 'ready' : 'blocked',
            siteReady ? [key] : [],
            siteReady
              ? `${metric?.title ?? key}を県の優劣へ短絡せず、地域条件と既存指標で解釈するarea企画`
              : '公開中のmetricが無いため停止'
          )
        : coverage('area', 'not-applicable', [], '地域別解説対象外'),
      roles.includes('japan')
        ? coverage(
            'japan',
            japanHits.length > 0
              ? 'integrated'
              : siteReady
                ? 'ready'
                : 'blocked',
            japanHits.map((theme) => theme.slug),
            japanHits.length > 0
              ? '日本全国時系列カタログへ統合済み'
              : siteReady
                ? `${metric?.title ?? key}を都道府県順位と混在させず、全国時系列として検証する企画`
                : '公開中のmetricが無いため停止'
          )
        : coverage('japan', 'not-applicable', [], '日本全国時系列対象外'),
      geoScopes.includes('world')
        ? coverage(
            'world',
            'blocked',
            [],
            '世界統計基盤が未完成。一次資料と国際比較定義を保全したまま停止'
          )
        : coverage('world', 'not-applicable', [], '国際比較対象外'),
      roles.includes('blog') || blogMedia
        ? coverage(
            'blog',
            blogHits.length > 0
              ? 'integrated'
              : blogDrafts.length > 0 || blogMedia?.stage === 'draft'
                ? 'draft'
                : (blogMedia?.stage ?? (siteReady ? 'ready' : 'blocked')),
            [
              ...blogHits.map((blog) => blog.slug),
              ...blogDrafts.map((blog) => blog.slug),
              ...(blogMedia?.itemIds ?? []),
            ],
            blogHits.length > 0
              ? 'ランキングへの内部リンクを持つ公開記事あり'
              : blogDrafts.length > 0
                ? 'ランキングへの内部リンクを持つローカル下書きあり'
                : (blogMedia?.detail ??
                  `${metric?.title ?? key}の地域差を、定義・年度・関連指標をそろえて検証する記事企画`)
          )
        : coverage('blog', 'not-applicable', [], 'ブログ展開対象外'),
      roles.includes('note') || noteMedia
        ? coverage(
            'note',
            noteHits.length > 0
              ? 'integrated'
              : noteDrafts.length > 0 || noteMedia?.stage === 'draft'
                ? 'draft'
                : noteBlocker
                  ? 'blocked'
                  : (noteMedia?.stage ?? (siteReady ? 'ready' : 'blocked')),
            [
              ...allNoteHits.map((note) => note.key),
              ...(noteBlocker ? [noteBlocker.code] : []),
              ...(noteMedia?.itemIds ?? []),
            ],
            noteHits.length > 0
              ? 'stats47送客先を持つnote記事あり'
              : noteDrafts.length > 0
                ? 'stats47送客先を持つnote下書きあり'
                : (noteBlocker?.message ??
                  noteMedia?.detail ??
                  'note専用構成を制作可能')
          )
        : coverage('note', 'not-applicable', [], 'inventory上のnote展開対象外'),
      kindleHits.length > 0
        ? coverage(
            'kindle',
            kindleHits.some((book) =>
              ['generated', 'published'].includes(book.status)
            )
              ? 'integrated'
              : 'draft',
            kindleHits.map((book) => book.id),
            '需要確認済みの既存Kindle書籍へ章として接続'
          )
        : coverage(
            'kindle',
            'not-applicable',
            [],
            '1指標1冊にせず、需要確認済みの既存書籍ポートフォリオだけへ採択'
          ),
      youtube ??
        (roles.includes('youtube')
          ? coverage(
              'youtube',
              'blocked',
              [],
              'YouTube pilotの採択枠が無いため停止'
            )
          : coverage(
              'youtube',
              'not-applicable',
              [],
              '通常動画マスター未採択'
            )),
      instagram ??
        (roles.includes('instagram')
          ? coverage(
              'instagram',
              'blocked',
              [],
              '通常動画マスター確定前は派生しない'
            )
          : coverage(
              'instagram',
              'not-applicable',
              [],
              'マスターコンテンツ未採択'
            )),
      x ??
        (roles.includes('x')
          ? coverage('x', 'blocked', [], '通常動画マスター確定前は派生しない')
          : coverage('x', 'not-applicable', [], 'マスターコンテンツ未採択')),
    ];

    units.push({
      id: `metric:${key}`,
      kind: 'metric',
      label: metric?.title || key,
      sourceKeys: unique(evidence.map(({ inventory }) => inventory.sourceKey)),
      evidenceCount: evidence.length,
      primarySourceUrls: unique(
        evidence.flatMap(({ item }) =>
          item.primarySource?.url ? [item.primarySource.url] : []
        )
      ),
      roles,
      geoScopes,
      surveyIds,
      channels,
      nextAction: nextAction(channels),
      sourcePaths: unique([
        ...evidence.map(({ inventory }) => inventory.sourcePath),
        ...(metric ? [metric.sourcePath] : []),
        ...(themePlan ? [themePlan.sourcePath] : []),
        ...(noteBlocker ? [noteBlocker.sourcePath] : []),
        ...(input.mediaPlans ?? [])
          .filter((plan) => plan.metricKeys.includes(key))
          .map((plan) => plan.sourcePath),
      ]),
    });
  }

  for (const code of areaCodes) {
    const evidence = productionItems.filter(({ item }) =>
      item.mapping?.areaCodes?.includes(code)
    );
    const area = areaByCode.get(code);
    if (!area?.editorialPath) {
      findings.push({
        severity: 'error',
        code: 'REFERENCE_AREA_EDITORIAL_MISSING',
        itemId: code,
        message: '公式自治体資料へ接続された地域のarea editorialがありません',
      });
    }
    const channels = REFERENCE_PRODUCTION_CHANNELS.map((channel) =>
      channel === 'area'
        ? coverage(
            'area',
            area?.editorialPath ? 'integrated' : 'blocked',
            area?.editorialPath ? [code] : [],
            area?.editorialPath
              ? '県データブックの編集コンテンツへ統合済み'
              : 'area editorialが無いため停止'
          )
        : coverage(
            channel,
            'not-applicable',
            [],
            '自治体資料はareaページへ集約し、別チャネルへ重複展開しない'
          )
    );
    units.push({
      id: `area:${code}`,
      kind: 'area',
      label: area?.name || code,
      sourceKeys: unique(evidence.map(({ inventory }) => inventory.sourceKey)),
      evidenceCount: evidence.length,
      primarySourceUrls: unique(
        evidence.flatMap(({ item }) =>
          item.primarySource?.url ? [item.primarySource.url] : []
        )
      ),
      roles: ['area'],
      geoScopes: ['prefecture'],
      surveyIds: [],
      channels,
      nextAction: nextAction(channels),
      sourcePaths: unique([
        ...evidence.map(({ inventory }) => inventory.sourcePath),
        ...(area?.editorialPath ? [area.editorialPath] : []),
      ]),
    });
  }

  const integratedInternalFiles = new Set(input.integratedInternalFiles ?? []);
  const contextGroups = buildContextGroups(
    input.inventories,
    integratedInternalFiles
  );
  const sources = input.inventories.map(sourceSummary);
  const byChannel = Object.fromEntries(
    REFERENCE_PRODUCTION_CHANNELS.map((channel) => [
      channel,
      Object.fromEntries(
        STAGES.map((stage) => [
          stage,
          units.filter((unit) =>
            unit.channels.some(
              (entry) => entry.channel === channel && entry.stage === stage
            )
          ).length,
        ])
      ),
    ])
  ) as ReferenceContentPortfolioDTO['summary']['byChannel'];
  const allSlots = units.flatMap((unit) => unit.channels);
  const errors = findings.filter(
    (finding) => finding.severity === 'error'
  ).length;
  const warnings = findings.filter(
    (finding) => finding.severity === 'warning'
  ).length;
  const contextEvidenceByStage = (stage: ReferenceContextGroupDTO['stage']) =>
    contextGroups
      .filter((group) => group.stage === stage)
      .reduce((sum, group) => sum + group.evidenceCount, 0);

  return {
    summary: {
      sourceItems: sources.reduce((sum, source) => sum + source.itemCount, 0),
      productionEvidence: sources.reduce(
        (sum, source) => sum + source.productionEvidence,
        0
      ),
      contextEvidence: sources.reduce(
        (sum, source) => sum + source.contextEvidence,
        0
      ),
      blockedEvidence: sources.reduce(
        (sum, source) => sum + source.blockedEvidence,
        0
      ),
      notApplicable: sources.reduce(
        (sum, source) => sum + source.notApplicable,
        0
      ),
      productionUnits: units.length,
      integratedSlots: allSlots.filter((slot) => slot.stage === 'integrated')
        .length,
      draftSlots: allSlots.filter((slot) => slot.stage === 'draft').length,
      readySlots: allSlots.filter((slot) => slot.stage === 'ready').length,
      blockedSlots: allSlots.filter((slot) => slot.stage === 'blocked').length,
      contextGroups: contextGroups.length,
      contextIntegratedEvidence: contextEvidenceByStage('integrated'),
      contextReadyEvidence: contextEvidenceByStage('ready'),
      contextBlockedEvidence: contextEvidenceByStage('blocked'),
      byChannel,
    },
    audit: {
      status: errors > 0 ? 'fail' : warnings > 0 ? 'warn' : 'pass',
      findings,
    },
    sources,
    units: units.sort((a, b) => {
      const stageOrder: Record<ReferenceProductionStageDTO, number> = {
        draft: 0,
        ready: 1,
        blocked: 2,
        integrated: 3,
        'not-applicable': 4,
      };
      const priority = (unit: ReferenceProductionUnitDTO) =>
        Math.min(...unit.channels.map((channel) => stageOrder[channel.stage]));
      return (
        priority(a) - priority(b) ||
        (a.kind === 'metric' ? 0 : 1) - (b.kind === 'metric' ? 0 : 1) ||
        a.label.localeCompare(b.label, 'ja')
      );
    }),
    contextGroups,
  };
}
