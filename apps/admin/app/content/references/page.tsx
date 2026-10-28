import type { ReactNode } from 'react';
import {
  BanIcon,
  BookCopyIcon,
  BookMarkedIcon,
  CircleCheckIcon,
  FileSearchIcon,
  FilterIcon,
  HammerIcon,
  LayersIcon,
  LightbulbIcon,
  PencilRulerIcon,
  ScanSearchIcon,
  ShieldQuestionIcon,
} from 'lucide-react';

import {
  FilterLink,
  REFERENCE_STAGE_LABELS,
  ReferenceStageBadge,
} from '@/components/content/content-ui';
import { Cell, DataGrid, DataTable, PanelCard, Row, StatCard, StatusBadge } from '@/components/admin-ui';
import { Grid, Section } from '@/components/layout-primitives';
import { ErrorNote, PageHeading } from '@/components/ops/primitives';
import { Alert, AlertDescription, Button, buttonVariants, Collapsible, CollapsibleContent, CollapsibleTrigger, Input, NativeSelect } from '@stats47/components';
import type {
  ReferenceProductionChannelDTO,
  ReferenceProductionKindDTO,
  ReferenceProductionStageDTO,
} from '@/lib/contracts/types';
import { contentOperations } from '@/lib/server/content-operations';
import { projectRoot } from '@/lib/server/project-root';
import { referenceExpansionPlans } from '@/lib/server/reference-expansion-plans';
import { referenceExpansionView } from '@/lib/server/reference-expansion';
import { hasError } from '@/lib/server/state-io';
import {
  REFERENCE_PRODUCTION_CHANNEL_LABELS,
  REFERENCE_PRODUCTION_CHANNELS,
} from '@/lib/content-operations/reference';

export const dynamic = 'force-dynamic';
export const metadata = { title: '参考文献の活用・展開管理 — stats47 admin' };

type Query = {
  kind?: string;
  stage?: string;
  channel?: string;
  q?: string;
  page?: string;
  contextPage?: string;
};
const KINDS: ReferenceProductionKindDTO[] = ['metric', 'area'];
const STAGES: ReferenceProductionStageDTO[] = [
  'draft',
  'ready',
  'integrated',
  'blocked',
  'not-applicable',
];
const CHANNELS: ReferenceProductionChannelDTO[] = [
  ...REFERENCE_PRODUCTION_CHANNELS,
];
const SOURCE_LABELS: Record<string, string> = {
  'japan-zue': '日本国勢図会',
  'prefecture-deviation': '47都道府県の偏差値',
  'prefecture-databook': '2021都道府県DataBook',
  'claude-skills-guide': 'Claudeスキル構築ガイド',
  'amusement-shop-density': '全国都道府県遊技営業店密度ランキング',
  'average-income-ranking': '都道府県別平均年収ランキング',
  'capital-city-guide': '47都道府県県庁所在地ガイド',
  'gis-business-guide': '最新GISのビジネス活用がよ〜くわかる本',
  'money-health-ranking': 'おカネと健康 都道府県ランキング',
  'prefecture-ranking-consumption': '統計から読み解く47都道府県ランキング 消費・子供・スポーツ編',
  'yabai-kenmin-ranking': '全国47都道府県やばい県民ランキング',
};
const GEO_SCOPE_LABELS: Record<string, string> = {
  japan: '日本全体',
  prefecture: '都道府県',
  'prefecture-set': '47都道府県比較',
  world: '世界比較',
};
const ROLE_LABELS: Record<string, string> = {
  agent: 'エージェント改善',
  area: '都道府県ページ',
  blog: 'ブログ記事',
  'internal-documentation': '内部文書',
  japan: '日本全体ページ',
  note: 'note記事',
  ranking: 'ランキング',
  skill: 'スキル改善',
  theme: 'テーマページ',
};
const TARGET_LABELS: Record<string, string> = {
  '/ranking': 'ランキング一覧',
  '/themes': 'テーマページ',
  '/areas': '都道府県ページ',
  '/japan': '日本全体ページ',
  '/blog': 'ブログ',
  note: 'note記事',
  YouTube: 'YouTube動画',
  '/world（基盤完成後）': '世界比較（基盤完成後）',
};

