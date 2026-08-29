/**
 * buzz-map landing router + score gate + curated↔machine dedup (純粋コア)
 *
 * 正典: .claude/rules/buzz-map-standards.md §4-5
 *   （score / hard gate / landing router / routing rule）
 *
 * ここには「純粋関数」だけ置く (実IOは inventory-core / contract-core に分離)。
 * curated-ideas.ts (TS) を build-buzz-map-catalog.ts が読み込み、各 idea を
 * ここの関数に通して gate / router 判定を得る。テストは本モジュールを直接 import する。
 */

// ---------------------------------------------------------------------------
// score — 8 要素 (0-100) + landing 補正
// ---------------------------------------------------------------------------

/** score 8 要素の満点。builder が breakdown の再計算に使う。 */
export const SCORE_MAX = {
  anomaly: 20,
  selfSearch: 15,
  replyBait: 15,
  seasonality: 10,
  externalBuzz: 10,
  gscDemand: 15,
  feasibility: 10,
  differentiation: 5,
};

/**
 * scoreBreakdown の各要素を満点でクランプし合計する (作者見積を正規化)。
 * 欠けた要素は 0 とみなす。
 * @returns {{ base:number, clamped:Record<string,number> }}
 */
export function computeBaseScore(breakdown) {
  const clamped = {};
  let base = 0;
  for (const [k, max] of Object.entries(SCORE_MAX)) {
    const v = Math.max(0, Math.min(max, Number(breakdown?.[k] ?? 0)));
    clamped[k] = v;
    base += v;
  }
  return { base, clamped };
}

/**
 * landing 補正:
 *   live の既存 ranking/blog へ約束一致で着地: +10
 *   文脈一致 vertical がある: +5
 *   landing 新規作成が必要: -5
 * @param {{ strategy:string, readiness:string, monetizationVertical:string }} landingPlan
 * @returns {{ delta:number, notes:string[] }}
 */
export function landingScoreAdjustment(landingPlan) {
  const notes = [];
  let delta = 0;
  const strategy = landingPlan?.strategy;
  const readiness = landingPlan?.readiness;
  const usesExisting =
    strategy === "existing-ranking" || strategy === "existing-blog";
  if (usesExisting && (readiness === "live" || readiness === "ready" || readiness === "review-passed")) {
    delta += 10;
    notes.push("+10 live 既存 landing へ約束一致");
  }
  if (landingPlan?.monetizationVertical && landingPlan.monetizationVertical !== "none") {
    delta += 5;
    notes.push("+5 文脈一致 vertical");
  }
  if (strategy === "create-blog" || strategy === "create-theme") {
    delta -= 5;
    notes.push("-5 landing 新規作成が必要");
  }
  return { delta, notes };
}

/**
 * curated idea の最終 score (base + landing 補正、0-100 にクランプ)。
 * @returns {{ score:number, base:number, delta:number, notes:string[] }}
 */
export function computeCuratedScore(idea) {
  const { base } = computeBaseScore(idea?.scoreBreakdown);
  const { delta, notes } = landingScoreAdjustment(idea?.landingPlan ?? {});
  const score = Math.max(0, Math.min(100, base + delta));
  return { score, base, delta, notes };
}

// ---------------------------------------------------------------------------
// hard gate — 自動生成 / 自動投稿の可否
// ---------------------------------------------------------------------------

/**
 * hard gate を評価する。「自動生成対象か」と「自動投稿対象か」を分けて返す。
 *   - license=non-commercial (commercialUse=blocked) は収益導線に使えない
 *   - competitorOverlap=exact は自動生成対象外
 *   - story/hook が空の機械 combo は自動生成対象外
 *   - sensitivity=high は自動 caption・自動投稿対象外
 * @returns {{ generatable:boolean, autoPostable:boolean, eligible:boolean, reasons:string[] }}
 */
