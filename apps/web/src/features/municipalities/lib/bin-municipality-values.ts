// 実装は packages/ranking へ移設した (snapshot builder が同じビン化を焼き込みに使うため、
// 単一実装を維持する)。この re-export で既存の呼び出し元 (page.tsx / DistributionHistogram
// への配線) は無変更で動く。
export {
  binMunicipalityValues,
  type MunicipalityDistribution,
  type MunicipalityDistributionBin,
} from '@stats47/ranking';
