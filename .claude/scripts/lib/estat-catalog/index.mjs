// e-Stat カタログの差分 plan・索引 upsert・manifest 更新 (純粋関数)。
// ネットワーク・fs に触れない。テスト: .claude/scripts/lib/__tests__/estat-catalog.test.mjs

/** manifest.failed の再試行上限。到達したら quarantined へ移す */
export const MAX_ATTEMPTS = 5;

/**
 * 今回の L1 クロールと既存索引を突き合わせ、getMetaInfo すべき statsDataId を決める。
 *
 * @param {object[]} existingTables 既存 index/tables/<statCode>.json を統合した現在の行
 * @param {Map<string, object>} freshRows 今回の L1 (getStatsList 全 collectArea) を正規化した行。key=statsDataId
 * @param {object} manifest 直前の manifest ({ failed, quarantined })
 * @param {number[]} metaScope meta を取る collectArea (例 [2,3])
 * @param {number} maxMeta 今回 fetch する上限件数
 */
export function buildPlan({ existingTables, freshRows, manifest, metaScope, maxMeta = Infinity }) {
  const existingById = new Map(existingTables.map((t) => [t.statsDataId, t]));
  const quarantined = new Set((manifest.quarantined ?? []).map((q) => q.id));
  const failedById = new Map((manifest.failed ?? []).map((f) => [f.id, f]));

  const newRows = [];
  const updatedRows = [];
  const seenIds = new Set();

  for (const [id, row] of freshRows) {
    seenIds.add(id);
    const existing = existingById.get(id);
    if (!existing || existing.removedAt) {
      newRows.push(row);
    } else if (!existing.meta || existing.meta.sourceUpdatedDate !== row.updatedDate) {
      updatedRows.push(row);
    }
  }

  const removedIds = [...existingById.keys()].filter((id) => !seenIds.has(id));

  const queuedIds = new Set([...newRows, ...updatedRows].map((r) => r.statsDataId));
  const retryRows = [...failedById.entries()]
    .filter(([id, f]) => !quarantined.has(id) && f.attempts < MAX_ATTEMPTS && !queuedIds.has(id))
    .sort((a, b) => a[1].attempts - b[1].attempts)
    .map(([id]) => freshRows.get(id))
    .filter(Boolean);

  const inScope = (row) => metaScope.includes(Number(row.collectArea));
  const toFetchMeta = [...newRows, ...updatedRows, ...retryRows].filter(inScope).slice(0, maxMeta);

  return { newRows, updatedRows, removedIds, retryRows, toFetchMeta };
}

/** meta 取得結果 (成功/未実施/既存流用) を表行にマージする */
export function upsertTableRow(existingRow, freshRow, metaResult) {
  const row = { ...freshRow, removedAt: null };
  if (metaResult?.ok) {
    row.meta = metaResult.meta;
  } else if (existingRow?.meta) {
    row.meta = existingRow.meta;
  } else {
    row.meta = null;
  }
  return row;
}

/** L1 から消えた表に removedAt を付ける (meta は保持し削除しない) */
export function markRemoved(existingRow, now) {
  return { ...existingRow, removedAt: now };
}

export function recordFetchSuccess(manifest, id) {
  return { ...manifest, failed: (manifest.failed ?? []).filter((f) => f.id !== id) };
}

export function recordFetchFailure(manifest, id, error, now) {
  const failed = [...(manifest.failed ?? [])];
  const quarantined = [...(manifest.quarantined ?? [])];
  const idx = failed.findIndex((f) => f.id === id);
  const attempts = (idx >= 0 ? failed[idx].attempts : 0) + 1;
  const lastError = String(error).slice(0, 200);
  if (attempts >= MAX_ATTEMPTS) {
    if (idx >= 0) failed.splice(idx, 1);
    quarantined.push({ id, attempts, lastError, lastAttemptAt: now });
    return { ...manifest, failed, quarantined };
  }
  const entry = { id, attempts, lastError, lastAttemptAt: now };
  if (idx >= 0) failed[idx] = entry;
  else failed.push(entry);
  return { ...manifest, failed, quarantined };
}

/** 索引行から調査 (statCode) 単位の名簿を集計する */
export function computeSurveysSummary(tables) {
  const bySt = new Map();
  for (const t of tables) {
    if (t.removedAt || !t.statCode) continue;
    if (!bySt.has(t.statCode)) {
      bySt.set(t.statCode, {
        statCode: t.statCode,
        statName: t.statName,
        govOrg: t.govOrg,
        tablesByCollectArea: {},
        metaFetched: 0,
      });
    }
    const s = bySt.get(t.statCode);
    const ca = String(t.collectArea ?? "unknown");
    s.tablesByCollectArea[ca] = (s.tablesByCollectArea[ca] ?? 0) + 1;
    if (t.meta) s.metaFetched++;
  }
  return [...bySt.values()].sort((a, b) => a.statCode.localeCompare(b.statCode));
}
