/**
 * SNS 投稿台帳の「1 id から全部たどれる」契約の検査 (純関数)。CLI は ../check-post-trace.mjs。
 *
 * error (PR を止める): 形 (posts.schema.json)・id の一意・_meta・カットオーバー以降の行の承認・
 *   Instagram の外部 ID・台本ファイル・素材の置き場・指標時系列が台帳に無い id を指していないか。
 * warning (件数を報告するだけ): 素材を Drive へ保全していない posted 行・missing の素材・
 *   台帳と結び付いていない指標行・外部 ID をたどれない posted 行。運用の遅れ (CI 投稿の素材を
 *   Mac で保全するまでの間など) で PR を止めないため。
 *
 * 契約の正典: .claude/rules/sns-content-standards.md §3
 */
import Ajv from "ajv";
import postsSchema from "../../../../data/sns/posts.schema.json" with { type: "json" };
import scriptsSchema from "../../../../data/sns/scripts.schema.json" with { type: "json" };

/**
 * この時刻以降に作られた行は承認の記録が必須 (2026-10-09 オーナー決定: 新規投稿は承認必須)。
 * それより前の行は承認の記録を持たないので approval.state = "unrecorded" を許す。
 */
export const TRACE_CUTOVER = "2026-10-10T00:00:00.000Z";

const ajv = new Ajv({ allErrors: true });
const validateLedgerShape = ajv.compile(postsSchema);
const validateScriptShape = ajv.compile(scriptsSchema);

const isLive = (row) => !row.deleted_at && row.status !== "deleted";

/**
 * @param {object} input
 * @param {{_meta: object, posts: object[]}} input.ledger 台帳 (posts.json の中身)
 * @param {(scriptPath: string) => object | null} input.readScript 台本 JSON を読む (無ければ null)
 * @param {{date: string, sns_post_id: string, platform: string}[]} input.metricRows 指標時系列の全行
 * @param {(row: object) => string | null} input.externalIdOf store の externalIdOf
 * @param {string} [input.cutover]
 */
export function checkPostTrace({ ledger, readScript, metricRows, externalIdOf, cutover = TRACE_CUTOVER }) {
  const errors = [];
  const warnings = [];
  const posts = Array.isArray(ledger?.posts) ? ledger.posts : [];

  if (!validateLedgerShape(ledger)) {
    for (const e of validateLedgerShape.errors) errors.push(`schema ${e.dataPath || "/"} ${e.message}`);
  }

  const ids = new Set();
  let maxId = 0;
  for (const row of posts) {
    if (ids.has(row.id)) errors.push(`id=${row.id} が重複しています`);
    ids.add(row.id);
    maxId = Math.max(maxId, row.id || 0);
  }
  if (ledger?._meta?.count !== posts.length) errors.push(`_meta.count=${ledger?._meta?.count} が行数 ${posts.length} と違います`);
  if (!(ledger?._meta?.nextId > maxId)) errors.push(`_meta.nextId=${ledger?._meta?.nextId} が最大 id ${maxId} 以下です`);

  const summary = {
    posts: posts.length,
    approval: {},
    externalId: { traced: 0, untraced: 0 },
    assets: { archivedRows: 0, missingAssets: 0, notArchivedPostedRows: 0 },
    metrics: { linked: 0, unlinked: 0, dangling: 0 },
  };

  for (const row of posts) {
    const tag = `id=${row.id} (${row.platform})`;
    const state = row.approval?.state ?? "(なし)";
    summary.approval[state] = (summary.approval[state] ?? 0) + 1;
    const isNew = (row.created_at ?? "") >= cutover;

    if (isNew && state === "unrecorded") errors.push(`${tag}: カットオーバー以降の行に unrecorded は使えません`);
    if (isNew && ["scheduled", "posted"].includes(row.status) && isLive(row) && state !== "approved") {
      errors.push(`${tag}: 承認されていない投稿が ${row.status} になっています (approval=${state})`);
    }

    // note は note catalog が正本なので外部 ID・素材の集計に含めない (2026-10-09 オーナー決定)
    const live = isLive(row) && row.status === "posted" && row.platform !== "note";
    if (live) {
      if (externalIdOf(row)) summary.externalId.traced++;
      else summary.externalId.untraced++;
      if (isNew && row.platform === "instagram" && !row.external_id) {
        errors.push(`${tag}: Instagram の posted 行に external_id (media_id) がありません`);
      }
    }

    if (row.script_path) {
      const script = readScript(row.script_path);
      if (!script) errors.push(`${tag}: script_path ${row.script_path} がありません`);
      else if (!validateScriptShape(script)) {
        errors.push(`${tag}: 台本の形が違います ${ajv.errorsText(validateScriptShape.errors)}`);
      } else if (script.post_id !== row.id) {
        errors.push(`${tag}: 台本の post_id=${script.post_id} が行の id と違います`);
      }
    }

    if (Array.isArray(row.assets)) {
      const seen = new Set();
      const prefix = `SNS素材/${row.platform}/${row.id}/`;
      for (const asset of row.assets) {
        const key = `${asset.role}#${asset.order}`;
        if (seen.has(key)) errors.push(`${tag}: 素材 ${key} が重複しています`);
        seen.add(key);
        if (asset.drive_path && !asset.drive_path.startsWith(prefix)) {
          errors.push(`${tag}: 素材の置き場 ${asset.drive_path} が ${prefix} の外です`);
        }
        if (asset.state === "missing") summary.assets.missingAssets++;
      }
      if (row.assets.some((a) => a.state === "archived")) summary.assets.archivedRows++;
    } else if (live) {
      summary.assets.notArchivedPostedRows++;
    }
  }

  for (const m of metricRows) {
    if (!m.sns_post_id) summary.metrics.unlinked++;
    else if (ids.has(Number(m.sns_post_id))) summary.metrics.linked++;
    else {
      summary.metrics.dangling++;
      if (m.date >= cutover.slice(0, 10)) {
        errors.push(`指標 ${m.date} ${m.platform}: sns_post_id=${m.sns_post_id} が台帳にありません`);
      }
    }
  }

  if (summary.assets.notArchivedPostedRows) {
    warnings.push(`素材を Drive へ保全していない posted 行: ${summary.assets.notArchivedPostedRows} 件 (archive-sns-assets.mjs)`);
  }
  if (summary.assets.missingAssets) warnings.push(`取得元が無く保全できなかった素材: ${summary.assets.missingAssets} 件`);
  if (summary.externalId.untraced) warnings.push(`外部 ID をたどれない posted 行: ${summary.externalId.untraced} 件`);
  if (summary.metrics.unlinked) warnings.push(`台帳と結び付いていない指標行: ${summary.metrics.unlinked} 件`);
  if (summary.metrics.dangling) warnings.push(`台帳に無い id を指す指標行 (カットオーバー前): ${summary.metrics.dangling} 件`);

  return { errors, warnings, summary };
}
