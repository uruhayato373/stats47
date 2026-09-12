#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkKeywordState } from './keyword-cycle.mjs';

const args = process.argv.slice(2);
const option = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
try {
  checkKeywordState(path.resolve(option('--repo', path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..'))), option('--base', null));
  console.log('Keyword state and immutable history verified');
} catch (error) { console.error(error.message); process.exitCode = 1; }
