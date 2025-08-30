import { EstatMetadataService } from "@/lib/estat/metadata-service";

export async function POST(request: Request) {
  try {
    const { statsDataId, batchMode, startId, endId } = await request.json();

    if (!process.env.DB) {
      return Response.json(
        { error: "データベース接続が設定されていません" },
        { status: 500 }
      );
    }

    const metadataService = new EstatMetadataService(process.env.DB as any);

    if (batchMode && startId && endId) {
      // 範囲指定での一括処理
      await metadataService.fetchAndSaveMetadataRange(startId, endId);
      return Response.json({
        success: true,
        message: `${startId}から${endId}までの統計表IDを処理しました`,
      });
    } else if (Array.isArray(statsDataId)) {
      // 複数IDでの一括処理
      await metadataService.fetchAndSaveMultipleMetadata(statsDataId);
      return Response.json({
        success: true,
        message: `${statsDataId.length}件の統計表IDを処理しました`,
      });
    } else if (statsDataId) {
      // 単一IDでの処理
      await metadataService.fetchAndSaveMetadata(statsDataId);
      return Response.json({
        success: true,
        message: `${statsDataId}のメタ情報を保存しました`,
      });
    } else {
      return Response.json({ error: "統計表IDが必要です" }, { status: 400 });
    }
  } catch (error) {
    console.error("メタ情報保存エラー:", error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "メタ情報の保存に失敗しました",
      },
      { status: 500 }
    );
  }
}