function sourceLabel(sourceKey: string): string {
  return SOURCE_LABELS[sourceKey] ?? sourceKey;
}

function editionLabel(sourceKey: string, edition: string): string {
  if (sourceKey === 'japan-zue' && edition === '2025-26') {
    return '2025・2026年版';
  }
  return `${edition}年版`;
}

function japaneseLabels(values: string[], labels: Record<string, string>) {
  return values.map((value) => labels[value] ?? value);
}

function targetLabel(path: string): string {
  if (TARGET_LABELS[path]) return TARGET_LABELS[path];
  if (path.startsWith('/survey/')) return '統計調査ページ';
  if (path.startsWith('/ranking/')) return 'ランキングページ';
  if (/\.(?:md|ts|tsx|json)$/.test(path)) return '既存コンテンツの管理ファイル';
  return '既存コンテンツ';
}

function themeTargetLabel(target: string): string {
  const slug = target.replace(/^\/themes\//, '');
  const catalog: Record<string, string> = {
    'population-dynamics': '人口動態テーマ',
    climate: '気候テーマ',
    'labor-mobility': '労働・人の移動テーマ',
    'local-economy': '地域経済テーマ',
    'real-income': '家計・実質所得テーマ',
    'local-finance': '地方財政テーマ',
    manufacturing: '製造業テーマ',
  };
  return catalog[slug] ?? 'テーマページ';
}

function InternalDetails({
  children,
  summary = '管理情報を表示',
}: {
  children: ReactNode;
  summary?: string;
}) {
  return (
    <Collapsible className="mt-1 text-xs text-muted-foreground">
      <CollapsibleTrigger className="cursor-pointer select-none hover:text-foreground">
        {summary}
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-1 break-all font-mono text-xs">{children}</CollapsibleContent>
    </Collapsible>
  );
}

function href(query: Query, patch: Partial<Query>, anchor?: string) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...query, ...patch })) {
    if (value) params.set(key, value);
  }
  const text = params.toString();
  const path = text ? `/content/references?${text}` : '/content/references';
  return anchor ? `${path}#${anchor}` : path;
}

