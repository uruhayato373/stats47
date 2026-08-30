/**
 * ranking ai-content 用 Gemini API クライアント。
 *
 * CI は Gemini CLI に依存せず、API key を header で渡して直接 generateContent を呼ぶ。
 * 429 / 5xx / timeout / network だけを限定再試行し、認証・入力・モデル廃止は即時失敗する。
 */

import type { GeminiJsonSchema } from "./gemini-content-schemas";

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

/** pinned model。提供終了は実生成 preflight が検出し、env で復旧する。 */
export const GEMINI_TEXT_MODEL = "gemini-3.7-flash";

export function resolveTextModel(env: NodeJS.ProcessEnv = process.env): string {
  return env.GEMINI_TEXT_MODEL?.trim() || GEMINI_TEXT_MODEL;
}

const DEFAULT_MAX_OUTPUT_TOKENS = 32_768;
const DEFAULT_TIMEOUT_MS = 180_000;

export type GeminiTextErrorClass =
  | "rate-limit"
  | "billing"
  | "server"
  | "bad-request"
  | "auth"
  | "http-error"
  | "no-text"
  | "truncated"
  | "timeout"
  | "network"
  | "unknown";

export interface GeminiQuotaDetails {
  metric?: string;
  limit?: string;
  retryAfter?: string;
}

export interface GeminiTokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  thinkingTokens: number;
}

const ZERO_USAGE: GeminiTokenUsage = {
  inputTokens: 0,
  outputTokens: 0,
  totalTokens: 0,
  thinkingTokens: 0,
};

const BILLING_EXHAUSTED_MARKERS = [
  "credits are depleted",
  "credit balance is too low",
  "insufficient credits",
];

export function isBillingExhausted(raw: string): boolean {
  const lower = raw.toLowerCase();
  return BILLING_EXHAUSTED_MARKERS.some((marker) => lower.includes(marker));
}

/** 429 本文から機密でない quota の構造フィールドだけを抽出する。 */
export function extractQuotaDetails(raw: string): GeminiQuotaDetails | undefined {
  try {
    const parsed = JSON.parse(raw) as {
      error?: { details?: Array<Record<string, unknown>> };
    };
    const out: GeminiQuotaDetails = {};
    for (const detail of parsed.error?.details ?? []) {
      const violations = detail.violations as Array<Record<string, unknown>> | undefined;
      const violation = violations?.[0];
      if (typeof violation?.quotaMetric === "string") out.metric = violation.quotaMetric;
      if (typeof violation?.quotaValue === "string") out.limit = violation.quotaValue;
      if (typeof detail.retryDelay === "string") out.retryAfter = detail.retryDelay;
    }
    return out.metric || out.limit || out.retryAfter ? out : undefined;
  } catch {
    return undefined;
  }
}

export class GeminiTextError extends Error {
  constructor(
    readonly classification: GeminiTextErrorClass,
    readonly status?: number,
    readonly quota?: GeminiQuotaDetails,
  ) {
    super(status ? `${classification} (HTTP ${status})` : classification);
    this.name = "GeminiTextError";
  }
}

export interface GenerateTextOptions {
  prompt: string;
  apiKey: string;
  model?: string;
  responseJsonSchema?: GeminiJsonSchema;
  timeoutMs?: number;
  maxOutputTokens?: number;
  maxAttempts?: number;
  temperature?: number;
  fetchImpl?: typeof fetch;
  sleepImpl?: (ms: number) => Promise<void>;
  onAttempt?: (info: {
    attempt: number;
    status?: number;
    classification: GeminiTextErrorClass | "ok";
    quota?: GeminiQuotaDetails;
  }) => void;
}

export interface GenerateTextResult {
  text: string;
  attempts: number;
  usage: GeminiTokenUsage;
}

function classify(status: number): GeminiTextErrorClass {
  if (status === 429) return "rate-limit";
  if (status >= 500) return "server";
  if (status === 401 || status === 403) return "auth";
  if (status >= 400) return "bad-request";
  return "http-error";
}

function isRetriable(classification: GeminiTextErrorClass): boolean {
  return ["rate-limit", "server", "timeout", "network"].includes(classification);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isAbort(error: unknown): boolean {
  return error instanceof Error && ["AbortError", "TimeoutError"].includes(error.name);
}

function retryDelayMs(
  classification: GeminiTextErrorClass,
  attempt: number,
  quota?: GeminiQuotaDetails,
): number {
  const match = quota?.retryAfter?.match(/^(\d+(?:\.\d+)?)s$/);
  if (match) return Math.min(60_000, Math.max(1_000, Number(match[1]) * 1_000));
  const base = classification === "rate-limit" ? 15_000 : 2_000;
  return Math.min(60_000, base * 2 ** Math.max(0, attempt - 1));
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
    thoughtsTokenCount?: number;
  };
}