export function evaluateHardGate(idea) {
  const reasons = [];
  let generatable = true;
  let autoPostable = true;

  if (idea?.commercialUse === "blocked") {
    generatable = false;
    autoPostable = false;
    reasons.push("commercialUse=blocked (non-commercial data・収益導線不可)");
  }
  if (idea?.competitorOverlap === "exact") {
    generatable = false;
    autoPostable = false;
    reasons.push("competitorOverlap=exact (自動生成対象外)");
  }
  const hasStory = Boolean((idea?.hook ?? "").trim()) && Boolean((idea?.question ?? "").trim());
  if (!hasStory) {
    generatable = false;
    autoPostable = false;
    reasons.push("hook/question が空 (機械 combo・自動生成対象外)");
  }
  if (idea?.sensitivity === "high") {
    autoPostable = false;
    reasons.push("sensitivity=high (自動 caption・自動投稿対象外)");
  }
  if (idea?.commercialUse === "review-required") {
    // 生成は可・投稿前にライセンス確認が要る (review-required)
    reasons.push("commercialUse=review-required (投稿前にライセンス確認)");
  }
  if (Array.isArray(idea?.channels) && idea.channels.length === 0) {
    autoPostable = false;
    reasons.push("channels=[] (投稿チャネル無し)");
  }

  return { generatable, autoPostable, eligible: generatable, reasons };
}

// ---------------------------------------------------------------------------
// §5 landing router — 判定順に沿って landingPlan を「解決」する
// ---------------------------------------------------------------------------

/** 分岐 status。router が feasibility/gate から機械導出する。 */
export const BRANCH_STATUS = [
  "needs-content",
  "needs-pipeline",
  "needs-renderer",
  "needs-license-review",
  "blocked",
  "rejected",
];

/**
 * §5.1 判定順 + §5.2 routing rule で landingPlan を解決する (純粋)。
 * inventory は buzz-map-inventory-core の buildInventory 出力 (Set 群)。
 * live 疎通は contract checker が別途行うため、ここでは「在庫に存在するか」で
 * strategy を確定し readiness の初期値を機械導出する (live は router では付けない)。
 *
 * @param {object} idea CuratedBuzzMapIdea
 * @param {{ rankingKeys:Set, blogSlugs:Set, themeSlugs:Set }} inventory
 * @returns {{ strategy:string, readiness:string, primaryUrl:string|null, primaryKey:string|null,
 *   themeSlug:string|null, articleSlug:string|null, resolvedReasons:string[] }}
 */
