var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-korphD/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// src/lib/estat/types/errors.ts
var EstatAPIError = class _EstatAPIError extends Error {
  constructor(message, code, status, details) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
    this.name = "EstatAPIError";
  }
  static {
    __name(this, "EstatAPIError");
  }
  /**
   * エラーコードからエラーメッセージを生成
   */
  static fromErrorCode(code, details) {
    const messages = {
      [0 /* OK */]: "\u6B63\u5E38\u306B\u7D42\u4E86\u3057\u307E\u3057\u305F\u3002",
      [1 /* OK_WITH_WARNING */]: "\u6B63\u5E38\u306B\u7D42\u4E86\u3057\u307E\u3057\u305F\u304C\u3001\u4E00\u90E8\u306B\u30A8\u30E9\u30FC\u304C\u3042\u308A\u307E\u3059\u3002",
      [2 /* NO_DATA */]: "\u30C7\u30FC\u30BF\u304C\u5B58\u5728\u3057\u307E\u305B\u3093\u3002",
      [100 /* INVALID_APP_ID */]: "\u30A2\u30D7\u30EA\u30B1\u30FC\u30B7\u30E7\u30F3ID\u304C\u6307\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002",
      [101 /* INVALID_LANG */]: "\u30D1\u30E9\u30E1\u30FC\u30BF lang \u304C\u4E0D\u6B63\u3067\u3059\u3002",
      [102 /* INVALID_SEARCH_KIND */]: "\u30D1\u30E9\u30E1\u30FC\u30BF searchKind \u304C\u4E0D\u6B63\u3067\u3059\u3002",
      [103 /* INVALID_SURVEY_YEARS */]: "\u30D1\u30E9\u30E1\u30FC\u30BF surveyYears \u304C\u4E0D\u6B63\u3067\u3059\u3002",
      [104 /* INVALID_OPEN_YEARS */]: "\u30D1\u30E9\u30E1\u30FC\u30BF openYears \u304C\u4E0D\u6B63\u3067\u3059\u3002",
      [105 /* INVALID_STATS_FIELD */]: "\u30D1\u30E9\u30E1\u30FC\u30BF statsField \u304C\u4E0D\u6B63\u3067\u3059\u3002",
      [106 /* INVALID_STATS_CODE */]: "\u30D1\u30E9\u30E1\u30FC\u30BF statsCode \u304C\u4E0D\u6B63\u3067\u3059\u3002",
      [107 /* INVALID_SEARCH_WORD */]: "\u30D1\u30E9\u30E1\u30FC\u30BF searchWord \u304C\u4E0D\u6B63\u3067\u3059\u3002",
      [110 /* INVALID_DATA_FORMAT */]: "\u30D1\u30E9\u30E1\u30FC\u30BF dataFormat \u304C\u4E0D\u6B63\u3067\u3059\u3002",
      [111 /* INVALID_STATS_DATA_ID */]: "\u30D1\u30E9\u30E1\u30FC\u30BF statsDataId \u304C\u4E0D\u6B63\u3067\u3059\u3002",
      [112 /* INVALID_NARROWING_COND */]: "\u7D5E\u308A\u8FBC\u307F\u6761\u4EF6\u304C\u4E0D\u6B63\u3067\u3059\u3002",
      [113 /* INVALID_LEVEL_OR_CODE */]: "\u968E\u5C64\u30EC\u30D9\u30EB\u3001\u30B3\u30FC\u30C9\u306E\u6307\u5B9A\u304C\u4E0D\u6B63\u3067\u3059\u3002",
      [114 /* INVALID_COMBINATION */]: "\u7D71\u8A08\u30C7\u30FC\u30BF\u306E\u53D6\u5F97\u6761\u4EF6\u306E\u7D44\u307F\u5408\u308F\u305B\u304C\u4E0D\u6B63\u3067\u3059\u3002",
      [130 /* INVALID_START_POSITION */]: "\u30D1\u30E9\u30E1\u30FC\u30BF startPosition \u304C\u4E0D\u6B63\u3067\u3059\u3002",
      [131 /* INVALID_LIMIT */]: "\u30D1\u30E9\u30E1\u30FC\u30BF limit \u304C\u4E0D\u6B63\u3067\u3059\u3002",
      [140 /* INVALID_META_GET_FLG */]: "\u30D1\u30E9\u30E1\u30FC\u30BF metaGetFlg \u304C\u4E0D\u6B63\u3067\u3059\u3002",
      [141 /* INVALID_CNT_GET_FLG */]: "\u30D1\u30E9\u30E1\u30FC\u30BF cntGetFlg \u304C\u4E0D\u6B63\u3067\u3059\u3002",
      [142 /* INVALID_EXPLANATION_GET_FLG */]: "\u30D1\u30E9\u30E1\u30FC\u30BF explanationGetFlg \u304C\u4E0D\u6B63\u3067\u3059\u3002",
      [143 /* INVALID_ANNOTATION_GET_FLG */]: "\u30D1\u30E9\u30E1\u30FC\u30BF annotationGetFlg \u304C\u4E0D\u6B63\u3067\u3059\u3002",
      [144 /* INVALID_REPLACE_SP_CHARS */]: "\u30D1\u30E9\u30E1\u30FC\u30BF replaceSpChars \u304C\u4E0D\u6B63\u3067\u3059\u3002",
      [150 /* INVALID_SECTION_HEADER_FLG */]: "\u30D1\u30E9\u30E1\u30FC\u30BF sectionHeaderFlg \u304C\u4E0D\u6B63\u3067\u3059\u3002",
      [160 /* INVALID_CALLBACK */]: "\u30D1\u30E9\u30E1\u30FC\u30BF callback \u304C\u4E0D\u6B63\u3067\u3059\u3002",
      [170 /* INVALID_UPDATED_DATE */]: "\u30D1\u30E9\u30E1\u30FC\u30BF updatedDate \u304C\u4E0D\u6B63\u3067\u3059\u3002",
      [999 /* SYSTEM_ERROR */]: "\u30B7\u30B9\u30C6\u30E0\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F\u3002"
    };
    return new _EstatAPIError(
      messages[code] || "Unknown error",
      code,
      code,
      details
    );
  }
};
var APIResponseError = class extends Error {
  constructor(message, statusCode, response) {
    super(message);
    this.statusCode = statusCode;
    this.response = response;
    this.name = "APIResponseError";
  }
  static {
    __name(this, "APIResponseError");
  }
};

