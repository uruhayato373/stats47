# Cloudflare Usage — 2026-08-20

> 計測時刻: 2026-08-21T17:56:49.115Z
> 前日比: 2026-08-19

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
| Requests | 81.84K | ▲ +16.3% ✅ |
| Errors | 0 | → |
| Subrequests | 1.03K | ▲ +111.0% ⚠️ |

**Error rate**: 0.00% (0/81839)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 5.16K | ▲ +25.1%  |
| Class B ops (reads) | 169.75K | ▲ +24.9%  |
| Egress | 75242MB | ▲ +14.4%  |
| Storage | 17.34GB | ▲ +12.8%  |
| Objects | 66,379 | ▲ +7.5% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 11.44 | 52,809 | 5.16K | 166.68K | 74945 |
| doboku-note | 3.05 | 9,788 | 0 | 3.07K | 297 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 2.85 | 3,782 | 0 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-08-14,0,0,0,0,0,42894,0,5773,4396,170812,84328,15.549,59860
2026-08-15,0,0,0,0,0,42945,1,3655,9733,277175,95286,15.541,61182
2026-08-16,0,0,0,0,0,48983,0,906,13128,225574,71975,15.400,61727
2026-08-17,0,0,0,0,0,61948,0,1147,44103,411319,86687,15.339,61363
2026-08-18,0,0,0,0,0,79709,2,1095,4306,174542,73909,15.354,61423
2026-08-19,0,0,0,0,0,70399,0,489,4127,135916,65765,15.379,61767
2026-08-20,0,0,0,0,0,81839,0,1032,5161,169746,75242,17.340,66379
```
