import "server-only";

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { storedAccounts } from "../../../../.claude/scripts/measurement/credential-store.mjs";
import { projectRoot } from "./project-root";
import { wrap } from "./state-io";

/**
 * ログインと資格情報の一覧 (読み取り専用)。正本は .claude/config/auth-credentials.json。
 * ページを開くたびに、この PC の資格情報ストア (有無と ID だけ) と CI の Secrets 名を読む (2026-10-01 オーナー判断)。
 * 子プロセスはパスワードを読まない 3 コマンド (cmdkey /list・security -w なし・gh secret list) に限る
 * (tests/unit/read-only-contract.test.ts の例外)。
 */
export interface AuthCredentialRow {
  id: string;
  label: string;
  /** 正本のログイン ID。未確定の service は null */
  loginId: string | null;
  storeItem: string;
  autoLogin: boolean;
  ciCredential: boolean;
  ciStored: boolean;
  policyNote: string;
  stored: boolean | null;
  user: string | null;
  ciSecrets: boolean | null;
  registerCommand: string;
}

interface ServiceSpec {
  label: string;
  loginId?: string;
  storeItem: string;
  autoLogin: boolean;
  ciCredential: boolean;
  ciStored?: boolean;
  policyNote: string;
}

function ciSecretNames(): Set<string> | null {
  try {
    const out = execFileSync("gh", ["secret", "list", "--repo", "uruhayato373/stats47", "--json", "name"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      windowsHide: true,
      timeout: 15000,
    });
    return new Set((JSON.parse(out) as Array<{ name: string }>).map((s) => s.name));
  } catch {
    return null;
  }
}

export function authCredentialRows() {
  return wrap(() => {
    const config = path.join(projectRoot(), ".claude/config/auth-credentials.json");
    const services = (JSON.parse(fs.readFileSync(config, "utf8")) as { services: Record<string, ServiceSpec> }).services;
    const local = storedAccounts(Object.values(services).map((s) => s.storeItem)) as
      | Record<string, { stored: boolean; user: string | null }>
      | null;
    const secrets = ciSecretNames();
    const mac = process.platform === "darwin";
    const rows = Object.entries(services).map(([id, s]): AuthCredentialRow => {
      const key = id.toUpperCase();
      const entry = local?.[s.storeItem];
      const loginArg = s.loginId ?? "<ログインID>";
      return {
        id,
        label: s.label,
        loginId: s.loginId ?? null,
        storeItem: s.storeItem,
        autoLogin: s.autoLogin,
        ciCredential: s.ciCredential,
        ciStored: s.ciStored === true,
        policyNote: s.policyNote,
        stored: entry ? entry.stored : null,
        user: entry?.user ?? null,
        ciSecrets: !(s.ciCredential || s.ciStored) || !secrets
          ? null
          : secrets.has(`STATS47_AUTH_${key}_USER`) && secrets.has(`STATS47_AUTH_${key}_PASSWORD`),
        registerCommand: mac
          ? `security add-generic-password -U -s ${s.storeItem} -a ${loginArg} -w`
          : `cmdkey /generic:${s.storeItem} /user:${loginArg} /pass`,
      };
    });
    return { rows, generatedAt: new Date().toISOString() };
  });
}
