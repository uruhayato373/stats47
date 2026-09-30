import type { ReactNode } from 'react';

import { LinkCard, StatusBadge } from '@/components/admin-ui';
import type {
  ContentChannelSummaryDTO,
  ContentFindingDTO,
  ContentStageDTO,
  ReferenceProductionStageDTO,
} from '@/lib/contracts/types';

import { Card, CardContent } from "@/components/ui/card";
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

/** チャネル 1 つの現在地 (件数と段階)。/content と /product/status が同じ見た目で並べる */
export function ChannelSummaryCard({ channel }: { channel: Omit<ContentChannelSummaryDTO, 'channel'> }) {
  return (
    <LinkCard href={channel.href}>
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-semibold text-console-fg">{channel.label}</h2>
        <span className="font-mono text-xl font-bold text-console-fg">{channel.total}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {channel.ready > 0 ? <StageBadge stage="ready" /> : null}
        {channel.review > 0 ? <StageBadge stage="review" /> : null}
        {channel.scheduled > 0 ? <StageBadge stage="scheduled" /> : null}
        {channel.published > 0 ? <StageBadge stage="published" /> : null}
        {channel.draft > 0 ? <StageBadge stage="draft" /> : null}
        {channel.blocked > 0 ? <StageBadge stage="blocked" /> : null}
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-console-muted">
        <div>準備完了 {channel.ready}</div>
        <div>審査中 {channel.review}</div>
        <div>予約 {channel.scheduled}</div>
        <div>公開 {channel.published}</div>
        <div>準備中 {channel.draft}</div>
      </dl>
      <p className="mt-3 break-all text-[10px] text-console-muted/80">{channel.source}</p>
    </LinkCard>
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
    <Card className="gap-0 py-3"><CardContent className="px-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-console-fg">
        SSOT整合性
        <StatusBadge
          tone={status === 'pass' ? 'good' : status === 'warn' ? 'warn' : 'bad'}
        >
          {status.toUpperCase()}
        </StatusBadge>
      </div>
      {findings.length === 0 ? (
        <p className="mt-2 text-xs text-console-muted">不整合はありません。</p>
      ) : (
        <ul className="mt-2 space-y-1 text-xs text-console-muted">
          {findings.slice(0, 20).map((finding, index) => (
            <li key={`${finding.code}-${finding.itemId ?? 'all'}-${index}`}>
              <span
                className={
                  finding.severity === 'error'
                    ? 'text-console-bad'
                    : 'text-console-warn'
                }
              >
                {finding.severity === 'error' ? 'ERROR' : 'WARN'}
              </span>{' '}
              {finding.channel}
              {finding.itemId ? `/${finding.itemId}` : ''}: {finding.message}
            </li>
          ))}
        </ul>
      )}
    </CardContent></Card>
  );
}

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
    <a
      href={href}
      className={
        active
          ? 'rounded-full border border-console-accent bg-console-accent px-3 py-1 text-xs font-semibold text-console-bg'
          : 'rounded-full border border-console-border px-3 py-1 text-xs text-console-muted hover:border-console-accent/60'
      }
    >
      {children}
    </a>
  );
}
