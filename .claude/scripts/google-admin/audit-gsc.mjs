/**
 * audit-gsc — GSC property の存在・権限を **API (read-only)** で照合する。
 *
 * 正典: ./README.md「mutation前のidentity確認」。
 * 日常データ取得は API 優先 — GSC 側の確認は service account (既存・webmasters.readonly) で足り、
 * ブラウザは GA4 Admin UI (リンク作成側) だけに使う。
 * owner/user・change of address・bulk export 等の変更 API は呼ばない (README「denylist」)。
 */
import { GSC_PROPERTY } from "../lib/site-config.cjs";
import { createWebmastersClient } from "../lib/google-client.cjs";

export { GSC_PROPERTY };

/** sites.list (read-only) で property の存在と permissionLevel を返す。 */
export async function auditGscProperty() {
  try {
    const webmasters = createWebmastersClient();
    const res = await webmasters.sites.list({});
    const sites = res.data.siteEntry ?? [];
    const target = sites.find((s) => s.siteUrl === GSC_PROPERTY);
    return {
      status: "ok",
      property: GSC_PROPERTY,
      present: !!target,
      permissionLevel: target?.permissionLevel ?? null,
      siteCount: sites.length,
    };
  } catch (e) {
    return { status: "error", property: GSC_PROPERTY, present: null, error: String(e.message ?? e).slice(0, 200) };
  }
}
