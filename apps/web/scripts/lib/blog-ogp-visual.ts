/**
 * ブログ OGP AI 背景の「決定的な解決 + プロンプト + hash」。
 *
 * frontmatter から visualType / motif を決定的に導き (モデルに分類させない)、
 * 固定スタイル + カタログ + タイトルからプロンプトを組み立て、promptHash を計算する。
 *
 * 正典: docs/02_実装計画/23_ブログOGP生成AIパイプライン仕様.md
 */

import { createHash } from "node:crypto";

import type { OgpVisualType } from "@stats47/types";

import {
  ARCHETYPE_TO_VISUAL,
  CATEGORY_TO_VISUAL,
  DEFAULT_MOTIF,
  DEFAULT_VISUAL_TYPE,
  defaultMotifFor,
  isValidMotif,
  isValidVisualType,
  motifFragment,
  OGP_MODEL,
  OGP_PROMPT_VERSION,
  OGP_STYLE_PREFIX,
  TAG_TO_VISUAL,
} from "../data/blog-ogp-visual-catalog";

/** 解決の入力 (article.md frontmatter から抜いた最小限)。 */
export interface OgpVisualInput {
  ogpVisualType?: string | null;
  ogpMotif?: string | null;
  category?: string | null;
  archetype?: string | null;
  tags?: string[] | null;
}

/**
 * article.md 先頭の YAML frontmatter から visual 解決に必要なフィールドだけを抜く。
 * tags は `tags: [a, b]` と複数行 `- a` の両方に対応。値の生プロンプトは扱わない。
 */
export function parseOgpVisualFrontmatter(markdown: string): OgpVisualInput {
  const m = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const block = m ? m[1] : "";
  const scalar = (key: string): string | null => {
    const line = block.match(new RegExp(`^${key}:[ \\t]*(.+)$`, "m"));
    if (!line) return null;
    let v = line[1].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    return v || null;
  };
  // tags: [a, b] インライン
  let tags: string[] = [];
  const inline = block.match(/^tags:[ \t]*\[(.*)\]/m);
  if (inline) {
    tags = inline[1]
      .split(",")
      .map((s) => s.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);
  } else {
    // tags:\n  - a\n  - b ブロック
    const blockList = block.match(/^tags:[ \t]*\r?\n((?:[ \t]*-[ \t]*.+\r?\n?)+)/m);
    if (blockList) {
      tags = blockList[1]
        .split(/\r?\n/)
        .map((l) => l.replace(/^[ \t]*-[ \t]*/, "").trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    }
  }
  return {
    ogpVisualType: scalar("ogpVisualType"),
    ogpMotif: scalar("ogpMotif"),
    category: scalar("category"),
    archetype: scalar("archetype"),
    tags,
  };
}

export type OgpVisualSource =
  | "explicit"
  | "category"
  | "archetype"
  | "tags"
  | "default";

export interface OgpVisualResolution {
  visualType: OgpVisualType;
  motif: string;
  /** どの tier で決まったか (監査・ログ用) */
  source: OgpVisualSource;
}

/**
 * 解決優先順位 (§4):
 *  1. frontmatter の有効な ogpVisualType
 *  2. category → archetype → tags の決定的対応表 (順序固定)
 *  3. 既定 map / prefecture-comparison
 * motif は「有効な ogpMotif > visualType の既定 motif」。
 */
export function resolveOgpVisual(input: OgpVisualInput): OgpVisualResolution {
  let visualType: OgpVisualType;
  let source: OgpVisualSource;

  if (input.ogpVisualType && isValidVisualType(input.ogpVisualType)) {
    visualType = input.ogpVisualType;
    source = "explicit";
  } else if (input.category && CATEGORY_TO_VISUAL[input.category]) {
    visualType = CATEGORY_TO_VISUAL[input.category];
    source = "category";
  } else if (input.archetype && ARCHETYPE_TO_VISUAL[input.archetype]) {
    visualType = ARCHETYPE_TO_VISUAL[input.archetype];
    source = "archetype";
  } else {
    const tag = (input.tags ?? []).find((t) => t && TAG_TO_VISUAL[t]);
    if (tag) {
      visualType = TAG_TO_VISUAL[tag];
      source = "tags";
    } else {
      visualType = DEFAULT_VISUAL_TYPE;
      source = "default";
    }
  }

  const motif =
    input.ogpMotif && isValidMotif(visualType, input.ogpMotif)
      ? input.ogpMotif
      : source === "default"
        ? DEFAULT_MOTIF
        : defaultMotifFor(visualType);

  return { visualType, motif, source };
}

/**
 * 背景生成プロンプト。固定スタイル + カタログ主題 + タイトル (テーマ文脈)。
 * タイトルはテーマ context としてのみ渡し、STYLE_PREFIX の "no text" で描画を禁止する。
 */
export function buildOgpPrompt(args: {
  visualType: OgpVisualType;
  motif: string;
  title: string;
}): string {
  return (
    OGP_STYLE_PREFIX +
    motifFragment(args.visualType, args.motif) +
    ". Article theme (do not render any text or letters): " +
    args.title +
    "."
  );
}

/**
 * promptHash。model / promptVersion / visualType / motif / title のいずれか変化で変わる (§12)。
 * プロンプト全文ではなく決定的な構成要素から算出 (SSOT 二重化を避ける)。
 */
export function computePromptHash(args: {
  visualType: OgpVisualType;
  motif: string;
  title: string;
  model?: string;
  promptVersion?: string;
}): string {
  const input = [
    args.promptVersion ?? OGP_PROMPT_VERSION,
    args.model ?? OGP_MODEL,
    args.visualType,
    args.motif,
    args.title,
  ].join("|");
  return "sha256-" + createHash("sha256").update(input).digest("hex").slice(0, 16);
}
