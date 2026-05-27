# Cloudflare Usage — 2026-05-26

> 計測時刻: 2026-05-27T18:20:15.888Z
> 前日比: 2026-05-25

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
| Requests | 24.64K | ▼ -59.0% ⚠️ |
| Errors | 260 | ▲ +19.3%  |
| Subrequests | 14.48K | ▼ -7.7% ✅ |

**Error rate**: 1.06% (260/24640)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 70 | ▼ -91.1% ✅ |
| Class B ops (reads) | 260.96K | ▼ -35.3% ✅ |
| Egress | 66512MB | ▼ -54.5% ✅ |
| Storage | 11.89GB | ▲ +19.9%  |
| Objects | 34,111 | ▲ +8.0% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 10.71 | 25,090 | 70 | 259.08K | 66487 |
| doboku-note | 0.66 | 6,390 | 0 | 1.88K | 26 |
| kakkom | 0.52 | 2,631 | 0 | 0 | 0 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-05-20,0,0,0,0,0,18353,45,8682,337,105246,68775,9.105,29429
2026-05-21,0,0,0,0,0,34613,66,17261,19902,187867,110184,9.142,29562
2026-05-22,0,0,0,0,0,28449,43,11123,4630,134887,62545,9.150,30963
2026-05-23,0,0,0,0,0,23005,64,10272,2919,164618,49461,9.480,31286
2026-05-24,0,0,0,0,0,30515,219,14207,728,319573,92347,9.922,31497
2026-05-25,0,0,0,0,0,60102,218,15683,787,403597,146101,9.922,31572
2026-05-26,0,0,0,0,0,24640,260,14476,70,260956,66512,11.893,34111
```
