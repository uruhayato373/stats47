# Cloudflare Usage — 2026-07-07

> 計測時刻: 2026-07-08T18:54:45.063Z
> 前日比: 2026-07-05

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
| Requests | 40.41K | ▲ +20.1% ✅ |
| Errors | 5 | ▼ -85.7% ✅ |
| Subrequests | 8.70K | ▲ +52.3% ⚠️ |

**Error rate**: 0.01% (5/40406)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 648 | ▼ -71.9% ✅ |
| Class B ops (reads) | 118.65K | ▲ +3.5%  |
| Egress | 53035MB | ▲ +35.5% ⚠️ |
| Storage | 21.32GB | ▲ +0.6%  |
| Objects | 63,150 | ▲ +1.3% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 19.03 | 54,305 | 648 | 112.76K | 52507 |
| doboku-note | 2.29 | 8,845 | 0 | 5.89K | 528 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-06-30,0,0,0,0,0,49144,22,12877,6775,201806,56571,19.357,51693
2026-07-01,0,0,0,0,0,32257,23,9396,3388,97048,35148,19.880,51703
2026-07-02,0,0,0,0,0,31745,120,8986,20309,77732,35261,20.093,53175
2026-07-03,0,0,0,0,0,40638,137,9198,15537,126494,50706,20.232,53900
2026-07-04,0,0,0,0,0,32247,64,6652,14664,120744,43133,20.649,54354
2026-07-05,0,0,0,0,0,33639,35,5711,2307,114598,39126,21.193,62348
2026-07-07,0,0,0,0,0,40406,5,8696,648,118652,53035,21.321,63150
```
