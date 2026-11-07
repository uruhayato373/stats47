/**
 * 問いの分析の実行役が、次に何をするかを決める純粋関数。モデルを呼ばず、状態だけで決める。
 * 判断はモデルが返した JSON を台帳へ移すだけで、順番・やり直し・止める場所はここが持つ。
 */
export const MAX_ROUNDS = 2;

/** 審査と反証そのものの指摘は工程で扱うので、下書きの直しへ渡さない */
const CYCLE_MESSAGES = /審査|反証/;
export const draftBlockers = (blockers) => blockers.filter((blocker) => !CYCLE_MESSAGES.test(blocker));

const stop = (reason, detail) => ({ stop: reason, detail });

/**
 * 書き手へ渡す指摘が残っているか。回数を超えたら人へ渡す。
 * 文章は既定で Claude の書き手が書く (Codex の下書きは用語の定義より先に結論の語が出る崩れ方をした)。
 * 実行役は小包を書いて止まり、セッションが書き手を起動する。
 */
function redraft(state, reason, findings) {
  if (state.rounds.draft >= MAX_ROUNDS) return stop("needs-owner", `${reason}が ${MAX_ROUNDS} 回で解消しない`);
  return state.writer === "codex" ? { step: "draft", findings } : { step: "packet", findings, reason };
}

export function nextStep(state) {
  if (!state.frame) return { step: "frame" };
  if (state.wantsResearch && !state.research) return { step: "research" };
  if (state.wantsInventory && !state.inventory) return { step: "inventory" };
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
  if (state.wantsFigurePlan && !state.figurePlanFresh) return { step: "figures" };
  if (!state.article) return state.writer === "codex" ? { step: "draft", findings: [] } : { step: "packet", findings: [], reason: "初稿" };
  if (state.gateBlockers.length) return redraft(state, "品質ゲート", state.gateBlockers);
  if (state.firstReview?.articleSha !== state.articleSha) return { step: "review" };
  if (state.firstReview.verdict !== "PASS") return redraft(state, "1 次審査", state.firstReview.findings);
  if (state.finalReview?.articleSha !== state.articleSha) return stop("needs-final-review", "Claude の blog-critic で最終審査する");
  if (state.finalReview.verdict !== "PASS") return redraft(state, "最終審査", state.finalReview.findings);
  return { step: "done" };
}

/** 2 回目以降の 1 次審査は、前回の指摘が解消したかと、新しい BLOCK だけを見る。収束させるための規則 */
export function reviewMode(history = []) {
  if (!history.length) return { mode: "full", previous: [] };
  const last = history.at(-1);
  return { mode: "verify", previous: last.findings ?? [] };
}

/**
 * 書き手 (Claude) に渡す小包。データは渡さず、主張・注意点・図の読み方・数値の出どころだけを渡す。
 * 書き手が数値を自分で計算し直さないので、文脈が小さく済む。
 */
export function buildWriterPacket({ question, terms, analysis, figures, summaryPath, articlePath, reason, findings = [], unmatchedNumbers = [] }) {
  const claims = (analysis.claims ?? []).map((c, i) => `- C${i + 1}: ${c.text} (値 ${c.value}${c.interval ? `・幅 ${c.interval}` : ""})`).join("\n");
  const figs = figures.map((f) => `- ![${f.chart?.alt ?? f.title}](data/${f.chart?.name ?? f.id}.svg) ${f.title}: ${f.reads}`).join("\n");
  const fix = findings.map((f) => `- ${typeof f === "string" ? f : `[${f.severity}] ${f.text}`}`).join("\n");
  return `<task>
<goal>${reason === "初稿" ? "論文型の記事の初稿を書く" : `指摘 (${reason}) の箇所だけを直す`}</goal>
<scope>書いてよいのは ${articlePath} だけ。データ・図・台帳を変えない。R2 や外部へ書かない</scope>
<sources>規約 .claude/rules/blog-quality-standards.md・.claude/rules/content-type-standards.md。数値の出どころ ${summaryPath} (本文の数値はここから取る。自分で計算し直さない)。今の本文 ${articlePath}</sources>
<done_when>問いに最初の段落で答え、主張より強く書かず、図をすべて載せた</done_when>
</task>

問い: ${question}
問いの語: ${terms} (この語で答える。言い換えない)
記事の条件: ${JSON.stringify(analysis.article ?? {})}

結論: ${analysis.finding}

主張 (この強さまでしか書かない):
${claims}

注意点 (「この分解で言えないこと」に入れる):
${(analysis.caveats ?? []).map((c) => `- ${c}`).join("\n")}

図 (この順を骨格に章を立て、各図の後に読み方から書く):
${figs}
${fix ? `\n直す指摘:\n${fix}\n` : ""}${unmatchedNumbers.length ? `\n出どころの見つからない数値 (直すか出どころを確かめる):\n${unmatchedNumbers.map((n) => `- ${n}`).join("\n")}\n` : ""}
規則: です・ます調。用語は初出で定義してから使う。表は使わない。順位の主張 (N位) を書かない。frontmatter は今の本文の形を保ち、published は変えない。直すときは指摘の箇所だけを変える。
`;
}
