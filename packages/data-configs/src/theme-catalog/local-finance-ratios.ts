/** 地方財政の専用カードと配置監査が共有する4指標。 */
export const LOCAL_FINANCE_RATIO_METRICS = [
  {
    key: 'fiscalIndex',
    componentKey: 'kpi-lf-fiscal-strength',
    rankingKey: 'fiscal-strength-index-prefecture',
    label: '財政力指数',
    unit: '',
    decimals: 2,
  },
  {
    key: 'currentBalanceRatio',
    componentKey: 'kpi-lf-current-balance',
    rankingKey: 'current-balance-ratio',
    label: '経常収支比率',
    unit: '%',
    decimals: 1,
  },
  {
    key: 'debtServiceRatio',
    componentKey: 'kpi-lf-debt-service',
    rankingKey: 'real-public-debt-service-ratio',
    label: '実質公債費比率',
    unit: '%',
    decimals: 1,
  },
  {
    key: 'futureBurdenRatio',
    componentKey: 'kpi-lf-future-burden',
    rankingKey: 'future-burden-ratio',
    label: '将来負担比率',
    unit: '%',
    decimals: 1,
  },
] as const;
