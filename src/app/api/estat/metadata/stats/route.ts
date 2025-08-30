import { EstatMetadataService } from "@/lib/estat/metadata-service";

export async function GET(request: Request) {
  try {
    if (!process.env.DB) {
      return Response.json(
        { error: "データベース接続が設定されていません" },
        { status: 500 }
      );
    }

    const metadataService = new EstatMetadataService(process.env.DB as any);

    // データ件数とカテゴリ一覧を取得
    const [count, categories] = await Promise.all([
      metadataService.getSavedDataCount(),
      metadataService.getSavedStatList(),
    ]);

    return Response.json({
      success: true,
      data: {
        totalCount: count,
        statCount: categories.length,
        categories: categories,
      },
    });
  } catch (error) {
    console.error("統計情報取得エラー:", error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "統計情報の取得に失敗しました",
      },
      { status: 500 }
    );
  }
}
