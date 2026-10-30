import fs from "node:fs";
import path from "node:path";

import { LAYOUT_REVIEW_ROOT } from "@/lib/server/layout-review";
import { projectRoot } from "@/lib/server/project-root";
import { mimeFor, resolveSafe } from "@/lib/server/safe-local-file";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** レイアウト確認の撮影を .local/layout-review/latest の下からだけ配る */
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;
  const resolved = resolveSafe(path.join(projectRoot(), LAYOUT_REVIEW_ROOT), segments);
  if ("error" in resolved) {
    return new Response(resolved.error.message, { status: resolved.error.kind === "forbidden" ? 403 : 404 });
  }
  return new Response(new Uint8Array(fs.readFileSync(resolved.file)), {
    headers: {
      "content-type": mimeFor(resolved.file),
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
