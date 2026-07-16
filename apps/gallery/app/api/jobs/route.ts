import { listJobs } from "@/lib/server/jobs";
import { jsonResponse } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return jsonResponse({ jobs: listJobs() });
}
