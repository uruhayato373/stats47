import { beforeEach, describe, expect, it, vi } from "vitest";
import { EstatMetaInfoFetchError } from "../../errors";
import { fetchMetaInfo } from "../../services/fetch-meta-info";
import { mockMetaInfoResponse } from "../fixtures/mock-responses";

// リポジトリのモック
const fetchFromApiMock = vi.fn();
const findCacheMock = vi.fn();
const saveCacheMock = vi.fn();

vi.mock("../../repositories/api/fetch-from-api", () => ({
  fetchMetaInfoFromApi: (id: string) => fetchFromApiMock(id),
}));

vi.mock("../../repositories/cache/find-cache", () => ({
  findMetaInfoCache: (id: string) => findCacheMock(id),
}));

vi.mock("../../repositories/cache/save-cache", () => ({
  saveMetaInfoCache: (id: string, data: any) => saveCacheMock(id, data),
}));

describe("fetchMetaInfo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("キャッシュヒット時はAPIを呼ばずにキャッシュを返すこと", async () => {
    findCacheMock.mockResolvedValue(mockMetaInfoResponse);

    const result = await fetchMetaInfo("0000010101");

    expect(result).toBe(mockMetaInfoResponse);
    expect(findCacheMock).toHaveBeenCalledWith("0000010101");
    expect(fetchFromApiMock).not.toHaveBeenCalled();
    expect(saveCacheMock).not.toHaveBeenCalled();
  });

  it("キャッシュミス時はAPIから取得し、キャッシュに保存すること", async () => {
    findCacheMock.mockResolvedValue(null);
    fetchFromApiMock.mockResolvedValue(mockMetaInfoResponse);
    saveCacheMock.mockResolvedValue(undefined);

    const result = await fetchMetaInfo("0000010101");

    expect(result).toBe(mockMetaInfoResponse);
    expect(findCacheMock).toHaveBeenCalled();
    expect(fetchFromApiMock).toHaveBeenCalledWith("0000010101");
    expect(saveCacheMock).toHaveBeenCalledWith("0000010101", mockMetaInfoResponse);
  });

  it("キャッシュ取得エラー時はAPI取得にフォールバックすること", async () => {
    findCacheMock.mockRejectedValue(new Error("Cache Error"));
    fetchFromApiMock.mockResolvedValue(mockMetaInfoResponse);

    const result = await fetchMetaInfo("0000010101");

    expect(result).toBe(mockMetaInfoResponse);
    expect(fetchFromApiMock).toHaveBeenCalled();
  });

  it("API取得失敗時にEstatMetaInfoFetchErrorをスローすること", async () => {
    findCacheMock.mockResolvedValue(null);
    fetchFromApiMock.mockRejectedValue(new Error("API Error"));

    await expect(fetchMetaInfo("0000010101")).rejects.toThrow(EstatMetaInfoFetchError);
  });

  it("キャッシュ保存失敗時でも正常に終了すること", async () => {
    findCacheMock.mockResolvedValue(null);
    fetchFromApiMock.mockResolvedValue(mockMetaInfoResponse);
    saveCacheMock.mockRejectedValue(new Error("Save Error"));

    const result = await fetchMetaInfo("0000010101");

    expect(result).toBe(mockMetaInfoResponse);
    expect(saveCacheMock).toHaveBeenCalled();
     // 保存は非同期で待たないが、このテストではawaitしないので
     // 実際にはsaveCache呼び出しを確認すればOK
  });
});
