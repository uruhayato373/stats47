// Browser-side function shared by ins_file and deterministic DOM regression tests.
function attachmentDom(action, headingText, fileName) {
  const editors = document.querySelectorAll('[contenteditable=true]');
  if (editors.length !== 1) return 'editor-not-unique';
  const editor = editors[0];
  const headings = [...editor.querySelectorAll('h2')].filter(
    (heading) => heading.textContent.trim() === headingText
  );
  if (headings.length !== 1) return 'heading-not-unique';
  const heading = headings[0];
  const attachments = [...editor.querySelectorAll('figure[embedded-service=attachment]')].filter(
    (figure) => [...figure.querySelectorAll('*')].some(
      (element) => element.textContent.trim() === fileName
    )
  );
  if (action === 'prepare') {
    delete window.__noteAttachmentInsertion;
    if (attachments.length) return 'attachment-already-present';
    const paragraph = heading.nextElementSibling;
    if (!paragraph || paragraph.tagName !== 'P' || !paragraph.textContent.trim())
      return 'immediate-paragraph-missing';
    editor.focus();
    const range = document.createRange();
    range.setStart(paragraph, 0);
    range.collapse(true);
    const selection = window.getSelection();
    if (!selection) return 'selection-missing';
    selection.removeAllRanges();
    selection.addRange(range);
    paragraph.scrollIntoView({ block: 'center' });
    window.__noteAttachmentInsertion = { headingText, fileName, paragraphText: paragraph.textContent };
    return 'note-attachment-prepared';
  }
  if (action !== 'verify') return 'unknown-action';
  const saved = window.__noteAttachmentInsertion;
  if (!saved || saved.headingText !== headingText || saved.fileName !== fileName)
    return 'preparation-missing';
  if (attachments.length !== 1) return 'attachment-not-unique';
  const attachment = attachments[0];
  if (!(heading.compareDocumentPosition(attachment) & Node.DOCUMENT_POSITION_FOLLOWING))
    return 'attachment-before-heading';
  // 保護対象の段落が分割・欠落していないことも同じ見出し節内で確認する。
  const section = [];
  for (let node = heading.nextElementSibling; node && node.tagName !== 'H2'; node = node.nextElementSibling)
    section.push(node);
  if (!section.some((node) => node === attachment || node.contains(attachment)))
    return 'attachment-outside-section';
  if (section.filter((node) => node.tagName === 'P' && node.textContent === saved.paragraphText).length !== 1)
    return 'paragraph-changed';
  delete window.__noteAttachmentInsertion;
  return 'note-attachment-verified';
}

function buildExpression(action, headingText, fileName) {
  if (!['prepare', 'verify'].includes(action) || !headingText || !fileName)
    throw new Error('Expected prepare|verify, exact H2 text, and filename');
  return `(${attachmentDom.toString()})(${[action, headingText, fileName].map((value) => JSON.stringify(value)).join(',')});`;
}

module.exports = { buildExpression };
if (require.main === module) {
  process.stdout.write(buildExpression(...process.argv.slice(2)));
}
