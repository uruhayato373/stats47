"use client";

import { useState } from "react";

import { Badge, Button, Textarea, cn } from "@stats47/components";

import { apiSend, ApiError } from "@/lib/client/api-client";
import { MediaPreview } from "@/components/media-preview";
import type { PostDTO } from "@/lib/contracts/types";

type ExtraItem = Record<string, unknown> & {
  id?: null;
  platform: string;
  domain?: string | null;
  content_key?: string | null;
  post_type?: string | null;
  media_candidates?: Array<{ url: string | null; source: string }>;
  status?: string;
  _source?: string;
};

type GalleryItem = PostDTO | ExtraItem;

const STATUS_BADGE_CLASS: Record<string, string> = {
  posted: "border-green-500/50 bg-green-500/10 text-console-good",
  scheduled: "border-amber-500/50 bg-amber-500/10 text-console-warn",
  draft: "border-console-accent/50 bg-console-accent/10 text-console-accent",
};

function statusBadgeClass(status: string | undefined) {
  return (
    STATUS_BADGE_CLASS[status ?? ""] ??
    "border-console-border bg-console-border/30 text-console-muted"
  );
}

function fmtDatetimeLocal(s: string | null | undefined): string {
  if (!s) return "";
  return s.replace(" ", "T").slice(0, 16);
}

/** id を持つ post (draft/scheduled/posted) かどうかの型ガード。extras (未登録) は id が null/undefined。 */
function hasId(item: GalleryItem): item is PostDTO {
  return item.id !== null && item.id !== undefined;
}

export function PostCard({
  item,
  onChanged,
  onJobStarted,
}: {
  item: GalleryItem;
  onChanged: () => void;
  onJobStarted: (jobId: string, title: string) => void;
}) {
  const mediaCandidates = ((item.media_candidates ?? []) as Array<{
    url: string | null;
    source: string;
  }>)
    .filter((c): c is { url: string; source: string } => Boolean(c.url))
    .map((c) => ({ url: c.url, source: c.source }));

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-console-border bg-console-card">
      <div className="relative">
        <MediaPreview candidates={mediaCandidates} aspectClassName="aspect-[16/10]" />
        <Badge
          variant="outline"
          className={cn(
            "absolute left-1.5 top-1.5 z-10 text-[10px]",
            statusBadgeClass(item.status),
          )}
        >
          {item.status || "?"}
        </Badge>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-2.5 text-xs">
        <div className="break-all text-[13px] font-semibold text-console-fg">
          {item.content_key || "(no key)"}{" "}
          <span className="font-normal text-console-muted">
            #{hasId(item) ? item.id : "-"}
          </span>
        </div>
        <div className="flex flex-wrap gap-2 text-console-muted">
          <span>{item.platform}</span>
          <span>{item.domain || ""}</span>
          <span>{item.post_type || ""}</span>
          {item._source ? <span>{String(item._source)}</span> : null}
        </div>

        {item.status === "posted" ? (
          <PostedBody item={item as PostDTO} />
        ) : hasId(item) ? (
          <EditableBody
            post={item}
            onChanged={onChanged}
            onJobStarted={onJobStarted}
          />
        ) : (
          <UnregisteredBody item={item} onChanged={onChanged} />
        )}
      </div>
    </div>
  );
}

