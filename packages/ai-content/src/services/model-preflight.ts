/**
 * Gemini テキストモデルの実在判定 (純関数)。
 *
 * ## なぜ要るか (2026-07-30 の障害)
 *
 * 日次 cron `ai-content-generate-daily.yml` の初回実行が **40 件すべて HTTP 404** で失敗した。
 * 404 は「そのモデルが API バージョンに存在しない」応答で、原因はキーでも配線でもなくモデル名だった。
 * にもかかわらず workflow は success で終わり、生成 0 件のまま誰も気づかなかった。
 *
 * モデルは提供終了する。コードに焼いたモデル名はいつか必ず 404 になる。だから
 * **生成を始める前に ListModels で実在を確かめ、無ければ候補付きで即落とす**。
 *
 * 判定はここ (純関数) に置き、HTTP は gemini-text-client、CLI は scripts/preflight-gemini.ts が持つ。
 */

/** 生成用途に使えないモデル (テキスト生成以外の用途) を弾く語 */
const NON_TEXT_MARKERS = [
  "embedding",
  "aqa",
  "image",
  "vision",
  "tts",
  "audio",
  "live",
  "native-audio",
  "computer-use",
];

/** 安定版として扱わない語。候補の並びで後ろに落とす (使えないわけではない) */
const UNSTABLE_MARKERS = ["preview", "exp", "experimental"];

export interface ModelAvailability {
  /** 設定中のモデルが generateContent 可能なモデル一覧に存在するか */
  ok: boolean;
  /** 設定中のモデル名 */
  configured: string;
  /** ok=false のときの代替候補 (良い順)。ok=true なら空 */
  suggestions: string[];
}

function isTextCandidate(name: string): boolean {
  const lower = name.toLowerCase();
  if (!lower.startsWith("gemini")) return false;
  return !NON_TEXT_MARKERS.some((m) => lower.includes(m));
}

function isStable(name: string): boolean {
  const lower = name.toLowerCase();
  return !UNSTABLE_MARKERS.some((m) => lower.includes(m));
}

/**
 * 設定中のモデルが使えるかを判定し、使えなければ代替候補を返す。
 *
 * 候補は **提案** であって自動選択ではない。どれに寄せるかは人 / agent が決める
 * (勝手に別モデルへ切り替えると、品質もコストも黙って変わる)。
 *
 * 並び順: 安定版 → flash 系 → 名前降順 (新しい世代が先に来る)。
 */
export function evaluateModelAvailability(
  configured: string,
  availableModels: readonly string[],
): ModelAvailability {
  const available = new Set(availableModels);
  if (available.has(configured)) {
    return { ok: true, configured, suggestions: [] };
  }

  const suggestions = availableModels
    .filter(isTextCandidate)
    .sort((a, b) => {
      const stable = Number(isStable(b)) - Number(isStable(a));
      if (stable !== 0) return stable;
      const flash = Number(b.includes("flash")) - Number(a.includes("flash"));
      if (flash !== 0) return flash;
      return b.localeCompare(a);
    });

  return { ok: false, configured, suggestions };
}
