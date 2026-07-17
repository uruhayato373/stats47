import fs from "node:fs";
import { Readable } from "node:stream";

import { localPilotDir } from "@/lib/server/project-root";
import { resolveSafe, mimeFor } from "@/lib/server/safe-local-file";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * ブログ OGP パイロット (.local/ogp-pilot) を配信する。旧 servePilot 相当で Range は不要
 * (画像/webp/json のみ)。traversal / symlink 脱出は 403、不在は 404。
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;
  const resolved = resolveSafe(localPilotDir(), segments ?? []);
  if ("error" in resolved) {
    const status = resolved.error.kind === "forbidden" ? 403 : 404;
    return Response.json({ error: resolved.error.message }, { status });
  }
  const file = resolved.file;
  const size = fs.statSync(file).size;
  const type = mimeFor(file);
  const stream = Readable.toWeb(fs.createReadStream(file)) as ReadableStream<Uint8Array>;
  return new Response(stream, {
    status: 200,
    headers: {
      "content-type": type,
      "content-length": String(size),
      "cache-control": "no-store",
    },
  });
}
