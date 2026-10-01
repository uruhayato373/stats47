/**
 * モデル使用量の集計 (純関数)。計測→記録→改善サイクルの「計測」と「改善提案」を担う。
 *
 * ★なぜ要るか (2026-10-02)
 * agent の frontmatter に effort を書かないと呼び出し元セッションの effort を継承する
 * (公式 https://code.claude.com/docs/en/sub-agents の effort 欄、2026-10-02 参照)。60 体のどれも
 * effort を書いておらず、ローカル transcript の応答の 6 割強が xhigh だった。どの agent が
 * どのモデル・effort で幾ら使っているかを測らないまま「Sonnet で十分」「effort を下げる」を
 * 判断できないので、transcript に最初から入っている usage を集計して残す。
 *
 * ★何を測れて何を測れないか
 *   測れる   … agent 種別 × モデル × effort ごとの呼び出し回数・トークン・API 換算費用
 *   測れない … 品質 (成功したか)。品質は canary (run-canary.mjs) と backlog-loop の成功率で別に測る。
 *              費用は API 単価での換算で、Max プランの枠消費の実額ではない。
 *
 * 保存するのは集計値だけで、prompt・本文・agent への依頼文は持たない。
 */

export const TOKEN_KEYS = ['input', 'output', 'cacheWrite5m', 'cacheWrite1h', 'cacheRead'];

/** `claude-sonnet-5-20260101` のような日付付き ID を単価表のキーへ寄せる */
export function normalizeModelId(model) {
  if (typeof model !== 'string' || !model.startsWith('claude-')) return null;
  return model.replace(/-\d{8}$/, '');
}

/** モデル ID → 系統 (haiku / sonnet / opus / fable)。agent frontmatter の alias と比べるのに使う */
export function modelFamily(model) {
  const m = /^claude-(haiku|sonnet|opus|fable|mythos)/.exec(model ?? '');
  return m ? m[1] : null;
}

/** transcript の assistant message.usage → 正規化したトークン */
export function tokensOf(usage) {
  if (!usage || typeof usage !== 'object') return null;
  const cw = usage.cache_creation ?? {};
  const total5m = Number(cw.ephemeral_5m_input_tokens ?? 0);
  const total1h = Number(cw.ephemeral_1h_input_tokens ?? 0);
  const creation = Number(usage.cache_creation_input_tokens ?? 0);
  return {
    input: Number(usage.input_tokens ?? 0),
    output: Number(usage.output_tokens ?? 0),
    // 内訳が無い古い記録は 5 分キャッシュとして数える (安い側に倒す = 節約額を過大にしない)
    cacheWrite5m: total5m + total1h > 0 ? total5m : creation,
    cacheWrite1h: total1h,
    cacheRead: Number(usage.cache_read_input_tokens ?? 0),
  };
}

/** API 単価での換算 (USD)。単価表に無いモデルは null (0 と読み違えない) */
export function costOf(tokens, model, pricing) {
  const p = pricing?.models?.[normalizeModelId(model)];
  if (!p) return null;
  return TOKEN_KEYS.reduce((sum, k) => sum + (tokens[k] ?? 0) * (p[k] ?? 0), 0) / 1e6;
}

