#!/usr/bin/env node
/** Restore the approved revision to an owned temporary directory; remove after upload in editor-helpers.sh. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { readCoverLedger } from './lib/cover-assets.mjs';
import { readStoredCover, readStoredCoverInput } from './lib/cover-storage.mjs';
import { assertCurrentCoverCandidate } from './lib/cover-production.mjs';
const key = process.argv[2];
if (process.argv.length !== 3 || !key) throw Error('Usage: materialize-cover.mjs <articleKey>');
const row = readCoverLedger().articles.find(a => a.articleKey === key);
const revision = row?.revisions.find(r => r.id === row.approvedRevisionId && r.id === row.candidateRevisionId);
if (!revision || revision.review.status !== 'pass') throw Error('reviewed remote cover required; prepare/generate/review with note:assets first');
assertCurrentCoverCandidate(row, revision.id);
const bytes = await readStoredCover(revision);
await readStoredCoverInput(revision);
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'stats47-note-cover-upload-'));
const file = path.join(directory, 'cover.png');
fs.writeFileSync(file, bytes);
console.log(file);
