import { NextRequest, NextResponse } from "next/server";

import {
  buildAllBasesCsv,
  buildSingleSeriesCsv,
  getRankingDownloadSeries,
} from "@stats47/ranking/server";

import { DOWNLOAD_DATA_CACHE_HEADERS, NO_STORE_CACHE_HEADERS } from "@/lib/cache-policy";
import { getRankingRetirementResponse } from "@/lib/ranking-retirement-response";

/**
 * ランキングデータ ダウンロード API
 *
 * GET /api/ranking/[rankingKey]/download?format=csv&basis=original&encoding=utf8
 *
 * R2 観測値からオンザフライで CSV / JSON を生成して stream する (完全DBレス・事前 bake なし)。
 * 全 metric を事前生成すると 1GB 超 / 2 万ファイル超の R2 肥大化になるため、都度生成に統一
 * (Phase 6 で削除した事前 bake exporter を復活させない方針、2026-06-01)。
 * Cloudflare Workers Cache は `Cloudflare-CDN-Cache-Control` で結果をedgeキャッシュする。
 *
 * パラメータは全て whitelist 検証で path injection を防ぐ。
 *
 * @param format    csv | json
 * @param basis     original | per_population | per_area | all-bases
 *                  (省略時は original)
 * @param encoding  utf8 | sjis (CSV のみ。JSON は常に utf8)
 */

const ALLOWED_FORMATS = new Set(["csv", "json"] as const);
const ALLOWED_BASES = new Set([
  "original",
  "per_population",
  "per_area",
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
  const retirementResponse = getRankingRetirementResponse(req, rankingKey);
  if (retirementResponse) return retirementResponse;
  const sp = req.nextUrl.searchParams;

  const formatParam = sp.get("format");
  const basisParam = sp.get("basis") ?? "original";
  const encodingParam = sp.get("encoding") ?? "utf8";

  if (!isFormat(formatParam)) {
    return NextResponse.json(
      { error: "Invalid format. Expected csv or json." },
      { status: 400, headers: NO_STORE_CACHE_HEADERS },
    );
  }
  if (!(ALLOWED_BASES as Set<string>).has(basisParam)) {
    return NextResponse.json(
      { error: "Invalid basis." },
      { status: 400, headers: NO_STORE_CACHE_HEADERS },
    );
  }
  if (!isEncoding(encodingParam)) {
    return NextResponse.json(
      { error: "Invalid encoding." },
      { status: 400, headers: NO_STORE_CACHE_HEADERS },
    );
  }

  // JSON は utf8 のみ
  let safeEncoding: Encoding = formatParam === "json" ? "utf8" : encodingParam;

  // R2 観測値からオンザフライで系列を取得 (47都道府県 × 全年)。
  const series = await getRankingDownloadSeries(rankingKey, "prefecture", basisParam);
  if (series.length === 0) {
    return NextResponse.json(
      { error: "No data for this ranking/basis." },
      { status: 404, headers: NO_STORE_CACHE_HEADERS },
    );
  }

  // 本文生成
  let bodyText: string;
  if (formatParam === "json") {
    bodyText =
      basisParam === "all-bases"
        ? JSON.stringify(Object.fromEntries(series.map((s) => [s.basisKey, s.values])))
        : JSON.stringify(series[0].values);
  } else if (basisParam === "all-bases") {
    bodyText = buildAllBasesCsv(series);
  } else {
    bodyText = buildSingleSeriesCsv(series[0].values);
  }

  // 出力 body: UTF-8 / JSON は string をそのまま渡す (BodyInit)。
  // SJIS のみ iconv-lite で byte 列に encode。Workers で動かない等の失敗時は UTF-8 文字列に
  // graceful fallback する (500 を出さない)。動的 import でバンドル時の巻き込みも避ける。
  let responseBody: string | Uint8Array<ArrayBuffer> = bodyText;
  if (formatParam === "csv" && safeEncoding === "sjis") {
    try {
      const iconv = (await import("iconv-lite")).default;
      responseBody = new Uint8Array(iconv.encode(bodyText, "Shift_JIS"));
    } catch {
      responseBody = bodyText; // fallback: UTF-8 文字列
      safeEncoding = "utf8"; // Content-Type / filename を UTF-8 に合わせる
    }
  }

  const contentType = formatParam === "csv"
    ? safeEncoding === "sjis"
      ? "text/csv; charset=Shift_JIS"
      : "text/csv; charset=utf-8"
    : "application/json; charset=utf-8";

  const filename = buildFilename(rankingKey, basisParam, formatParam, safeEncoding);

  return new NextResponse(responseBody, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": buildContentDisposition(filename),
      // オンザフライ生成だが結果は決定的なので edge に長めにキャッシュさせる
      ...DOWNLOAD_DATA_CACHE_HEADERS,
    },
  });
}