export default async function ReferenceContentPage({
  searchParams,
}: {
  searchParams: Promise<Query>;
}) {
  const data = contentOperations();
  const query = await searchParams;
  if (hasError(data)) {
    return (
      <>
        <PageHeading
          title="参考文献の活用・展開管理"
          source="参考文献台帳 + 各コンテンツ管理台帳"
        />
        <ErrorNote error={data.error} />
      </>
    );
  }
  const portfolio = data.references;
  const metricLabelByKey = new Map(
    portfolio.units
      .filter((unit) => unit.kind === 'metric')
      .map((unit) => [unit.id.replace(/^metric:/, ''), unit.label])
  );
  const plans = referenceExpansionPlans(projectRoot());
  const expansion = referenceExpansionView();
  const themePlans = plans.filter((plan) => plan.kind === 'theme');
  const blogDrafts = plans.filter((plan) => plan.kind === 'blog');
  const kind = KINDS.includes(query.kind as ReferenceProductionKindDTO)
    ? (query.kind as ReferenceProductionKindDTO)
    : undefined;
  const stage = STAGES.includes(query.stage as ReferenceProductionStageDTO)
    ? (query.stage as ReferenceProductionStageDTO)
    : undefined;
  const channel = CHANNELS.includes(
    query.channel as ReferenceProductionChannelDTO
  )
    ? (query.channel as ReferenceProductionChannelDTO)
    : undefined;
  const word = query.q?.trim().toLowerCase() ?? '';
  const hasFilters = Boolean(kind || stage || channel || word);
  const units = portfolio.units.filter((unit) => {
    const selectedCoverage = channel
      ? unit.channels.filter((entry) => entry.channel === channel)
      : unit.channels;
    const searchableText = [
      unit.id,
      unit.label,
      ...unit.sourceKeys,
      ...unit.sourceKeys.map(sourceLabel),
      ...unit.geoScopes,
      ...japaneseLabels(unit.geoScopes, GEO_SCOPE_LABELS),
      ...unit.channels.flatMap((entry) => [
        entry.detail,
        REFERENCE_PRODUCTION_CHANNEL_LABELS[entry.channel],
        REFERENCE_STAGE_LABELS[entry.stage],
      ]),
    ]
      .join(' ')
      .toLowerCase();
    return (
      (!kind || unit.kind === kind) &&
      (!stage || selectedCoverage.some((entry) => entry.stage === stage)) &&
      (!word || searchableText.includes(word))
    );
  });
  const pageSize = 20;
  const pageCount = Math.max(1, Math.ceil(units.length / pageSize));
  const requestedPage = Number.parseInt(query.page ?? '1', 10);
  const currentPage = Number.isFinite(requestedPage)
    ? Math.min(Math.max(requestedPage, 1), pageCount)
    : 1;
  const visibleUnits = units.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  const contextGroups = portfolio.contextGroups.filter((group) => {
    const searchableText = [
      group.sourceKey,
      sourceLabel(group.sourceKey),
      group.organization,
      group.label,
      ...group.roles,
      ...japaneseLabels(group.roles, ROLE_LABELS),
      ...group.geoScopes,
      ...japaneseLabels(group.geoScopes, GEO_SCOPE_LABELS),
      ...group.targetPaths,
      ...group.targetPaths.map(targetLabel),
    ]
      .join(' ')
      .toLowerCase();
    return !word || searchableText.includes(word);
  });
  const contextPageSize = 20;
  const contextPageCount = Math.max(
    1,
    Math.ceil(contextGroups.length / contextPageSize)
  );
  const requestedContextPage = Number.parseInt(query.contextPage ?? '1', 10);
  const currentContextPage = Number.isFinite(requestedContextPage)
    ? Math.min(Math.max(requestedContextPage, 1), contextPageCount)
    : 1;
  const visibleContextGroups = contextGroups.slice(
    (currentContextPage - 1) * contextPageSize,
    currentContextPage * contextPageSize
  );

  return (
    <>
      <PageHeading
        title="参考文献の活用・展開管理"
        source="参考文献台帳 + 各コンテンツ管理台帳"
      >
        <p className="text-sm text-muted-foreground">
          原本、文字起こし、ページ画像、図表の切り抜きは非公開のGoogle
          Driveで保管しています。この画面では、一次資料まで確認できた展開テーマと、既存コンテンツの補強候補だけを管理します。
        </p>
      </PageHeading>

      <Grid min="sm">
        <StatCard label="確認した資料項目" icon={<BookCopyIcon />} value={portfolio.summary.sourceItems} />
        <StatCard label="展開テーマ" icon={<LayersIcon />} value={portfolio.summary.productionUnits} tone="info" />
        <StatCard label="既存内容の補強候補" icon={<FileSearchIcon />} value={portfolio.summary.contextEvidence} />
        <StatCard label="補強資料グループ" icon={<BookMarkedIcon />} value={portfolio.summary.contextGroups} />
        <StatCard label="反映済み" icon={<CircleCheckIcon />} value={portfolio.summary.integratedSlots} tone="good" />
        <StatCard label="下書き・制作中" icon={<PencilRulerIcon />} value={portfolio.summary.draftSlots} tone="warn" />
        <StatCard label="制作可能" icon={<HammerIcon />} value={portfolio.summary.readySlots} tone="info" />
        <StatCard label="権利・出典確認待ち" icon={<ShieldQuestionIcon />} value={portfolio.summary.blockedEvidence} tone="warn" />
      </Grid>

      <nav
        aria-label="参考文献管理のページ内メニュー"
        className="flex flex-wrap gap-2"
      >
        {[
          ['portfolio', '展開テーマを探す'],
          ['plans', '企画・下書き'],
          ['sources', '資料別の状況'],
          ['channels', '展開先別の状況'],
          ['context', '補強候補'],
          ['audit', '機械監査'],
        ].map(([anchor, label]) => (
          <a key={anchor} href={`#${anchor}`} className={buttonVariants({ variant: "outline", size: "sm" })}>{label}</a>
        ))}
      </nav>

      <PanelCard title="検索・絞り込み" icon={<FilterIcon />}>
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <FilterLink
              href={href(
                query,
                { stage: undefined, page: undefined },
                'portfolio'
              )}
              active={!stage}
            >
              全状態
            </FilterLink>
            {STAGES.map((value) => (
              <FilterLink
                key={value}
                href={href(
                  query,
                  { stage: value, page: undefined },
                  'portfolio'
                )}
                active={stage === value}
              >
                {REFERENCE_STAGE_LABELS[value]}
              </FilterLink>
            ))}
          </div>
          <form
            className="flex flex-wrap gap-2"
            action="/content/references#portfolio"
          >
            {stage ? <input type="hidden" name="stage" value={stage} /> : null}
            <NativeSelect name="kind" defaultValue={kind} aria-label="展開テーマの種類">
              <option value="">すべての種類</option>
              <option value="metric">統計指標</option>
              <option value="area">都道府県ページ</option>
            </NativeSelect>
            <NativeSelect name="channel" defaultValue={channel} aria-label="展開先">
              <option value="">すべての展開先</option>
              {CHANNELS.map((value) => (
                <option key={value} value={value}>
                  {REFERENCE_PRODUCTION_CHANNEL_LABELS[value]}
                </option>
              ))}
            </NativeSelect>
            <Input
              name="q"
              defaultValue={query.q}
              aria-label="展開テーマを検索"
              placeholder="指標名・地域名・資料名で検索"
              className="w-64"
              />
            <Button type="submit" variant="outline">
              検索する
            </Button>
            {hasFilters ? (
              <a href="/content/references#portfolio" className={buttonVariants({ variant: "ghost" })}>条件を解除</a>
            ) : null}
          </form>
          <p className="text-xs text-muted-foreground">
            {hasFilters
              ? `${portfolio.units.length}件中${units.length}件を表示しています。`
              : `展開テーマ${portfolio.units.length}件を表示しています。`}
          </p>
        </div>
      </PanelCard>

      <Section
        id="sources"
        title="資料別の利用状況"
        count={portfolio.sources.length}
      >
        <DataTable
          columns={[
            '資料',
            '全項目',
            '制作に利用',
            '既存内容の補強',
            '利用保留',
            '対象外',
          ]}
        >
          {portfolio.sources.map((source) => (
            <Row key={`${source.sourceKey}-${source.edition}`}>
              <Cell>
                <div className="font-medium">
                  {sourceLabel(source.sourceKey)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {editionLabel(source.sourceKey, source.edition)}
                </div>
                <InternalDetails>{source.sourceKey}</InternalDetails>
              </Cell>
              <Cell nowrap>{source.itemCount}</Cell>
              <Cell nowrap>{source.productionEvidence}</Cell>
              <Cell nowrap>{source.contextEvidence}</Cell>
              <Cell nowrap>{source.blockedEvidence}</Cell>
              <Cell nowrap>{source.notApplicable}</Cell>
            </Row>
          ))}
        </DataTable>
      </Section>

      <Section
        id="channels"
        title="展開先別の状況"
        count={CHANNELS.length}
        note="サイト、長文記事、書籍、動画、SNSへの展開状況を同じ基準で追跡します。「対象外」も残し、内容に合わない展開を増やさないための判断に使います。"
      >
        <DataTable
          columns={[
            '展開先',
            '反映済み',
            '下書き・制作中',
            '制作可能',
            '確認待ち',
            '対象外',
          ]}
        >
          {CHANNELS.map((value) => {
            const counts = portfolio.summary.byChannel[value];
            return (
              <Row key={value}>
                <Cell>
                  <span className="font-medium">
                    {REFERENCE_PRODUCTION_CHANNEL_LABELS[value]}
                  </span>
                </Cell>
                <Cell nowrap>{counts.integrated}</Cell>
                <Cell nowrap>{counts.draft}</Cell>
                <Cell nowrap>{counts.ready}</Cell>
                <Cell nowrap>{counts.blocked}</Cell>
                <Cell nowrap>{counts['not-applicable']}</Cell>
              </Row>
            );
          })}
        </DataTable>
      </Section>

      <Section
        id="analyses"
        title="分析企画の展開"
        count={expansion.summary.length}
      >
        <p className="text-sm text-muted-foreground">
          教材から採択した分析企画を展開先ごとに数えます。記録は展開記録
          (expansion.json。書き込みは npm run reference:expansion --
          record)。ランキング・調査・テーマ・全国は、指標が公開ページに載っていれば自動で済みにします。
        </p>
        {expansion.errors.length > 0 && (
          <Alert>
            <AlertDescription>
              展開記録の検査エラー {expansion.errors.length} 件:{' '}
              {expansion.errors.slice(0, 3).join(' / ')}
            </AlertDescription>
          </Alert>
        )}
        <DataTable
          columns={[
            '展開先',
            '済み (記録)',
            '済み (自動)',
            '企画中',
            '見送り',
            '未着手',
            '担当',
          ]}
        >
          {expansion.summary.map((row) => (
            <Row key={row.channel}>
              <Cell>
                <span className="font-medium">{row.channel}</span>
              </Cell>
              <Cell nowrap>{row.counts.done}</Cell>
              <Cell nowrap>{row.counts.derived}</Cell>
              <Cell nowrap>{row.counts.planned}</Cell>
              <Cell nowrap>{row.counts.declined}</Cell>
              <Cell nowrap>{row.counts.pending}</Cell>
              <Cell nowrap>{row.owner}</Cell>
            </Row>
          ))}
        </DataTable>
      </Section>

      <Section id="plans" title="企画・下書き" count={plans.length}>
        <Grid min="sm">
          <StatCard label="テーマ企画" icon={<LightbulbIcon />} value={themePlans.length} tone="info" />
          <StatCard label="ブログ下書き" icon={<PencilRulerIcon />} value={blogDrafts.length} tone="warn" />
          <StatCard
            label="確認待ち"
            icon={<ShieldQuestionIcon />}
            value={plans.filter((plan) => plan.status === 'blocked').length}
            tone="warn"
          />
        </Grid>
        <p className="text-sm text-muted-foreground">
          テーマ企画は展開判断の記録 (placement-decisions.ts) 、ブログは非公開の原稿ファイルが管理元です。
          参考文献は論点の発見に使い、一次資料と保存済み統計データを確認するまで公開へ進めません。
        </p>
        <DataGrid
          columns={[
            { id: 'kind', header: '種類', sortable: true, nowrap: true },
            { id: 'title', header: '企画名', sortable: true },
            { id: 'target', header: '追加先・使用指標' },
            { id: 'status', header: '状態', sortable: true, nowrap: true },
            { id: 'summary', header: '企画の狙い' },
            { id: 'meta', header: '管理情報' },
          ]}
          rows={plans.map((plan) => ({
            id: plan.id,
            cells: [
              plan.kind === 'theme' ? 'テーマ' : 'ブログ',
              <div key="title" className="font-medium">
                {plan.title}
              </div>,
              <div key="target" className="text-muted-foreground">
                <div className="text-foreground">
                  {plan.kind === 'theme'
                    ? themeTargetLabel(plan.target)
                    : 'ブログ記事（非公開下書き）'}
                </div>
                {plan.metricKeys.length > 0 ? (
                  <div className="mt-1 max-w-72 text-xs">
                    {plan.metricKeys
                      .map(
                        (key) =>
                          metricLabelByKey.get(key) ?? '登録予定の統計指標'
                      )
                      .join('、')}
                  </div>
                ) : null}
              </div>,
              <ReferenceStageBadge key="status" stage={plan.status} />,
              plan.summary,
              <InternalDetails key="meta" summary="識別子と保存先を表示">
                <div>{plan.id}</div>
                <div>{plan.target}</div>
                <div>{plan.metricKeys.join(' / ')}</div>
                <div>{plan.sourcePath}</div>
              </InternalDetails>,
            ],
            sort: [plan.kind, plan.title, null, plan.status, null, null],
            search: `${plan.id} ${plan.title} ${plan.target}`,
            facet: plan.kind,
            tone: plan.status === 'blocked' ? ('warn' as const) : undefined,
          }))}
          facets={[
            { value: 'theme', label: 'テーマ' },
            { value: 'blog', label: 'ブログ' },
          ]}
          searchPlaceholder="企画名・識別子で絞り込み"
        />
      </Section>

      <Section
        id="portfolio"
        title="展開テーマ一覧"
        count={`${visibleUnits.length}/${units.length}`}
      >
        {units.length === 0 ? (
          <Alert>
            <AlertDescription>条件に合う展開テーマはありません。検索語または絞り込み条件を変更してください。</AlertDescription>
          </Alert>
        ) : null}
        <DataTable
          columns={[
            '展開テーマ',
            '参考資料・根拠',
            '展開先ごとの状態',
            '選択した展開先の詳細',
            '次に行うこと',
          ]}
        >
          {visibleUnits.map((unit) => {
            const selected = channel
              ? unit.channels.find((entry) => entry.channel === channel)
              : undefined;
            const applicable = unit.channels.filter(
              (entry) => entry.stage !== 'not-applicable'
            );
            return (
              <Row key={unit.id}>
                <Cell>
                  <div className="font-medium">{unit.label}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {japaneseLabels(unit.geoScopes, GEO_SCOPE_LABELS).join(
                      '・'
                    ) || '対象範囲未指定'}
                  </div>
                  <InternalDetails>{unit.id}</InternalDetails>
                </Cell>
                <Cell muted>
                  <div>
                    {unit.sourceKeys.map(sourceLabel).join('・')} · 根拠
                    {unit.evidenceCount}件
                  </div>
                  {unit.primarySourceUrls[0] ? (
                    <a
                      href={unit.primarySourceUrls[0]}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-foreground underline-offset-4 hover:underline"
                    >
                      一次資料
                    </a>
                  ) : null}
                  {unit.surveyIds.length > 0 ? (
                    <InternalDetails summary="統計調査IDを表示">
                      {unit.surveyIds.join(' / ')}
                    </InternalDetails>
                  ) : null}
                </Cell>
                <Cell>
                  <div className="flex max-w-xl flex-wrap gap-1.5">
                    {applicable.map((entry) => (
                      <span
                        key={entry.channel}
                        className="inline-flex items-center gap-1"
                      >
                        <span className="text-xs text-muted-foreground">
                          {REFERENCE_PRODUCTION_CHANNEL_LABELS[entry.channel]}
                        </span>
                        <ReferenceStageBadge stage={entry.stage} />
                      </span>
                    ))}
                  </div>
                </Cell>
                <Cell muted>
                  {selected ? (
                    <div className="max-w-72">
                      <div className="flex items-center gap-2">
                        <span>
                          {
                            REFERENCE_PRODUCTION_CHANNEL_LABELS[
                              selected.channel
                            ]
                          }
                        </span>
                        <ReferenceStageBadge stage={selected.stage} />
                      </div>
                      <p className="mt-1">{selected.detail}</p>
                      {selected.itemIds.length > 0 ? (
                        <InternalDetails summary="参照項目IDを表示">
                          {selected.itemIds.join(' / ')}
                        </InternalDetails>
                      ) : null}
                    </div>
                  ) : (
                    <span>
                      展開先を選ぶと、根拠や確認待ちの理由を表示します
                    </span>
                  )}
                </Cell>
                <Cell>{unit.nextAction}</Cell>
              </Row>
            );
          })}
        </DataTable>
        {pageCount > 1 ? (
          <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
            {currentPage > 1 ? (
              <FilterLink
                href={href(
                  query,
                  { page: String(currentPage - 1) },
                  'portfolio'
                )}
                active={false}
              >
                前へ
              </FilterLink>
            ) : null}
            <span>
              {currentPage} / {pageCount}ページ
            </span>
            {currentPage < pageCount ? (
              <FilterLink
                href={href(
                  query,
                  { page: String(currentPage + 1) },
                  'portfolio'
                )}
                active={false}
              >
                次へ
              </FilterLink>
            ) : null}
          </div>
        ) : null}
      </Section>

      <Section
        id="context"
        title="既存コンテンツの補強候補"
        count={`${visibleContextGroups.length}/${contextGroups.length}`}
      >
        <Grid min="sm">
          <StatCard
            label="既存ページへ反映済み"
            icon={<CircleCheckIcon />}
            value={portfolio.summary.contextIntegratedEvidence}
            tone="good"
          />
          <StatCard
            label="補強に利用可能"
            icon={<HammerIcon />}
            value={portfolio.summary.contextReadyEvidence}
            tone="info"
          />
          <StatCard
            label="反映先の確認待ち"
            icon={<ShieldQuestionIcon />}
            value={portfolio.summary.contextBlockedEvidence}
            tone="warn"
          />
        </Grid>
        <p className="text-sm text-muted-foreground">
          補強専用資料は独立した記事、ランキング、書籍にはしません。公式一次資料ごとにまとめ、
          既存ページの用語説明、よくある質問、考察、出典の補強にだけ使います。
        </p>
        {contextGroups.length === 0 ? (
          <Alert>
            <AlertDescription>条件に合う補強候補はありません。</AlertDescription>
          </Alert>
        ) : null}
        <DataTable
          columns={[
            '公式資料のまとまり',
            '根拠数',
            '対象範囲・利用先',
            '状態',
            '反映先',
            '使い方',
          ]}
        >
          {visibleContextGroups.map((group) => (
            <Row key={group.id}>
              <Cell>
                <div className="font-medium">{group.label}</div>
                <div className="text-xs text-muted-foreground">
                  {group.organization} · {sourceLabel(group.sourceKey)}
                </div>
                <InternalDetails>{group.id}</InternalDetails>
                {group.primarySourceUrl ? (
                  <a
                    href={group.primarySourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    一次資料
                  </a>
                ) : null}
              </Cell>
              <Cell nowrap>{group.evidenceCount}</Cell>
              <Cell muted>
                <div>
                  {japaneseLabels(group.geoScopes, GEO_SCOPE_LABELS).join(
                    '・'
                  ) || '内部運用'}
                </div>
                <div className="mt-1 text-xs">
                  {japaneseLabels(group.roles, ROLE_LABELS).join('・')}
                </div>
              </Cell>
              <Cell nowrap>
                <ReferenceStageBadge stage={group.stage} />
              </Cell>
              <Cell muted>
                <div className="max-w-72 text-foreground">
                  {group.targetPaths.length > 0
                    ? Array.from(
                        new Set(group.targetPaths.map(targetLabel))
                      ).join('・')
                    : '反映先を確認中'}
                </div>
                {group.targetPaths.length > 0 ? (
                  <InternalDetails summary="管理先を表示">
                    {group.targetPaths.join(' / ')}
                  </InternalDetails>
                ) : null}
              </Cell>
              <Cell>{group.detail}</Cell>
            </Row>
          ))}
        </DataTable>
        {contextPageCount > 1 ? (
          <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
            {currentContextPage > 1 ? (
              <FilterLink
                href={href(
                  query,
                  {
                    contextPage: String(currentContextPage - 1),
                  },
                  'context'
                )}
                active={false}
              >
                前へ
              </FilterLink>
            ) : null}
            <span>
              {currentContextPage} / {contextPageCount}ページ
            </span>
            {currentContextPage < contextPageCount ? (
              <FilterLink
                href={href(
                  query,
                  {
                    contextPage: String(currentContextPage + 1),
                  },
                  'context'
                )}
                active={false}
              >
                次へ
              </FilterLink>
            ) : null}
          </div>
        ) : null}
      </Section>

      <Section title="展開しない判断も含む完了境界">
        <Grid min="md">
          <PanelCard title="世界統計" icon={<BanIcon />}>
            <p className="text-sm text-muted-foreground">世界比較ページの基盤が完成するまでは「確認待ち」です。国際比較の候補を国内ランキングへ混在させません。</p>
          </PanelCard>
          <PanelCard title="Kindle・データ商品" icon={<BanIcon />}>
            <p className="text-sm text-muted-foreground">1指標ごとに商品化せず、既存書籍への追加、無料コンテンツでの需要確認、少数の試験販売、実売確認の順で進めます。</p>
          </PanelCard>
          <PanelCard title="YouTube・SNS" icon={<BanIcon />}>
            <p className="text-sm text-muted-foreground">YouTubeの通常動画を基礎に、Instagram・X向け素材を作ります。TikTokは撤退済みのため再開しません。</p>
          </PanelCard>
          <PanelCard title="補強専用資料" icon={<BanIcon />}>
            <p className="text-sm text-muted-foreground">既存コンテンツ補強専用。単独ページ・記事・書籍への水増しを禁止します。</p>
          </PanelCard>
          <PanelCard title="権利・一次資料の確認待ち" icon={<BanIcon />}>
            <p className="text-sm text-muted-foreground">権利確認中、または一次資料を確認できない資料はGoogle Driveに保全したまま、制作予定へは入れません。</p>
          </PanelCard>
          <PanelCard title="公開承認" icon={<BanIcon />}>
            <p className="text-sm text-muted-foreground">この画面は読み取り専用です。各担当の品質確認と公開確認が終わるまで外部公開しません。</p>
          </PanelCard>
        </Grid>
      </Section>

      <div id="audit" className="scroll-mt-6">
        <PanelCard
          title="機械監査"
          icon={<ScanSearchIcon />}
          action={
            <StatusBadge tone={portfolio.audit.status === 'pass' ? 'good' : portfolio.audit.status === 'warn' ? 'warn' : 'bad'}>
              {{
                pass: '問題なし',
                warn: '確認事項あり',
                fail: '不整合あり',
              }[portfolio.audit.status] ?? portfolio.audit.status}
            </StatusBadge>
          }
        >
          {portfolio.audit.findings.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              参考文献台帳と各コンテンツ管理台帳の接続に不整合はありません。
            </p>
          ) : (
            <DataTable columns={['重大度', '内容']}>
              {portfolio.audit.findings.map((finding) => (
                <Row key={`${finding.code}-${finding.itemId ?? 'all'}`}>
                  <Cell nowrap>
                    <StatusBadge tone={finding.severity === 'error' ? 'bad' : 'warn'}>
                      {finding.severity === 'error' ? 'エラー' : '警告'}
                    </StatusBadge>
                  </Cell>
                  <Cell>
                    {finding.message}
                    <InternalDetails summary="監査コードを表示">
                      {finding.code}
                      {finding.itemId ? ` / ${finding.itemId}` : ''}
                    </InternalDetails>
                  </Cell>
                </Row>
              ))}
            </DataTable>
          )}
        </PanelCard>
      </div>
    </>
  );
}
