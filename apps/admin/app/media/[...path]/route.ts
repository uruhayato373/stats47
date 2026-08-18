import fs from "node:fs";
import { Readable } from "node:stream";

import { localSnsDir } from "@/lib/server/project-root";
import { resolveSafe, parseRange, mimeFor } from "@/lib/server/safe-local-file";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * ローカル SNS 素材 (.local/r2/sns) を配信する。Range 対応 (video 再生に必須)。
 * traversal / symlink 脱出は resolveSafe が拒否 (403)、不在は 404。
 */

/**
 * fs stream → Web stream。client 切断 (video seek のたびに発生) で
 * "Controller is already closed" の uncaughtException が出ないよう、
 * abort で source を destroy し stream error は握りつぶす。
 */
function fileStream(file: string, req: Request, opts?: { start: number; end: number }) {
  const node = fs.createReadStream(file, opts);
  node.on("error", () => {
    /* client 切断後の遅延エラーはログ不要 (握りつぶし) */
  });
  req.signal?.addEventListener("abort", () => node.destroy(), { once: true });
  return Readable.toWeb(node) as ReadableStream<Uint8Array>;
}
export async function GET(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;
  const resolved = resolveSafe(localSnsDir(), segments ?? []);
  if ("error" in resolved) {
    const status = resolved.error.kind === "forbidden" ? 403 : 404;
    return Response.json({ error: resolved.error.message }, { status });
  }
  const file = resolved.file;
  const size = fs.statSync(file).size;
  const type = mimeFor(file);
  const range = parseRange(req.headers.get("range"), size);

  if (range === "unsatisfiable") {
    return new Response(null, {
      status: 416,
      headers: { "content-range": `bytes */${size}`, "accept-ranges": "bytes" },
    });
  }

  if (range) {
    const { start, end } = range;
    const stream = fileStream(file, req, { start, end });
    return new Response(stream, {
      status: 206,
      headers: {
        "content-type": type,
        "content-length": String(end - start + 1),
        "content-range": `bytes ${start}-${end}/${size}`,
        "accept-ranges": "bytes",
        "cache-control": "no-store",
      },
    });
  }

  const stream = fileStream(file, req);
  return new Response(stream, {
    status: 200,
    headers: {
      "content-type": type,
      "content-length": String(size),
      "accept-ranges": "bytes",
      "cache-control": "no-store",
    },
  });
}
