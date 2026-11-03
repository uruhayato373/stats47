import fs from "node:fs";
import path from "node:path";

import { AD_LAYOUT_ROOT } from "@/lib/server/ad-layout";
import { projectRoot } from "@/lib/server/project-root";
import { mimeFor, resolveSafe } from "@/lib/server/safe-local-file";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 広告の配置の撮影を .local/ad-layout の下からだけ配る (<日付>/<ページの種類>-<幅>.png) */
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;
  const resolved = resolveSafe(path.join(projectRoot(), AD_LAYOUT_ROOT), segments);
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
