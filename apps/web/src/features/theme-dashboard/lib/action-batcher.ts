/**
 * サーバーアクションの呼び出しを束ねる。
 *
 * ブラウザはサーバーアクションを 1 件ずつ順番に処理する。テーマページでは指標カード 24 枚が
 * 「選択県」と「全国」の時系列を 1 件ずつ要求し、48 件の POST が一列に並んで最後のカードの
 * 描画まで約 19 秒かかっていた (2026-09-25 本番実測: 48 件・重なり 0 件)。
 *
 * 同じタイミング (同じ描画で走った effect) の要求を 1 回のバッチアクションにまとめ、
 * サーバー側で並列に解決する。同じ引数の要求は 1 回だけ送り、結果を使い回す。
 */

/** 1 回のアクションで送る上限。これを超える分は次のバッチに分ける (サーバーの入力検査と同じ値) */
export const MAX_BATCH_SIZE = 60;

interface Pending<Req, Res> {
  request: Req;
  resolve: (result: Res) => void;
  reject: (error: unknown) => void;
}

export function createActionBatcher<Req, Res>(
  runBatch: (requests: Req[]) => Promise<Res[]>,
  keyOf: (request: Req) => string,
): (request: Req) => Promise<Res> {
  let queue: Pending<Req, Res>[] = [];
  let scheduled = false;
  const requested = new Map<string, Promise<Res>>();

  async function flush() {
    const pending = queue;
    queue = [];
    scheduled = false;
    for (let start = 0; start < pending.length; start += MAX_BATCH_SIZE) {
      const chunk = pending.slice(start, start + MAX_BATCH_SIZE);
      try {
        const results = await runBatch(chunk.map((p) => p.request));
        chunk.forEach((p, i) => p.resolve(results[i]));
      } catch (error) {
        chunk.forEach((p) => p.reject(error));
      }
    }
  }

  return (request) => {
    const key = keyOf(request);
    const existing = requested.get(key);
    if (existing) return existing;
    const promise = new Promise<Res>((resolve, reject) => {
      queue.push({ request, resolve, reject });
      if (!scheduled) {
        scheduled = true;
        setTimeout(flush, 0);
      }
    });
    requested.set(key, promise);
    // 失敗した要求は覚えておかない (次の描画で取り直せるように)
    promise.catch(() => requested.delete(key));
    return promise;
  };
}
