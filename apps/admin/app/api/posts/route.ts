import type { NextRequest } from "next/server";

import { filterPosts, createDraft } from "@/lib/server/posts";
import { CreatePost } from "@/lib/contracts/schemas";
import { jsonResponse, errorResponse, parseJsonBody } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const result = filterPosts({
    platform: sp.get("platform") ?? undefined,
    status: sp.get("status") ?? undefined,
    domain: sp.get("domain") ?? undefined,
    q: sp.get("q") ?? undefined,
  });
  return jsonResponse(result);
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await parseJsonBody(req);
  } catch (e) {
    return errorResponse((e as Error).message, 400);
  }
  const parsed = CreatePost.safeParse(body);
  if (!parsed.success) {
    return errorResponse("platform/domain/content_key は必須", 400);
  }
  const result = createDraft(parsed.data);
  if (!result.ok) return errorResponse(result.error, result.code);
  return jsonResponse(result.post, 201);
}
