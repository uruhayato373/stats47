/** Gemini model の実生成 preflight。ListModels は失敗時の候補提示だけに使う。 */

const NON_TEXT_MARKERS = [
  "embedding",
  "aqa",
  "image",
  "vision",
  "tts",
  "audio",
  "live",
  "computer-use",
];
const UNSTABLE_MARKERS = ["preview", "exp", "experimental"];

function isTextCandidate(name: string): boolean {
  const lower = name.toLowerCase();
  return lower.startsWith("gemini") && !NON_TEXT_MARKERS.some((marker) => lower.includes(marker));
}

function isStable(name: string): boolean {
  const lower = name.toLowerCase();
  return !UNSTABLE_MARKERS.some((marker) => lower.includes(marker));
}

export function suggestTextModels(models: readonly string[], exclude?: string): string[] {
  return models
    .filter((model) => model !== exclude && isTextCandidate(model))
    .sort((a, b) => {
      const stableOrder = Number(isStable(b)) - Number(isStable(a));
      if (stableOrder) return stableOrder;
      const flashOrder = Number(b.includes("flash")) - Number(a.includes("flash"));
      return flashOrder || b.localeCompare(a);
    });
}

export function evaluateModelAvailability(configured: string, models: readonly string[]) {
  if (models.includes(configured)) {
    return { ok: true as const, configured, suggestions: [] as string[] };
  }
  return {
    ok: false as const,
    configured,
    suggestions: suggestTextModels(models, configured),
  };
}

export type SmokeResult =
  | { ok: true }
  | { ok: false; classification: string; status?: number };

export interface PreflightReport {
  ok: boolean;
  messages: string[];
  suggestions: string[];
  classification?: string;
}

export async function runModelPreflight(deps: {
  configured: string;
  smoke: () => Promise<SmokeResult>;
  listModels: () => Promise<string[]>;
}): Promise<PreflightReport> {
  const smoke = await deps.smoke();
  if (smoke.ok) {
    return {
      ok: true,
      messages: [`✅ ${deps.configured} で structured generateContent が成功`],
      suggestions: [],
    };
  }

  const status = smoke.status ? ` (HTTP ${smoke.status})` : "";
  const messages = [
    `❌ ${deps.configured} の structured generateContent に失敗: ${smoke.classification}${status}`,
  ];

  if (smoke.classification === "billing") {
    messages.push(
      "  前払いクレジットが枯渇している。待機やモデル変更では復旧しない",
      "  AI Studio の請求設定を確認する。無料運用では請求未設定の専用project/keyを使う",
    );
    return {
      ok: false,
      messages,
      suggestions: [],
      classification: smoke.classification,
    };
  }

  if (smoke.classification === "rate-limit") {
    messages.push("  無料枠のクォータ/レート制限。次回scheduleへ繰り越す");
    return {
      ok: false,
      messages,
      suggestions: [],
      classification: smoke.classification,
    };
  }

  let models: string[];
  try {
    models = await deps.listModels();
  } catch {
    messages.push("  ListModels も失敗したため代替候補を確定できない");
    return {
      ok: false,
      messages,
      suggestions: [],
      classification: smoke.classification,
    };
  }

  messages.push(
    models.includes(deps.configured)
      ? `  ${deps.configured} は一覧にあるが実生成できない。権限または提供状態を確認する`
      : `  ${deps.configured} は ListModels に無い`,
  );
  return {
    ok: false,
    messages,
    suggestions: suggestTextModels(models, deps.configured),
    classification: smoke.classification,
  };
}
