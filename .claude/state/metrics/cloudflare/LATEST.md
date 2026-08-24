# Cloudflare Usage — 2026-08-22

> 計測時刻: 2026-08-23T17:45:49.941Z
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
| Requests | 67.50K | ▼ -4.1%  |
| Errors | 0 | → |
| Subrequests | 500 | ▲ +2.2%  |

**Error rate**: 0.00% (0/67500)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 16.37K | ▲ +296.7% ⚠️ |
| Class B ops (reads) | 348.81K | ▲ +156.6% ⚠️ |
| Egress | 223614MB | ▲ +240.0% ⚠️ |
| Storage | 22.20GB | ▲ +44.3% ⚠️ |
| Objects | 67,386 | ▲ +9.1% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 11.59 | 53,618 | 11.12K | 315.04K | 97620 |
| doboku-note | 1.63 | 6,164 | 770 | 25.63K | 428 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 8.98 | 7,604 | 4.48K | 8.15K | 125566 |

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
2026-08-22,0,0,0,0,0,67500,0,500,16373,348810,223614,22.197,67386
```