export function resolveLanding(idea, inventory) {
  const plan = idea?.landingPlan ?? {};
  const reasons = [];
  const has = {
    ranking: (k) => Boolean(k) && inventory?.rankingKeys?.has(k),
    blog: (s) => Boolean(s) && inventory?.blogSlugs?.has(s),
    theme: (s) => Boolean(s) && inventory?.themeSlugs?.has(s),
  };

  // hard gate が eligible=false なら blocked (feasibility より優先)
  const gate = evaluateHardGate(idea);
  if (!gate.generatable) {
    return {
      strategy: "blocked",
      readiness: "blocked",
      primaryUrl: plan.primaryUrl ?? null,
      primaryKey: plan.primaryKey ?? null,
      themeSlug: plan.themeSlug ?? null,
      articleSlug: plan.articleSlug ?? null,
      resolvedReasons: ["hard gate 不通過: " + gate.reasons.join(" / ")],
    };
  }

  // feasibility による blocked (renderer/data/pipeline 未整備) → needs-* に落とす
  const feasibilityBranch = {
    "needs-renderer": "needs-renderer",
    "needs-data": "needs-content",
    "needs-pipeline": "needs-pipeline",
  }[idea?.feasibility];

  // §5.1 判定順: 1-2 ranking / 3 blog / 4 theme / 5-6 create
  let strategy = plan.strategy ?? "blocked";
  let readiness = plan.readiness ?? "needs-content";
  let primaryKey = plan.primaryKey ?? null;

  // primaryKey が metrics に実在し、かつ ranking 在庫にあれば existing-ranking を最優先で成立
  const firstMetric = Array.isArray(idea?.metricKeys) && idea.metricKeys.length > 0 ? idea.metricKeys[0] : null;
  const candidateRankingKey = primaryKey ?? firstMetric;

  if (plan.strategy === "existing-ranking") {
    if (has.ranking(candidateRankingKey)) {
      strategy = "existing-ranking";
      primaryKey = candidateRankingKey;
      readiness = "needs-content"; // live 確定は contract checker
      reasons.push(`ranking 在庫あり: ${candidateRankingKey}`);
    } else {
      // ranking 未公開 → ranking 投入待ち (§5.1 step 7)
      strategy = "blocked";
      readiness = "blocked";
      reasons.push(`ranking 未公開: ${candidateRankingKey ?? "(key 無し)"} → ranking 投入待ち`);
    }
  } else if (plan.strategy === "existing-blog") {
    if (has.blog(plan.articleSlug)) {
      strategy = "existing-blog";
      readiness = "needs-content";
      reasons.push(`blog 在庫あり: ${plan.articleSlug}`);
    } else {
      // 既存 blog を指しているが未公開 → create-blog に降格
      strategy = "create-blog";
      readiness = "needs-content";
      reasons.push(`blog 未公開: ${plan.articleSlug} → create-blog へ降格`);
    }
  } else if (plan.strategy === "existing-theme" || plan.strategy === "extend-theme") {
    if (has.theme(plan.themeSlug)) {
      strategy = plan.strategy;
      readiness = "needs-content";
      reasons.push(`theme 在庫あり: ${plan.themeSlug}`);
    } else {
      strategy = "blocked";
      readiness = "blocked";
      reasons.push(`theme 未実在: ${plan.themeSlug}`);
    }
  } else if (plan.strategy === "create-blog") {
    strategy = "create-blog";
    readiness = "needs-content";
    reasons.push("新規 blog 制作 (create-blog)");
  } else if (plan.strategy === "create-theme") {
    strategy = "create-theme";
    readiness = "needs-content";
    reasons.push("新規 theme 制作 (create-theme)");
  } else {
    strategy = "blocked";
    readiness = "blocked";
    reasons.push("landing strategy 未確定");
  }

  // feasibility 未整備は readiness を needs-* に上書き (在庫があっても素材が作れない)
  if (feasibilityBranch && strategy !== "blocked") {
    readiness = feasibilityBranch;
    reasons.push(`feasibility=${idea.feasibility} → readiness=${feasibilityBranch}`);
  }
  // review-required は投稿前ライセンス確認 (readiness は保持しつつ理由を残す)
  if (idea?.commercialUse === "review-required") {
    reasons.push("commercialUse=review-required (公開前にライセンス確認)");
  }

  return {
    strategy,
    readiness,
    primaryUrl: plan.primaryUrl ?? null,
    primaryKey,
    themeSlug: plan.themeSlug ?? null,
    articleSlug: plan.articleSlug ?? null,
    resolvedReasons: reasons,
  };
}

// ---------------------------------------------------------------------------
// curated ↔ machine dedup (§4.1 同義候補を 1 件へ統合)
// ---------------------------------------------------------------------------

/**
 * curated idea が machine catalog の既存 entry と重複するかを判定する。
 * 突合は metricKey (先頭 + aliases) の集合一致で行う。
 * @param {object} idea CuratedBuzzMapIdea
 * @param {Set<string>} machineKeys machine catalog の metricKey 集合
 * @returns {{ isDuplicate:boolean, matchedKeys:string[] }}
 */
