/**
 * カテゴリ別の装飾イラストを Gemini 2.5 Flash Image で生成する。
 *
 * /ranking のカテゴリカード (17 分野) の上部バナー画像に使う。データ可視化ではなく
 * 「分野を象徴する装飾イラスト」なので AI 生成が適切 (ogp-image-standards.md: Gemini/SDXL は装飾用)。
 * 出力は public/images/categories/<key>.webp に静的コミット (17 枚のブランド資産・データ非依存)。
 *
 * 使い方:
 *   GEMINI_API_KEY=xxx npx tsx apps/web/scripts/generate-category-images.ts            # 未生成のみ
 *   GEMINI_API_KEY=xxx npx tsx apps/web/scripts/generate-category-images.ts --force     # 全再生成
 *   GEMINI_API_KEY=xxx npx tsx apps/web/scripts/generate-category-images.ts --only ict  # 1 件だけ
 *
 * API キーは Google AI Studio (https://aistudio.google.com/apikey) で発行。
 * 料金 (2025-2026): Gemini 2.5 Flash Image は 1 枚 ≈ $0.039。17 枚 ≈ $0.7 の一度きり。
 */

import { createHash } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { config as loadEnv } from "dotenv";
import sharp from "sharp";

// cwd 非依存にする (repo root / apps/web どちらから実行しても同じ挙動)。
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const APP_WEB_DIR = path.join(SCRIPT_DIR, "..");
const REPO_ROOT = path.join(APP_WEB_DIR, "..", "..");
// GEMINI_API_KEY は root か apps/web の .env.local から読む (無ければ process.env)。
loadEnv({ path: path.join(REPO_ROOT, ".env.local") });
loadEnv({ path: path.join(APP_WEB_DIR, ".env.local") });

// 統一感を出すための固定スタイル (17 枚が 1 セットとして揃うように prompt 前置を共通化)。
const STYLE_PREFIX =
  "Minimal flat editorial vector illustration for a Japanese government-statistics website. " +
  "Soft muted palette of indigo, slate blue and warm neutral tones on a very light off-white background. " +
  "Clean geometric shapes, gentle subtle gradients, calm and trustworthy mood, isometric-lite perspective, " +
  "generous negative space, centered composition. Absolutely no text, no letters, no numbers, no logos, no UI. " +
  "Subject: ";

/** categoryKey → 描く主題 (STYLE_PREFIX に続けて 1 セットの統一画風で生成する)。 */
const CATEGORY_SUBJECTS: Record<string, string> = {
  landweather:
    "a serene Japanese landscape with layered mountains, a coastline, and soft weather clouds with a small sun",
  population:
    "a small diverse group of simple people silhouettes with a few house shapes, evoking households and demographics",
  laborwage:
    "an office worker with a briefcase beside a bar chart and a few stacked coins, evoking work and wages",
  agriculture:
    "terraced rice fields, a small fishing boat on water, and a stylized forest, evoking farming, forestry and fishery",
  miningindustry:
    "a tidy factory building with a smokestack and interlocking gears, evoking manufacturing and industry",
  commercial:
    "a friendly small shop storefront with an awning and a shopping bag, evoking retail and services",
  economy:
    "a pie chart, a few coins and small buildings with a household budget notebook, evoking economy and finance",
  construction:
    "modern houses with a construction crane and land plots, evoking housing, land and construction",
  energy:
    "power transmission lines with a wind turbine, a solar panel and water droplets, evoking energy and water",
  tourism:
    "an airplane and a train with a rolling suitcase and a simple landmark, evoking transport and tourism",
  educationsports:
    "a graduation cap, an open book and a sports ball, evoking education, culture and sports",
  administrativefinancial:
    "a classical government building with columns and a few documents, evoking public administration and finance",
  safetyenvironment:
    "a shield with balanced scales of justice and green leaves, evoking justice, safety and environment",
  socialsecurity:
    "a hospital building with a heart and a medical cross held by caring hands, evoking social security and health",
  international:
    "a globe with a few connection lines and small abstract flags, evoking international affairs",
  infrastructure:
    "a bridge, a road and utility poles, evoking public infrastructure facilities",
  ict: "abstract network nodes with a wifi symbol, a satellite and a circuit motif, evoking ICT and technology",
};

