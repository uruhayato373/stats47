# Cloudflare Usage — 2026-07-09

> 計測時刻: 2026-07-10T19:00:00.315Z
> 前日比: 2026-07-07

## D1

| 指標 | 当日 | 前日比 |
|---|---|---|
| Databases (active) | 0 | → |
| Read queries | 0 | → |
| Rows read | 0 | → |
| Write queries | 0 | → |
| Rows written | 0 | → |

## Workers

| 指標 | 当日 | 前日比 |
|---|---|---|
| Requests | 50.67K | ▲ +25.4% ✅ |
| Errors | 7 | ▲ +40.0% ⚠️ |
| Subrequests | 13.43K | ▲ +54.4% ⚠️ |

**Error rate**: 0.01% (7/50673)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 10.73K | ▲ +1556.3% ⚠️ |
| Class B ops (reads) | 150.44K | ▲ +26.8%  |
| Egress | 47537MB | ▼ -10.4% ✅ |
| Storage | 21.47GB | ▲ +0.7%  |
| Objects | 64,733 | ▲ +2.5% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 19.17 | 55,849 | 3.70K | 143.99K | 45660 |
| doboku-note | 2.31 | 8,884 | 7.03K | 6.45K | 1877 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-07-02,0,0,0,0,0,31745,120,8986,20309,77732,35261,20.093,53175
2026-07-03,0,0,0,0,0,40638,137,9198,15537,126494,50706,20.232,53900
2026-07-04,0,0,0,0,0,32247,64,6652,14664,120744,43133,20.649,54354
2026-07-05,0,0,0,0,0,33639,35,5711,2307,114598,39126,21.193,62348
2026-07-06,0,0,0,0,0,63263,785,16851,16675,242511,61022,21.296,63018
2026-07-07,0,0,0,0,0,40406,5,8696,648,118652,53035,21.321,63150
2026-07-09,0,0,0,0,0,50673,7,13428,10733,150443,47537,21.475,64733
```
