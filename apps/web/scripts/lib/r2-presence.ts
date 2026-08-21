/**
 * R2 上のオブジェクトが存在するかを、**「判定できなかった」を「無い」に倒さずに**返す。
 *
 * ★なぜ切り出したか (2026-08-17 の実害):
 *   `generate-known-ranking-keys.ts` の存在確認が HEAD 1 回・例外も非 ok もすべて
 *   `false` に倒していた。2,164 件を並列 30 で叩くため、一時的な失敗 1 回が
 *   KNOWN / SITEMAP からのキー削除 = **本番 404 とサイトマップ脱落**になる。
 *   実際に `bath-soap-consumption-expenditure` が R2 も本番も 200 のまま KNOWN から
 *   外れ、その差分が commit されていた。
 *
 * ★この形 (「1 件ずつ存在を確かめて、生き残った分だけ書き出す」) を持つ生成器は
 *   すべて同じ穴を持ちうる。単一の bulk fetch + throw で書き込みごと中止する形
 *   (`generate-known-tag-keys` など) は構造的に安全なので、ここを使う必要はない。
 *
 * ★同型の生成器を全部点検した結果 (2026-08-21)。**穴は「生成器であること」ではなく
 *   「1 件ずつ存在を確かめて生き残りだけ書き出す」形から来る**:
 *
 *   | 生成器 | 形 | 一時障害で行が消えるか |
 *   |---|---|---|
 *   | generate-known-ranking-keys | 2,164 件の per-key HEAD | **あった → 本モジュールで是正** |
 *   | generate-known-tag-keys | 単一 bulk fetch + throw + 空ガード | なし |
 *   | generate-unpublished-blog-slugs | 同上 | なし |
 *   | generate-sitemap-blog-entries | bulk fetch 2 本 + throw + 空ガード | なし |
 *   | .claude/scripts/gsc/build-sitemap-ranking-keys.cjs | ネットワーク無し (KNOWN から導出) | なし |
 *   | sync-known-keys-from-remote.ts | 廃止済み remote D1 依存の死んだコード | 実行不能 (maintenance-debt baseline 登録済) |
 *
 *   人が気づくためのゲートは `sync-snapshots.yml` の「Open PR if keys changed」が持つ
 *   (キー数の増減を Step Summary と PR 本文に出し、減少に ⚠️ を付ける)。
 */

export type Presence = "present" | "absent" | "undetermined";

export interface CheckPresenceOptions {
  /** ネットワーク由来の失敗をリトライする回数 (404 はリトライしない — 答えが出ているため) */
  attempts?: number;
  /** テストから差し替えるための注入口。既定はグローバルの fetch */
  fetchImpl?: typeof fetch;
  /** テストから差し替えるための注入口。既定は setTimeout */
  sleep?: (ms: number) => Promise<void>;
}

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * 404 は答えなので即 `absent`。それ以外 (例外 / 5xx / 429) はリトライし、
 * 尽きたら `undetermined` を返す。**呼び出し側は undetermined が 1 件でも残ったら
 * 書き込みを中止すること** — 部分結果で上書きすると、判定できなかったキーが
 * 黙って一覧から消える。
 */
export async function checkPresence(
  url: string,
  options: CheckPresenceOptions = {},
): Promise<Presence> {
  const attempts = options.attempts ?? 3;
  const doFetch = options.fetchImpl ?? fetch;
  const sleep = options.sleep ?? defaultSleep;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const res = await doFetch(url, { method: "HEAD" });
      if (res.ok) return "present";
      if (res.status === 404) return "absent";
      // 5xx / 429 等は一時的な可能性があるのでリトライ対象
    } catch {
      // ネットワーク断も同様
    }
    if (attempt < attempts) await sleep(300 * attempt);
  }
  return "undetermined";
}
