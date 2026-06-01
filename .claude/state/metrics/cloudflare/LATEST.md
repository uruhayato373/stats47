# Cloudflare Usage — 2026-05-31

> 計測時刻: 2026-06-01T19:19:04.150Z
> 前日比: 2026-05-30

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
| Requests | 58.94K | ▲ +122.6% ✅ |
| Errors | 98 | ▼ -9.3% ✅ |
| Subrequests | 12.57K | ▲ +49.8% ⚠️ |

**Error rate**: 0.17% (98/58938)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 854 | ▲ +169.4% ⚠️ |
| Class B ops (reads) | 421.90K | ▲ +69.4% ⚠️ |
| Egress | 156101MB | ▲ +42.6% ⚠️ |
| Storage | 11.41GB | ▲ +0.1%  |
| Objects | 32,021 | ▲ +0.5% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 10.75 | 25,507 | 850 | 420.46K | 156083 |
| doboku-note | 0.66 | 6,514 | 4 | 1.44K | 18 |
| kakkom | 0.00 | 0 | 0 | 0 | 0 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-05-24,0,0,0,0,0,30515,219,14207,728,319573,92347,9.922,31497
2026-05-25,0,0,0,0,0,60102,218,15683,787,403597,146101,9.922,31572
2026-05-26,0,0,0,0,0,24640,260,14476,70,260956,66512,11.893,34111
2026-05-27,0,0,0,0,0,38008,213,14930,2859,302325,81611,11.894,34111
2026-05-29,0,0,0,0,0,46649,119,12271,3150,330426,92496,11.391,31828
2026-05-30,0,0,0,0,0,26472,108,8391,317,249126,109494,11.405,31876
2026-05-31,0,0,0,0,0,58938,98,12572,854,421901,156101,11.413,32021
```
