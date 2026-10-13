/**
 * note 記事台帳 (data/note/articles.json) とマガジン台帳 (data/note/magazines.json) の読み書き。
 * 書き込みは Schema と参照整合を通したものだけ。本文・画像は台帳に入れない (所在とマニフェストの SHA だけ)。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import articleSchema from '../../../../data/note/articles.schema.json' with { type: 'json' };
import magazineSchema from '../../../../data/note/magazines.schema.json' with { type: 'json' };
import { datasetPath } from '../../../../config/datasets.mjs';

export const LEDGER_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const ajv = new Ajv({ allErrors: true });
const validateArticleShape = ajv.compile(articleSchema);
const validateMagazineShape = ajv.compile(magazineSchema);

const articlesFile = (root) => path.join(root, datasetPath('note.articles'));
const magazinesFile = (root) => path.join(root, datasetPath('note.magazines'));

export function readMagazineLedger(root = LEDGER_ROOT) {
  const ledger = JSON.parse(fs.readFileSync(magazinesFile(root), 'utf8'));
  if (!validateMagazineShape(ledger)) throw Error(`note magazines schema: ${ajv.errorsText(validateMagazineShape.errors)}`);
  return ledger;
}

export function validateArticleLedger(ledger, magazines) {
  if (!validateArticleShape(ledger)) throw Error(`note articles schema: ${ajv.errorsText(validateArticleShape.errors)}`);
  const seen = new Set();
  const magazineKeys = new Set(magazines.magazines.map((m) => m.key));
  for (const article of ledger.articles) {
    if (seen.has(article.key)) throw Error(`note articles: duplicate key ${article.key}`);
    seen.add(article.key);
    if (article.magazine !== null && !magazineKeys.has(article.magazine))
      throw Error(`note articles: ${article.key} refers to unknown magazine ${article.magazine}`);
  }
  return ledger;
}

export function readArticleLedger(root = LEDGER_ROOT) {
  return validateArticleLedger(JSON.parse(fs.readFileSync(articlesFile(root), 'utf8')), readMagazineLedger(root));
}

export function writeArticleLedger(ledger, root = LEDGER_ROOT) {
  validateArticleLedger(ledger, readMagazineLedger(root));
  const file = articlesFile(root);
  const temp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(ledger, null, 2)}\n`);
  fs.renameSync(temp, file);
}

/** Read, edit in place, validate and write once. Throws without writing when the edit breaks the contract. */
export function updateArticleLedger(edit, root = LEDGER_ROOT) {
  const ledger = readArticleLedger(root);
  const result = edit(ledger);
  writeArticleLedger(ledger, root);
  return result;
}

export function findLedgerArticle(ledger, key) {
  const article = ledger.articles.find((a) => a.key === key);
  if (!article) throw Error(`note articles: unknown key ${key}`);
  return article;
}

/** True only when the body was saved to R2 and its manifest recorded (not merely claimed). */
export const hasStoredBody = (article) => article.body.store !== 'note-only' && article.body.manifest !== null;
