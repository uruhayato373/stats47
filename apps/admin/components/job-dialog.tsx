"use client";

import { useEffect, useRef, useState } from "react";

import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  cn,
} from "@stats47/components";

import { apiGet } from "@/lib/client/api-client";

type JobStatus = "running" | "success" | "failed";

type JobResponse = {
  id: string;
  kind: string;
  status: JobStatus;
  log: string[];
  startedAt: string;
  endedAt: string | null;
};

const POLL_INTERVAL_MS = 1500;

const STATUS_LABEL: Record<JobStatus, string> = {
  running: "実行中",
  success: "成功",
  failed: "失敗",
};

const STATUS_BADGE_CLASS: Record<JobStatus, string> = {
  running: "bg-console-accent/20 text-console-accent",
  success: "bg-green-500/20 text-console-good",
  failed: "bg-red-500/20 text-console-bad",
};

/**
 * ジョブ実行状況をポーリングして表示するダイアログ。
 * 1.5 秒間隔で GET /api/jobs/:id を叩き、status が success/failed になったらポーリングを止める。
 * 旧 UI (sns.html / assets.html の watchJob) の setInterval ループを React 化したもの。
 */
export function JobDialog({
  jobId,
  onClose,
  onFinished,
}: {
  jobId: string;
  onClose: () => void;
  onFinished?: (status: JobStatus) => void;
}) {
  const [job, setJob] = useState<JobResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const logRef = useRef<HTMLPreElement>(null);
  const onFinishedRef = useRef(onFinished);
  onFinishedRef.current = onFinished;

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const tick = async () => {
      try {
        const data = await apiGet<JobResponse>(`/api/jobs/${jobId}`);
        if (cancelled) return;
        setJob(data);
        if (data.status !== "running") {
          if (timer) clearInterval(timer);
          onFinishedRef.current?.(data.status);
        }
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
        if (timer) clearInterval(timer);
      }
    };

    void tick();
    timer = setInterval(() => void tick(), POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [jobId]);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [job?.log]);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl bg-console-card text-console-fg border-console-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-console-fg">
            <span>
              Job #{jobId}
              {job ? ` — ${job.kind}` : ""}
            </span>
            {job ? (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  STATUS_BADGE_CLASS[job.status],
                )}
              >
                {STATUS_LABEL[job.status]}
              </span>
            ) : null}
          </DialogTitle>
        </DialogHeader>

        {error ? (
          <p className="text-sm text-console-bad">{error}</p>
        ) : (
          <pre
            ref={logRef}
            className="max-h-[52vh] overflow-auto whitespace-pre-wrap rounded-md bg-console-bg p-3 font-mono text-xs text-console-fg"
          >
            {job?.log && job.log.length > 0 ? job.log.join("\n") : "起動中..."}
          </pre>
        )}

        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            閉じる
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
