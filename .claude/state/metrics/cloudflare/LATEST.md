# Cloudflare Usage — 2026-06-20

> 計測時刻: 2026-06-21T18:03:36.944Z
> 前日比: 2026-06-19

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
| Requests | 17.93K | ▼ -46.2% ⚠️ |
| Errors | 32 | ▲ +23.1%  |
| Subrequests | 3.09K | ▼ -37.8% ✅ |

**Error rate**: 0.18% (32/17930)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 12.27K | ▲ +442.0% ⚠️ |
| Class B ops (reads) | 107.25K | ▲ +140.8% ⚠️ |
| Egress | 44344MB | ▲ +28.6%  |
| Storage | 35.63GB | ▲ +1.9%  |
| Objects | 62,062 | ▲ +1.0% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 33.91 | 53,621 | 8.94K | 105.65K | 44188 |
| doboku-note | 1.72 | 8,441 | 3.32K | 1.60K | 156 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-06-14,0,0,0,0,0,20382,22,5356,5389,77923,50734,23.516,46780
2026-06-15,0,0,0,0,0,24552,18,5463,5391,53380,36311,28.230,49836
2026-06-16,0,0,0,0,0,33539,36,7625,2179,52408,34248,29.019,50950
2026-06-17,0,0,0,0,0,28529,39,4661,5115,55197,36452,30.164,52162
2026-06-18,0,0,0,0,0,27499,26,5978,259,35189,26728,30.346,53308
2026-06-19,0,0,0,0,0,33341,26,4964,2263,44548,34491,34.957,61432
2026-06-20,0,0,0,0,0,17930,32,3089,12265,107255,44344,35.630,62062
```
