/** Retry only read-only image inputs; permanent errors never become fabricated fallback data. */
export async function fetchPublicImageInput(
  url: string,
  fetchImpl: typeof fetch = fetch,
  wait: (ms: number) => Promise<void> = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
): Promise<string> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetchImpl(url, { cache: 'no-store', signal: AbortSignal.timeout(30_000) });
      if (!response.ok) throw Object.assign(new Error(`HTTP ${response.status}`), { permanent: response.status < 500 && response.status !== 429 });
      return await response.text();
    } catch (error) {
      if (attempt === 2 || (error as { permanent?: boolean }).permanent) throw new Error(`画像生成入力の取得に失敗しました: ${url}: ${String(error)}`);
      await wait(1000 * (attempt + 1));
    }
  }
  throw new Error('Unreachable');
}
