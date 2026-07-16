import { getJob } from "@/lib/server/jobs";
import { jsonResponse, errorResponse } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  const job = Number.isInteger(id) ? getJob(id) : null;
  return job ? jsonResponse(job) : errorResponse("job not found", 404);
}
