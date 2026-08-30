import {
  FilterLink,
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
import { REFERENCE_PRODUCTION_CHANNELS } from '@/lib/content-operations/reference';

export const dynamic = 'force-dynamic';
export const metadata = { title: '参考文献展開 — stats47 admin' };

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
const CHANNEL_LABEL: Record<ReferenceProductionChannelDTO, string> = {
  ranking: 'ランキング',
  survey: '統計調査',
  theme: 'テーマ',
  area: 'area',
  japan: '日本全体',
  world: '世界',
  blog: 'ブログ',
  note: 'note',
  kindle: 'Kindle',
  youtube: 'YouTube',
  instagram: 'Instagram',
  x: 'X',
};

function href(query: Query, patch: Partial<Query>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...query, ...patch })) {
    if (value) params.set(key, value);
  }
  const text = params.toString();
  return text ? `/content/references?${text}` : '/content/references';
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
          title="参考文献展開"
          source="source inventory + 各コンテンツSSOT"
        />
        <ErrorNote error={data.error} />
      </div>
    );
  }
  const portfolio = data.references;
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
  const units = portfolio.units.filter((unit) => {
    const selectedCoverage = channel
      ? unit.channels.filter((entry) => entry.channel === channel)
      : unit.channels;
    return (
      (!kind || unit.kind === kind) &&
      (!stage || selectedCoverage.some((entry) => entry.stage === stage)) &&
      (!word ||
        `${unit.id} ${unit.label} ${unit.sourceKeys.join(' ')}`
          .toLowerCase()
          .includes(word))
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
  const contextGroups = portfolio.contextGroups.filter(
    (group) =>
      !word ||
      `${group.sourceKey} ${group.organization} ${group.label} ${group.roles.join(' ')} ${group.targetPaths.join(' ')}`
        .toLowerCase()
        .includes(word)
  );
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
        title="参考文献展開"
        source="source inventory + site / editorial / product / SNS の既存SSOT"
      >
        <p className="text-xs text-console-muted">
          原本・OCR・cropはprivate Google
          Driveのまま保持し、一次資料へ接続できた制作単位だけを表示します。
          文脈候補は独立コンテンツへ水増しせず、権利保留と一次資料不明は制作キューへ入りません。
        </p>
      </PageHeading>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-8">
        <Stat label="参考文献候補" value={portfolio.summary.sourceItems} />
        <Stat
          label="制作単位"
          value={portfolio.summary.productionUnits}
          tone="info"
        />
        <Stat label="文脈補強候補" value={portfolio.summary.contextEvidence} />
        <Stat label="文脈グループ" value={portfolio.summary.contextGroups} />
        <Stat
          label="統合済み枠"
          value={portfolio.summary.integratedSlots}
          tone="good"
        />
        <Stat
          label="制作中枠"
          value={portfolio.summary.draftSlots}
          tone="warn"
        />
        <Stat
          label="企画済み枠"
          value={portfolio.summary.readySlots}
          tone="info"
        />
        <Stat
          label="公開不可候補"
          value={portfolio.summary.blockedEvidence}
          tone="warn"
        />
      </div>

      <Section title="資料別の解決状況" count={portfolio.sources.length}>
        <Table
          columns={['資料', '全候補', '制作根拠', '文脈', '停止', '対象外']}
        >
          {portfolio.sources.map((source) => (
            <Tr key={`${source.sourceKey}-${source.edition}`}>
              <Td>
                <div className="font-medium">{source.sourceKey}</div>
                <div className="font-mono text-[10px] text-console-muted">
                  {source.edition}
                </div>
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

      <Section title="全展開チャネル" count={CHANNELS.length}>
        <p className="mb-3 text-xs text-console-muted">
          サイト5面、将来の世界面、長文、商品、動画・SNSを同じ制作単位から追跡します。
          対象外も省略せず、過剰展開を防ぐ判断として保持します。
        </p>
        <Table
          columns={[
            'チャネル',
            '統合済み',
            '下書き',
            '企画済み',
            '停止',
            '対象外',
          ]}
        >
          {CHANNELS.map((value) => {
            const counts = portfolio.summary.byChannel[value];
            return (
              <Tr key={value}>
                <Td>
                  <span className="font-medium">{CHANNEL_LABEL[value]}</span>
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

      <Section title="企画・下書き" count={plans.length}>
        <div className="mb-3 grid gap-3 sm:grid-cols-3">
          <Stat label="テーマ企画" value={themePlans.length} tone="info" />
          <Stat label="ブログ下書き" value={blogDrafts.length} tone="warn" />
          <Stat
            label="停止中"
            value={plans.filter((plan) => plan.status === 'blocked').length}
            tone="warn"
          />
        </div>
        <p className="mb-3 text-xs text-console-muted">
          テーマ企画は実行バックログ、ブログはpublished:falseのarticle.mdがSSOTです。
          参考文献は論点発見に限り、一次資料とR2観測値を接地するまで公開へ進めません。
        </p>
        <Table columns={['種別', '企画', '対象', '状態', '企画仮説', '保存先']}>
          {plans.map((plan) => (
            <Tr key={plan.id}>
              <Td nowrap>{plan.kind === 'theme' ? 'テーマ' : 'ブログ'}</Td>
              <Td>
                <div className="font-medium">{plan.title}</div>
                <div className="font-mono text-[10px] text-console-muted">
                  {plan.id}
                </div>
              </Td>
              <Td muted>
                <div className="font-mono text-[10px]">{plan.target}</div>
                <div className="mt-1 max-w-64 text-[10px]">
                  {plan.metricKeys.join(' / ')}
                </div>
              </Td>
              <Td nowrap>
                <ReferenceStageBadge stage={plan.status} />
              </Td>
              <Td>{plan.summary}</Td>
              <Td muted>
                <div className="max-w-56 break-all font-mono text-[9px]">
                  {plan.sourcePath}
                </div>
              </Td>
            </Tr>
          ))}
        </Table>
      </Section>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <FilterLink
            href={href(query, { stage: undefined, page: undefined })}
            active={!stage}
          >
            全状態
          </FilterLink>
          {STAGES.map((value) => (
            <FilterLink
              key={value}
              href={href(query, { stage: value, page: undefined })}
              active={stage === value}
            >
              {value}
            </FilterLink>
          ))}
        </div>
        <form className="flex flex-wrap gap-2" action="/content/references">
          {stage ? <input type="hidden" name="stage" value={stage} /> : null}
          <select
            name="kind"
            defaultValue={kind}
            aria-label="制作単位"
            className="h-8 rounded-md border border-console-border bg-console-card px-2 text-xs text-console-fg"
          >
            <option value="">全制作単位</option>
            <option value="metric">指標</option>
            <option value="area">地域</option>
          </select>
          <select
            name="channel"
            defaultValue={channel}
            aria-label="チャネル"
            className="h-8 rounded-md border border-console-border bg-console-card px-2 text-xs text-console-fg"
          >
            <option value="">全チャネル</option>
            {CHANNELS.map((value) => (
              <option key={value} value={value}>
                {CHANNEL_LABEL[value]}
              </option>
            ))}
          </select>
          <input
            name="q"
            defaultValue={query.q}
            aria-label="制作単位を検索"
            placeholder="指標・地域・source key"
            className="h-8 w-56 rounded-md border border-console-border bg-console-card px-2 text-xs text-console-fg"
          />
          <button className="rounded-md border border-console-border px-3 text-xs text-console-muted">
            絞り込む
          </button>
        </form>
      </div>

      <Section
        title="制作ポートフォリオ"
        count={`${visibleUnits.length}/${units.length}`}
      >
        <Table
          columns={[
            '制作単位',
            '根拠',
            '全チャネルの状態',
            '選択チャネル詳細',
            '次の作業',
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
                  <div className="font-mono text-[10px] text-console-muted">
                    {unit.id}
                  </div>
                  <div className="mt-1 text-[10px] text-console-muted">
                    {unit.geoScopes.join(' / ') || 'scope未指定'}
                  </div>
                </Td>
                <Td muted>
                  <div>
                    {unit.sourceKeys.join(' / ')} · {unit.evidenceCount}件
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
                    <div className="mt-1 font-mono text-[9px]">
                      {unit.surveyIds.join(' / ')}
                    </div>
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
                          {CHANNEL_LABEL[entry.channel]}
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
                        <span>{CHANNEL_LABEL[selected.channel]}</span>
                        <ReferenceStageBadge stage={selected.stage} />
                      </div>
                      <p className="mt-1">{selected.detail}</p>
                      {selected.itemIds.length > 0 ? (
                        <div className="mt-1 break-all font-mono text-[9px]">
                          {selected.itemIds.join(' / ')}
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <span>チャネル絞り込みで根拠と停止理由を表示</span>
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
                href={href(query, { page: String(currentPage - 1) })}
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
                href={href(query, { page: String(currentPage + 1) })}
                active={false}
              >
                次へ
              </FilterLink>
            ) : null}
          </div>
        ) : null}
      </Section>

      <Section
        title="既存コンテンツ補強プール"
        count={`${visibleContextGroups.length}/${contextGroups.length}`}
      >
        <div className="mb-3 grid gap-3 sm:grid-cols-3">
          <Stat
            label="内部SSOT統合済み"
            value={portfolio.summary.contextIntegratedEvidence}
            tone="good"
          />
          <Stat
            label="補強に利用可能"
            value={portfolio.summary.contextReadyEvidence}
            tone="info"
          />
          <Stat
            label="接続先未確定"
            value={portfolio.summary.contextBlockedEvidence}
            tone="warn"
          />
        </div>
        <p className="mb-3 text-xs text-console-muted">
          context-onlyは独立記事・ランキング・書籍にしません。公式一次資料単位に束ね、
          既存ページの定義、FAQ、考察、出典補強へだけ接続します。
        </p>
        <Table
          columns={[
            '公式資料グループ',
            '根拠数',
            '役割・粒度',
            '状態',
            '補強先',
            '利用境界',
          ]}
        >
          {visibleContextGroups.map((group) => (
            <Tr key={group.id}>
              <Td>
                <div className="font-medium">{group.label}</div>
                <div className="text-[10px] text-console-muted">
                  {group.organization} · {group.sourceKey}
                </div>
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
                <div>{group.geoScopes.join(' / ') || '内部運用'}</div>
                <div className="mt-1 text-[10px]">
                  {group.roles.join(' / ')}
                </div>
              </Td>
              <Td nowrap>
                <ReferenceStageBadge stage={group.stage} />
              </Td>
              <Td muted>
                <div className="max-w-72 break-all font-mono text-[9px]">
                  {group.targetPaths.join(' / ') || '未確定'}
                </div>
              </Td>
              <Td>{group.detail}</Td>
            </Tr>
          ))}
        </Table>
        {contextPageCount > 1 ? (
          <div className="flex items-center justify-end gap-2 text-xs text-console-muted">
            {currentContextPage > 1 ? (
              <FilterLink
                href={href(query, {
                  contextPage: String(currentContextPage - 1),
                })}
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
                href={href(query, {
                  contextPage: String(currentContextPage + 1),
                })}
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
              /world基盤完成前はblocked。国際比較候補を国内ランキングへ混在させません。
            </p>
          </div>
          <div className="rounded-md border border-console-border bg-console-card p-3">
            <div className="font-semibold text-console-fg">
              Kindle・データ商品
            </div>
            <p className="mt-1">
              1指標1商品にせず、既存書籍または無料需要→単一低価格pilot→実売のゲートを通します。
            </p>
          </div>
          <div className="rounded-md border border-console-border bg-console-card p-3">
            <div className="font-semibold text-console-fg">YouTube・SNS</div>
            <p className="mt-1">
              通常動画をmasterにし、Instagram・Xだけを派生。TikTokは撤退済みのため再開しません。
            </p>
          </div>
          <div className="rounded-md border border-console-border bg-console-card p-3">
            <div className="font-semibold text-console-fg">context-only</div>
            <p className="mt-1">
              既存コンテンツ補強専用。単独ページ・記事・書籍への水増しを禁止します。
            </p>
          </div>
          <div className="rounded-md border border-console-border bg-console-card p-3">
            <div className="font-semibold text-console-fg">
              権利・一次資料停止
            </div>
            <p className="mt-1">
              rights-holdとprimary-source-unavailableはDriveに保全したまま制作キューへ入れません。
            </p>
          </div>
          <div className="rounded-md border border-console-border bg-console-card p-3">
            <div className="font-semibold text-console-fg">公開承認</div>
            <p className="mt-1">
              この画面は読み取り専用。各ownerの品質・公開gateを通るまで外部公開しません。
            </p>
          </div>
        </div>
      </Section>

      <Section title="機械監査">
        <div className="rounded-md border border-console-border bg-console-card p-3 text-xs text-console-muted">
          <div className="font-semibold text-console-fg">
            {portfolio.audit.status.toUpperCase()}
          </div>
          {portfolio.audit.findings.length === 0 ? (
            <p className="mt-1">
              inventoryと既存SSOTの接続不整合はありません。
            </p>
          ) : (
            <ul className="mt-2 space-y-1">
              {portfolio.audit.findings.map((finding) => (
                <li key={`${finding.code}-${finding.itemId ?? 'all'}`}>
                  {finding.severity.toUpperCase()} {finding.code}
                  {finding.itemId ? `/${finding.itemId}` : ''}:{' '}
                  {finding.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Section>
    </div>
  );
}
