/**
 * CSV生成API
 *
 * 大容量データのCSV生成エンドポイント
 * 10,000行以上のデータをサーバーサイドで処理
 */

import { NextRequest, NextResponse } from "next/server";

import { FormattedValue } from "@/lib/estat-api";
import { generateCSV } from "@/lib/export/csv/generator";
import { CSVExportOptions } from "@/lib/export/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      data,
      options,
    }: { data: FormattedValue[]; options?: Partial<CSVExportOptions> } = body;

    // バリデーション
    if (!data || !Array.isArray(data)) {
      return NextResponse.json(
        { error: "Invalid data: data must be an array" },
        { status: 400 }
      );
    }

    if (data.length === 0) {
      return NextResponse.json(
        { error: "Invalid data: data array is empty" },
        { status: 400 }
      );
    }

    // データサイズ制限（100,000行）
    if (data.length > 100000) {
      return NextResponse.json(
        { error: "Data too large: maximum 100,000 rows allowed" },
        { status: 413 }
      );
    }

    // CSV生成
    const csvContent = generateCSV(data, options);

    // BOM付きUTF-8でレスポンス
    const bom = "\uFEFF";
    const response = new NextResponse(bom + csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${
          options?.filename || "export"
        }.csv"`,
        "Cache-Control": "no-cache",
      },
    });

    return response;
  } catch (error) {
    console.error("[CSV Export API] Error:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
