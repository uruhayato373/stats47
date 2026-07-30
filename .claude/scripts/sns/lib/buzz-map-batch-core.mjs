/**
 * buzz-map batch 生成の純粋プランナ (§8 生成・R2・draft / §8.1 対象 / §8.2 R2 key)。
 *
 * prepare-buzz-map-batch.ts (CLI) が使う「何をどの順で実行するか」を副作用なしで組み立てる。
 * 実 IO (spawn render / R2 push / posts insert) は CLI 側。ここは決定的にプランと検証だけ行う。
 * テストはネットワーク・spawn をモックせずこの純粋関数群を直接叩ける。
 */

// ---------------------------------------------------------------------------
// §8.1 型別の生成対象 (asset plan)
// ---------------------------------------------------------------------------

/**
 * recommendedType → 生成アセット。
 *   A/C/E: 4:5 静止画のみ (X + IG)
 *   B/D:   最終状態 4:5 静止画 + X 動画 + IG 9:16 リール
 *   F/flow: renderer 未整備 → catalog のみ (生成対象外)
 * @param {string} type
 * @returns {{ still:boolean, xVideo:boolean, igReel:boolean, renderable:boolean, reason:string|null }}
 */
export function assetPlanForType(type) {
  switch (type) {
    case "A":
    case "C":
    case "E":
      return { still: true, xVideo: false, igReel: false, renderable: true, reason: null };
    case "B":
    case "D":
      return { still: true, xVideo: true, igReel: true, renderable: true, reason: null };
    case "F":
    case "flow":
      return {
        still: false,
        xVideo: false,
        igReel: false,
        renderable: false,
        reason: `型${type} は renderer 未整備 (§8.1 catalog のみ)`,
      };
    default:
      return {
        still: false,
        xVideo: false,
        igReel: false,
        renderable: false,
        reason: `未知の型: ${type}`,
      };
  }
}

/** 型 → remotion composition id (SKILL.md 準拠)。still は 4:5、reel は比率別。 */
export function compositionsForType(type) {
  const plan = assetPlanForType(type);
  const comps = {};
  if (plan.still) comps.still = "BuzzMap-Still-45"; // 1080×1350 4:5 (X/IG 共用)
  if (plan.xVideo) comps.xVideo = type === "B" ? "BuzzMap-Reel-11" : "BuzzMap-Reel-11"; // X 1:1/正方
  if (plan.igReel) comps.igReel = "BuzzMap-Reel-916"; // IG 9:16
  return comps;
}

// ---------------------------------------------------------------------------
// §8.2 R2 key 構造
// ---------------------------------------------------------------------------

const R2_BASE = "sns/buzz-map";

/** ideaId → §8.2 の R2 キー群 (生成する asset に対応する分だけ)。 */
export function r2KeysFor(ideaId, plan) {
  const keys = {};
  if (plan.still) {
    keys.xStill = `${R2_BASE}/${ideaId}/x/stills/${ideaId}-45.png`;
    keys.igStill = `${R2_BASE}/${ideaId}/instagram/stills/slide-1-cover-1080x1350.png`;
  }
  if (plan.xVideo) keys.xReel = `${R2_BASE}/${ideaId}/x/reel.mp4`;
  if (plan.igReel) keys.igReel = `${R2_BASE}/${ideaId}/instagram/reel.mp4`;
  keys.xCaption = `${R2_BASE}/${ideaId}/x/caption.txt`;
  keys.igCaption = `${R2_BASE}/${ideaId}/instagram/caption.txt`;
  return keys;
}

/** R2 キーの拡張子 → 期待 Content-Type (§8.2 検証)。 */
export function expectedContentType(key) {
  if (key.endsWith(".png")) return "image/png";
  if (key.endsWith(".mp4")) return "video/mp4";
  if (key.endsWith(".txt")) return "text/plain";
  return null;
}

// ---------------------------------------------------------------------------
// 動画上限 — 1 バッチ最大 3 本
// ---------------------------------------------------------------------------

/**
 * batch の候補に動画上限 (既定 3) を課す。動画を持つ候補が上限を超えたら、
 * 超過分は「静止画のみ」に降格する（default batch size 12・動画 1batch 最大 3）。
 * @param {Array<{ideaId:string, assetPlan:object}>} candidates score 降順で渡す
 * @param {number} maxVideos
 * @returns {Array<{ideaId:string, assetPlan:object, videoDeferred:boolean}>}
 */
export function capVideos(candidates, maxVideos = 3) {
  let videoCount = 0;
  return candidates.map((c) => {
    const hasVideo = c.assetPlan.xVideo || c.assetPlan.igReel;
    if (hasVideo && videoCount < maxVideos) {
      videoCount += 1;
      return { ...c, videoDeferred: false };
    }
    if (hasVideo) {
      // 上限超過 → 動画を落として静止画のみ
      return {
        ...c,
        assetPlan: { ...c.assetPlan, xVideo: false, igReel: false },
        videoDeferred: true,
      };
    }
    return { ...c, videoDeferred: false };
  });
}

// ---------------------------------------------------------------------------
// idempotency 判定
// ---------------------------------------------------------------------------