function normalizeUsage(response: GeminiResponse): GeminiTokenUsage {
  const usage = response.usageMetadata;
  if (!usage) return { ...ZERO_USAGE };
  return {
    inputTokens: usage.promptTokenCount ?? 0,
    outputTokens: usage.candidatesTokenCount ?? 0,
    totalTokens: usage.totalTokenCount ?? 0,
    thinkingTokens: usage.thoughtsTokenCount ?? 0,
  };
}

export async function generateContentText(
  options: GenerateTextOptions,
): Promise<GenerateTextResult> {
  const model = options.model ?? resolveTextModel();
  const maxAttempts = Math.min(5, Math.max(1, options.maxAttempts ?? 3));
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const fetchImpl = options.fetchImpl ?? fetch;
  const sleepImpl = options.sleepImpl ?? sleep;
  const url = `${API_BASE}/${encodeURIComponent(model)}:generateContent`;

  let lastError: GeminiTextError | undefined;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(url, {
        method: "POST",
        headers: {
          "x-goog-api-key": options.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: options.prompt }] }],
          generationConfig: {
            responseFormat: {
              text: {
                mimeType: "application/json",
                ...(options.responseJsonSchema ? { schema: options.responseJsonSchema } : {}),
              },
            },
            maxOutputTokens: options.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS,
            temperature: options.temperature ?? 0.4,
          },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const raw = await response.text().catch(() => "");
        const billing = response.status === 429 && isBillingExhausted(raw);
        const classification = billing ? "billing" : classify(response.status);
        const quota = response.status === 429 ? extractQuotaDetails(raw) : undefined;
        options.onAttempt?.({
          attempt,
          status: response.status,
          classification,
          quota,
        });
        const error = new GeminiTextError(classification, response.status, quota);
        if (isRetriable(classification) && attempt < maxAttempts) {
          lastError = error;
          await sleepImpl(retryDelayMs(classification, attempt, quota));
          continue;
        }
        throw error;
      }

      const body = (await response.json()) as GeminiResponse;
      const candidate = body.candidates?.[0];
      const text = candidate?.content?.parts
        ?.map((part) => part.text ?? "")
        .join("")
        .trim();

      if (candidate?.finishReason === "MAX_TOKENS") {
        options.onAttempt?.({ attempt, status: 200, classification: "truncated" });
        throw new GeminiTextError("truncated", 200);
      }
      if (!text) {
        options.onAttempt?.({ attempt, status: 200, classification: "no-text" });
        throw new GeminiTextError("no-text", 200);
      }

      options.onAttempt?.({ attempt, status: 200, classification: "ok" });
      return { text, attempts: attempt, usage: normalizeUsage(body) };
    } catch (error) {
      if (error instanceof GeminiTextError) throw error;
      const classification: GeminiTextErrorClass = isAbort(error) ? "timeout" : "network";
      options.onAttempt?.({ attempt, classification });
      const wrapped = new GeminiTextError(classification);
      if (attempt < maxAttempts) {
        lastError = wrapped;
        await sleepImpl(retryDelayMs(classification, attempt));
        continue;
      }
      throw wrapped;
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError ?? new GeminiTextError("unknown");
}

interface ListModelsResponse {
  models?: Array<{ name?: string; supportedGenerationMethods?: string[] }>;
  nextPageToken?: string;
}

export async function listGenerateContentModels(options: {
  apiKey: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
  maxPages?: number;
}): Promise<string[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? 30_000;
  const maxPages = Math.min(20, Math.max(1, options.maxPages ?? 5));
  const models: string[] = [];
  let pageToken: string | undefined;

  for (let page = 0; page < maxPages; page++) {
    const suffix = pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : "";
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(`${API_BASE}?pageSize=200${suffix}`, {
        headers: { "x-goog-api-key": options.apiKey },
        signal: controller.signal,
      });
      if (!response.ok) {
        await response.text().catch(() => "");
        throw new GeminiTextError(classify(response.status), response.status);
      }
      const body = (await response.json()) as ListModelsResponse;
      for (const model of body.models ?? []) {
        if (!model.name) continue;
        if (!(model.supportedGenerationMethods ?? []).includes("generateContent")) continue;
        models.push(model.name.replace(/^models\//, ""));
      }
      pageToken = body.nextPageToken;
      if (!pageToken) break;
    } catch (error) {
      if (error instanceof GeminiTextError) throw error;
      throw new GeminiTextError(isAbort(error) ? "timeout" : "network");
    } finally {
      clearTimeout(timer);
    }
  }
  return models;
}
