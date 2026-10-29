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

type Props = { params: Promise<{ network: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const network = findInfraNetwork((await params).network);
  if (!network) return { title: 'ページが見つかりません' };
  return {
    title: `${network.label}網の変遷（${network.years.first}〜${network.years.last}年）`,
    description: network.description,
    alternates: { canonical: infraHistoryPath(network.key) },
    // 非商用原典の公開承認が出るまで検索に出さない (台帳 publication.status)
    ...(network.publication.status === 'public-approved' ? {} : { robots: 'noindex, follow' }),
  };
}

export default async function InfraHistoryNetworkPage({ params }: Props) {
  const network = findInfraNetwork((await params).network);
  const scope = network ? resolveInfraScope(network.key, null) : null;
  if (!network || !scope) notFound();
  const [summary, evidence] = await Promise.all([
    loadInfraHistorySummary(network.key),
    loadInfraHistoryEvidence(network.key),
  ]);
  return <InfraHistoryPage network={network} scope={scope} summary={summary} evidence={evidence} />;
}
