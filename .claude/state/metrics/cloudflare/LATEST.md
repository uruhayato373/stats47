# Cloudflare Usage — 2026-06-28

> 計測時刻: 2026-06-29T18:16:21.881Z
> 前日比: 2026-06-22

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
| Requests | 27.05K | ▼ -92.0% ⚠️ |
| Errors | 33 | ▼ -92.6% ✅ |
| Subrequests | 5.46K | ▼ -36.8% ✅ |

**Error rate**: 0.12% (33/27048)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 6.95K | ▼ -9.5% ✅ |
| Class B ops (reads) | 67.05K | ▼ -90.6% ✅ |
| Egress | 29311MB | ▼ -74.3% ✅ |
| Storage | 19.43GB | ▲ +1.0%  |
| Objects | 51,627 | ▲ +1.6% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 17.61 | 42,926 | 24 | 65.22K | 28902 |
| doboku-note | 1.82 | 8,701 | 6.92K | 1.83K | 409 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-06-17,0,0,0,0,0,28529,39,4661,5115,55197,36452,30.164,52162
2026-06-18,0,0,0,0,0,27499,26,5978,259,35189,26728,30.346,53308
2026-06-19,0,0,0,0,0,33341,26,4964,2263,44548,34491,34.957,61432
2026-06-20,0,0,0,0,0,17930,32,3089,12265,107255,44344,35.630,62062
2026-06-21,0,0,0,0,0,24251,39,1168,13388,83147,52862,19.148,50194
2026-06-22,0,0,0,0,0,336361,446,8645,7678,711070,114133,19.230,50834
2026-06-28,0,0,0,0,0,27048,33,5462,6946,67048,29311,19.429,51627
```
