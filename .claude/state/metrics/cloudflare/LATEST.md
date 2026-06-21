# Cloudflare Usage — 2026-06-19

> 計測時刻: 2026-06-20T17:58:08.714Z
> 前日比: 2026-06-18

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
| Requests | 33.34K | ▲ +21.2% ✅ |
| Errors | 26 | → |
| Subrequests | 4.96K | ▼ -17.0% ✅ |

**Error rate**: 0.08% (26/33341)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 2.26K | ▲ +773.7% ⚠️ |
| Class B ops (reads) | 44.55K | ▲ +26.6%  |
| Egress | 34491MB | ▲ +29.0%  |
| Storage | 34.96GB | ▲ +15.2%  |
| Objects | 61,432 | ▲ +15.2% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 33.24 | 53,047 | 2.26K | 43.07K | 34467 |
| doboku-note | 1.72 | 8,385 | 0 | 1.48K | 24 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-06-13,0,0,0,0,0,23447,40,5957,9772,107068,63954,21.272,45370
2026-06-14,0,0,0,0,0,20382,22,5356,5389,77923,50734,23.516,46780
2026-06-15,0,0,0,0,0,24552,18,5463,5391,53380,36311,28.230,49836
2026-06-16,0,0,0,0,0,33539,36,7625,2179,52408,34248,29.019,50950
2026-06-17,0,0,0,0,0,28529,39,4661,5115,55197,36452,30.164,52162
2026-06-18,0,0,0,0,0,27499,26,5978,259,35189,26728,30.346,53308
2026-06-19,0,0,0,0,0,33341,26,4964,2263,44548,34491,34.957,61432
```
