import { NextRequest, NextResponse } from "next/server";
import { createD1Database } from "@/lib/d1-client";

export async function GET(request: NextRequest) {
  try {
    console.log("=== DB TEST START ===");

    // データベース接続テスト
    const db = await createD1Database() as any;
    console.log("Database connection successful");

    // 簡単なクエリテスト
    const result = await db.prepare("SELECT COUNT(*) as count FROM estat_metainfo").first();
    console.log("Query result:", result);

    console.log("=== DB TEST END ===");

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      totalRecords: result?.count || 0,
    });
  } catch (error) {
    console.error("=== DB TEST ERROR ===");
    console.error("Database test error:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
    console.error("=== DB TEST ERROR END ===");

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Database test failed",
        errorDetails: error instanceof Error ? error.stack : "Unknown error",
      },
      { status: 500 }
    );
  }
}