/**
 * AI 画像生成 CLI
 *
 * 使用方法:
 *   npx tsx apps/remotion/scripts/generate-ai-image.ts "aerial night view of Tokyo"
 *   npx tsx apps/remotion/scripts/generate-ai-image.ts --preset tokyo
 *   npx tsx apps/remotion/scripts/generate-ai-image.ts --quota  (残りクォータ確認)
 *
 * 生成画像は .local/r2/ai-images/ に保存される。
 */

import { config } from "dotenv";
import path from "node:path";

config({ path: path.resolve(__dirname, "..", "..", "..", ".env.local") });

import { generateImage, getRemainingQuota } from "../src/lib/ai-image";

// ---------- 都市夜景プリセット ----------

const CITY_PRESETS: Record<string, { prompt: string; negativePrompt: string }> =
  {
    tokyo: {
      prompt:
        "aerial night view of Tokyo cityscape, Tokyo Tower and Skytree visible, glowing city lights, cinematic photography, ultra realistic, 4k",
      negativePrompt: "text, watermark, blurry, low quality, daytime",
    },
    osaka: {
      prompt:
        "aerial night view of Osaka cityscape, Tsutenkaku tower and Umeda skyline, neon lights reflecting on rivers, cinematic photography, ultra realistic, 4k",
      negativePrompt: "text, watermark, blurry, low quality, daytime",
    },
    yokohama: {
      prompt:
        "aerial night view of Yokohama cityscape, Landmark Tower and Bay Bridge, harbor lights reflecting on water, cinematic photography, ultra realistic, 4k",
      negativePrompt: "text, watermark, blurry, low quality, daytime",
    },
    nagoya: {
      prompt:
        "aerial night view of Nagoya cityscape, TV tower and modern buildings, city lights at night, cinematic photography, ultra realistic, 4k",
      negativePrompt: "text, watermark, blurry, low quality, daytime",
    },
    sapporo: {
      prompt:
        "aerial night view of Sapporo cityscape, grid street pattern with lights, mountains in background, winter atmosphere, cinematic photography, ultra realistic, 4k",
      negativePrompt: "text, watermark, blurry, low quality, daytime",
    },
    fukuoka: {
      prompt:
        "aerial night view of Fukuoka cityscape, Hakata bay and modern buildings, city lights reflecting on water, cinematic photography, ultra realistic, 4k",
      negativePrompt: "text, watermark, blurry, low quality, daytime",
    },
    kobe: {
      prompt:
        "aerial night view of Kobe cityscape, port tower and harbor illumination, mountains backdrop, cinematic photography, ultra realistic, 4k",
      negativePrompt: "text, watermark, blurry, low quality, daytime",
    },
    kyoto: {
      prompt:
        "aerial night view of Kyoto cityscape, traditional and modern buildings mixed, Kyoto Tower visible, subtle warm lights, cinematic photography, ultra realistic, 4k",
      negativePrompt: "text, watermark, blurry, low quality, daytime",
    },
  };

// ---------- メイン ----------

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help")) {
    console.log(`
AI 画像生成 CLI (Cloudflare Workers AI / Stable Diffusion XL)

使用方法:
  npx tsx apps/remotion/scripts/generate-ai-image.ts "プロンプト"
  npx tsx apps/remotion/scripts/generate-ai-image.ts --preset <都市名>
  npx tsx apps/remotion/scripts/generate-ai-image.ts --quota

プリセット: ${Object.keys(CITY_PRESETS).join(", ")}

残りクォータ: ${getRemainingQuota()} 枚/日
`);
    return;
  }

  // クォータ確認モード
  if (args.includes("--quota")) {
    const remaining = getRemainingQuota();
    console.log(`本日の残り生成可能数: ${remaining} 枚`);
    return;
  }

  // プリセットモード
  const presetIdx = args.indexOf("--preset");
  if (presetIdx !== -1) {
    const presetName = args[presetIdx + 1];
    if (!presetName || !(presetName in CITY_PRESETS)) {
      console.error(
        `不明なプリセット: ${presetName}\n利用可能: ${Object.keys(CITY_PRESETS).join(", ")}`,
      );
      process.exit(1);
    }
    const preset = CITY_PRESETS[presetName];
    console.log(`プリセット "${presetName}" で生成中...`);
    console.log(`  プロンプト: ${preset.prompt}`);

    const result = await generateImage({
      prompt: preset.prompt,
      negativePrompt: preset.negativePrompt,
    });

    if (result.cached) {
      console.log(`✅ キャッシュヒット: ${result.filePath}`);
    } else {
      console.log(`✅ 生成完了: ${result.filePath}`);
    }
    console.log(`   残りクォータ: ${result.remaining} 枚/日`);
    return;
  }

  // フリープロンプトモード
  const prompt = args.join(" ");
  console.log(`生成中: "${prompt}"`);

  const result = await generateImage({ prompt });

  if (result.cached) {
    console.log(`✅ キャッシュヒット: ${result.filePath}`);
  } else {
    console.log(`✅ 生成完了: ${result.filePath}`);
  }
  console.log(`   残りクォータ: ${result.remaining} 枚/日`);
}

main().catch((err) => {
  console.error("エラー:", err.message);
  process.exit(1);
});
