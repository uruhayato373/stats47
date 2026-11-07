/**
 * 問いの分析を、次の工程へ進めてよいかを機械で判定する。意味の判断はせず、視点の結果が揃っているか、
 * 結果が分析の出力に実在するか、問いの語で答えているかだけを見る。正本は data/content/analysis-viewpoints.json。
 */
export const ANALYSIS_STAGES = ["framed", "viewpoints", "figures", "draft", "reviewed", "approved", "published", "evaluated"];
const SHARES_TOTAL = 100;
const SHARES_TOLERANCE = 0.5;
const MIN_ROBUSTNESS_CASES = 2;

/** 審査は下書きの本文に対して行う。公開の切り替えは本文の変更ではないので、比べる前に下書きの形へ戻す */
export const reviewedArticleText = (article) => article?.replace(/^published: true$/m, "published: false") ?? null;

const reached = (analysis, stage) => ANALYSIS_STAGES.indexOf(analysis.stage) >= ANALYSIS_STAGES.indexOf(stage);
const resolve = (object, path) => path.split(".").reduce((value, key) => (value === undefined || value === null ? undefined : value[key]), object);

function viewpointErrors({ analysis, layers, summary }) {
  const errors = [];
  const rows = new Map((analysis.viewpoints ?? []).map((row) => [row.layer, row]));
  for (const layer of layers) {
    const row = rows.get(layer.id);
    if (!row) {
      errors.push(`視点「${layer.label}」の結果が無い`);
      continue;
    }
    if (row.status === "na") {
      if (!row.reason) errors.push(`視点「${layer.label}」は対象外の理由が無い`);
      continue;
    }
    if (!row.result) errors.push(`視点「${layer.label}」の結果の文が無い`);
    const evidence = row.evidence ? resolve(summary, row.evidence) : undefined;
    if (evidence === undefined) {
      errors.push(`視点「${layer.label}」の根拠が分析の出力に無い: ${row.evidence ?? "(未指定)"}`);
      continue;
    }
    if (layer.id === "decomposition") {
      const total = Object.values(evidence).reduce((sum, value) => sum + value, 0);
      // 重なりを含めて足すと 100 になる。足りなければ分解が途中で止まっている
      if (Math.abs(total - SHARES_TOTAL) > SHARES_TOLERANCE) errors.push(`分解の内訳の合計が ${total.toFixed(1)}%`);
    }
    if (layer.id === "robustness" && (!Array.isArray(evidence) || evidence.length < MIN_ROBUSTNESS_CASES))
      errors.push(`頑健性は ${MIN_ROBUSTNESS_CASES} 通り以上で比べる`);
  }
  return errors;
}

/** 結論の主張を、値と幅に照らす。「過半」と書くなら幅の下限が基準を超えていなければならない */
function claimErrors({ analysis, summary }) {
  const claims = analysis.claims ?? [];
  if (!claims.length) return ["結論の主張 (claims) が無い"];
  const errors = [];
  for (const claim of claims) {
    const value = resolve(summary, claim.value);
    if (typeof value !== "number") {
      errors.push(`主張の値が分析の出力に無い: ${claim.value}`);
      continue;
    }
    if (claim.above === undefined && claim.below === undefined && claim.straddles === undefined) continue;
    const interval = claim.interval ? resolve(summary, claim.interval) : undefined;
    // 幅は [下限, 上限] でも { low, high } でもよい
    const [low, high] = Array.isArray(interval) ? interval : [interval?.low, interval?.high];
    if (typeof low !== "number" || typeof high !== "number") {
      errors.push(`主張の幅が分析の出力に無い: ${claim.interval ?? "(未指定)"}`);
      continue;
    }
    if (claim.above !== undefined && low <= claim.above) errors.push(`主張「${claim.text}」: 幅 ${low}〜${high} が ${claim.above} を上回ると言えない`);
    if (claim.below !== undefined && high >= claim.below) errors.push(`主張「${claim.text}」: 幅 ${low}〜${high} が ${claim.below} を下回ると言えない`);
    if (claim.straddles !== undefined && (low >= claim.straddles || high <= claim.straddles))
      errors.push(`主張「${claim.text}」: 幅 ${low}〜${high} が ${claim.straddles} をまたいでいない`);
  }
  return errors;
}

/** 反証は今の分析の出力に対して行い、崩れた主張を残したまま下書きへ進まない */
function refutationErrors({ analysis, hashes }) {
  const { refutation } = analysis;
  if (!refutation) return ["反証の記録が無い"];
  const errors = [];
  if (refutation.summarySha256 !== hashes.summary) errors.push("反証の後に分析の出力が変わった。反証をやり直す");
  for (const check of refutation.checks) if (check.verdict === "broken") errors.push(`反証で崩れた主張が残っている: ${check.claim}`);
  return errors;
}

/** 4:5 の型の画像は記事の幅の上限と暗い版の判定に名前で掛かる。掛からない名前は 672px で出る */
function figureNameErrors({ articleFigures }) {
  return articleFigures.filter((figure) => figure.typeImage && !figure.recognized).map((figure) => `型の画像なのに記事の表示で判定されない名前: ${figure.name}`);
}

function questionErrors({ analysis, issue, article }) {
  const terms = analysis.questionTerms ?? [];
  const errors = [];
  if (!terms.length) errors.push("問いの語 (questionTerms) が無い");
  for (const term of terms) {
    if (!issue.question.includes(term)) errors.push(`問いの語が台帳の問いに無い: ${term}`);
    if (!analysis.finding.includes(term)) errors.push(`結論が問いの語で答えていない: ${term}`);
    if (reached(analysis, "draft") && !(article ?? "").includes(term)) errors.push(`記事が問いの語で答えていない: ${term}`);
  }
  return errors;
}

/** 今の工程に居てよいかを返す。空なら進める */
export function analysisCycleErrors({ analysis, issue, layers, summary, figures, article, review, hashes = {}, articleFigures = [] }) {
  if (!ANALYSIS_STAGES.includes(analysis.stage)) return [`工程が不明: ${analysis.stage}`];
  if (!reached(analysis, "viewpoints")) return [];
  // 公開すると CI が送り箱の記事を消す (blog-data-schema.md §0)。検査は公開の前に済んでいる
  if (reached(analysis, "approved") && article === null) return [];
  const errors = [...questionErrors({ analysis, issue, article }), ...viewpointErrors({ analysis, layers, summary }), ...claimErrors({ analysis, summary })];
  if (reached(analysis, "figures")) {
    if (!figures.length) errors.push("図が台帳に無い");
    for (const figure of figures) if (!figure.reads) errors.push(`図の読み方 (reads) が無い: ${figure.id}`);
  }
  if (reached(analysis, "draft")) {
    errors.push(...refutationErrors({ analysis, hashes }), ...figureNameErrors({ articleFigures }));
    if (!article) errors.push("記事の下書きが無い");
    else {
      const images = (article.match(/!\[[^\]]*\]\(data\/[^)]+\)/g) ?? []).length;
      if (images < figures.length) errors.push(`図の台帳 ${figures.length} 枚に対し、記事の図は ${images} 枚`);
    }
  }
  if (reached(analysis, "reviewed")) {
    if (!/^verdict:\s*PASS\b/m.test(review ?? "")) errors.push("審査が PASS していない");
    else if (/^- \[(BLOCK|MAJOR)\]/m.test(review)) errors.push("審査の BLOCK か MAJOR の指摘が残っている");
    else if (review.match(/^articleSha256:\s*([0-9a-f]{64})\s*$/m)?.[1] !== hashes.article) errors.push("審査の後に本文が変わった。審査をやり直す");
  }
  return errors;
}
