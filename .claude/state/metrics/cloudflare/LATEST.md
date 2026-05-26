# Cloudflare Usage — 2026-05-25

> 計測時刻: 2026-05-26T18:19:39.025Z
> 前日比: 2026-05-24

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
| Requests | 60.10K | ▲ +97.0% ✅ |
| Errors | 218 | ▼ -0.5% ✅ |
| Subrequests | 15.68K | ▲ +10.4%  |

**Error rate**: 0.36% (218/60102)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 787 | ▲ +8.1%  |
| Class B ops (reads) | 403.60K | ▲ +26.3%  |
| Egress | 146101MB | ▲ +58.2% ⚠️ |
| Storage | 9.92GB | ▼ -0.0% ✅ |
| Objects | 31,572 | ▲ +0.2% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 8.74 | 22,551 | 785 | 401.08K | 146065 |
| doboku-note | 0.66 | 6,390 | 0 | 2.51K | 35 |
| kakkom | 0.52 | 2,631 | 0 | 0 | 0 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-05-19,0,0,0,0,0,22178,13,9865,21,108675,53145,8.199,29129
2026-05-20,0,0,0,0,0,18353,45,8682,337,105246,68775,9.105,29429
2026-05-21,0,0,0,0,0,34613,66,17261,19902,187867,110184,9.142,29562
2026-05-22,0,0,0,0,0,28449,43,11123,4630,134887,62545,9.150,30963
2026-05-23,0,0,0,0,0,23005,64,10272,2919,164618,49461,9.480,31286
2026-05-24,0,0,0,0,0,30515,219,14207,728,319573,92347,9.922,31497
2026-05-25,0,0,0,0,0,60102,218,15683,787,403597,146101,9.922,31572
```
