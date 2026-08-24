# Cloudflare Usage — 2026-08-23

> 計測時刻: 2026-08-24T17:57:47.688Z
> 前日比: 2026-08-22

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
| Requests | 54.99K | ▼ -18.5%  |
| Errors | 3 | → |
| Subrequests | 858 | ▲ +71.6% ⚠️ |

**Error rate**: 0.01% (3/54994)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 3.81K | ▼ -76.7% ✅ |
| Class B ops (reads) | 99.78K | ▼ -71.4% ✅ |
| Egress | 52173MB | ▼ -76.7% ✅ |
| Storage | 22.12GB | ▼ -0.4% ✅ |
| Objects | 67,416 | ▲ +0.0% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 11.51 | 53,648 | 3.81K | 97.87K | 51971 |
| doboku-note | 1.63 | 6,164 | 6 | 1.92K | 202 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 8.98 | 7,604 | 0 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-08-17,0,0,0,0,0,61948,0,1147,44103,411319,86687,15.339,61363
2026-08-18,0,0,0,0,0,79709,2,1095,4306,174542,73909,15.354,61423
2026-08-19,0,0,0,0,0,70399,0,489,4127,135916,65765,15.379,61767
2026-08-20,0,0,0,0,0,81839,0,1032,5161,169746,75242,17.340,66379
2026-08-21,0,0,0,0,0,55401,0,1000,15475,123974,71748,23.695,71049
2026-08-22,0,0,0,0,0,67500,0,500,16373,348810,223614,22.197,67386
2026-08-23,0,0,0,0,0,54994,3,858,3811,99785,52173,22.119,67416
```
