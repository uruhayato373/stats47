import { computeLimits } from "@/lib/server/limits";
import { loadGalleryState } from "@/lib/server/gallery-state";
import { jsonResponse } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return jsonResponse({ limits: computeLimits(), galleryState: loadGalleryState() });
}
