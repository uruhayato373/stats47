import { NextRequest, NextResponse } from "next/server";

import { fetchFromR2 } from "@stats47/r2-storage/server";
import { rankingDownloadKeyPath } from "@stats47/ranking/types";

/**
 * ランキングデータ ダウンロード API
 *
 * GET /api/ranking/[rankingKey]/download?format=csv&basis=original&encoding=utf8
 *
 * R2 に事前生成済みの CSV / JSON ファイルをそのまま stream する。
 * クライアント側で CSV を組み立てる必要がないため、Workers CPU 消費なし。
 * Cloudflare CDN cache でファイル単位にキャッシュ。
 *
 * パラメータは全て whitelist 検証で path injection を防ぐ。
 *
 * @param format    csv | json
 * @param basis     original | per_population | per_area | per_household | all-bases
 *                  (省略時は original)
 * @param encoding  utf8 | sjis (CSV のみ。JSON は常に utf8)
 */

const ALLOWED_FORMATS = new Set(["csv", "json"] as const);
const ALLOWED_BASES = new Set([
  "original",
  "per_population",
  "per_area",
  "per_household",
  "all-bases",
] as const);
const ALLOWED_ENCODINGS = new Set(["utf8", "sjis"] as const);

type Format = "csv" | "json";
type Encoding = "utf8" | "sjis";

function isFormat(v: string | null): v is Format {
  return v !== null && (ALLOWED_FORMATS as Set<string>).has(v);
}

function isEncoding(v: string | null): v is Encoding {
  return v !== null && (ALLOWED_ENCODINGS as Set<string>).has(v);
}

/** RFC 5987 形式の Content-Disposition (日本語ファイル名対応) */
function buildContentDisposition(filename: string): string {
  const encoded = encodeURIComponent(filename);
  return `attachment; filename="${filename.replace(/[^\w.-]/g, "_")}"; filename*=UTF-8''${encoded}`;
}

function buildFilename(
  rankingKey: string,
  basis: string,
  format: Format,
  encoding: Encoding,
): string {
  const basisSuffix = basis === "original" ? "" : `_${basis}`;
  const encSuffix = encoding === "sjis" ? "_sjis" : "";
  return `${rankingKey}${basisSuffix}${encSuffix}.${format}`;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ rankingKey: string }> },
) {
  const { rankingKey } = await params;
  const sp = req.nextUrl.searchParams;

  const formatParam = sp.get("format");
  const basisParam = sp.get("basis") ?? "original";
  const encodingParam = sp.get("encoding") ?? "utf8";

  if (!isFormat(formatParam)) {
    return NextResponse.json(
      { error: "Invalid format. Expected csv or json." },
      { status: 400 },
    );
  }
  if (!(ALLOWED_BASES as Set<string>).has(basisParam)) {
    return NextResponse.json(
      { error: "Invalid basis." },
      { status: 400 },
    );
  }
  if (!isEncoding(encodingParam)) {
    return NextResponse.json(
      { error: "Invalid encoding." },
      { status: 400 },
    );
  }

  // JSON は utf8 のみ
  const safeEncoding: Encoding = formatParam === "json" ? "utf8" : encodingParam;

  const path = rankingDownloadKeyPath(rankingKey, basisParam, formatParam, safeEncoding);
  const buffer = await fetchFromR2(path);

  if (!buffer) {
    return NextResponse.json(
      { error: "File not found. Run sync-snapshots to generate." },
      { status: 404 },
    );
  }

  const contentType = formatParam === "csv"
    ? safeEncoding === "sjis"
      ? "text/csv; charset=Shift_JIS"
      : "text/csv; charset=utf-8"
    : "application/json; charset=utf-8";

  const filename = buildFilename(rankingKey, basisParam, formatParam, safeEncoding);

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": buildContentDisposition(filename),
      "Cache-Control": "public, max-age=86400, s-maxage=2592000",
    },
  });
}
