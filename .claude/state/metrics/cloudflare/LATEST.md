# Cloudflare Usage — 2026-08-19

> 計測時刻: 2026-08-20T17:56:32.044Z
> 前日比: 2026-08-18

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
| Requests | 70.40K | ▼ -11.7%  |
| Errors | 0 | ▼ -100.0% ✅ |
| Subrequests | 489 | ▼ -55.3% ✅ |

**Error rate**: 0.00% (0/70399)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 4.13K | ▼ -4.2% ✅ |
| Class B ops (reads) | 135.92K | ▼ -22.1% ✅ |
| Egress | 65765MB | ▼ -11.0% ✅ |
| Storage | 15.38GB | ▲ +0.2%  |
| Objects | 61,767 | ▲ +0.6% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 11.37 | 52,470 | 4.13K | 132.91K | 65451 |
| doboku-note | 2.34 | 9,002 | 0 | 3.01K | 314 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 1.67 | 295 | 0 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-08-13,0,0,0,0,0,37720,0,4485,4098,158186,89439,15.784,61080
2026-08-14,0,0,0,0,0,42894,0,5773,4396,170812,84328,15.549,59860
2026-08-15,0,0,0,0,0,42945,1,3655,9733,277175,95286,15.541,61182
2026-08-16,0,0,0,0,0,48983,0,906,13128,225574,71975,15.400,61727
2026-08-17,0,0,0,0,0,61948,0,1147,44103,411319,86687,15.339,61363
2026-08-18,0,0,0,0,0,79709,2,1095,4306,174542,73909,15.354,61423
2026-08-19,0,0,0,0,0,70399,0,489,4127,135916,65765,15.379,61767
```