export function findMachineDuplicate(idea, machineKeys) {
  const candidateKeys = new Set();
  for (const k of idea?.metricKeys ?? []) candidateKeys.add(k);
  for (const a of idea?.aliases ?? []) candidateKeys.add(a);
  // ksj/gsi 系の合成 id (aliases に "ksj:S12" 等が入る場合) も突合対象
  const matched = [...candidateKeys].filter((k) => machineKeys.has(k));
  return { isDuplicate: matched.length > 0, matchedKeys: matched };
}

/**
 * curated idea を machine 由来の catalog entry 形へ射影する (build-buzz-map-catalog が
 * 既存 entries と同じ配列に混ぜられるように)。純粋。
 * @param {object} idea
 * @param {{ score:number }} scored computeCuratedScore の結果
 * @param {{ strategy:string, readiness:string }} landing resolveLanding の結果
 * @param {{ eligible:boolean, autoPostable:boolean }} gate evaluateHardGate の結果
 */
export function curatedToCatalogEntry(idea, scored, landing, gate) {
  const years = [
    ...new Set(
      (idea?.dataRefs ?? [])
        .map((ref) => ref?.year)
        .filter((year) => typeof year === "string" && year.length > 0),
    ),
  ];
  return {
    metricKey: `curated:${idea.ideaId}`,
    source: "curated",
    lane: "curated",
    ideaId: idea.ideaId,
    title: idea.title,
    subtitle: idea.subtitle ?? null,
    category: idea.category,
    score: Math.round(scored.score * 1000) / 1000,
    breakdown: idea.scoreBreakdown,
    priority: idea.priority,
    recommendedType: idea.recommendedType,
    sourceKind: idea.sourceKind,
    metricKeys: idea.metricKeys,
    requiredYear: years.length === 1 ? years[0] : null,
    landingPromise: idea?.landingPlan?.landingPromise ?? "",
    feasibility: idea.feasibility,
    capability: idea.capability,
    commercialUse: idea.commercialUse,
    sensitivity: idea.sensitivity,
    eligible: gate.eligible,
    autoPostable: gate.autoPostable,
    gateReasons: gate.reasons,
    landingStrategy: landing.strategy,
    landingReadiness: landing.readiness,
    primaryUrl: landing.primaryUrl,
    themeId: landing.themeSlug ?? null,
    // status は builder 側で upsert 保持 (rejected/generated/posted を再構築で消さない)
    status: "candidate",
    note: null,
  };
}

// ---------------------------------------------------------------------------
// status machine — upsert (後段状態を巻き戻さない)
// ---------------------------------------------------------------------------

/** メインの進行 status (candidate → … → measured)。index が大きいほど後段。 */
export const STATUS_ORDER = [
  "candidate",
  "data-ready",
  "landing-planned",
  "landing-ready",
  "spec",
  "generated",
  "r2-ready",
  "draft",
  "scheduled",
  "posted",
  "measured",
];

const STATUS_RANK = new Map(STATUS_ORDER.map((s, i) => [s, i]));

/** 進行 status か (分岐状態 needs-x / blocked / rejected は false)。 */
export function isProgressStatus(s) {
  return STATUS_RANK.has(s);
}

/**
 * status upsert（後段状態を巻き戻さない）。
 * - 両方が進行 status → max(rank) を採る (後段を維持)
 * - prev が進行 status で next が分岐状態 → prev を保持 (spec/generated が needs-x / blocked で消えない)
 * - prev が分岐で next が進行 → next へ昇格
 * - 両方分岐 → next (再判定を反映)
 * @param {string|undefined|null} prev
 * @param {string} next
 * @returns {string}
 */
export function upsertStatus(prev, next) {
  if (!prev) return next;
  const p = STATUS_RANK.get(prev);
  const n = STATUS_RANK.get(next);
  if (p != null && n != null) return p >= n ? prev : next;
  if (p != null && n == null) return prev; // 進行 status を分岐で巻き戻さない
  if (p == null && n != null) return next; // 分岐 → 進行へ昇格
  return next;
}

