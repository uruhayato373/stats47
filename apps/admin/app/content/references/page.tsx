import type { ReactNode } from 'react';

import {
  FilterLink,
  REFERENCE_STAGE_LABELS,
  ReferenceStageBadge,
} from '@/components/content/content-ui';
import {
  ErrorNote,
  PageHeading,
  Section,
  Stat,
  Table,
  Td,
  Tr,
} from '@/components/ops/primitives';
import type {
  ReferenceProductionChannelDTO,
  ReferenceProductionKindDTO,
  ReferenceProductionStageDTO,
} from '@/lib/contracts/types';
import { contentOperations } from '@/lib/server/content-operations';
import { projectRoot } from '@/lib/server/project-root';
import { referenceExpansionPlans } from '@/lib/server/reference-expansion-plans';
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
    <details className="mt-1 text-[10px] text-console-muted">
      <summary className="cursor-pointer select-none hover:text-console-fg">
        {summary}
      </summary>
      <div className="mt-1 break-all font-mono text-[9px]">{children}</div>
    </details>
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
      <div className="space-y-4">
        <PageHeading
          title="参考文献の活用・展開管理"
          source="参考文献台帳 + 各コンテンツ管理台帳"
        />
        <ErrorNote error={data.error} />
      </div>
    );
  }
  const portfolio = data.references;
  const metricLabelByKey = new Map(
    portfolio.units
      .filter((unit) => unit.kind === 'metric')
      .map((unit) => [unit.id.replace(/^metric:/, ''), unit.label])
  );
  const plans = referenceExpansionPlans(projectRoot());
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
    <div className="space-y-8">
      <PageHeading
        title="参考文献の活用・展開管理"
        source="参考文献台帳 + 各コンテンツ管理台帳"
      >
        <p className="text-xs text-console-muted">
          原本、文字起こし、ページ画像、図表の切り抜きは非公開のGoogle
          Driveで保管しています。この画面では、一次資料まで確認できた展開テーマと、既存コンテンツの補強候補だけを管理します。
        </p>
      </PageHeading>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-8">
        <Stat label="確認した資料項目" value={portfolio.summary.sourceItems} />
        <Stat
          label="展開テーマ"
          value={portfolio.summary.productionUnits}
          tone="info"
        />
        <Stat
          label="既存内容の補強候補"
          value={portfolio.summary.contextEvidence}
        />
        <Stat
          label="補強資料グループ"
          value={portfolio.summary.contextGroups}
        />
        <Stat
          label="反映済み"
          value={portfolio.summary.integratedSlots}
          tone="good"
        />
        <Stat
          label="下書き・制作中"
          value={portfolio.summary.draftSlots}
          tone="warn"
        />
        <Stat
          label="制作可能"
          value={portfolio.summary.readySlots}
          tone="info"
        />
        <Stat
          label="権利・出典確認待ち"
          value={portfolio.summary.blockedEvidence}
          tone="warn"
        />
      </div>

      <nav
        aria-label="参考文献管理のページ内メニュー"
        className="flex flex-wrap gap-2 rounded-md border border-console-border bg-console-card p-3 text-xs"
      >
        {[
          ['portfolio', '展開テーマを探す'],
          ['plans', '企画・下書き'],
          ['sources', '資料別の状況'],
          ['channels', '展開先別の状況'],
          ['context', '補強候補'],
          ['audit', '機械監査'],
        ].map(([anchor, label]) => (
          <a
            key={anchor}
            href={`#${anchor}`}
            className="rounded border border-console-border px-2 py-1 text-console-fg hover:border-console-accent hover:text-console-accent"
          >
            {label}
          </a>
        ))}
      </nav>

      <Section id="filters" title="検索・絞り込み">
        <div className="space-y-2 rounded-md border border-console-border bg-console-card p-3">
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
            <select
              name="kind"
              defaultValue={kind}
              aria-label="展開テーマの種類"
              className="h-8 rounded-md border border-console-border bg-console-bg px-2 text-xs text-console-fg"
            >
              <option value="">すべての種類</option>
              <option value="metric">統計指標</option>
              <option value="area">都道府県ページ</option>
            </select>
            <select
              name="channel"
              defaultValue={channel}
              aria-label="展開先"
              className="h-8 rounded-md border border-console-border bg-console-bg px-2 text-xs text-console-fg"
            >
              <option value="">すべての展開先</option>
              {CHANNELS.map((value) => (
                <option key={value} value={value}>
                  {REFERENCE_PRODUCTION_CHANNEL_LABELS[value]}
                </option>
              ))}
            </select>
            <input
              name="q"
              defaultValue={query.q}
              aria-label="展開テーマを検索"
              placeholder="指標名・地域名・資料名で検索"
              className="h-8 w-64 rounded-md border border-console-border bg-console-bg px-2 text-xs text-console-fg"
            />
            <button className="h-8 rounded-md border border-console-accent px-3 text-xs text-console-accent hover:bg-console-accent/10">
              検索する
            </button>
            {hasFilters ? (
              <a
                href="/content/references#portfolio"
                className="inline-flex h-8 items-center px-2 text-xs text-console-muted hover:text-console-fg"
              >
                条件を解除
              </a>
            ) : null}
          </form>
          <p className="text-[11px] text-console-muted">
            {hasFilters
              ? `${portfolio.units.length}件中${units.length}件を表示しています。`
              : `展開テーマ${portfolio.units.length}件を表示しています。`}
          </p>
        </div>
      </Section>

      <Section
        id="sources"
        title="資料別の利用状況"
        count={portfolio.sources.length}
      >
        <Table
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
            <Tr key={`${source.sourceKey}-${source.edition}`}>
              <Td>
                <div className="font-medium">
                  {sourceLabel(source.sourceKey)}
                </div>
                <div className="text-[10px] text-console-muted">
                  {editionLabel(source.sourceKey, source.edition)}
                </div>
                <InternalDetails>{source.sourceKey}</InternalDetails>
              </Td>
              <Td nowrap>{source.itemCount}</Td>
              <Td nowrap>{source.productionEvidence}</Td>
              <Td nowrap>{source.contextEvidence}</Td>
              <Td nowrap>{source.blockedEvidence}</Td>
              <Td nowrap>{source.notApplicable}</Td>
            </Tr>
          ))}
        </Table>
      </Section>

      <Section id="channels" title="展開先別の状況" count={CHANNELS.length}>
        <p className="mb-3 text-xs text-console-muted">
          サイト、長文記事、書籍、動画、SNSへの展開状況を同じ基準で追跡します。
          「対象外」も残し、内容に合わない展開を増やさないための判断に使います。
        </p>
        <Table
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
              <Tr key={value}>
                <Td>
                  <span className="font-medium">
                    {REFERENCE_PRODUCTION_CHANNEL_LABELS[value]}
                  </span>
                </Td>
                <Td nowrap>{counts.integrated}</Td>
                <Td nowrap>{counts.draft}</Td>
                <Td nowrap>{counts.ready}</Td>
                <Td nowrap>{counts.blocked}</Td>
                <Td nowrap>{counts['not-applicable']}</Td>
              </Tr>
            );
          })}
        </Table>
      </Section>

      <Section id="plans" title="企画・下書き" count={plans.length}>
        <div className="mb-3 grid gap-3 sm:grid-cols-3">
          <Stat label="テーマ企画" value={themePlans.length} tone="info" />
          <Stat label="ブログ下書き" value={blogDrafts.length} tone="warn" />
          <Stat
            label="確認待ち"
            value={plans.filter((plan) => plan.status === 'blocked').length}
            tone="warn"
          />
        </div>
        <p className="mb-3 text-xs text-console-muted">
          テーマ企画は実行待ちの作業台帳、ブログは非公開の原稿ファイルが管理元です。
          参考文献は論点の発見に使い、一次資料と保存済み統計データを確認するまで公開へ進めません。
        </p>
        <Table
          columns={[
            '種類',
            '企画名',
            '追加先・使用指標',
            '状態',
            '企画の狙い',
            '管理情報',
          ]}
        >
          {plans.map((plan) => (
            <Tr key={plan.id}>
              <Td nowrap>{plan.kind === 'theme' ? 'テーマ' : 'ブログ'}</Td>
              <Td>
                <div className="font-medium">{plan.title}</div>
              </Td>
              <Td muted>
                <div className="text-console-fg">
                  {plan.kind === 'theme'
                    ? themeTargetLabel(plan.target)
                    : 'ブログ記事（非公開下書き）'}
                </div>
                {plan.metricKeys.length > 0 ? (
                  <div className="mt-1 max-w-72 text-[10px]">
                    {plan.metricKeys
                      .map(
                        (key) =>
                          metricLabelByKey.get(key) ?? '登録予定の統計指標'
                      )
                      .join('、')}
                  </div>
                ) : null}
              </Td>
              <Td nowrap>
                <ReferenceStageBadge stage={plan.status} />
              </Td>
              <Td>{plan.summary}</Td>
              <Td muted>
                <InternalDetails summary="識別子と保存先を表示">
                  <div>{plan.id}</div>
                  <div>{plan.target}</div>
                  <div>{plan.metricKeys.join(' / ')}</div>
                  <div>{plan.sourcePath}</div>
                </InternalDetails>
              </Td>
            </Tr>
          ))}
        </Table>
      </Section>

      <Section
        id="portfolio"
        title="展開テーマ一覧"
        count={`${visibleUnits.length}/${units.length}`}
      >
        {units.length === 0 ? (
          <p className="rounded-md border border-console-border bg-console-card p-3 text-xs text-console-muted">
            条件に合う展開テーマはありません。検索語または絞り込み条件を変更してください。
          </p>
        ) : null}
        <Table
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
              <Tr key={unit.id}>
                <Td>
                  <div className="font-medium">{unit.label}</div>
                  <div className="mt-1 text-[10px] text-console-muted">
                    {japaneseLabels(unit.geoScopes, GEO_SCOPE_LABELS).join(
                      '・'
                    ) || '対象範囲未指定'}
                  </div>
                  <InternalDetails>{unit.id}</InternalDetails>
                </Td>
                <Td muted>
                  <div>
                    {unit.sourceKeys.map(sourceLabel).join('・')} · 根拠
                    {unit.evidenceCount}件
                  </div>
                  {unit.primarySourceUrls[0] ? (
                    <a
                      href={unit.primarySourceUrls[0]}
                      target="_blank"
                      rel="noreferrer"
                      className="text-console-accent hover:underline"
                    >
                      一次資料
                    </a>
                  ) : null}
                  {unit.surveyIds.length > 0 ? (
                    <InternalDetails summary="統計調査IDを表示">
                      {unit.surveyIds.join(' / ')}
                    </InternalDetails>
                  ) : null}
                </Td>
                <Td>
                  <div className="flex max-w-xl flex-wrap gap-1.5">
                    {applicable.map((entry) => (
                      <span
                        key={entry.channel}
                        className="inline-flex items-center gap-1"
                      >
                        <span className="text-[10px] text-console-muted">
                          {REFERENCE_PRODUCTION_CHANNEL_LABELS[entry.channel]}
                        </span>
                        <ReferenceStageBadge stage={entry.stage} />
                      </span>
                    ))}
                  </div>
                </Td>
                <Td muted>
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
                </Td>
                <Td>{unit.nextAction}</Td>
              </Tr>
            );
          })}
        </Table>
        {pageCount > 1 ? (
          <div className="flex items-center justify-end gap-2 text-xs text-console-muted">
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
        <div className="mb-3 grid gap-3 sm:grid-cols-3">
          <Stat
            label="既存ページへ反映済み"
            value={portfolio.summary.contextIntegratedEvidence}
            tone="good"
          />
          <Stat
            label="補強に利用可能"
            value={portfolio.summary.contextReadyEvidence}
            tone="info"
          />
          <Stat
            label="反映先の確認待ち"
            value={portfolio.summary.contextBlockedEvidence}
            tone="warn"
          />
        </div>
        <p className="mb-3 text-xs text-console-muted">
          補強専用資料は独立した記事、ランキング、書籍にはしません。公式一次資料ごとにまとめ、
          既存ページの用語説明、よくある質問、考察、出典の補強にだけ使います。
        </p>
        {contextGroups.length === 0 ? (
          <p className="rounded-md border border-console-border bg-console-card p-3 text-xs text-console-muted">
            条件に合う補強候補はありません。
          </p>
        ) : null}
        <Table
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
            <Tr key={group.id}>
              <Td>
                <div className="font-medium">{group.label}</div>
                <div className="text-[10px] text-console-muted">
                  {group.organization} · {sourceLabel(group.sourceKey)}
                </div>
                <InternalDetails>{group.id}</InternalDetails>
                {group.primarySourceUrl ? (
                  <a
                    href={group.primarySourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-console-accent hover:underline"
                  >
                    一次資料
                  </a>
                ) : null}
              </Td>
              <Td nowrap>{group.evidenceCount}</Td>
              <Td muted>
                <div>
                  {japaneseLabels(group.geoScopes, GEO_SCOPE_LABELS).join(
                    '・'
                  ) || '内部運用'}
                </div>
                <div className="mt-1 text-[10px]">
                  {japaneseLabels(group.roles, ROLE_LABELS).join('・')}
                </div>
              </Td>
              <Td nowrap>
                <ReferenceStageBadge stage={group.stage} />
              </Td>
              <Td muted>
                <div className="max-w-72 text-console-fg">
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
              </Td>
              <Td>{group.detail}</Td>
            </Tr>
          ))}
        </Table>
        {contextPageCount > 1 ? (
          <div className="flex items-center justify-end gap-2 text-xs text-console-muted">
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
        <div className="grid gap-3 text-xs text-console-muted md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-md border border-console-border bg-console-card p-3">
            <div className="font-semibold text-console-fg">世界統計</div>
            <p className="mt-1">
              世界比較ページの基盤が完成するまでは「確認待ち」です。国際比較の候補を国内ランキングへ混在させません。
            </p>
          </div>
          <div className="rounded-md border border-console-border bg-console-card p-3">
            <div className="font-semibold text-console-fg">
              Kindle・データ商品
            </div>
            <p className="mt-1">
              1指標ごとに商品化せず、既存書籍への追加、無料コンテンツでの需要確認、少数の試験販売、実売確認の順で進めます。
            </p>
          </div>
          <div className="rounded-md border border-console-border bg-console-card p-3">
            <div className="font-semibold text-console-fg">YouTube・SNS</div>
            <p className="mt-1">
              YouTubeの通常動画を基礎に、Instagram・X向け素材を作ります。TikTokは撤退済みのため再開しません。
            </p>
          </div>
          <div className="rounded-md border border-console-border bg-console-card p-3">
            <div className="font-semibold text-console-fg">補強専用資料</div>
            <p className="mt-1">
              既存コンテンツ補強専用。単独ページ・記事・書籍への水増しを禁止します。
            </p>
          </div>
          <div className="rounded-md border border-console-border bg-console-card p-3">
            <div className="font-semibold text-console-fg">
              権利・一次資料の確認待ち
            </div>
            <p className="mt-1">
              権利確認中、または一次資料を確認できない資料はGoogle
              Driveに保全したまま、制作予定へは入れません。
            </p>
          </div>
          <div className="rounded-md border border-console-border bg-console-card p-3">
            <div className="font-semibold text-console-fg">公開承認</div>
            <p className="mt-1">
              この画面は読み取り専用です。各担当の品質確認と公開確認が終わるまで外部公開しません。
            </p>
          </div>
        </div>
      </Section>

      <Section id="audit" title="機械監査">
        <div className="rounded-md border border-console-border bg-console-card p-3 text-xs text-console-muted">
          <div className="font-semibold text-console-fg">
            {{
              pass: '問題なし',
              warn: '確認事項あり',
              fail: '不整合あり',
            }[portfolio.audit.status] ?? portfolio.audit.status}
          </div>
          {portfolio.audit.findings.length === 0 ? (
            <p className="mt-1">
              参考文献台帳と各コンテンツ管理台帳の接続に不整合はありません。
            </p>
          ) : (
            <ul className="mt-2 space-y-1">
              {portfolio.audit.findings.map((finding) => (
                <li
                  key={`${finding.code}-${finding.itemId ?? 'all'}`}
                  className="rounded border border-console-border/70 px-2 py-1.5"
                >
                  <span className="font-medium text-console-fg">
                    {finding.severity === 'error' ? 'エラー' : '警告'}：
                  </span>
                  {finding.message}
                  <InternalDetails summary="監査コードを表示">
                    {finding.code}
                    {finding.itemId ? ` / ${finding.itemId}` : ''}
                  </InternalDetails>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Section>
    </div>
  );
}
