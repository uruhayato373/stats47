/**
 * diff-push-r2 が「R2 にある object と中身が同じファイル」を送らないための判定 (純関数)。
 *
 * 手元の manifest (size と mtime) だけで送る・送らないを決めると、CI の runner は毎回空の manifest で
 * 始まるので、中身が同じでも全件を送り直す (2026-11-02 の sync-snapshots run 41406400636 で 14,321 件)。
 * manifest を run の間で持ち越しても、CI は毎回ファイルを作り直すので mtime が必ず新しくなり送ってしまう。
 * そこで R2 の一覧 (ListObjectsV2) が返す size と ETag を、手元のファイルの size と MD5 に照合する。
 *
 * 照合は「一致したものだけ送らない」向きにしか働かない。一覧を取れない・ETag が MD5 の形でない・
 * 一致しない、のどれでも送る側へ倒れるので、照合が効かなくなっても従来どおりの全件送りに戻るだけで、
 * 送るべきファイルを送らないことは起きない (MD5 が偶然一致する場合を除く)。
 *
 * ETag と MD5 の関係の出典 (2026-11-14 閲覧。ページの最終更新は 2026-07-29):
 * https://developers.cloudflare.com/r2/objects/upload-objects/#etags
 * 「multipart で書いた object の ETag は 1 回の PUT で書いた object のものと異なり、各 part の ETag は
 * その part の MD5、完成した object の ETag は末尾に - と part 数が付く」。diff-push-r2 は 1 回の
 * PutObject で書くので、R2 の ETag は本文の MD5 になる。
 */

export interface RemoteObjectSummary {
  size: number;
  /** ListObjectsV2 が返す ETag (引用符つきの場合がある) */
  etag: string;
}

const MD5_HEX = /^[0-9a-f]{32}$/;

/** ETag を MD5 の 16 進 32 桁として読む。その形でなければ (multipart の `<hash>-<part 数>` など) null */
function etagAsMd5(etag: string): string | null {
  const bare = etag.replace(/^"|"$/g, "").toLowerCase();
  return MD5_HEX.test(bare) ? bare : null;
}

/**
 * R2 を一覧する prefix を決める。`--prefix` があればそれだけ。無ければ送る候補の最上位ディレクトリごとに
 * 一覧し、候補の無い領域 (ISR のキャッシュなど) まで bucket 全体を一覧しない。
 */
export function remoteListPrefixes(prefix: string, keys: readonly string[]): string[] {
  if (prefix) return [prefix];
  const tops = new Set<string>();
  for (const key of keys) {
    const slash = key.indexOf("/");
    tops.add(slash === -1 ? key : key.slice(0, slash + 1));
  }
  return [...tops].sort();
}

/**
 * 送る候補を「R2 と中身が同じ (送らない)」と「送る」に分ける。
 * 中身のハッシュはサイズが一致したファイルだけ計算する (md5Of はファイルを読むので)。
 */
export function splitUnchangedOnRemote<T extends { key: string; size: number }>(
  candidates: readonly T[],
  remote: ReadonlyMap<string, RemoteObjectSummary>,
  md5Of: (file: T) => string,
): { toUpload: T[]; unchanged: T[] } {
  const toUpload: T[] = [];
  const unchanged: T[] = [];
  for (const file of candidates) {
    const found = remote.get(file.key);
    const remoteMd5 = found && found.size === file.size ? etagAsMd5(found.etag) : null;
    if (remoteMd5 !== null && remoteMd5 === md5Of(file).toLowerCase()) unchanged.push(file);
    else toUpload.push(file);
  }
  return { toUpload, unchanged };
}