function PostedBody({ item }: { item: PostDTO }) {
  const [open, setOpen] = useState(false);
  const postUrl = typeof item.post_url === "string" ? item.post_url : null;
  const engagement =
    item.impressions && item.impressions > 0
      ? (
          (((item.likes || 0) + (item.reposts || 0) + (item.replies || 0)) /
            item.impressions) *
          100
        ).toFixed(1) + "%"
      : "-";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-3 text-console-muted">
        <span>
          📅 <b className="text-console-fg">{item.posted_at || "-"}</b>
        </span>
        <span>
          👁 <b className="text-console-fg">{item.impressions ?? "-"}</b>
        </span>
        <span>
          ❤️ <b className="text-console-fg">{item.likes ?? "-"}</b>
        </span>
        <span>
          eng <b className="text-console-fg">{engagement}</b>
        </span>
      </div>
      {postUrl ? (
        <a
          href={postUrl}
          target="_blank"
          rel="noreferrer"
          className="text-console-accent hover:underline"
        >
          投稿を見る ↗
        </a>
      ) : null}
      {item.caption ? (
        <div>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="cursor-pointer text-console-muted hover:text-console-fg"
          >
            caption {open ? "▲" : "▼"}
          </button>
          {open ? (
            <div className="mt-1.5 whitespace-pre-wrap text-console-fg">
              {item.caption}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function EditableBody({
  post,
  onChanged,
  onJobStarted,
}: {
  post: PostDTO;
  onChanged: () => void;
  onJobStarted: (jobId: string, title: string) => void;
}) {
  const [caption, setCaption] = useState(post.caption || "");
  const [dt, setDt] = useState(fmtDatetimeLocal(post.scheduled_at));
  const [savedCaption, setSavedCaption] = useState(post.caption || "");
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = caption !== savedCaption;

  const saveCaption = async () => {
    setSaving(true);
    setError(null);
    try {
      await apiSend(`/api/posts/${post.id}`, "PATCH", { caption });
      setSavedCaption(caption);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const runPublishX = async (opts: {
    dry_run?: boolean;
    immediate?: boolean;
    force?: boolean;
  }) => {
    setBusy(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        content_key: post.content_key,
        domain: post.domain || "ranking",
        ...opts,
      };
      if (dt && !opts.immediate) body.datetime = dt;
      const r = await apiSend<{ id: string | number }>(
        "/api/actions/publish-x",
        "POST",
        body,
      );
      onJobStarted(
        String(r.id),
        `publish-x: ${post.content_key}${opts.dry_run ? " (dry-run)" : ""}`,
      );
    } catch (e) {
      if (e instanceof ApiError && e.status === 428) {
        if (window.confirm(`${e.message}\n\nそれでも実行しますか?`)) {
          await runPublishX({ ...opts, force: true });
          return;
        }
      } else {
        setError(e instanceof ApiError ? e.message : String(e));
      }
    } finally {
      setBusy(false);
    }
  };

  const runScheduleIg = async () => {
    const date = dt.slice(0, 10);
    if (!date) {
      window.alert("予約日時を入力してください");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const r = await apiSend<{ file: string; postId: number }>(
        "/api/actions/schedule-ig",
        "POST",
        {
          date,
          time: dt.slice(11, 16) || "09:00",
          type: post.post_type || "image",
          domain: post.domain,
          content_key: post.content_key,
          caption,
        },
      );
      onChanged();
      window.alert(`予約登録: ${r.file} + posts#${r.postId}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Textarea
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="caption"
        className="min-h-[64px] bg-console-bg text-xs"
      />
      <div className="flex flex-wrap items-center gap-1.5">
        <input
          type="datetime-local"
          value={dt}
          onChange={(e) => setDt(e.target.value)}
          className="rounded-md border border-console-border bg-console-bg px-1.5 py-1 text-xs text-console-fg"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 px-2 text-xs"
          disabled={!dirty || saving}
          onClick={saveCaption}
        >
          caption 保存
        </Button>
      </div>

      {post.platform === "x" ? (
        <div className="flex flex-wrap gap-1.5">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs"
            disabled={busy}
            onClick={() => runPublishX({ dry_run: true })}
          >
            dry-run
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-7 px-2 text-xs"
            disabled={busy}
            onClick={() => runPublishX({})}
          >
            予約投稿
          </Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            className="h-7 px-2 text-xs"
            disabled={busy}
            onClick={() => {
              if (window.confirm(`即時投稿します: ${post.content_key}`)) {
                void runPublishX({ immediate: true });
              }
            }}
          >
            即時投稿
          </Button>
        </div>
      ) : post.platform === "instagram" ? (
        <div className="flex flex-wrap gap-1.5">
          <Button
            type="button"
            size="sm"
            className="h-7 px-2 text-xs"
            disabled={busy}
            onClick={() => void runScheduleIg()}
          >
            IG 予約登録 (cron が投稿)
          </Button>
        </div>
      ) : null}

      {error ? <p className="text-[11px] text-console-bad">{error}</p> : null}
    </div>
  );
}

function UnregisteredBody({
  item,
  onChanged,
}: {
  item: ExtraItem;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = async () => {
    setBusy(true);
    setError(null);
    try {
      await apiSend("/api/posts", "POST", {
        platform: item.platform,
        domain: item.domain,
        content_key: item.content_key,
        post_type: item.post_type,
      });
      onChanged();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <Button
        type="button"
        size="sm"
        className="h-7 w-fit px-2 text-xs"
        disabled={busy}
        onClick={() => void register()}
      >
        draft 登録
      </Button>
      {error ? <p className="text-[11px] text-console-bad">{error}</p> : null}
    </div>
  );
}
