import "server-only";

import fs from "node:fs";
import path from "node:path";

import { projectRoot } from "./project-root";
import { wrap } from "./state-io";

/**
 * ログインと資格情報の一覧 (読み取り専用)。正本は .claude/config/auth-credentials.json。
 * 登録状況は .claude/scripts/measurement/credential-status.mjs が書いたファイルを読む
 * (`npm run admin` の前に自動実行。管理画面は子プロセスを起動しない)。パスワードはどこにも無い。
 */
export interface AuthCredentialRow {
  id: string;
  label: string;
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
  storeItem: string;
  autoLogin: boolean;
  ciCredential: boolean;
  ciStored?: boolean;
  policyNote: string;
}

interface CredentialStatus {
  generatedAt: string;
  platform: string;
  local: Record<string, { stored: boolean; user: string | null }> | null;
  ciSecrets: string[] | null;
}

const STATUS_PATH = ".local/authenticated-measurement/credential-status.json";

function readStatus(root: string): CredentialStatus | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, STATUS_PATH), "utf8")) as CredentialStatus;
  } catch {
    return null;
  }
}

export function authCredentialRows() {
  return wrap(() => {
    const root = projectRoot();
    const config = path.join(root, ".claude/config/auth-credentials.json");
    const services = (JSON.parse(fs.readFileSync(config, "utf8")) as { services: Record<string, ServiceSpec> }).services;
    const status = readStatus(root);
    const secrets = status?.ciSecrets ? new Set(status.ciSecrets) : null;
    const mac = (status?.platform ?? process.platform) === "darwin";
    const rows = Object.entries(services).map(([id, s]): AuthCredentialRow => {
      const key = id.toUpperCase();
      const local = status?.local?.[s.storeItem];
      return {
        id,
        label: s.label,
        storeItem: s.storeItem,
        autoLogin: s.autoLogin,
        ciCredential: s.ciCredential,
        ciStored: s.ciStored === true,
        policyNote: s.policyNote,
        stored: local ? local.stored : null,
        user: local?.user ?? null,
        ciSecrets: !(s.ciCredential || s.ciStored) || !secrets
          ? null
          : secrets.has(`STATS47_AUTH_${key}_USER`) && secrets.has(`STATS47_AUTH_${key}_PASSWORD`),
        registerCommand: mac
          ? `security add-generic-password -s ${s.storeItem} -a <ログインID> -w`
          : `cmdkey /generic:${s.storeItem} /user:<ログインID> /pass`,
      };
    });
    return { rows, generatedAt: status?.generatedAt ?? null };
  });
}
