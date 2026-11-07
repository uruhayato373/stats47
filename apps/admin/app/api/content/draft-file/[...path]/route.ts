import fs from "node:fs";
import path from "node:path";

import { projectRoot } from "@/lib/server/project-root";
import { mimeFor, resolveSafe } from "@/lib/server/safe-local-file";

import { datasetDir } from "../../../../../../../config/datasets.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 公開待ちの原稿の図 (contents/blog) と背景画像を返す。読み取りのみ。
 * 先頭の segment で置き場を選ぶ: draft/<slug>/data/<name>.svg か background/<slug>.jpg。
 */
const ROOTS: Record<string, string> = { draft: "contents/blog", background: datasetDir("blog.article-backgrounds") };
const IMAGE = /\.(?:svg|jpe?g|png)$/i;

export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;
  const [kind, ...rest] = segments ?? [];
  const base = ROOTS[kind];
  if (!base || !IMAGE.test(rest.at(-1) ?? "")) return Response.json({ error: "対象外" }, { status: 404 });
  const resolved = resolveSafe(path.join(projectRoot(), base), rest);
  if ("error" in resolved) {
    return Response.json({ error: resolved.error.message }, { status: resolved.error.kind === "forbidden" ? 403 : 404 });
  }
  return new Response(fs.readFileSync(resolved.file), { headers: { "Content-Type": mimeFor(resolved.file) } });
}