const OUT_DIR = path.join(APP_WEB_DIR, "public", "images", "categories");
const MODEL = "gemini-2.5-flash-image";
const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
// カード上部バナー用 3:2。sharp で cover リサイズして webp 圧縮。
const OUT_WIDTH = 768;
const OUT_HEIGHT = 512;

interface Args {
  force: boolean;
  only?: string;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { force: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--force") args.force = true;
    else if (argv[i] === "--only") args.only = argv[++i];
  }
  return args;
}

async function generateOne(
  apiKey: string,
  key: string,
  subject: string,
): Promise<{ key: string; status: "ok" | "skip" | "fail"; note?: string }> {
  const outPath = path.join(OUT_DIR, `${key}.webp`);
  const prompt = STYLE_PREFIX + subject + ".";

  const res = await fetch(`${API_BASE}/${MODEL}:generateContent`, {
    method: "POST",
    headers: {
      "x-goog-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ["IMAGE"] },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    return { key, status: "fail", note: `HTTP ${res.status}: ${body.slice(0, 200)}` };
  }

  const json = (await res.json()) as {
    candidates?: {
      content?: { parts?: { inlineData?: { data?: string; mimeType?: string } }[] };
    }[];
  };
  const part = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
  const b64 = part?.inlineData?.data;
  if (!b64) {
    return { key, status: "fail", note: "レスポンスに inlineData 画像なし" };
  }

  const buf = Buffer.from(b64, "base64");
  await sharp(buf)
    .resize(OUT_WIDTH, OUT_HEIGHT, { fit: "cover", position: "centre" })
    .webp({ quality: 82 })
    .toFile(outPath);

  const hash = createHash("sha256").update(buf).digest("hex").slice(0, 8);
  return { key, status: "ok", note: `${(buf.length / 1024).toFixed(0)}KB src / sha ${hash}` };
}

async function main() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error(
      "❌ GEMINI_API_KEY が未設定です。Google AI Studio で発行し、\n" +
        "   .env.local に GEMINI_API_KEY=... を追加するか、コマンド前に付けてください。",
    );
    process.exit(1);
  }

  const args = parseArgs(process.argv.slice(2));
  mkdirSync(OUT_DIR, { recursive: true });

  const entries = Object.entries(CATEGORY_SUBJECTS).filter(
    ([key]) => !args.only || key === args.only,
  );
  if (entries.length === 0) {
    console.error(`❌ --only ${args.only} は 17 カテゴリに存在しません`);
    process.exit(1);
  }

  console.log(`🎨 Gemini (${MODEL}) で ${entries.length} 件のカテゴリ画像を生成`);
  const results: { key: string; status: string; note?: string }[] = [];
  for (const [key, subject] of entries) {
    const outPath = path.join(OUT_DIR, `${key}.webp`);
    if (!args.force && existsSync(outPath)) {
      console.log(`  ⏭️  ${key} (既存・--force で再生成)`);
      results.push({ key, status: "skip" });
      continue;
    }
    try {
      const r = await generateOne(apiKey, key, subject);
      const icon = r.status === "ok" ? "✅" : "❌";
      console.log(`  ${icon} ${key} ${r.note ?? ""}`);
      results.push(r);
    } catch (e) {
      console.log(`  ❌ ${key} ${e instanceof Error ? e.message : String(e)}`);
      results.push({ key, status: "fail", note: String(e) });
    }
  }

  const ok = results.filter((r) => r.status === "ok").length;
  const fail = results.filter((r) => r.status === "fail").length;
  const skip = results.filter((r) => r.status === "skip").length;
  console.log(`\n完了: ✅ ${ok} 生成 / ⏭️ ${skip} スキップ / ❌ ${fail} 失敗 → ${OUT_DIR}`);
  if (fail > 0) process.exit(1);
}

main();
