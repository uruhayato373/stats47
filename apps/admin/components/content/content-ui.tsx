import type { ReactNode } from 'react';

import { StatusBadge } from '@/components/admin-ui';
import type {
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
