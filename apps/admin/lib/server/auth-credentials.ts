import "server-only";

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { storedAccounts } from "../../../../.claude/scripts/measurement/credential-store.mjs";
import { projectRoot } from "./project-root";
import { cached, wrap } from "./state-io";

/**
 * ログインと資格情報の一覧 (読み取り専用)。正本は .claude/config/auth-credentials.json。
 * この PC の登録は OS の資格情報ストアから「有無と ID」だけを読み、CI は Secrets の名前だけを見る。
 * パスワードはどこからも取り出さない。
 */
export interface AuthCredentialRow {
  id: string;
  label: string;
  storeItem: string;
  autoLogin: boolean;
  ciCredential: boolean;
  policyNote: string;
  stored: boolean | null;
  user: string | null;
  ciSecrets: boolean | null;
  registerCommand: string;
}

interface ServiceSpec {
  label: string;
  storeItem: string;
  autoLogin: boolean;
  ciCredential: boolean;
  policyNote: string;
}

const CI_SECRETS_TTL_MS = 10 * 60 * 1000;

function ciSecretNames(): Set<string> | null {
  return cached("auth-credentials:ci-secrets", CI_SECRETS_TTL_MS, () => {
    try {
      const out = execFileSync("gh", ["secret", "list", "--repo", "uruhayato373/stats47", "--json", "name"], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
        windowsHide: true,
      });
      return new Set((JSON.parse(out) as Array<{ name: string }>).map((s) => s.name));
    } catch {
      return null;
    }
  });
}

function registerCommand(storeItem: string): string {
  return process.platform === "darwin"
    ? `security add-generic-password -s ${storeItem} -a <ログインID> -w`
    : `cmdkey /generic:${storeItem} /user:<ログインID> /pass`;
}

export function authCredentialRows() {
  return wrap((): AuthCredentialRow[] => {
    const config = path.join(projectRoot(), ".claude/config/auth-credentials.json");
    const services = (JSON.parse(fs.readFileSync(config, "utf8")) as { services: Record<string, ServiceSpec> }).services;
    const items = Object.values(services).map((s) => s.storeItem);
    const local = storedAccounts(items) as Record<string, { stored: boolean; user: string | null }> | null;
    const secrets = ciSecretNames();
    return Object.entries(services).map(([id, s]) => {
      const key = id.toUpperCase();
      return {
        id,
        label: s.label,
        storeItem: s.storeItem,
        autoLogin: s.autoLogin,
        ciCredential: s.ciCredential,
        policyNote: s.policyNote,
        stored: local ? local[s.storeItem].stored : null,
        user: local ? local[s.storeItem].user : null,
        ciSecrets: !s.ciCredential || !secrets
          ? null
          : secrets.has(`STATS47_AUTH_${key}_USER`) && secrets.has(`STATS47_AUTH_${key}_PASSWORD`),
        registerCommand: registerCommand(s.storeItem),
      };
    });
  });
}
