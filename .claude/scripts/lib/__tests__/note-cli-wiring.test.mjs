// note の部品 (packages/ops/src/note) と、.claude に残る note のシェル・CLI の配線を確かめる基盤のテスト。
// 部品のテストは packages へ移したが、editor-helpers.sh と update-note-covers.mjs の本文は .claude にあるのでここで確かめる (SCRIPTS-TO-PACKAGES-02)。
// 各 test の中身は移す前のまま (attachment-dom.test.cjs・cover-update.test.mjs から test ごと移した)。
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom');
const { buildExpression } = require('../../../../packages/ops/src/note/attachment-dom.cjs');

const heading = '商品ファイルのダウンロード';
const filename = 'product.zip';
function fixture() {
  const dom = new JSDOM('<div contenteditable="true"><p>有料部分の「商品ファイルのダウンロード」見出し直後にあります。</p><h2>商品ファイルのダウンロード</h2><p style="width:1px">ZIPファイル全体の説明。画面で何行に折り返されてもこの段落を維持する。</p><h2>次の節</h2></div>', { runScripts: 'outside-only' });
  dom.window.HTMLElement.prototype.scrollIntoView = function () {};
  const editor = dom.window.document.querySelector('[contenteditable]');
  const h2 = editor.querySelector('h2');
  const paragraph = h2.nextElementSibling;
  const run = (action, text = heading, name = filename) => dom.window.eval(buildExpression(action, text, name));
  const attach = (before = false, name = filename) => {
    const figure = dom.window.document.createElement('figure');
    figure.setAttribute('embedded-service', 'attachment');
    const link = dom.window.document.createElement('a');
    link.textContent = name;
    figure.append(link);
    if (before) h2.before(figure); else h2.after(figure);
    return figure;
  };
  return { dom, editor, h2, paragraph, run, attach };
}

// 既知の失敗: editor-helpers.sh の ins_file が 2026-10-24 から旧方式 (startsWith・index($0,h)) に戻っている。
// 直したら todo を外す (WINDOWS-LOCAL-GATES-01)。
test('無料説明文の同名言及を無視し、折り返し段落のDOM先頭を選ぶ', () => {
  const f = fixture();
  const original = f.paragraph.textContent;
  assert.equal(f.run('prepare'), 'note-attachment-prepared');
  const selection = f.dom.window.getSelection();
  assert.equal(selection.anchorNode, f.paragraph);
  assert.equal(selection.anchorOffset, 0);
  assert.equal(selection.isCollapsed, true);
  assert.equal(f.paragraph.textContent, original);
  f.attach();
  assert.equal(f.run('verify'), 'note-attachment-verified');
  assert.equal(f.paragraph.textContent, original);
  const shell = fs.readFileSync(require.resolve('../../note/editor-helpers.sh'), 'utf8').split('ins_file(){')[1].split('\n}\n')[0];
  assert.doesNotMatch(shell, /keys Home|index\(\$0,h\)|startsWith/);
});

test('Windows uses the dedicated authenticated browser and closes it without a POSIX daemon lookup', () => {
  const source = fs.readFileSync(new URL('../../note/update-note-covers.mjs', import.meta.url), 'utf8');
  assert.match(source, /process\.platform === 'win32' \|\| unattended\(\)/);
  assert.match(source, /await assertAccount\(playwrightContext\)/);
  const cleanup = source.slice(source.indexOf('async function cleanup()'));
  assert.ok(cleanup.indexOf('await playwrightContext?.close()') < cleanup.indexOf('const before = processes()'));
  assert.match(cleanup, /pruneProfileCaches\(\);\s*return;/);
  assert.match(source, /const prior = findCoverOperation\(previousJournals, a\)/);
});
