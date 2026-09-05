import { describe, expect, it } from "vitest";

import {
  CLAUDE_CLI_MODELS,
  ClaudeCliError,
  isClaudeCliAlias,
  parseClaudeCliOutput,
} from "../claude-cli-output";

const successWrapper = {
  type: "result",
  subtype: "success",
  is_error: false,
  result: '```json\n{"faq":{"items":[]}}\n```',
  total_cost_usd: 0.1234,
  usage: {
    input_tokens: 1000,
    output_tokens: 6000,
    cache_creation_input_tokens: 5000,
    cache_read_input_tokens: 1500,
  },
  modelUsage: { "claude-sonnet-5": { inputTokens: 1000 } },
};

describe("claude CLI output", () => {
  it("structured_output があればそれを JSON 文字列として text に返す", () => {
    const parsed = parseClaudeCliOutput(
      JSON.stringify({ ...successWrapper, structured_output: { faq: { items: [] } } }),
    );
    expect(parsed.text).toBe('{"faq":{"items":[]}}');
    expect(parsed.modelId).toBe("claude-sonnet-5");
    expect(parsed.costUsd).toBe(0.1234);
  });

  it("structured_output が無ければ result のテキストをそのまま返す (json fence は呼び元が剥がす)", () => {
    const parsed = parseClaudeCliOutput(JSON.stringify(successWrapper));
    expect(parsed.text).toBe(successWrapper.result);
  });

  it("inputTokens は cache を含む合算、費用は total_cost_usd をそのまま使う", () => {
    const parsed = parseClaudeCliOutput(JSON.stringify(successWrapper));
    expect(parsed.breakdown).toEqual({ input: 1000, output: 6000, cacheWrite: 5000, cacheRead: 1500 });
    expect(parsed.usage).toEqual({
      inputTokens: 7500,
      outputTokens: 6000,
      totalTokens: 13500,
      thinkingTokens: 0,
    });
  });

  it("is_error / 非 success subtype は ClaudeCliError で subtype を保持する (parse error と混同しない)", () => {
    const errorWrapper = {
      ...successWrapper,
      subtype: "error_during_execution",
      is_error: true,
      result: "Rate limit reached",
    };
    expect(() => parseClaudeCliOutput(JSON.stringify(errorWrapper))).toThrowError(ClaudeCliError);
    try {
      parseClaudeCliOutput(JSON.stringify(errorWrapper));
    } catch (error) {
      expect((error as ClaudeCliError).subtype).toBe("error_during_execution");
      expect((error as ClaudeCliError).message).toContain("Rate limit reached");
    }
  });

  it("is_error なのに subtype が success の wrapper (実測: 未ログイン) は subtype を error に読み替えて弾く", () => {
    const notLoggedIn = {
      type: "result",
      subtype: "success",
      is_error: true,
      result: "Not logged in · Please run /login",
      total_cost_usd: 0,
      usage: { input_tokens: 0, output_tokens: 0 },
      modelUsage: [],
    };
    try {
      parseClaudeCliOutput(JSON.stringify(notLoggedIn));
      throw new Error("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ClaudeCliError);
      expect((error as ClaudeCliError).subtype).toBe("error");
      expect((error as ClaudeCliError).message).toContain("Not logged in");
    }
  });

  it("result JSON でない stdout は invalid-output として弾く", () => {
    expect(() => parseClaudeCliOutput("plain text, not json")).toThrowError(ClaudeCliError);
    expect(() => parseClaudeCliOutput("[]")).toThrowError(/result JSON/);
  });

  it("usage が欠けていても 0 として扱い、負値・非数は 0 に丸める", () => {
    const parsed = parseClaudeCliOutput(
      JSON.stringify({ type: "result", subtype: "success", result: "x", usage: { input_tokens: -5 } }),
    );
    expect(parsed.usage.inputTokens).toBe(0);
    expect(parsed.costUsd).toBe(0);
    expect(parsed.modelId).toBeNull();
  });
});

describe("claude CLI model alias", () => {
  it("allowlist の 3 alias だけを受理し、実 model ID (typo) は alias として拒否する", () => {
    expect(isClaudeCliAlias("claude-sonnet")).toBe(true);
    expect(isClaudeCliAlias("claude-haiku")).toBe(true);
    expect(isClaudeCliAlias("claude-opus")).toBe(true);
    expect(isClaudeCliAlias("claude-sonnet-5")).toBe(false);
    expect(isClaudeCliAlias("claude")).toBe(false);
    expect(isClaudeCliAlias("gemini-api")).toBe(false);
  });

  it("alias は現行の model ID に解決する (stale な 4.x 系 ID を残さない)", () => {
    expect(CLAUDE_CLI_MODELS["claude-sonnet"]).toBe("claude-sonnet-5");
    expect(CLAUDE_CLI_MODELS["claude-opus"]).toBe("claude-opus-5");
    expect(CLAUDE_CLI_MODELS["claude-haiku"]).toBe("claude-haiku-4-5-20251001");
  });
});
