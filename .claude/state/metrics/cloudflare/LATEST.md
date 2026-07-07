# Cloudflare Usage — 2026-07-05

> 計測時刻: 2026-07-06T19:16:13.277Z
> 前日比: 2026-07-04

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
| Requests | 33.64K | ▲ +4.3% ✅ |
| Errors | 35 | ▼ -45.3% ✅ |
| Subrequests | 5.71K | ▼ -14.1% ✅ |

**Error rate**: 0.10% (35/33639)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 2.31K | ▼ -84.3% ✅ |
| Class B ops (reads) | 114.60K | ▼ -5.1% ✅ |
| Egress | 39126MB | ▼ -9.3% ✅ |
| Storage | 21.19GB | ▲ +2.6%  |
| Objects | 62,348 | ▲ +14.7% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 18.90 | 53,503 | 2.30K | 110.80K | 38867 |
| doboku-note | 2.29 | 8,845 | 6 | 3.80K | 259 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-06-29,0,0,0,0,0,42455,49,7737,3366,111747,55879,19.357,51673
2026-06-30,0,0,0,0,0,49144,22,12877,6775,201806,56571,19.357,51693
2026-07-01,0,0,0,0,0,32257,23,9396,3388,97048,35148,19.880,51703
2026-07-02,0,0,0,0,0,31745,120,8986,20309,77732,35261,20.093,53175
2026-07-03,0,0,0,0,0,40638,137,9198,15537,126494,50706,20.232,53900
2026-07-04,0,0,0,0,0,32247,64,6652,14664,120744,43133,20.649,54354
2026-07-05,0,0,0,0,0,33639,35,5711,2307,114598,39126,21.193,62348
```
