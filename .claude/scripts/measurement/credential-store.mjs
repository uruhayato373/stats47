/**
 * credential-store.mjs — 計測ログインの ID / パスワード / TOTP 秘密鍵を OS の資格情報ストアから読む唯一の入口。
 *
 * Mac = キーチェーン (`security`)、Windows = 資格情報マネージャー (Win32 CredRead を PowerShell 5.1 から呼ぶ。
 * 追加モジュール不要)。CI などそれ以外の OS では常に null (CI はパスワードを持たず、Secret のセッションだけを使う)。
 * 同じサービス名を両 OS で使うので、スクリプト側は OS を意識しない。
 *
 * サービス名 (オーナーが各マシンで 1 回だけ登録する。値をログ・引数・ファイルへ出さない):
 *   stats47-measurement-<source>        アカウント = ログイン ID、パスワード = パスワード
 *   stats47-measurement-<source>-totp   パスワード = 認証アプリ用の TOTP 秘密鍵 (base32)。2FA が無いサービスは登録しない
 *
 * 登録コマンド:
 *   Mac:     security add-generic-password -s stats47-measurement-a8 -a <ログインID> -w          (-w 値なしで対話入力)
 *            security add-generic-password -s stats47-measurement-kdp-totp -a totp -w
 *   Windows: cmdkey /generic:stats47-measurement-a8 /user:<ログインID> /pass                    (/pass 値なしで対話入力)
 *            cmdkey /generic:stats47-measurement-kdp-totp /user:totp /pass
 *
 * 守ること: この関数の戻り値をログへ出さない。読み出しの失敗は理由を問わず null (登録なしと同じ扱い)。
 * 資格情報ストアを直接呼ぶコードをこのファイルの外に書かない (`credential-store-contract.test.mjs` が止める)。
 */
import { createHmac } from 'node:crypto';
import { execFileSync } from 'node:child_process';

export const SERVICE_PREFIX = 'stats47-measurement-';

export function serviceName(source, kind = 'login') {
  return `${SERVICE_PREFIX}${source}${kind === 'totp' ? '-totp' : ''}`;
}

/** `security find-generic-password` の属性出力からアカウント名を取り出す。 */
export function parseKeychainAccount(text) {
  const m = /"acct"<blob>="([^"]*)"/.exec(text);
  return m ? m[1] : null;
}

function readMacKeychain(service, exec) {
  const run = (extra) => exec('security', ['find-generic-password', '-s', service, ...extra],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  try {
    const user = parseKeychainAccount(run([]));
    const password = run(['-w']).replace(/\n$/, '');
    return user && password ? { user, password } : null;
  } catch { return null; }
}

// 対象名は環境変数で渡す (コマンド文字列へ埋め込まない)。出力は base64 の JSON 1 行で、文字コードの取り違えを避ける。
export const WINDOWS_CRED_READ_SCRIPT = `
$ErrorActionPreference = 'Stop'
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public static class Stats47Cred {
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
  public struct CREDENTIAL {
    public int Flags; public int Type; public string TargetName; public string Comment;
    public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
    public int CredentialBlobSize; public IntPtr CredentialBlob; public int Persist;
    public int AttributeCount; public IntPtr Attributes; public string TargetAlias; public string UserName;
  }
  [DllImport("advapi32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
  public static extern bool CredRead(string target, int type, int flags, out IntPtr cred);
  [DllImport("advapi32.dll")]
  public static extern void CredFree(IntPtr cred);
}
"@
$ptr = [IntPtr]::Zero
if (-not [Stats47Cred]::CredRead($env:STATS47_CRED_TARGET, 1, 0, [ref]$ptr)) { exit 3 }
try {
  $c = [Runtime.InteropServices.Marshal]::PtrToStructure($ptr, [type][Stats47Cred+CREDENTIAL])
  $pw = if ($c.CredentialBlobSize -gt 0) { [Runtime.InteropServices.Marshal]::PtrToStringUni($c.CredentialBlob, $c.CredentialBlobSize / 2) } else { '' }
  $json = @{ user = $c.UserName; password = $pw } | ConvertTo-Json -Compress
  [Console]::Out.Write([Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($json)))
} finally { [Stats47Cred]::CredFree($ptr) }
`;

export function parseWindowsCredOutput(stdout) {
  try {
    const { user, password } = JSON.parse(Buffer.from(String(stdout).trim(), 'base64').toString('utf8'));
    return user && password ? { user, password } : null;
  } catch { return null; }
}

function readWindowsCredential(service, exec) {
  try {
    const out = exec('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', WINDOWS_CRED_READ_SCRIPT],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], env: { ...process.env, STATS47_CRED_TARGET: service }, windowsHide: true });
    return parseWindowsCredOutput(out);
  } catch { return null; }
}

/** 1 つのサービス名を読む。登録なし・読めない・未対応 OS はすべて null。 */
export function readSecret(service, { platform = process.platform, exec = execFileSync } = {}) {
  if (platform === 'darwin') return readMacKeychain(service, exec);
  if (platform === 'win32') return readWindowsCredential(service, exec);
  return null;
}

/** ログイン用の資格情報。TOTP 秘密鍵が登録されていれば totpSecret に入れる (無ければ null)。 */
export function readCredential(source, options = {}) {
  const login = readSecret(serviceName(source), options);
  if (!login) return null;
  const totp = readSecret(serviceName(source, 'totp'), options);
  return { user: login.user, password: login.password, totpSecret: totp?.password ?? null };
}

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function decodeBase32(text) {
  const clean = String(text).toUpperCase().replace(/[\s=-]/g, '');
  let bits = 0;
  let value = 0;
  const bytes = [];
  for (const ch of clean) {
    const index = BASE32.indexOf(ch);
    if (index < 0) throw new Error('invalid_base32');
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

/** RFC 6238 の TOTP。認証アプリと同じ既定 (SHA-1・30 秒・6 桁)。 */
export function totpCode(secret, { time = Date.now(), step = 30, digits = 6, algorithm = 'sha1' } = {}) {
  const key = Buffer.isBuffer(secret) ? secret : decodeBase32(secret);
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(time / 1000 / step)));
  const hmac = createHmac(algorithm, key).update(counter).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary = ((hmac[offset] & 0x7f) << 24) | (hmac[offset + 1] << 16) | (hmac[offset + 2] << 8) | hmac[offset + 3];
  return String(binary % 10 ** digits).padStart(digits, '0');
}
