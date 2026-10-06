import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";

import { localKindleBooksDir, localKindleCoverDraftsDir, projectRoot } from "@/lib/server/project-root";
import { mimeFor, resolveSafe } from "@/lib/server/safe-local-file";
import { KDP_LISTINGS } from "../../../../../config/paths.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BOOK_ID = /^K-S[1-4]-\d{2}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function currentCoverSegments(id: string): string[] | null {
  try {
    const raw: unknown = JSON.parse(
      fs.readFileSync(path.join(projectRoot(), KDP_LISTINGS), "utf8"),
    );
    if (!isRecord(raw) || !isRecord(raw.listings)) return null;
    const listing = raw.listings[id];
    if (!isRecord(listing) || typeof listing.coverPath !== "string") return null;
    const normalized = listing.coverPath.replaceAll("\\", "/");
    const prefix = `.local/kindle-books/${id}/`;
    if (!normalized.startsWith(prefix)) return null;
    const relative = normalized.slice(prefix.length);
    const segments = relative.split("/");
    if (segments.length !== 2 || !/^cover\.(?:jpe?g|png)$/i.test(segments[1])) return null;
    return [id, ...segments];
  } catch {
    return null;
  }
}

/** Kindle のローカル表紙だけを安全に配信する読み取り専用ルート。 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!BOOK_ID.test(id)) {
    return Response.json({ error: "not found" }, { status: 404 });
  }

  // 未承認ドラフトがあれば優先表示する。既刊の版ディレクトリは不変のまま保つ。
  const draft = resolveSafe(localKindleCoverDraftsDir(), [id, "cover.jpg"]);
  const segments = currentCoverSegments(id);
  const resolved = "error" in draft
    ? segments
      ? resolveSafe(localKindleBooksDir(), segments)
      : draft
    : draft;
  if ("error" in resolved) {
    const status = resolved.error.kind === "forbidden" ? 403 : 404;
    return Response.json({ error: resolved.error.message }, { status });
  }

  const size = fs.statSync(resolved.file).size;
  const stream = Readable.toWeb(fs.createReadStream(resolved.file)) as ReadableStream<Uint8Array>;
  return new Response(stream, {
    status: 200,
    headers: {
      "content-type": mimeFor(resolved.file),
      "content-length": String(size),
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
