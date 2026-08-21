/**
 * adsense-ad-unit-walk — AdSense の ad client → ad unit を辿る**唯一の実装**。
 * ---------------------------------------------------------------------------
 * ★なぜ 1 箇所に集めるか (2026-08-21): この走査は元々 2 箇所に複製されていた。
 *   - `.claude/scripts/metrics/fetch-adsense-snapshot.mjs` (週次 snapshot)
 *   - `.claude/scripts/google-admin/audit-adsense.mjs` (週次 audit)
 *   2026-08-04 に前者だけ「1 client の失敗で inventory 全体を落とさない」修正が入り、
 *   後者は素通しのままだった。結果、**同じ資格情報で snapshot は成功しているのに
 *   audit は毎回「AdSense ad units: 0 件 (error)」**という食い違いが 2 週間以上続き、
 *   原因を credential 側だと誤診する材料になった。片方だけ直せる形が原因なので、
 *   走査そのものを共有し、**行の形だけを呼び出し側が決める**。
 *
 * 契約:
 *   - ad client を 1 つ落としても他は続ける (`skippedClients` に理由を残す)。
 *     この口座は content 用 `ca-pub-*` に加えて AdSense for Search の `partner-pub-*` を
 *     持ち、後者は広告ユニットの概念が無いため `adunits.list` が NOT_FOUND を返す。
 *   - **全 client が失敗したときだけ throw** する。0 件を「ユニットが無い」と誤読させない。
 *   - 個別ユニットの `getAdcode` 失敗はそのユニットを落とす理由にしない
 *     (native ad unit は adcode を持たないので正常系でも通る)。
 *   - ページングを辿る。
 *
 * テスト: .claude/scripts/metrics/__tests__/adsense-ad-unit-walk.test.mjs
 */

/**
 * @param {object} adsense googleapis の adsense client (fake を注入できる)
 * @param {string} account `accounts/pub-XXXX`
 * @param {{onAdCodeError?: (unit: object, error: unknown) => void,
 *          onClientSkipped?: (client: object, reason: string) => void}} [hooks]
 *        ログの出し方は呼び出し側で変わる (snapshot は stderr に出す / audit は出さない)。
 * @returns {Promise<{entries: Array<{unit: object, adCode: string|null}>, skippedClients: string[]}>}
 */
export async function collectAdUnitEntries(adsense, account, { onAdCodeError, onClientSkipped } = {}) {
  const entries = [];
  const skippedClients = [];

  const clientsRes = await adsense.accounts.adclients.list({ parent: account });
  const adClients = (clientsRes.data.adClients ?? []).filter((c) => c.name);

  for (const client of adClients) {
    try {
      let pageToken;
      do {
        const res = await adsense.accounts.adclients.adunits.list({
          parent: client.name,
          pageSize: 100,
          ...(pageToken ? { pageToken } : {}),
        });
        for (const unit of res.data.adUnits ?? []) {
          let adCode = null;
          if (unit?.name) {
            try {
              const codeRes = await adsense.accounts.adclients.adunits.getAdcode({ name: unit.name });
              adCode = codeRes.data.adCode ?? null;
            } catch (e) {
              onAdCodeError?.(unit, e);
            }
          }
          entries.push({ unit, adCode });
        }
        pageToken = res.data.nextPageToken || undefined;
      } while (pageToken);
    } catch (e) {
      const reason = e?.message || String(e);
      onClientSkipped?.(client, reason);
      skippedClients.push(`${client.name}: ${reason.slice(0, 120)}`);
    }
  }

  if (adClients.length > 0 && skippedClients.length === adClients.length) {
    throw new Error(
      `全 ${adClients.length} 件の ad client で adunits.list に失敗した: ${skippedClients.join(" / ")}`,
    );
  }

  return { entries, skippedClients };
}
