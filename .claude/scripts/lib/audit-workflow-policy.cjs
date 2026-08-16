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

/**
 * saveToR2 を import しているスクリプトの相対パスを集める。
 *
 * ★リストをハードコードしない。新しい writer が増えたとき更新を忘れて検査が素通りするため、
 *   実ファイルを走査して都度求める (対象は workflow が実行しうる scripts ディレクトリのみ)。
 */
let saveToR2ScriptsCache = null;
function collectSaveToR2Scripts() {
  if (saveToR2ScriptsCache) return saveToR2ScriptsCache;
  const roots = [
    path.join(ROOT, 'apps/web/scripts'),
    path.join(ROOT, '.claude/scripts'),
    path.join(ROOT, 'packages'),
  ];
  const out = [];
  const walk = (dir, depth = 0) => {
    if (depth > 6) return;
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (e.name === 'node_modules' || e.name === '__tests__' || e.name.startsWith('.')) continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        walk(full, depth + 1);
        continue;
      }
      if (!/\.(ts|mts|mjs|cjs)$/.test(e.name)) continue;
      let src;
      try {
        src = fs.readFileSync(full, 'utf8');
      } catch {
        continue;
      }
      // saveToR2 を import して呼ぶファイルだけを writer とみなす
      // (定義元 packages/r2-storage/src/lib/operations/save.ts は import しないので除外される)
      if (/\bsaveToR2\b/.test(src) && /from\s+["'][^"']*r2-storage/.test(src)) {
        out.push(path.relative(ROOT, full).split(path.sep).join('/'));
      }
    }
  };
  for (const r of roots) walk(r);
  saveToR2ScriptsCache = out;
  return out;
}

/**
 * 「node_modules が無いと動かない repo スクリプト」の集合を返す。
 *
 * 2026-08-16 の実障害: search-growth-weekly.yml は npm ci を持たないまま
 * `node --test .claude/scripts/metrics/__tests__/*.test.mjs` を走らせていた。8/2 までは
 * 対象テストが依存を持たなかったので通っていたが、W32 で追加された adsense-inventory.test.mjs が
 * **相対 import の 1 段先** (fetch-adsense-snapshot.mjs) で googleapis を import していたため、
 * 8/9 からファイル読み込みごと失敗するようになった (location: test.mjs:1:1)。
 *
 * ★ 浅い走査では捕まらない。entry 自身は `node:` と相対 import しか持たないので、
 *   **相対 import を再帰的に辿って**外部依存に到達するかを見る必要がある。
 */