/** ISO 日時 → ISO 週 (`2026-W40`)。週次の窓を他の計測 state と揃える */
export function isoWeek(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const year = t.getUTCFullYear();
  const week = Math.ceil(((t - Date.UTC(year, 0, 1)) / 86400000 + 1) / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

/**
 * 1 本の transcript (jsonl の行配列) を集計する。
 * 同じ API 応答は content block ごとに複数行へ分かれ、各行に同じ usage が付くので message.id で 1 回に数える。
 * @param {string[]} lines
 * @param {{ agentType: string, scope: 'main' | 'sub' }} who
 * @returns {Array<{ week, scope, agentType, model, effort, calls, tokens }>} 応答単位の行 (後で mergeRows で畳む)
 */
export function rowsFromTranscript(lines, who) {
  const seen = new Set();
  const rows = [];
  for (const line of lines) {
    if (!line) continue;
    let x;
    try {
      x = JSON.parse(line);
    } catch {
      continue;
    }
    if (x.type !== 'assistant') continue;
    const id = x.message?.id ?? x.requestId ?? x.uuid;
    if (seen.has(id)) continue;
    seen.add(id);
    const model = normalizeModelId(x.message?.model);
    const tokens = tokensOf(x.message?.usage);
    const week = isoWeek(x.timestamp);
    // <synthetic> (ローカルで作られた応答) と時刻の無い行は費用が無いので数えない
    if (!model || !tokens || !week) continue;
    rows.push({ week, scope: who.scope, agentType: who.agentType, model, effort: x.effort ?? 'unknown', calls: 1, tokens });
  }
  return rows;
}

const keyOf = (r) => [r.week, r.scope, r.agentType, r.model, r.effort].join('|');

/** 同じ (週・scope・agent・モデル・effort) を足し合わせ、runs (transcript 本数) を数える */
export function mergeRows(rows, pricing) {
  const map = new Map();
  for (const r of rows) {
    const k = keyOf(r);
    const cur = map.get(k) ?? { week: r.week, scope: r.scope, agentType: r.agentType, model: r.model, effort: r.effort, runs: 0, calls: 0, tokens: Object.fromEntries(TOKEN_KEYS.map((t) => [t, 0])) };
    cur.calls += r.calls;
    cur.runs += r.runs ?? 0;
    for (const t of TOKEN_KEYS) cur.tokens[t] += r.tokens[t] ?? 0;
    map.set(k, cur);
  }
  return [...map.values()]
    .map((r) => ({ ...r, costUsd: round(costOf(r.tokens, r.model, pricing)) }))
    .sort((a, b) => a.week.localeCompare(b.week) || a.scope.localeCompare(b.scope) || a.agentType.localeCompare(b.agentType) || a.model.localeCompare(b.model) || a.effort.localeCompare(b.effort));
}

/** 1 transcript の行に runs=1 を 1 回だけ載せる (どの (モデル,effort) にも重複計上しないよう先頭行に付ける) */
export function markRun(rows) {
  if (rows.length > 0) rows[0] = { ...rows[0], runs: 1 };
  return rows;
}

/**
 * 既存の記録と今回の走査を合わせる。transcript は Claude Code の cleanupPeriodDays で消えるので、
 * 今回の走査で見えた週は置き換え、見えなかった古い週は残す (消えた transcript の実績を失わない)。
 */
export function mergeWeeks(previousRows, scannedRows) {
  const scannedWeeks = new Set(scannedRows.map((r) => r.week));
  return [...previousRows.filter((r) => !scannedWeeks.has(r.week)), ...scannedRows].sort((a, b) => keyOf(a).localeCompare(keyOf(b)));
}

export function round(v, digits = 4) {
  if (v === null || v === undefined || Number.isNaN(v)) return null;
  const f = 10 ** digits;
  return Math.round(v * f) / f;
}

/** 直近 n 週 (最新週を含む) の週ラベル集合 */
export function recentWeeks(rows, n) {
  const weeks = [...new Set(rows.map((r) => r.week))].sort();
  return new Set(weeks.slice(-n));
}

/**
 * agent ごとの直近窓サマリ。
 * @returns {Array<{ agentType, runs, calls, costUsd, costPerRun, byModel: Record<string,number>, byEffort: Record<string,number> }>}
 */
export function summarizeAgents(rows, windowWeeks) {
  const map = new Map();
  for (const r of rows) {
    if (r.scope !== 'sub' || !windowWeeks.has(r.week)) continue;
    const cur = map.get(r.agentType) ?? { agentType: r.agentType, runs: 0, calls: 0, costUsd: 0, unpricedCalls: 0, byModel: {}, byEffort: {} };
    cur.runs += r.runs;
    cur.calls += r.calls;
    if (r.costUsd === null) cur.unpricedCalls += r.calls;
    cur.costUsd += r.costUsd ?? 0;
    cur.byModel[r.model] = (cur.byModel[r.model] ?? 0) + r.calls;
    cur.byEffort[r.effort] = (cur.byEffort[r.effort] ?? 0) + r.calls;
    map.set(r.agentType, cur);
  }
  return [...map.values()]
    .map((a) => ({ ...a, costUsd: round(a.costUsd), costPerRun: a.runs ? round(a.costUsd / a.runs) : null }))
    .sort((a, b) => b.costUsd - a.costUsd);
}

/** メインセッション (agent を介さない対話) の直近窓サマリ: モデル × effort */
export function summarizeMain(rows, windowWeeks) {
  const map = new Map();
  for (const r of rows) {
    if (r.scope !== 'main' || !windowWeeks.has(r.week)) continue;
    const k = `${r.model}|${r.effort}`;
    const cur = map.get(k) ?? { model: r.model, effort: r.effort, calls: 0, costUsd: 0 };
    cur.calls += r.calls;
    cur.costUsd += r.costUsd ?? 0;
    map.set(k, cur);
  }
  return [...map.values()].map((m) => ({ ...m, costUsd: round(m.costUsd) })).sort((a, b) => b.costUsd - a.costUsd);
}

/** 同じトークンを別モデルで処理したときの換算費用 (モデル変更の節約見込み。品質は別途 canary で確かめる) */
export function repriceTokens(rows, toModel, pricing) {
  const tokens = Object.fromEntries(TOKEN_KEYS.map((t) => [t, 0]));
  for (const r of rows) for (const t of TOKEN_KEYS) tokens[t] += r.tokens[t] ?? 0;
  return costOf(tokens, toModel, pricing);
}

/**
 * 改善提案 (決定的)。閾値は policy (`.claude/config/model-optimization-policy.json`) だけに置く。
 * 提案は「試す価値がある」までで、モデルや effort を自動では書き換えない。採否は canary の結果と人が決める。
 *
 * @param {{ agents: Array<{name, model, effort}>, rows, pricing, policy, canary: Array<{agent, candidate, verdict}>, ciRuns?: Array<{workflow, models, runs, costUsd}> }} input
 */
/** 窓内で最も多く応答したモデル ID */
const topModel = (summary) => Object.entries(summary.byModel).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

/** 提案に canary の結果と次の一手を付ける。合格なら変えてよい、不合格なら据え置き、未実施なら実行コマンド */
function canaryNext(canary, agentName, match, text) {
  const result = canary.find((c) => c.agent === agentName && match(c));
  if (!result) return { canary: 'not-run', next: text.run };
  return { canary: result.verdict, next: result.verdict === 'pass' ? text.pass : `canary 不合格 (${result.verdict})。据え置き` };
}

export function proposeChanges({ agents, rows, pricing, policy, canary = [], ciRuns = [] }) {
  const windowWeeks = recentWeeks(rows.filter((r) => r.scope === 'sub'), policy.windowWeeks);
  const summaries = new Map(summarizeAgents(rows, windowWeeks).map((s) => [s.agentType, s]));
  const proposals = [];

  for (const agent of agents) {
    const s = summaries.get(agent.name);
    // 回数が少なくても 1 回が重い agent は対象にする (例: 2 回で $88 の調査 agent)
    if (!s || (s.runs < policy.minRuns && s.costUsd < policy.minCostUsd)) continue;
    const agentRows = rows.filter((r) => r.scope === 'sub' && r.agentType === agent.name && windowWeeks.has(r.week));

    // 1) effort 未指定でセッションの高い effort を継承している
    if (!agent.effort) {
      const heavy = policy.heavyEfforts.reduce((n, e) => n + (s.byEffort[e] ?? 0), 0);
      const share = heavy / s.calls;
      if (share >= policy.heavyEffortShare) {
        proposals.push({
          id: `effort:${agent.name}`,
          kind: 'set-effort',
          agent: agent.name,
          current: `未指定 (継承。直近 ${policy.windowWeeks} 週の応答の ${Math.round(share * 100)}% が ${policy.heavyEfforts.join('/')})`,
          suggested: `effort: ${policy.defaultEffortSuggestion}`,
          costUsd: s.costUsd,
          runs: s.runs,
          evidence: `呼び出し ${s.runs} 回・応答 ${s.calls} 件・換算 $${s.costUsd}`,
          ...canaryNext(canary, agent.name, (c) => c.effort === policy.defaultEffortSuggestion && modelFamily(c.candidate) === modelFamily(topModel(s)), {
            pass: `canary 合格。frontmatter に effort: ${policy.defaultEffortSuggestion} を書いてよい`,
            run: `canary 未実施: node .claude/scripts/model-usage/run-canary.mjs --agent ${agent.name} --model <現行モデルの full ID> --effort ${policy.defaultEffortSuggestion}`,
          }),
        });
      }
    }

    // 2) 上位モデルで動いている agent は 1 段下のモデルを試す価値がある (節約見込みが閾値以上のとき)
    const observedFamily = topModel(s);
    const target = policy.downgradeTarget[modelFamily(observedFamily)];
    if (target) {
      const now = s.costUsd;
      const after = repriceTokens(agentRows, target, pricing);
      const saving = after === null ? null : round(now - after);
      if (saving !== null && saving >= policy.minSavingUsd) {
        proposals.push({
          id: `model:${agent.name}`,
          kind: 'downgrade-model',
          agent: agent.name,
          current: `${agent.model ?? '未指定'} (実測 ${observedFamily})`,
          suggested: target,
          costUsd: now,
          runs: s.runs,
          savingUsd: saving,
          evidence: `直近 ${policy.windowWeeks} 週の同じトークンを ${target} 単価で換算すると $${round(after)} (差 $${saving})`,
          ...canaryNext(canary, agent.name, (c) => c.candidate === target, {
            pass: `canary 合格。frontmatter の model を ${target} に変えてよい`,
            run: `canary 未実施: node .claude/scripts/model-usage/run-canary.mjs --agent ${agent.name} --model ${target}`,
          }),
        });
      }
    }
  }

  // 3) frontmatter の alias と実測モデルの系統が食い違う (例: model: sonnet なのに opus で動いている)
  for (const agent of agents) {
    const s = summaries.get(agent.name);
    if (!s || !agent.model || agent.model === 'inherit') continue;
    const declared = modelFamily(agent.model.startsWith('claude-') ? agent.model : `claude-${agent.model}`);
    const mismatched = Object.entries(s.byModel).filter(([m]) => modelFamily(m) !== declared);
    const calls = mismatched.reduce((n, [, c]) => n + c, 0);
    if (declared && calls / s.calls >= policy.driftShare) {
      proposals.push({
        id: `drift:${agent.name}`,
        kind: 'model-drift',
        agent: agent.name,
        current: `frontmatter ${agent.model}`,
        suggested: '呼び出し側の model 上書きを確認',
        costUsd: s.costUsd,
        runs: s.runs,
        evidence: `応答 ${s.calls} 件中 ${calls} 件が ${mismatched.map(([m]) => m).join(', ')}`,
        next: 'Agent tool の model 引数で上書きしている呼び出し元 (skill / workflow) を探す',
      });
    }
  }

  // 4) 別名 (sonnet / opus …) が系統の最新版でなく古い版に解決されている。
  //    別名の解決先は Claude Code の版で決まる (2026-10-02 実測: CLI 2.1.197 の `--model sonnet` は claude-sonnet-5)。
  //    最新版の定義は policy.latestModels だけに置く。直近 1 週の実測だけを見る (切替前の週で誤検知しない)。
  const latestWeek = [...windowWeeks].sort().at(-1);
  for (const agent of agents) {
    if (!agent.model || !(agent.model in policy.latestModels)) continue;
    const latest = policy.latestModels[agent.model];
    const stale = rows.filter((r) => r.scope === 'sub' && r.agentType === agent.name && r.week === latestWeek && modelFamily(r.model) === agent.model && r.model !== latest);
    if (stale.length === 0) continue;
    const calls = stale.reduce((n, r) => n + r.calls, 0);
    proposals.push({
      id: `stale-alias:${agent.name}`,
      kind: 'stale-alias',
      agent: agent.name,
      current: `model: ${agent.model} → ${[...new Set(stale.map((r) => r.model))].join(', ')}`,
      suggested: latest,
      costUsd: round(stale.reduce((n, r) => n + (r.costUsd ?? 0), 0)),
      runs: stale.reduce((n, r) => n + r.runs, 0),
      evidence: `${latestWeek} の応答 ${calls} 件が最新版 ${latest} でない`,
      next: 'Claude Code を更新して別名の解決先を確かめる。更新できない経路 (CI の action 版固定) は full ID 指定を検討する',
    });
  }
  for (const w of ciRuns) {
    const stale = Object.keys(w.models).filter((m) => {
      const fam = modelFamily(m);
      return fam && policy.latestModels[fam] && m !== policy.latestModels[fam];
    });
    if (stale.length === 0) continue;
    proposals.push({
      id: `stale-alias:ci:${w.workflow}`,
      kind: 'stale-alias',
      agent: `CI ${w.workflow}`,
      current: stale.join(', '),
      suggested: stale.map((m) => policy.latestModels[modelFamily(m)]).join(', '),
      costUsd: w.costUsd,
      runs: w.runs,
      evidence: `直近の CI 実行 ${w.runs} 回の init 行のモデル`,
      next: 'claude-code-base-action の版を上げるか claude_args の --model を full ID にする',
    });
  }

  return proposals.sort((a, b) => (b.savingUsd ?? b.costUsd ?? 0) - (a.savingUsd ?? a.costUsd ?? 0));
}
