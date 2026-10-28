import type { ReactNode } from 'react';
import { ScanSearchIcon, TriangleAlertIcon } from 'lucide-react';

import { Cell, DataTable, LinkCard, PanelCard, Row, StatusBadge } from '@/components/admin-ui';
import { buttonVariants } from '@stats47/components';
import type {
  ContentChannelSummaryDTO,
  ContentFindingDTO,
  ContentOperationsResponse,
  ContentStageDTO,
  ReferenceProductionStageDTO,
} from '@/lib/contracts/types';

const STAGE_LABEL: Record<ContentStageDTO, string> = {
  draft: '原稿・準備中',
  ready: '公開準備完了',
  review: 'KDP審査中',
  scheduled: '予約済み',
  published: '公開済み',
  blocked: '要対応',
};

export function StageBadge({ stage }: { stage: ContentStageDTO }) {
  const tone =
    stage === 'published'
      ? 'good'
      : stage === 'ready' || stage === 'review' || stage === 'scheduled'
        ? 'info'
        : stage === 'blocked'
          ? 'bad'
          : 'neutral';
  return <StatusBadge tone={tone}>{STAGE_LABEL[stage]}</StatusBadge>;
}

/** チャネル 1 つの現在地 (件数と段階)。/content と /product/status が同じ見た目で並べる (LinkCard の title / value / sub) */
export function ChannelSummaryCard({ channel }: { channel: Omit<ContentChannelSummaryDTO, 'channel'> }) {
  return (
    <LinkCard
      href={channel.href}
      title={channel.label}
      value={channel.total}
      sub={`準備完了 ${channel.ready}・審査中 ${channel.review}・予約 ${channel.scheduled}・公開 ${channel.published}・準備中 ${channel.draft}`}
    >
      <div className="mt-2 flex flex-wrap gap-1.5">
        {channel.ready > 0 ? <StageBadge stage="ready" /> : null}
        {channel.review > 0 ? <StageBadge stage="review" /> : null}
        {channel.scheduled > 0 ? <StageBadge stage="scheduled" /> : null}
        {channel.published > 0 ? <StageBadge stage="published" /> : null}
        {channel.draft > 0 ? <StageBadge stage="draft" /> : null}
        {channel.blocked > 0 ? <StageBadge stage="blocked" /> : null}
      </div>
      <p className="mt-2 break-all font-mono text-xs text-muted-foreground">{channel.source}</p>
    </LinkCard>
  );
}

/** 判断待ちの一覧。/content と /product/status が同じ見た目で並べる */
export function DecisionPanel({ decisions }: { decisions: ContentOperationsResponse['decisions'] }) {
  const pending = decisions.filter((x) => x.status === 'pending').length;
  return (
    <PanelCard title="判断待ち" icon={<TriangleAlertIcon />} description={`未決 ${pending} 件 / 全 ${decisions.length} 件`}>
      {decisions.length === 0 ? (
        <p className="text-sm text-muted-foreground">判断待ちはありません。</p>
      ) : (
        <DataTable columns={['状態', '判断', '再開条件', '真実源']}>
          {decisions.map((decision) => (
            <Row key={`${decision.channel}-${decision.title}`}>
              <Cell nowrap>
                <StatusBadge tone={decision.status === 'pending' ? 'warn' : 'good'}>
                  {decision.status === 'pending' ? '判断待ち' : '決定済み'}
                </StatusBadge>
              </Cell>
              <Cell>
                <div className="font-medium">{decision.title}</div>
                <p className="text-xs text-muted-foreground">{decision.detail}</p>
              </Cell>
              <Cell muted className="text-xs">
                {decision.resumeCondition}
              </Cell>
              <Cell muted className="font-mono text-xs break-all">
                {decision.source}
              </Cell>
            </Row>
          ))}
        </DataTable>
      )}
    </PanelCard>
  );
}

export const REFERENCE_STAGE_LABELS: Record<
  ReferenceProductionStageDTO,
  string
> = {
  integrated: '反映済み',
  draft: '制作中',
  ready: '制作可能',
  blocked: '確認待ち',
  'not-applicable': '対象外',
};

export function ReferenceStageBadge({
  stage,
}: {
  stage: ReferenceProductionStageDTO;
}) {
  const tone =
    stage === 'integrated'
      ? 'good'
      : stage === 'draft'
        ? 'warn'
        : stage === 'ready'
          ? 'info'
          : stage === 'blocked'
            ? 'bad'
            : 'neutral';
  return <StatusBadge tone={tone}>{REFERENCE_STAGE_LABELS[stage]}</StatusBadge>;
}

export function ContentAuditPanel({
  status,
  findings,
}: {
  status: 'pass' | 'warn' | 'fail';
  findings: ContentFindingDTO[];
}) {
  return (
    <PanelCard
      title="SSOT整合性"
      icon={<ScanSearchIcon />}
      action={
        <StatusBadge tone={status === 'pass' ? 'good' : status === 'warn' ? 'warn' : 'bad'}>
          {status.toUpperCase()}
        </StatusBadge>
      }
      description={findings.length > 20 ? `先頭 20 件 / 全 ${findings.length} 件` : undefined}
    >
      {findings.length === 0 ? (
        <p className="text-sm text-muted-foreground">不整合はありません。</p>
      ) : (
        <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
          {findings.slice(0, 20).map((finding, index) => (
            <li key={`${finding.code}-${finding.itemId ?? 'all'}-${index}`}>
              <StatusBadge tone={finding.severity === 'error' ? 'bad' : 'warn'}>
                {finding.severity === 'error' ? 'ERROR' : 'WARN'}
              </StatusBadge>{' '}
              {finding.channel}
              {finding.itemId ? `/${finding.itemId}` : ''}: {finding.message}
            </li>
          ))}
        </ul>
      )}
    </PanelCard>
  );
}

/** 絞り込みのリンク。選択中は塗りのボタン、それ以外は枠のボタン (公式 Button を a で描く) */
export function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <a href={href} className={buttonVariants({ variant: active ? 'default' : 'outline', size: "sm" })}>
      {children}
    </a>
  );
}
