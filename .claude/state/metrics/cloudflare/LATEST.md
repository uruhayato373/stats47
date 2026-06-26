# Cloudflare Usage — 2026-06-25

> 計測時刻: 2026-06-26T18:07:00.426Z
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
| Requests | 30.91K | ▼ -90.8% ⚠️ |
| Errors | 26 | ▼ -94.2% ✅ |
| Subrequests | 7.04K | ▼ -18.6% ✅ |

**Error rate**: 0.08% (26/30906)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 3.46K | ▼ -54.9% ✅ |
| Class B ops (reads) | 57.21K | ▼ -92.0% ✅ |
| Egress | 17299MB | ▼ -84.8% ✅ |
| Storage | 19.33GB | ▲ +0.5%  |
| Objects | 51,440 | ▲ +1.2% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 17.60 | 42,827 | 42 | 54.27K | 17113 |
| doboku-note | 1.73 | 8,613 | 3.42K | 2.94K | 185 |
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
2026-06-25,0,0,0,0,0,30906,26,7041,3462,57209,17299,19.335,51440
```
