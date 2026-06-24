# Cloudflare Usage — 2026-06-22

> 計測時刻: 2026-06-23T18:12:14.661Z
> 前日比: 2026-06-21

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
| Requests | 336.36K | ▲ +1287.0% ✅ |
| Errors | 446 | ▲ +1043.6% ⚠️ |
| Subrequests | 8.64K | ▲ +640.2% ⚠️ |

**Error rate**: 0.13% (446/336361)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 7.68K | ▼ -42.7% ✅ |
| Class B ops (reads) | 711.07K | ▲ +755.2% ⚠️ |
| Egress | 114133MB | ▲ +115.9% ⚠️ |
| Storage | 19.23GB | ▲ +0.4%  |
| Objects | 50,834 | ▲ +1.3% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 17.50 | 42,287 | 883 | 709.35K | 113835 |
| doboku-note | 1.73 | 8,547 | 6.79K | 1.72K | 298 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-06-16,0,0,0,0,0,33539,36,7625,2179,52408,34248,29.019,50950
2026-06-17,0,0,0,0,0,28529,39,4661,5115,55197,36452,30.164,52162
2026-06-18,0,0,0,0,0,27499,26,5978,259,35189,26728,30.346,53308
2026-06-19,0,0,0,0,0,33341,26,4964,2263,44548,34491,34.957,61432
2026-06-20,0,0,0,0,0,17930,32,3089,12265,107255,44344,35.630,62062
2026-06-21,0,0,0,0,0,24251,39,1168,13388,83147,52862,19.148,50194
2026-06-22,0,0,0,0,0,336361,446,8645,7678,711070,114133,19.230,50834
```
