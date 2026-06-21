import { NextRequest, NextResponse } from "next/server";

const isDev = process.env.NODE_ENV === "development";

/**
 * ブログ記事チャートデータ配信 API
 *
 * 開発環境: .local/r2/app/blog/ からローカルファイルを読み込み
 * 本番環境: R2 から fetchFromR2AsJson() で取得
 *
 * パス例: /api/blog-data/my-article/data/chart.json
 *       → R2 キー: app/blog/my-article/data/chart.json
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  const key = toBlogDataKey(segments);

  if (!key) {
    return NextResponse.json({ error: "不正なパスです" }, { status: 400 });
  }

  try {
    if (isDev) {
      return await readFromLocal(key);
    }
    return await readFromR2(key);
  } catch {
    return NextResponse.json(
      { error: "ファイルが見つかりません" },
      { status: 404 }
    );
  }
}

function toBlogDataKey(segments: string[]): string | null {
  if (segments.length !== 3) return null;

  const [slug, dir, file] = segments;
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) return null;
  if (dir !== "data") return null;
  if (!/^[\w.-]+\.(?:json|svg)$/.test(file)) return null;
  if (file.includes("..")) return null;

  return `app/blog/${slug}/data/${file}`;
}

function getContentType(key: string): string {
  const ext = key.split(".").at(-1) ?? "";
  if (ext === "svg") return "image/svg+xml";
  return "application/json";
}

async function readFromLocal(key: string): Promise<NextResponse> {
  const fs = await import("fs");
  const path = await import("path");

  const filePath = path.resolve(process.cwd(), `../../.local/r2/${key}`);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json(
      { error: "ファイルが見つかりません" },
      { status: 404 }
    );
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const contentType = getContentType(key);

  if (contentType !== "application/json") {
    return new NextResponse(content, {
      headers: { "Content-Type": contentType, "Cache-Control": "no-store" },
    });
  }

  const data = JSON.parse(content);
  return NextResponse.json(data, {
    headers: { "Cache-Control": "no-store" },
  });
}

async function readFromR2(key: string): Promise<NextResponse> {
  const contentType = getContentType(key);

  if (contentType !== "application/json") {
    const { fetchFromR2AsString } = await import("@stats47/r2-storage/server");
    const data = await fetchFromR2AsString(key);

    if (!data) {
      return NextResponse.json(
        { error: "ファイルが見つかりません" },
        { status: 404 }
      );
    }

    return new NextResponse(data, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    });
  }

  const { fetchFromR2AsJson } = await import("@stats47/r2-storage/server");
  const data = await fetchFromR2AsJson(key);

  if (!data) {
    return NextResponse.json(
      { error: "ファイルが見つかりません" },
      { status: 404 }
    );
  }

  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" },
  });
}
