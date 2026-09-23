#!/usr/bin/env tsx
/**
 * render-ig-carousel.ts — Instagram「地域」(火・土枠) / 「相関」(水枠) カルーセルの
 * props.json 1本から stills 一式 + caption.txt を書き出す唯一の入口。
 *
 * 正典: .claude/rules/sns-content-standards.md §2-3c（切り口・データ源）/ §2-3（キャプション規約）。
 * Remotion コンポジション本体は apps/remotion/src/features/{area-instagram,correlation-instagram}/。
 * 本スクリプトはそこへ委譲するだけで、見た目のロジックは持たない。
 *
 * props.json は以下の生成物をそのまま渡す (このスクリプトは変更・再計算しない):
 *   地域: `.claude/scripts/sns/build-ig-area-props.ts` の出力
 *   相関: `.claude/scripts/sns/build-ig-correlation-props.ts` の出力
 *
 * 検証は Remotion 側の zod schema と resolve*() 関数を再利用する。props が欠けている・矛盾している
 * (例: canonicalUrl と areaCode が食い違う、highlights の県が points に無い) 場合は remotion CLI へ
 * 渡す前に Node 側で fail-closed する。
 *
 * Usage:
 *   npx tsx .claude/scripts/sns/render-ig-carousel.ts --domain area \
 *     --props .local/r2/sns/area-carousel/06000/instagram/props.json
 *   npx tsx .claude/scripts/sns/render-ig-carousel.ts --domain correlation \
 *     --props .local/r2/sns/correlation-carousel/aging-rate--clinic-count-per-100k/instagram/props.json
 *
 * 出力 (既定. --out で上書き可):
 *   .local/r2/sns/area-carousel/<areaCode>/instagram/{caption.txt,stills/slide-<n>-<name>-1080x1350.png}
 *   .local/r2/sns/correlation-carousel/<xKey>--<yKey>/instagram/{caption.txt,stills/slide-<n>-<name>-1080x1350.png}
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import {
  AREA_CAROUSEL_SLIDES,
  resolveAreaCarousel,
  type AreaCarouselSlide,
  type AreaCarouselSpec,
} from "../../../apps/remotion/src/features/area-instagram/area.ts";
import {
  CORRELATION_CAROUSEL_SLIDES,
  combinedSourceLabel,
  formatR,
  resolveCorrelationCarousel,
  type CorrelationCarouselSlide,
  type CorrelationCarouselSpec,
} from "../../../apps/remotion/src/features/correlation-instagram/correlation.ts";

const PROJECT_ROOT = join(import.meta.dirname ?? __dirname, "../../..");
const REMOTION_DIR = join(PROJECT_ROOT, "apps/remotion");
const LOCAL_R2 = join(PROJECT_ROOT, ".local/r2");
const CHROME =
  process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const DOMAINS = ["area", "correlation"] as const;
type Domain = (typeof DOMAINS)[number];

const AREA_COMPOSITION_ID = "AreaInstagram-Carousel";
const CORRELATION_COMPOSITION_ID = "CorrelationInstagram-Carousel";

/** キャプションの規約 (sns-content-standards.md §2-3): 2200字以内・ハッシュタグ8〜13個 */
const CAPTION_MAX_CHARS = 2200;
const HASHTAG_MIN = 8;
const HASHTAG_MAX = 13;

// ─── CLI ────────────────────────────────────────────────────────────────────

function parseArgs() {
  const argv = process.argv.slice(2);
  const val = (name: string): string | null => {
    const i = argv.indexOf(name);
    return i !== -1 ? (argv[i + 1] ?? null) : null;
  };
  const domain = val("--domain");
  const props = val("--props");
  if (!domain || !DOMAINS.includes(domain as Domain)) {
    console.error(`✗ --domain area|correlation を指定してください (受け取った値: ${domain ?? "なし"})`);
    process.exit(1);
  }
  if (!props) {
    console.error("✗ --props <path> を指定してください (build-ig-*-props.ts の出力)");
    process.exit(1);
  }
  return { domain: domain as Domain, propsPath: props, out: val("--out") };
}

// ─── キャプション生成 (地域) ────────────────────────────────────────────────

const AREA_HASHTAGS = [
  "都道府県データ",
  "統計",
  "地方創生",
  "ランキング",
  "都道府県あるある",
  "暮らし",
  "地域比較",
  "日本",
  "データで見る日本",
];

function buildAreaCaption(spec: AreaCarouselSpec, sourceLines: string[]): string {
  const [topGroup, bottomGroup] = spec.groups;
  const listLines = (label: string, group: AreaCarouselSpec["groups"][number]) => {
    const rows = group.items
      .map((item) => `${item.label} ${item.rank}位（${item.value}${item.unit}・${item.year}年）`)
      .join("\n");
    return `${label}:\n${rows}`;
  };

  const lines = [
    `【都道府県データ】${spec.coverHook}`,
    "",
    listLines(topGroup.title, topGroup),
    "",
    listLines(bottomGroup.title, bottomGroup),
    "",
    "保存して後で見返してね📌",
    "プロフィールのリンクから全47都道府県が見られます",
    "",
    `出典: ${sourceLines.join("、")}`,
    "",
    [...AREA_HASHTAGS, spec.areaName].map((t) => `#${t}`).join(" "),
  ];
  return lines.join("\n");
}

// ─── キャプション生成 (相関) ────────────────────────────────────────────────

const CORRELATION_HASHTAGS = [
  "都道府県データ",
  "統計",
  "相関",
  "データ分析",
  "日本",
  "ランキング",
  "暮らし",
  "地域比較",
  "データで見る日本",
];

