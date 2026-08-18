import type { NextRequest } from "next/server";

import { updatePost } from "@/lib/server/posts";
import { jsonResponse, errorResponse, parseJsonBody } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isInteger(id)) return errorResponse("invalid id", 400);
  let body: unknown;
  try {
    body = await parseJsonBody(req);
  } catch (e) {
    return errorResponse((e as Error).message, 400);
  }
  if (typeof body !== "object" || body === null) {
    return errorResponse("caption / scheduled_at のみ編集可", 400);
  }
  const result = updatePost(id, body as Record<string, unknown>);
  if (!result.ok) return errorResponse(result.error, result.code);
  return jsonResponse(result.post);
}
