import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// モックの作成
vi.mock("../metadata-database");
vi.mock("@/services/estat-api");
vi.mock("../data-transformer");

// モックされたクラスとインスタンス
const mockEstatMetadataDatabaseService = vi.fn();
const mockEstatAPI = {
  getMetaInfo: vi.fn(),
};
const mockEstatDataTransformer = {
  transformToCSVFormat: vi.fn(),
};

// モックされたD1Database
const mockD1Database = {
  prepare: vi.fn(),
  exec: vi.fn(),
  batch: vi.fn(),
} as any;

// モックされたEstatMetadataDatabaseServiceインスタンス
const mockDbServiceInstance = {
  saveTransformedData: vi.fn(),
  search: vi.fn(),
  getStatList: vi.fn(),
  getCount: vi.fn(),
  findByStatsId: vi.fn(),
  findByCategory: vi.fn(),
  db: mockD1Database,
  processBatch: vi.fn(),
  findByStatName: vi.fn(),
  getCategoryCounts: vi.fn(),
  getLastUpdated: vi.fn(),
} as any;

describe("EstatMetadataService", () => {
  let service: any;
  let EstatMetadataService: any;

  beforeEach(async () => {
    // モックのリセット
    vi.clearAllMocks();

    // 動的インポートでクラスを取得
    const metadataModule = await import("../metadata-service");
    EstatMetadataService = metadataModule.EstatMetadataService;

    // モックされたクラスのコンストラクタを設定
    mockEstatMetadataDatabaseService.mockImplementation(
      () => mockDbServiceInstance
    );

    // モジュールのモック設定
    const { EstatMetadataDatabaseService } = await import(
      "../metadata-database"
    );
    const { estatAPI } = await import("@/services/estat-api");
    const { EstatDataTransformer } = await import("../data-transformer");

    vi.mocked(EstatMetadataDatabaseService).mockImplementation(
      () => mockDbServiceInstance
    );
    vi.mocked(estatAPI).getMetaInfo = mockEstatAPI.getMetaInfo;
    vi.mocked(EstatDataTransformer).transformToCSVFormat =
      mockEstatDataTransformer.transformToCSVFormat;

    // サービスのインスタンス化
    service = new EstatMetadataService(mockD1Database);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("基本的なテスト", () => {
    it("EstatMetadataServiceクラスが存在する", () => {
      expect(EstatMetadataService).toBeDefined();
      expect(typeof EstatMetadataService).toBe("function");
    });

    it("EstatMetadataServiceのインスタンスが作成できる", () => {
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
              STAT_NAME: { $: "社会・人口統計体系" },
              TITLE: { $: "Ａ　人口・世帯" },
            },
            CLASS_INF: {
              CLASS_OBJ: [
                {
                  "@id": "cat01",
                  CLASS: [{ "@name": "A140401", "@unit": "人" }],
                },
              ],
            },
          },
        },
      };

      const mockTransformedData = [
        {
          stats_data_id: statsDataId,
          stat_name: "社会・人口統計体系",
          title: "Ａ　人口・世帯",
          cat01: "A140401",
          item_name: "A140401",
          unit: "人",
        },
      ];

      // モックの戻り値を設定
      mockEstatAPI.getMetaInfo.mockResolvedValue(mockMetadata);
      mockEstatDataTransformer.transformToCSVFormat.mockReturnValue(
        mockTransformedData
      );
      mockDbServiceInstance.saveTransformedData.mockResolvedValue(undefined);

      // テスト実行
      await service.fetchAndSaveMetadata(statsDataId);

      // 検証
      expect(mockEstatAPI.getMetaInfo).toHaveBeenCalledWith({ statsDataId });
      expect(
        mockEstatDataTransformer.transformToCSVFormat
      ).toHaveBeenCalledWith(mockMetadata);
      expect(mockDbServiceInstance.saveTransformedData).toHaveBeenCalledWith(
        mockTransformedData
      );
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
      expect(
        mockEstatDataTransformer.transformToCSVFormat
      ).not.toHaveBeenCalled();
      expect(mockDbServiceInstance.saveTransformedData).not.toHaveBeenCalled();
    });
  });

  describe("データ検索・取得メソッド", () => {
    it("searchSavedMetadataが正しく動作する", async () => {
      const query = "人口";
      const mockResults = [
        { stats_data_id: "0000010101", stat_name: "人口統計" },
      ];

      mockDbServiceInstance.search.mockResolvedValue(mockResults);

      const results = await service.searchSavedMetadata(query);

      expect(mockDbServiceInstance.search).toHaveBeenCalledWith(query);
      expect(results).toEqual(mockResults);
    });

    it("getSavedStatListが正しく動作する", async () => {
      const mockStatList = [
        { stats_data_id: "0000010101", stat_name: "人口統計" },
        { stats_data_id: "0000010102", stat_name: "経済統計" },
      ];

      mockDbServiceInstance.getStatList.mockResolvedValue(mockStatList);

      const results = await service.getSavedStatList();

      expect(mockDbServiceInstance.getStatList).toHaveBeenCalled();
      expect(results).toEqual(mockStatList);
    });

    it("getSavedDataCountが正しく動作する", async () => {
      const mockCount = 150;

      mockDbServiceInstance.getCount.mockResolvedValue(mockCount);

      const count = await service.getSavedDataCount();

      expect(mockDbServiceInstance.getCount).toHaveBeenCalled();
      expect(count).toBe(mockCount);
    });
  });
});
