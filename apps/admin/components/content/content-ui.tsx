import type { ReactNode } from "react";

import { Badge } from "@/components/ops/primitives";
import type {
  ContentFindingDTO,
  ContentStageDTO,
  ReferenceProductionStageDTO,
} from "@/lib/contracts/types";

const STAGE_LABEL: Record<ContentStageDTO, string> = {
  draft: "原稿・準備中",
  ready: "公開準備完了",
  review: "KDP審査中",
  scheduled: "予約済み",
  published: "公開済み",
  blocked: "要対応",
};

export function StageBadge({ stage }: { stage: ContentStageDTO }) {
  const tone =
    stage === "published"
      ? "good"
      : stage === "ready" || stage === "review" || stage === "scheduled"
        ? "info"
        : stage === "blocked"
          ? "bad"
          : "neutral";
  return <Badge tone={tone}>{STAGE_LABEL[stage]}</Badge>;
}

const REFERENCE_STAGE_LABEL: Record<ReferenceProductionStageDTO, string> = {
  integrated: "統合済み",
  draft: "制作中",
  ready: "制作可能",
  blocked: "停止",
  "not-applicable": "対象外",
};

export function ReferenceStageBadge({
  stage,
}: {
  stage: ReferenceProductionStageDTO;
}) {
  const tone =
    stage === "integrated"
      ? "good"
      : stage === "draft"
        ? "warn"
      : stage === "ready"
        ? "info"
        : stage === "blocked"
          ? "bad"
          : "neutral";
  return <Badge tone={tone}>{REFERENCE_STAGE_LABEL[stage]}</Badge>;
}

export function ContentAuditPanel({
  status,
  findings,
}: {
  status: "pass" | "warn" | "fail";
  findings: ContentFindingDTO[];
}) {
  return (
    <div className="rounded-md border border-console-border bg-console-card p-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-console-fg">
        SSOT整合性
        <Badge tone={status === "pass" ? "good" : status === "warn" ? "warn" : "bad"}>
          {status.toUpperCase()}
        </Badge>
      </div>
      {findings.length === 0 ? (
        <p className="mt-2 text-xs text-console-muted">不整合はありません。</p>
      ) : (
        <ul className="mt-2 space-y-1 text-xs text-console-muted">
          {findings.slice(0, 20).map((finding, index) => (
            <li key={`${finding.code}-${finding.itemId ?? "all"}-${index}`}>
              <span
                className={
                  finding.severity === "error" ? "text-console-bad" : "text-console-warn"
                }
              >
                {finding.severity === "error" ? "ERROR" : "WARN"}
              </span>{" "}
              {finding.channel}
              {finding.itemId ? `/${finding.itemId}` : ""}: {finding.message}
            </li>
          ))}
        </ul>
      )}
    </div>
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
          ? "rounded-full border border-console-accent bg-console-accent px-3 py-1 text-xs font-semibold text-console-bg"
          : "rounded-full border border-console-border px-3 py-1 text-xs text-console-muted hover:border-console-accent/60"
      }
    >
      {children}
    </a>
  );
}
