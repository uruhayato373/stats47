/**
 * quality-gate.mjs の NG_PATTERN「title 「N位」だけで終わる」の回帰テスト (BLOG-TUTORIAL-GATE-GAPS-01)。
 * 実行: node --test .claude/scripts/lib/__tests__/quality-gate.title-ng.test.mjs
 *
 * 旧実装は「N位」を含む引用符つきタイトルをすべて止め、名前 (「N位」で終わる) と判定がずれていた。
 * 「4位なのに空き家は37位」のように、対比 (curiosity gap) を持つタイトルまで止まっていた。
 * quality-gate.mjs は import 時に走る CLI なので、子プロセスで実行して blockers の NG_PATTERN だけを読む。
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GATE = path.resolve(__dirname, '../../blog/quality-gate.mjs');
const NG_NAME = 'NG_PATTERN: title 「N位」だけで終わる';

function titleBlocked(title) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'qg-title-'));
  try {
    fs.writeFileSync(
      path.join(dir, 'article.md'),
      `---\ntitle: ${title}\nseoTitle: "検査用の題"\npublished: false\n---\n\n## 本文\n\n検査用の本文です。\n`
    );
    let stdout;
    try {
      stdout = execFileSync('node', [GATE, path.join(dir, 'article.md')], { encoding: 'utf8' });
    } catch (e) {
      stdout = e.stdout; // blocker があると exit 1。JSON は stdout に出ている
    }
    return JSON.parse(stdout).blockers.some((b) => b.startsWith(NG_NAME));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test('★「N位」で終わり、gap の要素が無い事実羅列の題は止める', () => {
  assert.equal(titleBlocked('"穀類への支出、愛知県が1位で鳥取県が47位"'), true);
});

test('★「4位なのに空き家は37位」のように対比 (のに) で終わる題は止めない', () => {
  assert.equal(titleBlocked('"人口は4位なのに空き家は37位"'), false);
});

test('★N位を含むだけで、N位で終わらない題は止めない (旧実装は止めていた)', () => {
  assert.equal(titleBlocked('"あさり消費量1位は、山梨県なのか"'), false);
  assert.equal(titleBlocked('"1位の県と最下位の県、差は何倍か"'), false);
});

test('gap の要素 (なぜ・？・倍) を含む題は、N位で終わっても止めない', () => {
  assert.equal(titleBlocked('"なぜ山梨が1位なのか、そして47位は"'), false);
  assert.equal(titleBlocked('"1位と47位は約3.8倍"'), false);
});
