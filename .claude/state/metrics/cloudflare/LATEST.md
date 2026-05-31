# Cloudflare Usage — 2026-05-30

> 計測時刻: 2026-05-31T17:50:55.446Z
> 前日比: 2026-05-29

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
| Requests | 26.47K | ▼ -43.3% ⚠️ |
| Errors | 108 | ▼ -9.2% ✅ |
| Subrequests | 8.39K | ▼ -31.6% ✅ |

**Error rate**: 0.41% (108/26472)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 317 | ▼ -89.9% ✅ |
| Class B ops (reads) | 249.13K | ▼ -24.6% ✅ |
| Egress | 109494MB | ▲ +18.4%  |
| Storage | 11.40GB | ▲ +0.1%  |
| Objects | 31,876 | ▲ +0.2% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 10.74 | 25,362 | 315 | 247.56K | 109474 |
| doboku-note | 0.66 | 6,514 | 0 | 1.57K | 20 |
| kakkom | 0.00 | 0 | 0 | 0 | 0 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-05-23,0,0,0,0,0,23005,64,10272,2919,164618,49461,9.480,31286
2026-05-24,0,0,0,0,0,30515,219,14207,728,319573,92347,9.922,31497
2026-05-25,0,0,0,0,0,60102,218,15683,787,403597,146101,9.922,31572
2026-05-26,0,0,0,0,0,24640,260,14476,70,260956,66512,11.893,34111
2026-05-27,0,0,0,0,0,38008,213,14930,2859,302325,81611,11.894,34111
2026-05-29,0,0,0,0,0,46649,119,12271,3150,330426,92496,11.391,31828
2026-05-30,0,0,0,0,0,26472,108,8391,317,249126,109494,11.405,31876
```