// src/lib/constants.ts
var ESTAT_API = {
  BASE_URL: "https://api.e-stat.go.jp/rest/3.0",
  VERSION: "3.0",
  DATA_FORMAT: "json",
  DEFAULT_LANG: "J"
};
var ESTAT_APP_ID = "59eb12e8a25751dfc27f2e48fcdfa8600b86655e";
var ESTAT_ENDPOINTS = {
  GET_STATS_DATA: "/app/json/getStatsData",
  GET_META_INFO: "/app/json/getMetaInfo",
  GET_STATS_LIST: "/app/json/getStatsList",
  GET_DATA_CATALOG: "/app/json/getDataCatalog"
};

// src/services/estat-api.ts
var EstatAPIClient = class {
  static {
    __name(this, "EstatAPIClient");
  }
  constructor(appId = ESTAT_APP_ID) {
    this.baseUrl = ESTAT_API.BASE_URL;
    this.appId = appId;
  }
  /**
   * APIリクエストの共通処理
   */
  async request(endpoint, params) {
    try {
      const searchParams = new URLSearchParams({
        appId: this.appId,
        lang: ESTAT_API.DEFAULT_LANG,
        dataFormat: ESTAT_API.DATA_FORMAT,
        ...params
      });
      const url = `${this.baseUrl}${endpoint}?${searchParams.toString()}`;
      console.log("API Request URL:", url);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25e3);
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json"
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        throw new APIResponseError(
          `HTTP error! status: ${response.status}`,
          response.status
        );
      }
      const data = await response.json();
      console.log("Raw e-Stat API response:", JSON.stringify(data, null, 2));
      const result = this.extractResult(data);
      console.log("Extracted result:", result);
      if (result && result.STATUS !== 0) {
        console.error("e-Stat API error status:", result.STATUS, result);
        throw EstatAPIError.fromErrorCode(result.STATUS, result);
      }
      return data;
    } catch (error) {
      console.error("e-STAT API Error:", error);
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new Error("e-STAT API\u3078\u306E\u30EA\u30AF\u30A8\u30B9\u30C8\u304C\u30BF\u30A4\u30E0\u30A2\u30A6\u30C8\u3057\u307E\u3057\u305F");
      }
      throw error;
    }
  }
  /**
   * レスポンスからRESULT情報を抽出
   */
  extractResult(data) {
    if (data.GET_STATS_DATA?.RESULT) return data.GET_STATS_DATA.RESULT;
    if (data.GET_META_INFO?.RESULT) return data.GET_META_INFO.RESULT;
    if (data.GET_STATS_LIST?.RESULT) return data.GET_STATS_LIST.RESULT;
    if (data.GET_DATA_CATALOG?.RESULT) return data.GET_DATA_CATALOG.RESULT;
    return null;
  }
  /**
   * メタ情報を取得
   */
  async getMetaInfo(params) {
    return this.request(
      ESTAT_ENDPOINTS.GET_META_INFO,
      params
    );
  }
  /**
   * 統計データを取得
   */
  async getStatsData(params) {
    return this.request(
      ESTAT_ENDPOINTS.GET_STATS_DATA,
      params
    );
  }
  /**
   * 統計表リストを取得
   */
  async getStatsList(params) {
    return this.request(
      ESTAT_ENDPOINTS.GET_STATS_LIST,
      params
    );
  }
};
var estatAPI = new EstatAPIClient();