function buildCorrelationCaption(spec: CorrelationCarouselSpec): string {
  const lines = [
    `【データの相関】${spec.x.label} × ${spec.y.label}`,
    "",
    spec.hook,
    "",
    `縦軸: ${spec.y.label}（${spec.y.unit}・${spec.y.year}年）出典: ${spec.y.source}`,
    `横軸: ${spec.x.label}（${spec.x.unit}・${spec.x.year}年）出典: ${spec.x.source}`,
    "",
    `相関係数 r=${formatR(spec.r)}（人口の影響を除くと r=${formatR(spec.rPopulationAdjusted)}）`,
    "",
    spec.caution,
    "",
    "保存して後で見返してね📌",
    "プロフィールのリンクから全47都道府県のデータが見られます",
    "",
    [...CORRELATION_HASHTAGS, spec.x.category, spec.y.category].map((t) => `#${t}`).join(" "),
  ];
  return lines.join("\n");
}

// ─── キャプション検証 (fail-closed) ────────────────────────────────────────

function assertCaptionValid(caption: string): void {
  if (caption.length > CAPTION_MAX_CHARS) {
    throw new Error(`caption が${CAPTION_MAX_CHARS}字を超えています (${caption.length}字)`);
  }
  const hashtagCount = (caption.match(/#[^\s#]+/g) ?? []).length;
  if (hashtagCount < HASHTAG_MIN || hashtagCount > HASHTAG_MAX) {
    throw new Error(
      `ハッシュタグは${HASHTAG_MIN}〜${HASHTAG_MAX}個の規約です (実際: ${hashtagCount}個)`,
    );
  }
}

// ─── slide 定義 ─────────────────────────────────────────────────────────────

interface SlideDef<S extends string> {
  slide: S;
  name: string;
}

const AREA_SLIDE_DEFS: SlideDef<AreaCarouselSlide>[] = AREA_CAROUSEL_SLIDES.map((slide) => ({
  slide,
  name: slide,
}));

const CORRELATION_SLIDE_DEFS: SlideDef<CorrelationCarouselSlide>[] = CORRELATION_CAROUSEL_SLIDES.map(
  (slide) => ({ slide, name: slide }),
);

// ─── remotion still 実行 ────────────────────────────────────────────────────

function renderStill(compositionId: string, propsPath: string, outPath: string): void {
  mkdirSync(dirname(outPath), { recursive: true });
  const res = spawnSync(
    "npx",
    [
      "remotion",
      "still",
      "src/index.ts",
      compositionId,
      outPath,
      `--props=${propsPath}`,
      `--browser-executable=${CHROME}`,
    ],
    { cwd: REMOTION_DIR, stdio: "pipe", encoding: "utf-8" },
  );
  if (res.status !== 0 || !existsSync(outPath)) {
    console.error(res.stdout);
    console.error(res.stderr);
    throw new Error(`remotion still 失敗: ${compositionId} → ${outPath}`);
  }
}

// ─── main ───────────────────────────────────────────────────────────────────

async function main() {
  const { domain, propsPath, out } = parseArgs();
  const rawText = readFileSync(propsPath, "utf-8");
  const raw = JSON.parse(rawText);

  const tmpDir = mkdtempSync(join(tmpdir(), "ig-carousel-props-"));
  try {
    if (domain === "area") {
      const { spec, sourceLines } = resolveAreaCarousel(raw);
      const outDir = out ?? join(LOCAL_R2, "sns/area-carousel", spec.areaCode, "instagram");
      const stillsDir = join(outDir, "stills");
      mkdirSync(stillsDir, { recursive: true });

      AREA_SLIDE_DEFS.forEach((def, i) => {
        const propsForSlide = { ...raw, slide: def.slide };
        const tmpPropsPath = join(tmpDir, `${def.slide}.json`);
        writeFileSync(tmpPropsPath, JSON.stringify(propsForSlide));
        const outPath = join(stillsDir, `slide-${i + 1}-${def.name}-1080x1350.png`);
        renderStill(AREA_COMPOSITION_ID, tmpPropsPath, outPath);
        console.error(`✓ ${outPath}`);
      });

      const caption = buildAreaCaption(spec, sourceLines);
      assertCaptionValid(caption);
      writeFileSync(join(outDir, "caption.txt"), caption, "utf-8");
      console.error(`✓ ${join(outDir, "caption.txt")}`);
      console.error(`完了: ${spec.areaName} (${spec.areaCode}) — ${outDir}`);
      return;
    }

    // correlation
    const { spec } = resolveCorrelationCarousel(raw);
    const contentKey = `${spec.x.key}--${spec.y.key}`;
    const outDir = out ?? join(LOCAL_R2, "sns/correlation-carousel", contentKey, "instagram");
    const stillsDir = join(outDir, "stills");
    mkdirSync(stillsDir, { recursive: true });

    CORRELATION_SLIDE_DEFS.forEach((def, i) => {
      const propsForSlide = { ...raw, slide: def.slide };
      const tmpPropsPath = join(tmpDir, `${def.slide}.json`);
      writeFileSync(tmpPropsPath, JSON.stringify(propsForSlide));
      const outPath = join(stillsDir, `slide-${i + 1}-${def.name}-1080x1350.png`);
      renderStill(CORRELATION_COMPOSITION_ID, tmpPropsPath, outPath);
      console.error(`✓ ${outPath}`);
    });

    const caption = buildCorrelationCaption(spec);
    assertCaptionValid(caption);
    writeFileSync(join(outDir, "caption.txt"), caption, "utf-8");
    console.error(`✓ ${join(outDir, "caption.txt")}`);
    console.error(`完了: ${combinedSourceLabel(spec)} — ${contentKey} — ${outDir}`);
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(`✗ ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
