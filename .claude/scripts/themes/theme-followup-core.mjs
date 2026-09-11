import { addDays } from '../metrics/lib/periods.mjs';

export function planFollowup(experiments, today, force = false) {
  if (!Array.isArray(experiments) || addDays(today, 0) !== today)
    throw new Error('Invalid follow-up input');
  const due = experiments
    .filter((e) => e.verdict === 'pending')
    .flatMap((e) =>
      ['d7', 'd28', 'd56']
        .filter(
          (cp) =>
            e.evaluateAt?.[cp] && e.evaluateAt[cp] <= today && !e.result?.[cp]
        )
        .map((cp) => ({
          experimentId: e.experimentId,
          checkpoint: cp,
          date: e.evaluateAt[cp],
        }))
    );
  const weekly = new Date(`${today}T00:00:00Z`).getUTCDay() === 1;
  const monthly = today.endsWith('-01');
  return {
    today,
    run: force || weekly || monthly || due.length > 0,
    weekly,
    monthly,
    due,
  };
}

export function runtimeFindings(r) {
  const findings = [];
  if (r.http !== 200) findings.push(`http:${r.http ?? 'missing'}`);
  if (!r.htmlClosed || r.htmlIntegrity !== 'complete')
    findings.push('incomplete-html');
  if (
    r.h1?.length !== 1 ||
    r.h1?.some((h) => /表示できません|見つかりません/.test(h))
  )
    findings.push('invalid-heading');
  for (const s of r.sections ?? [])
    if (s.count !== 1) findings.push(`section:${s.key}:${s.count}`);
  for (const s of r.sections ?? [])
    if (s.expectedCards !== undefined && s.cards !== s.expectedCards)
      findings.push(`section-cards:${s.key}:${s.cards}/${s.expectedCards}`);
  for (const key of r.expectedChartKeys ?? [])
    if (!(r.charts ?? []).some((c) => c.key === key))
      findings.push(`missing-chart:${key}`);
  for (const c of r.cards ?? [])
    if (c.state !== 'ready') findings.push(`card:${c.state}`);
  for (const c of r.charts ?? []) {
    const selection = /都道府県.*選択/.test(c.text ?? '');
    const prompt =
      selection &&
      (c.state === 'select-prefecture' ||
        (c.state === 'no-data' &&
          ['cpi-profile', 'cpi-heatmap', 'pyramid-chart'].includes(c.type)));
    if (c.state !== 'ready' && !prompt)
      findings.push(`chart:${c.key}:${c.state}`);
  }
  for (const e of r.pageErrors ?? []) findings.push(`js:${e}`);
  for (const e of r.networkErrors ?? []) findings.push(`network:${e.status}`);
  if (r.scrollWidth > r.width + 1) findings.push('horizontal-overflow');
  if (r.selectors !== 1) findings.push('prefecture-selector');
  return [...new Set(findings)];
}

export function summarizeFollowup({
  experiments,
  quality,
  runtime,
  codes,
  today,
}) {
  const problems = Object.entries(codes)
    .filter(([, code]) => code !== 0)
    .map(([name, code]) => `${name}-process:${code}`);
  if (!quality?.summary || quality.summary.errors > 0)
    problems.push('quality-errors');
  for (const finding of quality?.findings ?? [])
    if (finding.severity === 'error')
      problems.push(
        `quality:${finding.themeKey ?? finding.metricKey ?? 'catalog'}:${finding.code}:${finding.detail ?? ''}`
      );
  if (!runtime?.summary || runtime.summary.checked !== runtime.summary.expected)
    problems.push('runtime-incomplete');
  for (const c of runtime?.cases ?? [])
    for (const f of c.findings ?? [])
      problems.push(`${c.themeKey}/${c.width}:${f}`);
  if (runtime?.summary?.failed > 0 && !problems.length)
    problems.push('runtime-errors');
  const checkpoints = experiments.flatMap((e) =>
    ['d7', 'd28', 'd56']
      .filter((cp) => e.evaluateAt?.[cp] <= today)
      .map((cp) => {
        const o = e.result?.rechecks?.[cp]?.at(-1) ?? e.result?.[cp];
        return {
          experimentId: e.experimentId,
          themeKey: e.themeKey,
          checkpoint: cp,
          due: e.evaluateAt[cp],
          status: o?.status ?? 'not-observed',
          reasons: o?.reasons ?? [],
          verdict: e.verdict,
        };
      })
  );
  const unique = [...new Set(problems)].sort();
  const alertBody =
    [
      '# テーマ継続確認',
      ...unique.map((p) => `- ${p}`),
      '',
      '結果: `.claude/state/themes/ci-followup.json`。HTML・応答・cf-ray・スクリーンショットは実行runのtheme-followup-evidence artifactを参照。',
      '再現: `node --import tsx .claude/scripts/themes/audit-theme-runtime.ts` と `npm run theme:portfolio:audit`。',
    ].join('\n') + '\n';
  return {
    schemaVersion: 1,
    observedAt: today,
    status: unique.length ? 'fail' : 'pass',
    themeCount: quality?.summary?.themes ?? null,
    runtime: runtime?.summary ?? null,
    problems: unique,
    checkpoints,
    alertBody,
  };
}
