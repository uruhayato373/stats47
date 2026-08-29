import fs from "node:fs";
import { Readable } from "node:stream";

import { localKindleBooksDir } from "@/lib/server/project-root";
import { mimeFor, resolveSafe } from "@/lib/server/safe-local-file";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BOOK_ID = /^K-S[1-4]-\d{2}$/;

/** Kindle のローカル表紙だけを安全に配信する読み取り専用ルート。 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!BOOK_ID.test(id)) {
    return Response.json({ error: "not found" }, { status: 404 });
  }

  const resolved = resolveSafe(localKindleBooksDir(), [id, "v1", "cover.jpg"]);
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