/**
 * R2 既存素材 (HEAD 200 セット) と posts.json 既 draft から、この候補を skip すべきか判定。
 * @param {object} params
 * @param {string[]} params.requiredKeys 生成予定の R2 キー群
 * @param {Set<string>} params.existingR2Keys HEAD 200 が返ったキー集合
 * @param {boolean} params.alreadyDraft posts.json に (platform,domain,content_key) draft が既にあるか
 * @returns {{ skip:boolean, reason:string|null, missingKeys:string[] }}
 */
export function idempotencyDecision({ requiredKeys, existingR2Keys, alreadyDraft }) {
  const missingKeys = requiredKeys.filter((k) => !existingR2Keys.has(k));
  if (alreadyDraft && missingKeys.length === 0) {
    return { skip: true, reason: "既 draft + R2 素材全て存在 (idempotent skip)", missingKeys: [] };
  }
  return { skip: false, reason: null, missingKeys };
}

// ---------------------------------------------------------------------------
// caption 完全性（draft gate: 出典・年度・対象単位）
// ---------------------------------------------------------------------------

/**
 * caption に出典・年度・対象単位が含まれるかの決定的チェック。
 * @param {string} caption
 * @param {{ requiredYear?:string, requiredUnitTerms?:string[], sourceRequired?:boolean }} req
 * @returns {{ complete:boolean, missing:string[] }}
 */
export function captionComplete(caption, req = {}) {
  const missing = [];
  const text = typeof caption === "string" ? caption : "";
  // 出典: 「出典」「総務省」等の語 or URL。sourceRequired 既定 true
  if (req.sourceRequired !== false) {
    const hasSource = /出典|統計|e-Stat|estat|https?:\/\//i.test(text);
    if (!hasSource) missing.push("出典");
  }
  if (req.requiredYear && !text.includes(req.requiredYear)) missing.push(`年度 ${req.requiredYear}`);
  if (Array.isArray(req.requiredUnitTerms) && req.requiredUnitTerms.length > 0) {
    const hasUnit = req.requiredUnitTerms.some((u) => u && text.includes(u));
    if (!hasUnit) missing.push(`対象単位 (${req.requiredUnitTerms.join("/")})`);
  }
  return { complete: missing.length === 0, missing };
}

// ---------------------------------------------------------------------------
// 候補ごとの実行プラン組み立て (dry-run 表示 + apply 手順の単一ソース)
// ---------------------------------------------------------------------------

/**
 * 1 候補の実行プランを組み立てる (純粋)。CLI は dry-run でこれを表示、apply でこの steps を順に実行。
 * @param {object} entry curated catalog entry (ideaId/recommendedType/landing/commercialUse/sensitivity)
 * @param {object} opts { specExists:boolean, specId:string|null }
 * @returns {{ ideaId:string, type:string, renderable:boolean, blocked:boolean, blockReason:string|null,
 *   assetPlan:object, compositions:object, r2Keys:object, steps:string[] }}
 */
export function buildCandidatePlan(entry, opts = {}) {
  const type = entry.recommendedType ?? "A";
  const assetPlan = assetPlanForType(type);
  const compositions = compositionsForType(type);
  const r2Keys = r2KeysFor(entry.ideaId, assetPlan);
  const steps = [];
  let blocked = false;
  let blockReason = null;

  if (!assetPlan.renderable) {
    blocked = true;
    blockReason = assetPlan.reason;
    return { ideaId: entry.ideaId, type, renderable: false, blocked, blockReason, assetPlan, compositions, r2Keys, steps };
  }
  if (entry.commercialUse !== "allowed") {
    blocked = true;
    blockReason = `commercialUse=${entry.commercialUse} (draft 不可)`;
  }
  if (entry.sensitivity === "high") {
    blocked = true;
    blockReason = (blockReason ? blockReason + " / " : "") + "sensitivity=high";
  }

  steps.push(
    opts.specExists
      ? `spec 確認済み: ${opts.specId}.json (再利用)`
      : `spec 生成 (build-buzz-map-spec: ${entry.ideaId})`,
  );
  if (assetPlan.still) steps.push(`still レンダ (${compositions.still}) → ${r2Keys.xStill} / ${r2Keys.igStill}`);
  if (assetPlan.xVideo) steps.push(`X 動画レンダ (${compositions.xVideo}) → ${r2Keys.xReel}`);
  if (assetPlan.igReel) steps.push(`IG リールレンダ (${compositions.igReel}) → ${r2Keys.igReel}`);
  steps.push("決定的レンダ検査 (寸法/非空)");
  steps.push("R2 push (push-exact-r2-assets --key <generated asset>)");
  steps.push("R2 HEAD 検証 (HTTP 200 + Content-Type)");
  steps.push("caption 生成 (UTM + 出典/年度/対象単位)");
  steps.push("landing contract 検証 (verifyLandingContract → pass)");
  steps.push("isPostable 全条件 PASS のみ posts.json draft insert (予約なし)");

  return { ideaId: entry.ideaId, type, renderable: true, blocked, blockReason, assetPlan, compositions, r2Keys, steps };
}
