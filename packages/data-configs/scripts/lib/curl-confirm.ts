import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);
/** curl の終了コード: 証明書の検証失敗 (期限切れ・自己署名など) */
const CURL_CERT_ERRORS = new Set([51, 60]);

async function status(url: string, userAgent: string, insecure: boolean): Promise<number> {
  // -b "" で Cookie を有効にする。pref.aichi.jp は Cookie が無いと同じ URL へ転送し続ける (2026-10-01 実測)
  const args = ["-sS", "-o", "/dev/null", "-w", "%{http_code}", "-L", "--max-time", "30", "-b", "", "-A", userAgent, url];
  const { stdout } = await run("curl", insecure ? ["-k", ...args] : args);
  return Number(stdout.trim());
}

/**
 * link-check-core の confirmFn 用。fetch が届かなかった URL を curl で 1 回だけ確かめ、HTTP status を返す。
 * 証明書の期限切れはリンク切れではない (ページは在る) ので、証明書を検証せずに到達だけ確かめて警告を出す
 * (www.pref.nara.jp の証明書が 2026-09-13 に失効。2026-10-01 実測)。curl も届かなければ null。
 */
export async function curlStatus(url: string, userAgent = "stats47-link-check/2.0"): Promise<number | null> {
  try {
    const code = await status(url, userAgent, false);
    return Number.isInteger(code) && code > 0 ? code : null;
  } catch (error) {
    const exit = (error as { code?: number }).code;
    if (exit === undefined || !CURL_CERT_ERRORS.has(exit)) return null;
    try {
      const code = await status(url, userAgent, true);
      if (Number.isInteger(code) && code > 0) console.warn(`[cert] ${url}: 証明書の検証に失敗 (curl exit ${exit})。ページは HTTP ${code} で到達する`);
      return Number.isInteger(code) && code > 0 ? code : null;
    } catch {
      return null;
    }
  }
}
