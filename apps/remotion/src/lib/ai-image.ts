/**
 * Cloudflare Workers AI 画像生成ユーティリティ
 *
 * - Stable Diffusion XL (REST API) で画像生成
 * - ローカルファイルキャッシュ（同一プロンプトは再生成しない）
 * - 日次クォータ管理（無料枠 10,000 ニューロン/日 を超えない）
 */

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

// ---------- 定数 ----------

const MODEL = "@cf/stabilityai/stable-diffusion-xl-base-1.0";
const NEURONS_PER_IMAGE = 1_300;
const FREE_TIER_NEURONS = 10_000;
/** 1日の生成上限（安全マージン込み） */
const DAILY_LIMIT = Math.floor(FREE_TIER_NEURONS / NEURONS_PER_IMAGE) - 1; // 6

const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const CACHE_DIR = path.join(PROJECT_ROOT, ".local", "r2", "ai-images");
const QUOTA_FILE = path.join(PROJECT_ROOT, ".local", "ai-image-quota.json");

// ---------- 型定義 ----------

export interface GenerateImageOptions {
  /** 画像生成プロンプト（英語推奨） */
  prompt: string;
  /** ネガティブプロンプト */
  negativePrompt?: string;
  /** 推論ステップ数（デフォルト: 20、最大 20） */
  numSteps?: number;
}

interface QuotaData {
  date: string;
  count: number;
}

interface GenerateResult {
  /** 生成された画像のファイルパス */
  filePath: string;
  /** キャッシュヒットした場合 true */
  cached: boolean;
  /** 本日の残り生成可能数 */
  remaining: number;
}

// ---------- クォータ管理 ----------

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function readQuota(): QuotaData {
  if (!existsSync(QUOTA_FILE)) {
    return { date: today(), count: 0 };
  }
  try {
    const data: QuotaData = JSON.parse(readFileSync(QUOTA_FILE, "utf-8"));
    // 日付が変わっていたらリセット
    if (data.date !== today()) {
      return { date: today(), count: 0 };
    }
    return data;
  } catch {
    return { date: today(), count: 0 };
  }
}

function writeQuota(quota: QuotaData): void {
  const dir = path.dirname(QUOTA_FILE);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(QUOTA_FILE, JSON.stringify(quota, null, 2));
}

/** 本日の残り生成可能数 */
export function getRemainingQuota(): number {
  const quota = readQuota();
  return Math.max(0, DAILY_LIMIT - quota.count);
}

// ---------- キャッシュ ----------

function promptToHash(prompt: string, negativePrompt?: string): string {
  const input = `${prompt}||${negativePrompt ?? ""}`;
  return createHash("sha256").update(input).digest("hex").slice(0, 16);
}

function getCachePath(hash: string): string {
  return path.join(CACHE_DIR, `${hash}.png`);
}

// ---------- API 呼び出し ----------

async function callWorkersAI(
  accountId: string,
  apiToken: string,
  options: GenerateImageOptions,
): Promise<Buffer> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${MODEL}`;

  const body: Record<string, unknown> = {
    prompt: options.prompt,
    num_steps: options.numSteps ?? 20,
  };
  if (options.negativePrompt) {
    body.negative_prompt = options.negativePrompt;
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Workers AI API エラー (${res.status}): ${text}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// ---------- メイン関数 ----------

/**
 * AI 画像を生成する。キャッシュがあればそれを返す。
 * 日次クォータを超える場合はエラーを投げる。
 */
export async function generateImage(
  options: GenerateImageOptions,
): Promise<GenerateResult> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    throw new Error(
      "環境変数が不足: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN",
    );
  }

  const hash = promptToHash(options.prompt, options.negativePrompt);
  const cachePath = getCachePath(hash);

  // キャッシュヒット
  if (existsSync(cachePath)) {
    return {
      filePath: cachePath,
      cached: true,
      remaining: getRemainingQuota(),
    };
  }

  // クォータチェック
  const quota = readQuota();
  if (quota.count >= DAILY_LIMIT) {
    throw new Error(
      `日次クォータ上限 (${DAILY_LIMIT}枚/日) に達しました。明日再試行してください。`,
    );
  }

  // 生成
  const imageBuffer = await callWorkersAI(accountId, apiToken, options);

  // 保存
  if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(cachePath, imageBuffer);

  // メタデータ（プロンプト復元用）
  const metaPath = cachePath.replace(".png", ".json");
  writeFileSync(
    metaPath,
    JSON.stringify(
      {
        prompt: options.prompt,
        negativePrompt: options.negativePrompt,
        numSteps: options.numSteps ?? 20,
        generatedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
  );

  // クォータ更新
  quota.count += 1;
  quota.date = today();
  writeQuota(quota);

  return {
    filePath: cachePath,
    cached: false,
    remaining: DAILY_LIMIT - quota.count,
  };
}
