import 'server-only';

import {
  infraHistoryKeys,
  parseInfraHistorySummary,
  type InfraHistoryManifest,
  type InfraHistorySummary,
  type InfraNetworkKey,
} from '@stats47/gis/infra-history';
import { fetchFromR2AsJson } from '@stats47/r2-storage/server';

/** summary.json を読む。読めない・形が合わないときは null (画面は欠損として表示する) */
export async function loadInfraHistorySummary(
  network: InfraNetworkKey,
): Promise<InfraHistorySummary | null> {
  try {
    return parseInfraHistorySummary(
      await fetchFromR2AsJson<unknown>(infraHistoryKeys.summary(network)),
      network,
    );
  } catch {
    return null;
  }
}

/** manifest のうち画面に出す項目 (県帰属・保存則・年不明の除外) だけを確かめて返す */
export type InfraHistoryEvidence = Pick<
  InfraHistoryManifest,
  'generatedAt' | 'assignment' | 'conservation'
> & { readonly excludedUnknownYear: InfraHistoryManifest['input']['excludedUnknownYear'] };

export async function loadInfraHistoryEvidence(
  network: InfraNetworkKey,
): Promise<InfraHistoryEvidence | null> {
  try {
    const manifest = await fetchFromR2AsJson<InfraHistoryManifest>(
      infraHistoryKeys.manifest(network),
    );
    if (
      manifest?.schemaVersion !== 1 ||
      manifest.network !== network ||
      manifest.conservation?.passed !== true ||
      !Array.isArray(manifest.input?.excludedUnknownYear)
    ) {
      return null;
    }
    return {
      generatedAt: manifest.generatedAt,
      assignment: manifest.assignment,
      conservation: manifest.conservation,
      excludedUnknownYear: manifest.input.excludedUnknownYear,
    };
  } catch {
    return null;
  }
}
