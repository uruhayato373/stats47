import { mimeFor } from "@/lib/server/safe-local-file";
import { BOOK_ID, readKindleImage } from "@/lib/server/kindle-epub";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 出品台帳の入稿版 EPUB の中の図を 1 枚だけ返す読み取り専用ルート (/content/kindle/[id] の本文表示用)。 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; file: string }> },
) {
  const { id, file } = await params;
  const version = new URL(request.url).searchParams.get("version");
  const image = BOOK_ID.test(id) ? readKindleImage(id, `images/${file}`, version) : null;
  if (!image) return Response.json({ error: "not found" }, { status: 404 });
  return new Response(new Uint8Array(image), {
    status: 200,
    headers: {
      "content-type": mimeFor(file),
      "content-length": String(image.length),
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