let nodeModulesDependentScriptsCache = null;
function collectScriptsNeedingNodeModules() {
  if (nodeModulesDependentScriptsCache) return nodeModulesDependentScriptsCache;
  const roots = [
    path.join(ROOT, '.claude/scripts'),
    path.join(ROOT, 'apps/web/scripts'),
    path.join(ROOT, 'packages'),
    path.join(ROOT, 'scripts'),
  ];
  const files = [];
  const walk = (dir, depth = 0) => {
    if (depth > 7) return;
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full, depth + 1);
      else if (/\.(ts|mts|cts|mjs|cjs|js)$/.test(e.name)) files.push(full);
    }
  };
  for (const r of roots) walk(r);

  const readImports = (absolute) => {
    let src;
    try {
      src = fs.readFileSync(absolute, 'utf8');
    } catch {
      return null;
    }
    const specs = [];
    for (const m of src.matchAll(/(?:from|import)\s+["']([^"']+)["']/g)) specs.push(m[1]);
    for (const m of src.matchAll(/\brequire\(\s*["']([^"']+)["']\s*\)/g)) specs.push(m[1]);
    return specs;
  };

  /** 相対 import を解決して実ファイルを返す (拡張子省略・index も試す) */
  const resolveRelative = (fromFile, spec) => {
    const base = path.resolve(path.dirname(fromFile), spec);
    const candidates = [
      base,
      // .js/.mjs 指定で実体が .ts のケース (tsx / ESM の慣習)
      base.replace(/\.js$/, '.ts'),
      base.replace(/\.mjs$/, '.mts'),
      ...['.ts', '.mts', '.cts', '.mjs', '.cjs', '.js'].map((ext) => base + ext),
      ...['.ts', '.mts', '.mjs', '.cjs', '.js'].map((ext) => path.join(base, 'index' + ext)),
    ];
    for (const c of candidates) {
      try {
        if (fs.statSync(c).isFile()) return c;
      } catch {
        /* next */
      }
    }
    return null;
  };

  /** 外部依存 (非 node: ・非相対) に到達するか。相対 import を再帰的に辿る */
  const needsInstall = (absolute, seen = new Set()) => {
    if (seen.has(absolute)) return false;
    seen.add(absolute);
    const specs = readImports(absolute);
    if (!specs) return false;
    for (const spec of specs) {
      if (spec.startsWith('node:')) continue;
      if (spec.startsWith('.') || spec.startsWith('/')) {
        const next = resolveRelative(absolute, spec);
        if (next && needsInstall(next, seen)) return true;
        continue;
      }
      // bare specifier = node_modules 依存 (workspace パッケージも npm ci が要る)
      return true;
    }
    return false;
  };

  const out = [];
  for (const f of files) {
    if (needsInstall(f)) out.push(path.relative(ROOT, f).split(path.sep).join('/'));
  }
  nodeModulesDependentScriptsCache = out;
  return out;
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

  // R2_WRITE_WITHOUT_PUSH: saveToR2 は **.local/r2/ に書くだけ**で、実 R2 への反映は
  // diff-push-r2.ts (S3 API) が行う 2 段構成。push 段を書き忘れると workflow は success する
  // のに本番へ何も届かない (2026-08-04 の sync-rakuten-catalog で実発生。公開 URL を
  // 叩くまで気づけなかった)。saveToR2 を使うスクリプトを実行する step があるなら、
  // 同じ job に push 段 (diff-push-r2 / push-generated-image-set / sync-snapshots の run.sh) が要る。
  const R2_WRITER_SCRIPTS = collectSaveToR2Scripts();
  if (R2_WRITER_SCRIPTS.length > 0) {
    for (const [jobId, job] of Object.entries(jobs)) {
      if (!job || typeof job !== 'object' || !Array.isArray(job.steps)) continue;
      // ★ シェルコメントを落としてから判定する。コメントで push スクリプト名に言及している
      //   だけで「push 段あり」と誤判定し、検査が素通りする (実装時に実際に踏んだ)。
      const stripShellComments = (text) =>
        text
          .split('\n')
          .filter((line) => !/^\s*#/.test(line))
          .join('\n');
      const runs = job.steps
        .map((s) => (typeof s?.run === 'string' ? stripShellComments(s.run) : ''))
        .join('\n');
      if (!runs) continue;
      const writesViaSaveToR2 = R2_WRITER_SCRIPTS.some((rel) => runs.includes(rel));
      if (!writesViaSaveToR2) continue;
      const hasPush =
        runs.includes('diff-push-r2') ||
        runs.includes('push-generated-image-set') ||
        runs.includes('push-exact-r2-assets') ||
        runs.includes('sync-snapshots/run.sh');
      if (!hasPush) {
        findings.push({
          code: 'R2_WRITE_WITHOUT_PUSH',
          file: relative,
          message: `job ${jobId}: saveToR2 を使うスクリプトを実行しているが push 段 (diff-push-r2 等) が無い。.local/r2 に書くだけで本番に届かない`,
        });
      }
    }
  }

  // SCRIPT_RUN_WITHOUT_INSTALL: node_modules 依存を持つ repo スクリプトを実行するのに
  // 同じ job へ npm ci / npm install が無い。
  //
  // 2026-08-16 の実障害: search-growth-weekly が install 無しで node --test を回しており、
  // W32 で追加されたテストが相対 import の 1 段先で googleapis を要求した瞬間に死んだ
  // (8/9・8/16 の 2 週連続失敗。8/2 までは対象テストに依存が無く通っていた)。
  // 「依存の無いスクリプトを install 無しで走らせている」状態は、依存を持つファイルが
  // 1 本増えた瞬間に静かに壊れる時限式なので、実行対象の依存を静的に見て要求する。
  const INSTALL_NEEDING_SCRIPTS = collectScriptsNeedingNodeModules();
  if (INSTALL_NEEDING_SCRIPTS.length > 0) {
    for (const [jobId, job] of Object.entries(jobs)) {
      if (!job || typeof job !== 'object' || !Array.isArray(job.steps)) continue;
      // ★ 「実行」と「文字列としての言及」を区別する。区別しないと、Issue 本文の
      //   「反映手順」に `npx tsx <path>` と書いてあるだけの workflow を誤検知する
      //   (実装時に internal-link-audit-weekly / ksj-catalog-monthly の 2 本で実際に踏んだ)。
      //   誤検知を出すゲートは運用で無効化されるので、確実に実行と言える形だけを見る。
      const stripComments = (text) => {
        const out = [];
        let heredoc = null;
        for (const line of text.split('\n')) {
          if (heredoc) {
            // heredoc 本文 (Issue body 等) は実行されないので落とす
            if (line.trim() === heredoc) heredoc = null;
            continue;
          }
          if (/^\s*#/.test(line)) continue;
          const open = line.match(/<<-?\s*['"]?([A-Za-z_][A-Za-z0-9_]*)['"]?/);
          if (open) heredoc = open[1];
          // echo で囲まれた行も手順書きなので実行とみなさない
          if (/^\s*echo\b/.test(line)) continue;
          out.push(line);
        }
        return out.join('\n');
      };
      const runs = job.steps
        .map((s) => (typeof s?.run === 'string' ? stripComments(s.run) : ''))
        .join('\n');
      if (!runs) continue;
      // インタプリタの引数位置に現れたパス表現を集める。
      // ★ glob をそのまま文字列比較すると素通りする: 実障害の search-growth-weekly は
      //   `node --test .claude/scripts/metrics/__tests__/*.test.mjs` と書いており、
      //   具体的なファイル名は run に現れない。展開して突き合わせないと検査が空振りする。
      const executedPatterns = [];
      for (const m of runs.matchAll(
        /(?:^|[;&|]|\)\s)\s*(?:npx\s+(?:--\S+\s+)*)?(?:node|tsx|ts-node)\s+([^\n]*)/gm
      )) {
        for (const token of m[1].split(/\s+/)) {
          if (!token || token.startsWith('-')) continue;
          if (/[./]/.test(token)) executedPatterns.push(token.replace(/^["']|["']$/g, ''));
        }
      }
      const matchesPattern = (rel, pattern) => {
        if (!pattern.includes('*')) return rel === pattern || rel.endsWith('/' + pattern);
        const re = new RegExp(
          '^' +
            pattern
              .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
              .replace(/\*\*/g, ' ')
              .replace(/\*/g, '[^/]*')
              .replace(/ /g, '.*') +
            '$'
        );
        return re.test(rel);
      };
      const executed = INSTALL_NEEDING_SCRIPTS.filter((rel) =>
        executedPatterns.some((p) => matchesPattern(rel, p))
      );
      if (executed.length === 0) continue;
      const hasInstall = /\bnpm\s+(ci|install)\b/.test(runs);
      if (!hasInstall) {
        findings.push({
          code: 'SCRIPT_RUN_WITHOUT_INSTALL',
          file: relative,
          message:
            `job ${jobId}: node_modules 依存を持つスクリプトを実行しているが npm ci が無い ` +
            `(${executed.slice(0, 3).join(', ')}${executed.length > 3 ? ` 他 ${executed.length - 3} 件` : ''})`,
        });
      }
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
