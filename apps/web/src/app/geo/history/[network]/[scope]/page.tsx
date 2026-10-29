import { notFound } from 'next/navigation';

import { findInfraNetwork } from '@stats47/gis/infra-history';

import {
  InfraHistoryPage,
  infraHistoryPath,
  loadInfraHistoryEvidence,
  loadInfraHistorySummary,
  resolveInfraScope,
} from '@/features/infra-history';

import type { Metadata } from 'next';

// R2 の summary を実行時に読む。build 時は R2 を読めないので静的化しない (nextjs-ssg-preservation.md)
export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ network: string; scope: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { network: networkKey, scope: scopeSlug } = await params;
  const network = findInfraNetwork(networkKey);
  const scope = network ? resolveInfraScope(network.key, scopeSlug) : null;
  if (!network || !scope) return { title: 'ページが見つかりません' };
  return {
    title: `${scope.name}の${network.label}網の変遷`,
    description: `${scope.name}の${network.label}網が${network.years.first}年から${network.years.last}年までにどう広がったかを、年ごとの地図と延長で示します。`,
    alternates: { canonical: infraHistoryPath(network.key, scope.slug) },
    // 非商用原典の公開承認が出るまで検索に出さない (台帳 publication.status)
    ...(network.publication.status === 'public-approved' ? {} : { robots: 'noindex, follow' }),
  };
}

export default async function InfraHistoryScopePage({ params }: Props) {
  const { network: networkKey, scope: scopeSlug } = await params;
  const network = findInfraNetwork(networkKey);
  const scope = network ? resolveInfraScope(network.key, scopeSlug) : null;
  if (!network || !scope) notFound();
  const [summary, evidence] = await Promise.all([
    loadInfraHistorySummary(network.key),
    loadInfraHistoryEvidence(network.key),
  ]);
  return <InfraHistoryPage network={network} scope={scope} summary={summary} evidence={evidence} />;
}
