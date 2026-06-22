# Cloudflare Usage — 2026-06-21

> 計測時刻: 2026-06-22T18:47:42.968Z
> 前日比: 2026-06-20

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
| Requests | 24.25K | ▲ +35.3% ✅ |
| Errors | 39 | ▲ +21.9%  |
| Subrequests | 1.17K | ▼ -62.2% ✅ |

**Error rate**: 0.16% (39/24251)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 13.39K | ▲ +9.2%  |
| Class B ops (reads) | 83.15K | ▼ -22.5% ✅ |
| Egress | 52862MB | ▲ +19.2%  |
| Storage | 19.15GB | ▼ -46.3% ✅ |
| Objects | 50,194 | ▼ -19.1%  |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 17.42 | 41,735 | 10.00K | 81.60K | 52702 |
| doboku-note | 1.73 | 8,459 | 3.38K | 1.55K | 160 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-06-15,0,0,0,0,0,24552,18,5463,5391,53380,36311,28.230,49836
2026-06-16,0,0,0,0,0,33539,36,7625,2179,52408,34248,29.019,50950
2026-06-17,0,0,0,0,0,28529,39,4661,5115,55197,36452,30.164,52162
2026-06-18,0,0,0,0,0,27499,26,5978,259,35189,26728,30.346,53308
2026-06-19,0,0,0,0,0,33341,26,4964,2263,44548,34491,34.957,61432
2026-06-20,0,0,0,0,0,17930,32,3089,12265,107255,44344,35.630,62062
2026-06-21,0,0,0,0,0,24251,39,1168,13388,83147,52862,19.148,50194
```
