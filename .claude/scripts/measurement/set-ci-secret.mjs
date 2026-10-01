#!/usr/bin/env node
/**
 * set-ci-secret.mjs — CI の Secrets STATS47_AUTH_<SERVICE>_USER / _PASSWORD を登録する。
 * USER はこの PC の資格情報ストアに登録済みのログイン ID を自動で入れ、PASSWORD だけを gh の入力欄で聞く
 * (パスワードはこのスクリプトを通らない)。対象は正本 auth-credentials.json の ciCredential / ciStored の service。
 *
 * Usage: npm run auth:ci-secret -- <service>
 */
import { execFileSync } from 'node:child_process';
import { credentialServices, storedAccounts } from './credential-store.mjs';

const REPO = 'uruhayato373/stats47';
const service = process.argv[2];
const spec = credentialServices()[service];
if (!spec || !(spec.ciCredential || spec.ciStored)) {
  console.error(`CI に置く service を指定する: ${Object.entries(credentialServices()).filter(([, v]) => v.ciCredential || v.ciStored).map(([k]) => k).join(' / ')}`);
  process.exit(2);
}
const user = storedAccounts([spec.storeItem])?.[spec.storeItem]?.user;
if (!user) {
  console.error(`この PC に ${spec.storeItem} が未登録。先に資格情報マネージャー (Mac はキーチェーン) へ登録する`);
  process.exit(1);
}
const prefix = `STATS47_AUTH_${service.toUpperCase()}`;
execFileSync('gh', ['secret', 'set', `${prefix}_USER`, '--repo', REPO, '--body', user], { stdio: 'inherit' });
console.log(`${spec.label} のパスワードを入力する (画面には表示されない)`);
execFileSync('gh', ['secret', 'set', `${prefix}_PASSWORD`, '--repo', REPO], { stdio: 'inherit' });
