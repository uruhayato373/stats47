/**
 * 問いの分析を、次の工程へ進めてよいかを機械で判定する。意味の判断はせず、視点の結果が揃っているか、
 * 結果が分析の出力に実在するか、問いの語で答えているかだけを見る。正本は data/content/analysis-viewpoints.json。
 */
export const ANALYSIS_STAGES = ["framed", "viewpoints", "figures", "draft", "reviewed", "approved", "published", "evaluated"];
const SHARES_TOTAL = 100;
const SHARES_TOLERANCE = 0.5;
const MIN_ROBUSTNESS_CASES = 2;

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
export function analysisCycleErrors({ analysis, issue, layers, summary, figures, article, review }) {
  if (!ANALYSIS_STAGES.includes(analysis.stage)) return [`工程が不明: ${analysis.stage}`];
  if (!reached(analysis, "viewpoints")) return [];
  const errors = [...questionErrors({ analysis, issue, article }), ...viewpointErrors({ analysis, layers, summary })];
  if (reached(analysis, "figures")) {
    if (!figures.length) errors.push("図が台帳に無い");
    for (const figure of figures) if (!figure.reads) errors.push(`図の読み方 (reads) が無い: ${figure.id}`);
  }
  if (reached(analysis, "draft")) {
    if (!article) errors.push("記事の下書きが無い");
    else {
      const images = (article.match(/!\[[^\]]*\]\(data\/[^)]+\)/g) ?? []).length;
      if (images < figures.length) errors.push(`図の台帳 ${figures.length} 枚に対し、記事の図は ${images} 枚`);
    }
  }
  if (reached(analysis, "reviewed") && !/^verdict:\s*PASS\b/m.test(review ?? "")) errors.push("審査が PASS していない");
  return errors;
}
