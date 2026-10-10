import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";

import { getById } from "@/lib/server/posts-store";
import { mimeFor } from "@/lib/server/safe-local-file";
import { driveAbsolutePath, resolveDriveRoot } from "../../../../../../.claude/scripts/sns/lib/sns-drive-assets.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ID = /^[0-9]+$/;
const FILE = /^[A-Za-z0-9._-]+$/;

/**
 * 投稿台帳 (posts.json) の assets[] に記録した素材だけを Google Drive のローカルマウントから配信する。
 * 台帳に無いファイル名・SNS素材/ の外を指すパスは配信しない (読み取り専用)。
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string; file: string }> }) {
  const { id, file } = await params;
  const name = decodeURIComponent(file);
  if (!ID.test(id) || !FILE.test(name)) return Response.json({ error: "not found" }, { status: 404 });
  const post = getById(Number(id));
  const asset = (post?.assets ?? []).find(
    (a) => a.state === "archived" && a.drive_path && path.posix.basename(a.drive_path) === name,
  );
  if (!asset?.drive_path) return Response.json({ error: "台帳に無い素材" }, { status: 404 });

  let abs: string;
  try {
    abs = driveAbsolutePath(await resolveDriveRoot(), asset.drive_path);
  } catch (e) {
    return Response.json({ error: `Google Drive を解決できません: ${(e as Error).message}` }, { status: 503 });
  }
  if (!fs.existsSync(abs)) return Response.json({ error: `Drive に素材がありません: ${asset.drive_path}` }, { status: 404 });

  const size = fs.statSync(abs).size;
  const stream = Readable.toWeb(fs.createReadStream(abs)) as ReadableStream<Uint8Array>;
  return new Response(stream, {
    status: 200,
    headers: {
      "content-type": asset.mime ?? mimeFor(abs),
      "content-length": String(size),
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
