import { EstatMetadataService } from "@/lib/estat/metadata-service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const category = searchParams.get("category") || "";
    const statsDataId = searchParams.get("statsDataId") || "";

    if (!process.env.DB) {
      return Response.json(
        { error: "データベース接続が設定されていません" },
        { status: 500 }
      );
    }

    const metadataService = new EstatMetadataService(process.env.DB as any);

    let results;
    if (statsDataId) {
      results = await metadataService.getSavedMetadataByStatsId(statsDataId);
    } else if (category) {
      results = await metadataService.getSavedMetadataByCategory(category);
    } else if (query) {
      results = await metadataService.searchSavedMetadata(query);
    } else {
      results = await metadataService.getSavedStatList();
    }

    return Response.json({ success: true, data: results });
  } catch (error) {
    console.error("検索エラー:", error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : "検索に失敗しました",
      },
      { status: 500 }
    );
  }
}
