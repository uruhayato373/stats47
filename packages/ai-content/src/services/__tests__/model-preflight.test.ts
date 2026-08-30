import { describe, expect, it, vi } from "vitest";

import { runModelPreflight, suggestTextModels } from "../model-preflight";

describe("Gemini model preflight", () => {
  it("実生成成功を利用可否の正典にする", async () => {
    const listModels = vi.fn(async () => []);
    const result = await runModelPreflight({
      configured: "gemini-3.7-flash",
      smoke: async () => ({ ok: true }),
      listModels,
    });
    expect(result.ok).toBe(true);
    expect(listModels).not.toHaveBeenCalled();
  });

  it("rate-limit でモデルを自動切替しない", async () => {
    const listModels = vi.fn(async () => ["gemini-other"]);
    const result = await runModelPreflight({
      configured: "gemini-3.7-flash",
      smoke: async () => ({ ok: false, classification: "rate-limit", status: 429 }),
      listModels,
    });
    expect(result).toMatchObject({ ok: false, classification: "rate-limit", suggestions: [] });
    expect(listModels).not.toHaveBeenCalled();
  });

  it("廃止モデル時は安定 text/flash 候補を提示する", async () => {
    const result = await runModelPreflight({
      configured: "gemini-retired",
      smoke: async () => ({ ok: false, classification: "bad-request", status: 404 }),
      listModels: async () => [
        "gemini-image-preview",
        "gemini-3.6-pro",
        "gemini-3.7-flash",
      ],
    });
    expect(result.ok).toBe(false);
    expect(result.suggestions[0]).toBe("gemini-3.7-flash");
    expect(suggestTextModels(["embedding-001", "gemini-3.7-flash"])).toEqual([
      "gemini-3.7-flash",
    ]);
  });
});
