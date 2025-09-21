import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// モックの作成
vi.mock("@/services/estat-api");

// モックされたクラスとインスタンス
const mockEstatAPI = {
  getMetaInfo: vi.fn(),
};

// モックされたD1Database
const mockD1Database = {
  prepare: vi.fn(),
  exec: vi.fn(),
  batch: vi.fn(),
} as any;

describe("EstatMetaInfoService", () => {
  let service: any;
  let EstatMetaInfoService: any;

  beforeEach(async () => {
    // モックのリセット
    vi.clearAllMocks();

    // 動的インポートでクラスを取得
    const metadataModule = await import("../EstatMetaInfoService");
    EstatMetaInfoService = metadataModule.EstatMetaInfoService;

    // モジュールのモック設定
    const { estatAPI } = await import("@/services/estat-api");
    vi.mocked(estatAPI).getMetaInfo = mockEstatAPI.getMetaInfo;

    // サービスのインスタンス化
    service = new EstatMetaInfoService(mockD1Database);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("基本的なテスト", () => {
    it("EstatMetaInfoServiceクラスが存在する", () => {
      expect(EstatMetaInfoService).toBeDefined();
      expect(typeof EstatMetaInfoService).toBe("function");
    });

    it("EstatMetaInfoServiceのインスタンスが作成できる", () => {
      expect(service).toBeDefined();
      expect(typeof service).toBe("object");
    });

    it("必要なメソッドが存在する", () => {
      expect(typeof service.fetchAndSaveMetadata).toBe("function");
      expect(typeof service.searchSavedMetadata).toBe("function");
      expect(typeof service.getSavedStatList).toBe("function");
      expect(typeof service.getSavedDataCount).toBe("function");
    });
  });

  describe("fetchAndSaveMetadata", () => {
    it("正常にメタ情報を取得・変換・保存できる", async () => {
      // テストデータ
      const statsDataId = "0000010101";
      const mockMetadata = {
        GET_META_INFO: {
          PARAMETER: { STATS_DATA_ID: statsDataId },
          METADATA_INF: {
            TABLE_INF: {
              "@id": statsDataId,
              STAT_NAME: { $: "社会・人口統計体系" },
              TITLE: { $: "Ａ　人口・世帯" },
            },
            CLASS_INF: {
              CLASS_OBJ: [
                {
                  "@id": "cat01",
                  CLASS: [
                    { "@code": "A140401", "@name": "A140401", "@unit": "人" },
                  ],
                },
              ],
            },
          },
        },
      };

      // モックの戻り値を設定
      mockEstatAPI.getMetaInfo.mockResolvedValue(mockMetadata);

      // データベースのモック設定
      const mockStmt = {
        bind: vi.fn().mockReturnThis(),
        run: vi.fn().mockResolvedValue({}),
      };
      mockD1Database.prepare.mockReturnValue(mockStmt);

      // テスト実行
      await service.fetchAndSaveMetadata(statsDataId);

      // 検証
      expect(mockEstatAPI.getMetaInfo).toHaveBeenCalledWith({ statsDataId });
      expect(mockD1Database.prepare).toHaveBeenCalled();
    });

    it("APIエラーが発生した場合、エラーを投げる", async () => {
      const statsDataId = "0000010101";
      const errorMessage = "API接続エラー";

      mockEstatAPI.getMetaInfo.mockRejectedValue(new Error(errorMessage));

      // テスト実行と検証
      await expect(service.fetchAndSaveMetadata(statsDataId)).rejects.toThrow(
        errorMessage
      );
      expect(mockEstatAPI.getMetaInfo).toHaveBeenCalledWith({ statsDataId });
    });
  });

  describe("データ検索・取得メソッド", () => {
    it("searchSavedMetadataが正しく動作する", async () => {
      const query = "人口";
      const mockResults = [
        { stats_data_id: "0000010101", stat_name: "人口統計" },
      ];

      // データベースのモック設定
      const mockStmt = {
        bind: vi.fn().mockReturnThis(),
        all: vi.fn().mockResolvedValue({ results: mockResults }),
        first: vi.fn().mockResolvedValue({ count: 1 }),
      };
      mockD1Database.prepare.mockReturnValue(mockStmt);

      const results = await service.searchSavedMetadata(query);

      expect(mockD1Database.prepare).toHaveBeenCalled();
      expect(results).toEqual(mockResults);
    });

    it("getSavedStatListが正しく動作する", async () => {
      const mockStatList = [
        { stats_data_id: "0000010101", stat_name: "人口統計" },
        { stats_data_id: "0000010102", stat_name: "経済統計" },
      ];

      // データベースのモック設定
      const mockStmt = {
        bind: vi.fn().mockReturnThis(),
        all: vi.fn().mockResolvedValue({ results: mockStatList }),
      };
      mockD1Database.prepare.mockReturnValue(mockStmt);

      const results = await service.getSavedStatList();

      expect(mockD1Database.prepare).toHaveBeenCalled();
      expect(results).toEqual(mockStatList);
    });

    it("getSavedDataCountが正しく動作する", async () => {
      const mockCount = 150;

      // データベースのモック設定
      const mockStmt = {
        first: vi.fn().mockResolvedValue({ count: mockCount }),
      };
      mockD1Database.prepare.mockReturnValue(mockStmt);

      const count = await service.getSavedDataCount();

      expect(mockD1Database.prepare).toHaveBeenCalled();
      expect(count).toBe(mockCount);
    });
  });
});
