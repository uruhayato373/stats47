/**
 * Gemini テキストモデルの使用可否判定。
 *
 * ## なぜ要るか (2026-07-30 の障害)
 *
 * 日次 cron `ai-content-generate-daily.yml` の初回実行が **40 件すべて HTTP 404** で失敗した。
 * にもかかわらず workflow は success で終わり、生成 0 件のまま誰も気づかなかった。
 *
 * ## ★ListModels に載っていることは「使える」証明ではない (2026-07-31 実測)
 *
 * 当初この preflight は ListModels の一覧だけを見ていた。ところが CI で実測すると
 * `gemini-2.5-flash` は **一覧に載っていて `generateContent` を supportedGenerationMethods に
 * 持つのに、実際に generateContent を叩くと 404** だった。つまり一覧は「使える」の代理指標に
 * ならず、この preflight は壊れているパイプラインを素通りさせていた。
 *
 * よって判定は **実際に極小の生成を 1 回試す** ことで行う (出力数十トークン = 実質無料)。
 * 一覧は「落ちたときに代替候補を出す」診断にだけ使う。
 *
 * 判定はここ、HTTP は gemini-text-client、CLI は scripts/preflight-gemini.ts が持つ。
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

  const suggestions = suggestTextModels(availableModels, configured);
  return { ok: false, configured, suggestions };
}

/** 一覧からテキスト生成向け候補を良い順に並べる (設定中のモデル自身は除く) */
export function suggestTextModels(
  availableModels: readonly string[],
  exclude?: string,
): string[] {
  return availableModels
    .filter((m) => m !== exclude)
    .filter(isTextCandidate)
    .sort((a, b) => {
      const stable = Number(isStable(b)) - Number(isStable(a));
      if (stable !== 0) return stable;
      const flash = Number(b.includes("flash")) - Number(a.includes("flash"));
      if (flash !== 0) return flash;
      return b.localeCompare(a);
    });
}

// ============================================================
// 実生成による preflight (ListModels は診断にのみ使う)
// ============================================================

export type SmokeResult =
  | { ok: true }
  | { ok: false; classification: string; status?: number };

export interface PreflightDeps {
  /** 設定中のモデル名 */
  configured: string;
  /** 極小の生成を 1 回試す (これが唯一の合否判定) */
  smoke: () => Promise<SmokeResult>;
  /** 落ちたときだけ呼ぶ。代替候補の材料 */
  listModels: () => Promise<string[]>;
}

export interface PreflightReport {
  ok: boolean;
  /** 標準出力 / エラー出力に出す行 (呼び出し側が整形せずそのまま出す) */
  messages: string[];
  suggestions: string[];
  /** 失敗時の分類 (呼び出し側が汎用の復旧文を出すか決めるのに使う) */
  classification?: string;
}

/**
 * 実生成を試し、落ちたら候補を添えて報告する。
 *
 * 成功時の API 呼び出しは **1 回だけ** (ListModels は失敗時にしか呼ばない)。
 */
export async function runModelPreflight(deps: PreflightDeps): Promise<PreflightReport> {
  const smoke = await deps.smoke();
  if (smoke.ok) {
    return {
      ok: true,
      messages: [`✅ ${deps.configured} で generateContent が成功 (実生成で確認)`],
      suggestions: [],
    };
  }

  const status = smoke.status ? ` (HTTP ${smoke.status})` : "";
  const messages = [
    `❌ ${deps.configured} で generateContent に失敗: ${smoke.classification}${status}`,
  ];

  // ★クレジット枯渇 (2026-07-31 実測)。これは「モデルが使えない」でも「いま混んでいる」でもなく
  //   **人がクレジットを補充するまで全モデルで失敗し続ける**状態。時間をおくのも lite に逃げるのも
  //   効かない (課金はプロジェクト単位なのでモデルを変えても同じ)。誤った回避策を出さない。
  if (smoke.classification === "billing") {
    messages.push(
      "  ⚠ **前払いクレジットが枯渇している**。レート制限ではないので待っても戻らない",
      "  対処 (人の作業): AI Studio (https://ai.studio/projects) でクレジットを補充するか請求設定を見直す",
      "  モデル変更では回避できない (課金はプロジェクト単位。lite に落としても同じ 429 が返る)",
    );
    return { ok: false, messages, suggestions: [], classification: smoke.classification };
  }

  // ★429 (レート制限) は「モデルが使えない」ではなく「いま呼べない」。原因も対処も別なので分けて出す
  //   (2026-07-31 実測: 同じキー・同じモデルで数時間前は成功しており、提供終了ではなかった)。
  //   ここを混ぜると「モデルを変えろ」と読めてしまい、品質もコストも変わる変更を促してしまう。
  if (smoke.classification === "rate-limit") {
    messages.push(
      "  ⚠ これはクォータ/レート制限であって提供終了ではない。**モデルを変える前に時間をおいて再実行する**",
      "  (無料 tier はモデルごとに別枠なので、急ぐなら下の lite 系候補で回避できる。ただし品質は変わる)",
    );
    return { ok: false, messages, suggestions: [], classification: smoke.classification };
  }

  let models: string[] = [];
  try {
    models = await deps.listModels();
  } catch {
    messages.push(
      "  ListModels も失敗したためモデル候補を出せない (キー・ネットワークを確認する)",
    );
    return { ok: false, messages, suggestions: [], classification: smoke.classification };
  }

  const listed = models.includes(deps.configured);
  messages.push(
    listed
      ? `  ⚠ ${deps.configured} は ListModels には載っている。` +
        "一覧に載っていても generateContent が使えないことがある (2026-07-31 実測)。" +
        "提供終了かキーの権限を疑う"
      : `  ${deps.configured} は ListModels にも無い (提供終了)`,
  );

  return {
    ok: false,
    messages,
    suggestions: suggestTextModels(models, deps.configured),
    classification: smoke.classification,
  };
}
