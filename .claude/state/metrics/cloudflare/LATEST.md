# Cloudflare Usage — 2026-05-24

> 計測時刻: 2026-05-25T18:05:22.688Z
> 前日比: 2026-05-23

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
| Requests | 30.52K | ▲ +32.6% ✅ |
| Errors | 219 | ▲ +242.2% ⚠️ |
| Subrequests | 14.21K | ▲ +38.3% ⚠️ |

**Error rate**: 0.72% (219/30515)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 728 | ▼ -75.1% ✅ |
| Class B ops (reads) | 319.57K | ▲ +94.1% ⚠️ |
| Egress | 92347MB | ▲ +86.7% ⚠️ |
| Storage | 9.92GB | ▲ +4.7%  |
| Objects | 31,497 | ▲ +0.7% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 8.74 | 22,476 | 728 | 317.47K | 92324 |
| doboku-note | 0.66 | 6,390 | 0 | 2.10K | 23 |
| kakkom | 0.52 | 2,631 | 0 | 0 | 0 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-05-18,0,0,0,0,0,25170,18,9141,10986,120504,56695,8.153,29063
2026-05-19,0,0,0,0,0,22178,13,9865,21,108675,53145,8.199,29129
2026-05-20,0,0,0,0,0,18353,45,8682,337,105246,68775,9.105,29429
2026-05-21,0,0,0,0,0,34613,66,17261,19902,187867,110184,9.142,29562
2026-05-22,0,0,0,0,0,28449,43,11123,4630,134887,62545,9.150,30963
2026-05-23,0,0,0,0,0,23005,64,10272,2919,164618,49461,9.480,31286
2026-05-24,0,0,0,0,0,30515,219,14207,728,319573,92347,9.922,31497
```
