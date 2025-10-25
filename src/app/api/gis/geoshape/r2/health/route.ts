/**
 * R2ストレージヘルスチェックAPI Route
 */

import { NextResponse } from "next/server";

export async function GET() {
  try {
    const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
    const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
    const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
    const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

    const isConfigured = !!(
      R2_ACCOUNT_ID &&
      R2_ACCESS_KEY_ID &&
      R2_SECRET_ACCESS_KEY &&
      R2_BUCKET_NAME
    );

    return NextResponse.json({
      available: isConfigured,
      configured: isConfigured,
      accountId: R2_ACCOUNT_ID ? "***" : null,
      bucketName: R2_BUCKET_NAME || null,
    });
  } catch (error) {
    console.error("[R2 Health] Error:", error);
    return NextResponse.json(
      { available: false, error: "Health check failed" },
      { status: 500 }
    );
  }
}
