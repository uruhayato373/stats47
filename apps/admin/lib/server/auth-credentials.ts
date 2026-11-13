import "server-only";

import fs from "node:fs";
import path from "node:path";

import { storedAccounts } from "../../../../.claude/scripts/measurement/credential-store.mjs";
import { projectRoot } from "./project-root";
import { wrap } from "./state-io";

/**
 * ログインと資格情報の一覧 (読み取り専用)。正本は .claude/config/auth-credentials.json。
 * ページを開くたびに、この PC の資格情報ストア (有無と ID だけ) を読む (2026-10-01 オーナー判断)。
 * 読み口は credential-store.mjs の storedAccounts だけで、パスワードを読まないコマンド (cmdkey /list・security -w なし) に限る。
 * ログインは Mac だけが持ち、CI の Secrets には置かないので、Secrets は読まない (2026-10-20 オーナー判断)。
 */
export interface AuthCredentialRow {
  id: string;
  label: string;
  /** 正本のログイン ID。未確定の service は null */
  loginId: string | null;
  storeItem: string;
  autoLogin: boolean;
  policyNote: string;
  stored: boolean | null;
  user: string | null;
  registerCommand: string;
}

interface ServiceSpec {
  label: string;
  loginId?: string;
  storeItem: string;
  autoLogin: boolean;
  policyNote: string;
}

export function authCredentialRows() {
  return wrap(() => {
    const config = path.join(projectRoot(), ".claude/config/auth-credentials.json");
    const services = (JSON.parse(fs.readFileSync(config, "utf8")) as { services: Record<string, ServiceSpec> }).services;
    const local = storedAccounts(Object.values(services).map((s) => s.storeItem)) as
      | Record<string, { stored: boolean; user: string | null }>
      | null;
    const mac = process.platform === "darwin";
    const rows = Object.entries(services).map(([id, s]): AuthCredentialRow => {
      const entry = local?.[s.storeItem];
      const loginArg = s.loginId ?? "<ログインID>";
      return {
        id,
        label: s.label,
        loginId: s.loginId ?? null,
        storeItem: s.storeItem,
        autoLogin: s.autoLogin,
        policyNote: s.policyNote,
        stored: entry ? entry.stored : null,
        user: entry?.user ?? null,
        registerCommand: mac
          ? `security add-generic-password -U -s ${s.storeItem} -a ${loginArg} -w`
          : `cmdkey /generic:${s.storeItem} /user:${loginArg} /pass`,
      };
    });
    return { rows, generatedAt: new Date().toISOString() };
  });
}
