const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const { JSDOM } = require('jsdom');
const { buildExpression } = require('../attachment-dom.cjs');

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
  const shell = readFileSync(require.resolve('../editor-helpers.sh'), 'utf8').split('ins_file(){')[1].split('\n}\n')[0];
  assert.doesNotMatch(shell, /keys Home|index\(\$0,h\)|startsWith/);
});

test('見出し欠落・重複・直後段落欠落は挿入前に拒否する', () => {
  const missing = fixture(); missing.h2.remove();
  assert.equal(missing.run('prepare'), 'heading-not-unique');
  const duplicate = fixture(); duplicate.h2.after(duplicate.h2.cloneNode(true));
  assert.equal(duplicate.run('prepare'), 'heading-not-unique');
  const noParagraph = fixture(); noParagraph.paragraph.remove();
  assert.equal(noParagraph.run('prepare'), 'immediate-paragraph-missing');
});

test('添付欠落・同名重複・見出し前の添付・別節への添付を拒否する', () => {
  for (const scenario of ['missing', 'duplicate', 'before', 'next-section']) {
    const f = fixture(); f.run('prepare');
    if (scenario === 'duplicate') { f.attach(); f.attach(); }
    if (scenario === 'before') f.attach(true);
    if (scenario === 'next-section') f.editor.append(f.attach());
    assert.equal(f.run('verify'), ({ missing: 'attachment-not-unique', duplicate: 'attachment-not-unique', before: 'attachment-before-heading', 'next-section': 'attachment-outside-section' })[scenario]);
  }
});

test('既存同名添付を再挿入せず、ZIP説明の段落分割を拒否する', () => {
  const existing = fixture(); existing.attach(true);
  assert.equal(existing.run('prepare'), 'attachment-already-present');
  const split = fixture(); split.run('prepare'); split.attach();
  split.paragraph.textContent = 'Z';
  assert.equal(split.run('verify'), 'paragraph-changed');
});

test('引用符・改行・backslash・JS断片を見出し/ファイル名の文字列として扱う', () => {
  const f = fixture();
  const special = '商品\'"\\\n${x}`); window.compromised=true;//';
  const name = special + '.zip';
  f.h2.textContent = special;
  assert.equal(f.run('prepare', special, name), 'note-attachment-prepared');
  f.attach(false, name);
  assert.equal(f.run('verify', special, name), 'note-attachment-verified');
  assert.equal(f.dom.window.compromised, undefined);
});
