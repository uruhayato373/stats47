import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { createHash } from 'node:crypto';
import { jstDateOf } from '../metrics/lib/periods.mjs';
import { planFollowup, summarizeFollowup } from './theme-followup-core.mjs';

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..'
);
const { values: cli } = parseArgs({
  options: {
    plan: { type: 'boolean' },
    force: { type: 'boolean' },
    today: { type: 'string' },
    'quality-code': { type: 'string' },
    'runtime-code': { type: 'string' },
    'live-code': { type: 'string' },
  },
});
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const dir = path.join(ROOT, '.local/ci/theme-followup');
fs.mkdirSync(dir, { recursive: true });
const experiments = read('.claude/state/themes/experiments.json').experiments;
const today = cli.today ?? jstDateOf();
if (cli.plan) {
  const plan = planFollowup(experiments, today, cli.force ?? false);
  fs.writeFileSync(
    path.join(dir, 'plan.json'),
    JSON.stringify(plan, null, 2) + '\n'
  );
  const output = `run=${plan.run}\nmonthly=${plan.monthly}\ndue_count=${plan.due.length}\n`;
  if (process.env.GITHUB_OUTPUT)
    fs.appendFileSync(process.env.GITHUB_OUTPUT, output);
  console.log(output);
} else {
  const codes = Object.fromEntries(
    ['quality', 'runtime', 'live'].map((k) => {
      const v = cli[`${k}-code`];
      if (!/^\d+$/.test(v ?? '')) throw new Error(`Missing ${k} exit code`);
      return [k, Number(v)];
    })
  );
  const optional = (p) => {
    try {
      return read(p);
    } catch (error) {
      if (error.code === 'ENOENT') return null;
      throw error;
    }
  };
  const result = summarizeFollowup({
    experiments,
    quality: optional('.claude/state/themes/quality.json'),
    runtime: optional('.local/ci/theme-followup/runtime.json'),
    codes,
    today,
  });
  // Coarse, stable inputs avoid asking the reviewer to repeat an unchanged judgement.
  result.reviewInputSha256 = createHash('sha256')
    .update(
      JSON.stringify({
        month: today.slice(0, 7),
        problems: result.problems,
        checkpoints: result.checkpoints,
      })
    )
    .digest('hex');
  const priorReview = optional('.claude/state/themes/ci-review.json');
  result.reviewRequired = priorReview?.inputSha256 !== result.reviewInputSha256;
  result.runUrl = process.env.GITHUB_RUN_ID
    ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
    : null;
  fs.writeFileSync(
    path.join(ROOT, '.claude/state/themes/ci-followup.json'),
    JSON.stringify(result, null, 2) + '\n'
  );
  fs.writeFileSync(path.join(dir, 'alert.md'), result.alertBody);
  const output = `alert_open=${result.status === 'fail'}\nreview_required=${result.reviewRequired}\n`;
  if (process.env.GITHUB_OUTPUT)
    fs.appendFileSync(process.env.GITHUB_OUTPUT, output);
  console.log(output);
}