// src/lib/estat/metainfo/EstatMetaInfoService.ts
var EstatMetaInfoService = class {
  static {
    __name(this, "EstatMetaInfoService");
  }
  constructor(db) {
    this.db = db;
  }
  /**
   * メタ情報を取得・変換・保存
   */
  async processAndSaveMetaInfo(statsDataId) {
    try {
      const metaInfo = await estatAPI.getMetaInfo({ statsDataId });
      const transformedData = this.transformToCSVFormat(metaInfo);
      await this.saveTransformedData(transformedData);
      console.log(
        `${statsDataId}\u306E\u30E1\u30BF\u60C5\u5831\u3092\u51E6\u7406\u3057\u307E\u3057\u305F: ${transformedData.length}\u4EF6`
      );
      return {
        success: true,
        entriesProcessed: transformedData.length
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error(`${statsDataId}\u306E\u30E1\u30BF\u60C5\u5831\u51E6\u7406\u306B\u5931\u6557:`, error);
      return {
        success: false,
        entriesProcessed: 0,
        error: errorMessage
      };
    }
  }
  /**
   * 複数の統計データIDを一括処理
   */
  async processBulkMetaInfo(statsDataIds, options = {}) {
    const { batchSize = 10, delayMs = 1e3 } = options;
    const results = [];
    let successCount = 0;
    let failureCount = 0;
    for (let i = 0; i < statsDataIds.length; i += batchSize) {
      const batch = statsDataIds.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(async (id) => ({
          statsDataId: id,
          ...await this.processAndSaveMetaInfo(id)
        }))
      );
      for (const result of batchResults) {
        if (result.status === "fulfilled") {
          results.push(result.value);
          if (result.value.success) {
            successCount++;
          } else {
            failureCount++;
          }
        } else {
          results.push({
            statsDataId: "unknown",
            success: false,
            entriesProcessed: 0,
            error: result.reason?.message || "Processing failed"
          });
          failureCount++;
        }
      }
      if (i + batchSize < statsDataIds.length && delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
    return {
      totalProcessed: statsDataIds.length,
      successCount,
      failureCount,
      results
    };
  }
  /**
   * 統計データIDの範囲を指定して一括処理
   */
  async processMetaInfoRange(startId, endId, options) {
    const startNum = parseInt(startId);
    const endNum = parseInt(endId);
    if (isNaN(startNum) || isNaN(endNum)) {
      throw new Error("\u958B\u59CBID\u3068\u7D42\u4E86ID\u306F\u6570\u5024\u3067\u3042\u308B\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059");
    }
    if (startNum > endNum) {
      throw new Error("\u958B\u59CBID\u306F\u7D42\u4E86ID\u4EE5\u4E0B\u3067\u3042\u308B\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059");
    }
    const statsDataIds = [];
    for (let i = startNum; i <= endNum; i++) {
      statsDataIds.push(i.toString().padStart(10, "0"));
    }
    return this.processBulkMetaInfo(statsDataIds, options);
  }
  /**
   * メタ情報を検索
   */
  async searchMetaInfo(query, options = {}) {
    const { searchType = "full", limit = 100, offset = 0 } = options;
    let sqlQuery;
    let params;
    switch (searchType) {
      case "stat_name":
        sqlQuery = `
          SELECT * FROM estat_metainfo
          WHERE stat_name LIKE ?
          ORDER BY stat_name, title
          LIMIT ? OFFSET ?
        `;
        params = [`%${query}%`, limit.toString(), offset.toString()];
        break;
      case "category":
        sqlQuery = `
          SELECT * FROM estat_metainfo
          WHERE cat01 = ?
          ORDER BY stat_name, title
          LIMIT ? OFFSET ?
        `;
        params = [query, limit.toString(), offset.toString()];
        break;
      case "stats_id":
        sqlQuery = `
          SELECT * FROM estat_metainfo
          WHERE stats_data_id = ?
          ORDER BY cat01, item_name
          LIMIT ? OFFSET ?
        `;
        params = [query, limit.toString(), offset.toString()];
        break;
      default:
        sqlQuery = `
          SELECT * FROM estat_metainfo
          WHERE stat_name LIKE ? OR title LIKE ? OR item_name LIKE ?
          ORDER BY stat_name, title
          LIMIT ? OFFSET ?
        `;
        params = [
          `%${query}%`,
          `%${query}%`,
          `%${query}%`,
          limit.toString(),
          offset.toString()
        ];
        break;
    }
    const result = await this.db.prepare(sqlQuery).bind(...params).all();
    const countQuery = sqlQuery.replace(/SELECT \* FROM/, "SELECT COUNT(*) as count FROM").replace(/ORDER BY.*LIMIT.*OFFSET.*/, "");
    const countParams = params.slice(0, -2);
    const countResult = await this.db.prepare(countQuery).bind(...countParams).first();
    const totalCount = countResult ? countResult.count : 0;
    return {
      entries: result.results,
      totalCount,
      searchQuery: query,
      executedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  /**
   * メタ情報サマリーを取得
   */
  async getMetaInfoSummary() {
    const totalResult = await this.db.prepare("SELECT COUNT(*) as count FROM estat_metainfo").first();
    const totalEntries = totalResult ? totalResult.count : 0;
    const uniqueResult = await this.db.prepare(
      "SELECT COUNT(DISTINCT stats_data_id) as count FROM estat_metainfo"
    ).first();
    const uniqueStats = uniqueResult ? uniqueResult.count : 0;
    const categoryResult = await this.db.prepare(
      `
        SELECT cat01 as code,
               MAX(item_name) as name,
               COUNT(*) as count
        FROM estat_metainfo
        GROUP BY cat01
        ORDER BY count DESC
        LIMIT 20
      `
    ).all();
    const categories = categoryResult.results.map((row) => ({
      code: row.code,
      name: row.name,
      count: row.count
    }));
    const lastUpdatedResult = await this.db.prepare("SELECT MAX(updated_at) as last_updated FROM estat_metainfo").first();
    const lastUpdated = lastUpdatedResult ? lastUpdatedResult.last_updated : null;
    return {
      totalEntries,
      uniqueStats,
      categories,
      lastUpdated
    };
  }
  /**
   * 統計データ一覧を取得
   */
  async getStatsList(options = {}) {
    const { limit = 50, offset = 0, orderBy = "last_updated" } = options;
    const orderClause = {
      last_updated: "ORDER BY last_updated DESC",
      stat_name: "ORDER BY stat_name ASC",
      item_count: "ORDER BY item_count DESC"
    }[orderBy];
    const result = await this.db.prepare(
      `
        SELECT DISTINCT
          stats_data_id,
          stat_name,
          title,
          COUNT(*) as item_count,
          MAX(updated_at) as last_updated
        FROM estat_metainfo
        GROUP BY stats_data_id, stat_name, title
        ${orderClause}
        LIMIT ? OFFSET ?
      `
    ).bind(limit.toString(), offset.toString()).all();
    return result.results;
  }
  /**
   * メタ情報をCSV形式に変換
   */
  transformToCSVFormat(metaInfo) {
    const metaData = metaInfo.GET_META_INFO?.METADATA_INF;
    if (!metaData) {
      throw new Error("\u30E1\u30BF\u60C5\u5831\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093");
    }
    const tableInfo = metaData.TABLE_INF;
    const classInfo = metaData.CLASS_INF?.CLASS_OBJ;
    if (!tableInfo || !classInfo) {
      throw new Error("\u5FC5\u8981\u306A\u30E1\u30BF\u60C5\u5831\u304C\u4E0D\u8DB3\u3057\u3066\u3044\u307E\u3059");
    }
    const result = [];
    const statsDataId = tableInfo["@id"];
    const statName = tableInfo.STAT_NAME?.$ || "";
    const title = tableInfo.TITLE?.$ || "";
    const cat01Class = classInfo.find((cls) => cls["@id"] === "cat01");
    if (!cat01Class?.CLASS) {
      throw new Error("cat01\u30AB\u30C6\u30B4\u30EA\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093");
    }
    const categories = Array.isArray(cat01Class.CLASS) ? cat01Class.CLASS : [cat01Class.CLASS];
    categories.forEach((category) => {
      result.push({
        stats_data_id: statsDataId,
        stat_name: statName,
        title,
        cat01: category["@code"] || "",
        item_name: category["@name"] || "",
        unit: category["@unit"] || null
      });
    });
    return result;
  }
  /**
   * 変換されたデータをデータベースに保存
   */
  async saveTransformedData(dataList) {
    if (dataList.length === 0) return;
    const batchSize = 100;
    for (let i = 0; i < dataList.length; i += batchSize) {
      const batch = dataList.slice(i, i + batchSize);
      await this.processBatch(batch);
    }
  }
  /**
   * バッチ処理
   */
  async processBatch(dataList) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO estat_metainfo
      (stats_data_id, stat_name, title, cat01, item_name, unit, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    try {
      for (const data of dataList) {
        await stmt.bind(
          data.stats_data_id,
          data.stat_name,
          data.title,
          data.cat01,
          data.item_name,
          data.unit
        ).run();
      }
    } catch (error) {
      console.error("\u30D0\u30C3\u30C1\u51E6\u7406\u30A8\u30E9\u30FC:", error);
      throw error;
    }
  }
};

// src/worker.ts
var worker = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/estat/metainfo")) {
      return handleEstatMetainfo(request, env);
    }
    return new Response("Not Found", { status: 404 });
  }
};
var worker_default = worker;
async function handleEstatMetainfo(request, env) {
  const url = new URL(request.url);
  try {
    if (url.pathname === "/api/estat/metainfo/stats") {
      return handleStats(request, env);
    } else if (url.pathname === "/api/estat/metainfo/save") {
      return handleSave(request, env);
    } else if (url.pathname === "/api/estat/metainfo/search") {
      return handleSearch(request, env);
    }
    return new Response("Not Found", { status: 404 });
  } catch (error) {
    console.error("API Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(handleEstatMetainfo, "handleEstatMetainfo");
async function handleStats(request, env) {
  const metaInfoService = new EstatMetaInfoService(env.STATS47_DB);
  try {
    const [summary, statsList] = await Promise.all([
      metaInfoService.getMetaInfoSummary(),
      metaInfoService.getStatsList({ limit: 100 })
    ]);
    return Response.json({
      success: true,
      data: {
        totalCount: summary.totalEntries,
        statCount: summary.uniqueStats,
        categories: summary.categories,
        statsList
      }
    });
  } catch (error) {
    console.error("\u7D71\u8A08\u60C5\u5831\u53D6\u5F97\u30A8\u30E9\u30FC:", error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : "\u7D71\u8A08\u60C5\u5831\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F"
      },
      { status: 500 }
    );
  }
}
__name(handleStats, "handleStats");
async function handleSave(request, env) {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  try {
    const { statsDataId, batchMode, startId, endId } = await request.json();
    const metaInfoService = new EstatMetaInfoService(env.STATS47_DB);
    if (batchMode && startId && endId) {
      const result = await metaInfoService.processMetaInfoRange(startId, endId);
      return Response.json({
        success: true,
        message: `${startId}\u304B\u3089${endId}\u307E\u3067\u306E\u7D71\u8A08\u8868ID\u3092\u51E6\u7406\u3057\u307E\u3057\u305F`,
        details: result
      });
    } else if (Array.isArray(statsDataId)) {
      const result = await metaInfoService.processBulkMetaInfo(statsDataId);
      return Response.json({
        success: true,
        message: `${statsDataId.length}\u4EF6\u306E\u7D71\u8A08\u8868ID\u3092\u51E6\u7406\u3057\u307E\u3057\u305F`,
        details: result
      });
    } else if (statsDataId) {
      const result = await metaInfoService.processAndSaveMetaInfo(statsDataId);
      return Response.json({
        success: result.success,
        message: result.success ? `${statsDataId}\u306E\u30E1\u30BF\u60C5\u5831\u3092\u4FDD\u5B58\u3057\u307E\u3057\u305F` : `${statsDataId}\u306E\u30E1\u30BF\u60C5\u5831\u4FDD\u5B58\u306B\u5931\u6557\u3057\u307E\u3057\u305F`,
        details: result
      });
    } else {
      return Response.json({ error: "\u7D71\u8A08\u8868ID\u304C\u5FC5\u8981\u3067\u3059" }, { status: 400 });
    }
  } catch (error) {
    console.error("\u30E1\u30BF\u60C5\u5831\u4FDD\u5B58\u30A8\u30E9\u30FC:", error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : "\u30E1\u30BF\u60C5\u5831\u306E\u4FDD\u5B58\u306B\u5931\u6557\u3057\u307E\u3057\u305F"
      },
      { status: 500 }
    );
  }
}
__name(handleSave, "handleSave");
async function handleSearch(request, env) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") || "";
  const category = url.searchParams.get("category") || "";
  const statsDataId = url.searchParams.get("statsDataId") || "";
  const limitParam = url.searchParams.get("limit");
  const offsetParam = url.searchParams.get("offset");
  const limit = limitParam ? parseInt(limitParam) : 100;
  const offset = offsetParam ? parseInt(offsetParam) : 0;
  try {
    const metaInfoService = new EstatMetaInfoService(env.STATS47_DB);
    let results;
    if (statsDataId) {
      results = await metaInfoService.searchMetaInfo(statsDataId, {
        searchType: "stats_id",
        limit,
        offset
      });
    } else if (category) {
      results = await metaInfoService.searchMetaInfo(category, {
        searchType: "category",
        limit,
        offset
      });
    } else if (query) {
      results = await metaInfoService.searchMetaInfo(query, {
        searchType: "full",
        limit,
        offset
      });
    } else {
      const statsList = await metaInfoService.getStatsList({ limit, offset });
      results = {
        entries: statsList,
        totalCount: statsList.length,
        searchQuery: "",
        executedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
    }
    return Response.json({ success: true, data: results });
  } catch (error) {
    console.error("\u691C\u7D22\u30A8\u30E9\u30FC:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "\u691C\u7D22\u306B\u5931\u6557\u3057\u307E\u3057\u305F" },
      { status: 500 }
    );
  }
}
__name(handleSearch, "handleSearch");

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-korphD/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-korphD/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker2) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker2;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker2.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker2.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker2,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker2.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker2.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=worker.js.map
