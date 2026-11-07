/**
 * 問いの分析の実行役が、次に何をするかを決める純粋関数。モデルを呼ばず、状態だけで決める。
 * 判断はモデルが返した JSON を台帳へ移すだけで、順番・やり直し・止める場所はここが持つ。
 */
export const MAX_ROUNDS = 2;

/** 審査と反証そのものの指摘は工程で扱うので、下書きの直しへ渡さない */
const CYCLE_MESSAGES = /審査|反証/;
export const draftBlockers = (blockers) => blockers.filter((blocker) => !CYCLE_MESSAGES.test(blocker));

const stop = (reason, detail) => ({ stop: reason, detail });

/** 書き手へ渡す指摘が残っているか。回数を超えたら人へ渡す */
function redraft(state, reason, findings) {
  if (state.rounds.draft >= MAX_ROUNDS) return stop("needs-owner", `${reason}が ${MAX_ROUNDS} 回で解消しない`);
  return { step: "draft", findings };
}

export function nextStep(state) {
  if (!state.frame) return { step: "frame" };
  if (state.wantsResearch && !state.research) return { step: "research" };
  if (!state.plan) return { step: "plan" };
  if (!state.script) return { step: "author", round: "ledger" };
  if (!state.summaryFresh) return { step: "analyze" };
  if (!state.ledgerReady) {
    if (state.rounds.ledger >= MAX_ROUNDS) return stop("needs-owner", `分析の台帳が ${MAX_ROUNDS} 回で揃わない`);
    return { step: "author", findings: state.ledgerErrors, round: "ledger" };
  }
  if (!state.refutationFresh) return { step: "refute" };
  if (state.brokenClaims.length) {
    if (state.rounds.author >= MAX_ROUNDS) return stop("needs-owner", `反証で崩れた主張が ${MAX_ROUNDS} 回で解消しない`);
    return { step: "author", findings: state.brokenClaims, round: "author" };
  }
  if (!state.article) return { step: "draft", findings: [] };
  if (state.gateBlockers.length) return redraft(state, "品質ゲート", state.gateBlockers);
  if (state.firstReview?.articleSha !== state.articleSha) return { step: "review" };
  if (state.firstReview.verdict !== "PASS") return redraft(state, "1 次審査", state.firstReview.findings);
  if (state.finalReview?.articleSha !== state.articleSha) return stop("needs-final-review", "Claude の blog-critic で最終審査する");
  if (state.finalReview.verdict !== "PASS") return redraft(state, "最終審査", state.finalReview.findings);
  return { step: "done" };
}
