#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const YAML = require('yaml');

const ROOT =
  process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..', '..');
const WORKFLOW_ROOT = path.join(ROOT, '.github/workflows');
const isStrict = process.argv.includes('--strict');
const isJson = process.argv.includes('--json');

function workflowFiles() {
  return fs
    .readdirSync(WORKFLOW_ROOT)
    .filter((file) => /\.ya?ml$/.test(file))
    .map((file) => path.join(WORKFLOW_ROOT, file))
    .sort();
}

function hasSchedule(onValue) {
  return Boolean(onValue && typeof onValue === 'object' && onValue.schedule);
}

function auditFile(file) {
  const relative = path.relative(ROOT, file).split(path.sep).join('/');
  const findings = [];
  const raw = fs.readFileSync(file, 'utf8');
  let workflow;
  try {
    workflow = YAML.parse(raw);
  } catch (error) {
    return [{ code: 'YAML_PARSE', file: relative, message: String(error) }];
  }

  // ARG_VECTOR_QUOTED: 文字列連結で組んだ引数列 (VAR="$VAR --x" / VAR="--x y" 初期化) を
  // コマンドに "$VAR" と quote 渡しすると全体が 1 トークン化して実行時に壊れる。
  // SC2086 対応の quote 一括追加で発生した実regression (2026-07-14 sync-snapshots)。
  // 可変引数列は bash 配列 (VAR+=(...) と "${VAR[@]}") で組むこと。
  const argVectorVars = new Set();
  // 行頭に限定しない ([ -n ... ] && VAR="$VAR --x" の形を取りこぼさない)
  for (const m of raw.matchAll(/\b([A-Z_][A-Z0-9_]*)="\$\1 /g))
    argVectorVars.add(m[1]);
  for (const m of raw.matchAll(/\b([A-Z_][A-Z0-9_]*)="--\S+ /g))
    argVectorVars.add(m[1]);
  // 空白区切りの **複数パス** を 1 変数に入れる形 (VAR="a/x.ts b/y.ts") も同じ罠。
  // git diff --quiet -- "$VAR" が「一致なし = 差分なし」で常に early exit し、
  // PR 作成ステップが永久に動かない状態になっていた (2026-07-24 sync-snapshots で実検出)。
  // 「/ を含むトークンが 2 つ以上」に限定して誤検知 (メッセージ文字列等) を避ける。
  for (const m of raw.matchAll(/\b([A-Z_][A-Z0-9_]*)="([^"$\n]+)"/g)) {
    const tokens = m[2].trim().split(/\s+/);
    if (
      tokens.length >= 2 &&
      tokens.filter((t) => t.includes('/')).length >= 2
    ) {
      argVectorVars.add(m[1]);
    }
  }
  const lines = raw.split('\n');
  for (const name of argVectorVars) {
    // git / bash / node 等どのコマンドでも 1 トークン化は同じように壊れる。
    // ただし次は意図的な使い方なので除外する (誤検知の実例):
    //   - `echo "$VAR" | xargs` — 文字列のまま渡して下流で単語分割させる
    //   - `VAR=$(...)` の右辺 / コメント行
    const marker = `"$${name}"`;
    const flagged = lines.some((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('#')) return false;
      let at = line.indexOf(marker);
      while (at >= 0) {
        const before = line.slice(0, at);
        const after = line.slice(at + marker.length);
        // `VAR=$(echo "$VAR" | xargs)` / `if [ -z "$(echo "$VAR" ...)" ]` のように
        // 引用符・括弧・= が空白なしで前置するので、記号を区切りとして直前の語を取る
        const prevToken =
          before
            .split(/[^A-Za-z0-9_./-]+/)
            .filter(Boolean)
            .pop() ?? '';
        const isEchoArg = prevToken === 'echo';
        const isAssignmentRhs = /(^|\s)[A-Z_][A-Z0-9_]*=\$?\($/.test(
          before.trimEnd()
        );
        const isArgPosition = after === '' || /^[\s;)|&]/.test(after);
        if (!isEchoArg && !isAssignmentRhs && isArgPosition) return true;
        at = line.indexOf(marker, at + 1);
      }
      return false;
    });
    if (flagged) {
      findings.push({
        code: 'ARG_VECTOR_QUOTED',
        file: relative,
        message: `${name} は複数トークンの引数列だが "$${name}" と単一引数で渡している (1トークン化) — bash 配列 ${name}=(...) と "\${${name}[@]}" に変える`,
      });
    }
  }
  const jobs =
    workflow?.jobs && typeof workflow.jobs === 'object' ? workflow.jobs : {};
  const workflowPermissions = workflow?.permissions;

  const allSteps = Object.values(jobs).flatMap((job) =>
    job && typeof job === 'object' && Array.isArray(job.steps) ? job.steps : []
  );
  const executableLines = (run) =>
    run
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && !/^echo\b/.test(line));
  const isKnownImageGenerator = (line) =>
    line.includes('generate-ogp-images.ts') ||
    line.includes('generate-blog-thumbnails.ts') ||
    line.includes('generate-blog-thumbnails-cloud.ts');
  const isImageWriter = (step) => {
    if (typeof step?.run !== 'string') return false;
    const lines = executableLines(step.run);
    if (!lines.some(isKnownImageGenerator)) return false;

    // `SC=...generator.ts` followed by `$SC --audit` is intentionally
    // supported. A step that contains only audit invocations must not require
    // a publisher, whereas any generator invocation without --audit stages
    // image assets and therefore must be published exactly.
    const literalGeneratorCommands = lines.filter(
      (line) =>
        isKnownImageGenerator(line) &&
        !/^[A-Z_][A-Z0-9_]*=.*generate-/.test(line)
    );
    const auditOnly =
      lines.some((line) => line.includes('--audit')) &&
      !lines.some(
        (line) => line.includes('--apply') || line.includes('--out-dir')
      ) &&
      (literalGeneratorCommands.length === 0 ||
        literalGeneratorCommands.every((line) => line.includes('--audit')));
    return !auditOnly;
  };
  const publisherPositionAfterWriter = (writer, publisher) => {
    if (publisher.stepIndex > writer.stepIndex) return true;
    if (publisher.stepIndex < writer.stepIndex) return false;
    // A few bounded batch workflows generate and publish inside one shell
    // step. Treat it as ordered only when the exact publisher command occurs
    // after the generator reference in that same script.
    return (
      publisher.step.run.indexOf('push-generated-image-set.ts') >
      Math.max(
        writer.step.run.indexOf('generate-ogp-images.ts'),
        writer.step.run.indexOf('generate-blog-thumbnails.ts'),
        writer.step.run.indexOf('generate-blog-thumbnails-cloud.ts')
      )
    );
  };
  const imageWriters = [];
  const imagePublishers = [];
  for (const [jobId, job] of Object.entries(jobs)) {
    if (!job || typeof job !== 'object' || !Array.isArray(job.steps)) continue;
    job.steps.forEach((step, stepIndex) => {
      if (isImageWriter(step)) imageWriters.push({ jobId, stepIndex, step });
      if (
        typeof step?.run === 'string' &&
        step.run.includes('push-generated-image-set.ts')
      ) {
        imagePublishers.push({ jobId, stepIndex, step });
      }
    });
  }
  if (imageWriters.length > 0) {
    const concurrencyGroup =
      workflow?.concurrency && typeof workflow.concurrency === 'object'
        ? workflow.concurrency.group
        : null;
    if (concurrencyGroup !== 'r2-write') {
      findings.push({
        code: 'IMAGE_WRITE_NO_SHARED_CONCURRENCY',
        file: relative,
        message: '画像 R2 writer は共通 concurrency group `r2-write` を使う',
      });
    }
    for (const writer of imageWriters) {
      const publisher = imagePublishers.find(
        (candidate) =>
          candidate.jobId === writer.jobId &&
          publisherPositionAfterWriter(writer, candidate)
      );
      if (!publisher) {
        findings.push({
          code: 'R2_IMAGE_PUSH_WITHOUT_EXACT_PLAN',
          file: relative,
          message: `画像 generator (${writer.jobId}) の後続に同じ job の exact plan publisher がない`,
        });
      }
    }
  }
  for (const { step } of imageWriters) {
    const runLines = step.run.split('\n');
    const forceLine = runLines.find((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || /^echo\b/.test(trimmed))
        return false;
      return (
        /generate-(?:ogp-images|blog-thumbnails(?:-cloud)?)[^\n]*--force/.test(
          trimmed
        ) ||
        /\bFLAGS(?:\+)?=.*--force/.test(trimmed) ||
        /\$SC[^\n]*--force/.test(trimmed)
      );
    });
    if (forceLine) {
      findings.push({
        code: 'IMAGE_FORCE_IN_AUTOMATION',
        file: relative,
        message:
          '画像 automation で --force は禁止。fingerprint 差分または明示 --key を使う',
      });
    }
    if (
      /diff-push-r2\.ts[^\n]*--prefix\s+(?:["']?app\/ranking|["']?app\/areas|["']?sns\/pref-silhouette|["']?note(?:\s|["']))/.test(
        step.run
      )
    ) {
      findings.push({
        code: 'IMAGE_PREFIX_PUSH',
        file: relative,
        message: '画像生成後の prefix push は禁止。exact plan publisher を使う',
      });
    }
    if (/generate-blog-thumbnails(?:-cloud)?\.ts[^\n]*--apply/.test(step.run)) {
      findings.push({
        code: 'IMAGE_DIRECT_APPLY',
        file: relative,
        message:
          '画像 generator からの直接 apply は禁止。exact plan publisher を別工程で使う',
      });
    }
    if (
      step['continue-on-error'] === true ||
      /\|\|\s*true(?:\s|$)/m.test(step.run)
    ) {
      findings.push({
        code: 'IMAGE_WRITE_BEST_EFFORT',
        file: relative,
        message:
          '画像生成/publish の失敗を continue-on-error / || true で隠さない',
      });
    }
  }
  for (const { step } of imagePublishers) {
    const run = step.run;
    if (!/push-generated-image-set\.ts[^\n]*--plan\b/.test(run)) {
      findings.push({
        code: 'R2_IMAGE_PUSH_WITHOUT_EXACT_PLAN',
        file: relative,
        message: '画像 publisher は --plan で exact publish plan を指定する',
      });
    }
    if (
      step['continue-on-error'] === true ||
      /push-generated-image-set\.ts[^\n]*\|\|\s*true(?:\s|$)/m.test(run)
    ) {
      findings.push({
        code: 'IMAGE_PUBLISH_BEST_EFFORT',
        file: relative,
        message:
          'exact image publisher の失敗を continue-on-error / || true で隠さない',
      });
    }
    const optionalPlan =
      /(?:test|\[)\s+!?-f\s+["']?\$PLAN["']?\s*\]?\s*&&\s*[^\n]*push-generated-image-set\.ts/.test(
        run
      ) ||
      /if\s+(?:test\s+)?\[?\s*-f\s+["']?\$PLAN["']?\s*\]?\s*;?\s*then[\s\S]*?push-generated-image-set\.ts[\s\S]*?fi/.test(
        run
      ) ||
      /(?:test|\[)\s+!\s*-f\s+["']?\$PLAN["']?\s*\]?\s*&&\s*(?:exit\s+0|true)\b/.test(
        run
      ) ||
      /if\s+(?:test\s+)?\[?\s*!\s*-f\s+["']?\$PLAN["']?\s*\]?\s*;?\s*then\s*(?:exit\s+0|true)\b[\s\S]*?fi/.test(
        run
      );
    if (optionalPlan) {
      findings.push({
        code: 'IMAGE_PUBLISH_PLAN_OPTIONAL',
        file: relative,
        message:
          'exact publish plan の不在を成功扱いにしない。plan 不在は失敗にする',
      });
    }
  }

  // blog SVGは共通manifestを持たないが、生成assetである点は同じ。
  // app/blog全体のmtime/prefix同期へ戻ると未変更thumbnailまで再PUTされるため、
  // 明示keyをSHA比較するexact publisherを必須にする。
  const hasBlogSvgGenerator = allSteps.some(
    (step) =>
      typeof step?.run === 'string' &&
      step.run.includes('generate-article-charts.ts')
  );
  const hasBlogSvgR2Write = allSteps.some(
    (step) =>
      typeof step?.run === 'string' &&
      (step.run.includes('diff-push-r2.ts') ||
        step.run.includes('push-exact-r2-assets.ts'))
  );
  if (hasBlogSvgGenerator && hasBlogSvgR2Write) {
    if (
      allSteps.some(
        (step) =>
          typeof step?.run === 'string' &&
          /diff-push-r2\.ts[^\n]*--prefix\s+["']?app\/blog(?:\s|["']|$)/.test(
            step.run
          )
      )
    ) {
      findings.push({
        code: 'GENERATED_ASSET_PREFIX_PUSH',
        file: relative,
        message:
          'blog SVG再生成後のapp/blog prefix pushは禁止。明示keyのexact publisherを使う',
      });
    }
    const exactPublisher = allSteps.find(
      (step) =>
        typeof step?.run === 'string' &&
        step.run.includes('push-exact-r2-assets.ts')
    );
    if (
      !exactPublisher ||
      (!exactPublisher.run.includes('--key') &&
        !(
          exactPublisher.run.includes('--prefix') &&
          exactPublisher.run.includes('--extension')
        ))
    ) {
      findings.push({
        code: 'GENERATED_ASSET_NO_EXACT_PUBLISHER',
        file: relative,
        message:
          'blog SVG再生成には明示keyまたは狭いprefix+extensionのexact publisherが必要',
      });
    }
  }

  if (
    !workflowPermissions &&
    !Object.values(jobs).every((job) => job?.permissions)
  ) {
    findings.push({
      code: 'PERMISSIONS_IMPLICIT',
      file: relative,
      message: 'workflow/job permissions are not explicit for every job',
    });
  }
  if (hasSchedule(workflow?.on) && !workflow?.concurrency) {
    findings.push({
      code: 'SCHEDULE_NO_CONCURRENCY',
      file: relative,
      message: 'scheduled workflow has no concurrency policy',
    });
  }
  for (const [jobId, job] of Object.entries(jobs)) {
    if (!job || typeof job !== 'object') continue;
    if (!job['timeout-minutes']) {
      findings.push({
        code: 'JOB_NO_TIMEOUT',
        file: relative,
        message: `job ${jobId} has no timeout-minutes`,
      });
    }
    for (const step of job.steps || []) {
      if (!step?.uses || typeof step.uses !== 'string') continue;
      if (step.uses.startsWith('./') || step.uses.startsWith('docker://'))
        continue;
      const revision = step.uses.split('@')[1] || '';
      if (!/^[0-9a-f]{40}$/.test(revision)) {
        findings.push({
          code: 'ACTION_NOT_SHA_PINNED',
          file: relative,
          message: `${step.uses} is not pinned to a full commit SHA`,
        });
      }
    }
  }
  return findings;
}

const files = workflowFiles();
const findings = files.flatMap(auditFile);
const byCode = Object.fromEntries(
  [...new Set(findings.map((finding) => finding.code))]
    .sort()
    .map((code) => [
      code,
      findings.filter((finding) => finding.code === code).length,
    ])
);
const output = {
  workflows: files.length,
  findings: findings.length,
  byCode,
  details: findings,
};

if (isJson) console.log(JSON.stringify(output, null, 2));
else {
  console.log(
    `workflow policy audit: ${output.workflows} workflows / ${output.findings} advisory findings`
  );
  for (const [code, count] of Object.entries(byCode))
    console.log(`  ${code}: ${count}`);
  if (findings.length > 0)
    console.log(
      'advisory only; run with --strict after remediation/baseline decision'
    );
}
process.exit(isStrict && findings.length > 0 ? 1 : 0);