/**
 * curated 統合 entry に対する status を、dedup した machine entry 群の後段 status を
 * 加味して確定する（巻き戻し禁止・landing backfill）。
 * @param {string|undefined|null} prevStatus 前回 rebuild の curated entry status
 * @param {string[]} matchedMachineStatuses dedup した machine entry の status 群
 * @param {string|undefined|null} draftStatus posts.json 由来の draft 継承 status (無ければ null)
 * @returns {string}
 */
export function resolveMergedStatus(prevStatus, matchedMachineStatuses = [], draftStatus = null) {
  let status = prevStatus ?? "candidate";
  // machine 側の後段 status を max 継承 (generated/spec 等)
  for (const ms of matchedMachineStatuses) {
    if (ms) status = upsertStatus(status, ms);
  }
  // posts.json draft を継承 (draft は generated より後段なので upsert で自然に勝つ)
  if (draftStatus) status = upsertStatus(status, draftStatus);
  return status;
}

// ---------------------------------------------------------------------------
// postable predicate — draft 登録できるか
// ---------------------------------------------------------------------------

/**
 * draft gate。全条件を満たしたときだけ posts.json へ draft 登録できる。
 * 満たさない条件を reasons に列挙する (どれが欠けているか可視化)。
 * facts は builder / gallery / Phase 4 が R2・contract・live を解決して渡す。
 * @param {{
 *   commercialUse:string, sensitivity:string, specGenerated:boolean, renderChecked:boolean,
 *   r2Ok:boolean, landingContractPass:boolean, landingLive:boolean,
 *   captionComplete:boolean, noDuplicate:boolean, attributionComplete:boolean
 * }} facts
 * @returns {{ postable:boolean, reasons:string[] }}
 */
export function isPostable(facts) {
  const reasons = [];
  if (facts?.commercialUse !== "allowed") reasons.push("commercialUse != allowed");
  if (facts?.sensitivity === "high") reasons.push("sensitivity == high");
  if (!facts?.specGenerated) reasons.push("spec 未生成");
  if (!facts?.renderChecked) reasons.push("レンダ検査 未 PASS");
  if (!facts?.r2Ok) reasons.push("R2 素材が 200 でない");
  if (!facts?.landingContractPass) reasons.push("landingContract != pass");
  if (!facts?.landingLive) reasons.push("primary landing が live 200 でない");
  if (!facts?.captionComplete) reasons.push("caption に出典/年度/対象単位が不足");
  if (!facts?.noDuplicate) reasons.push("platform/domain/content_key が重複");
  if (!facts?.attributionComplete) reasons.push("UTM/attribution 契約が不完全");
  return { postable: reasons.length === 0, reasons };
}

// ---------------------------------------------------------------------------
// batch selection — eligible を score 順で N 件
// ---------------------------------------------------------------------------

/**
 * batch eligible（score / draft gate の予備軍）:
 *   - hard gate 通過 (entry.eligible !== false)
 *   - landing が blocked でない (landingStrategy が blocked でない)
 *   - status が posted/measured/rejected でない
 * curatedToCatalogEntry 形 (entry.eligible / entry.landingStrategy / entry.status) を前提。
 * @param {object} entry
 * @returns {boolean}
 */
export function isEligibleForBatch(entry) {
  if (entry?.eligible === false) return false;
  if (!entry?.landingStrategy || entry.landingStrategy === "blocked") return false;
  if (["posted", "measured", "rejected"].includes(entry?.status)) return false;
  return true;
}

/**
 * batch 対象 (eligible = 生成対象外でない・投稿導線がある) を score 降順で N 件返す。
 * @param {object[]} entries curated catalog entry 群
 * @param {number} n
 * @returns {object[]}
 */
export function selectBatch(entries, n) {
  return (entries ?? [])
    .filter((e) => isEligibleForBatch(e))
    .slice()
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, n);
}
