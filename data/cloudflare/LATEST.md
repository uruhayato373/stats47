# Cloudflare Usage — 2026-10-09

> 計測時刻: 2026-10-10T20:40:18.402Z
> 前日比: 2026-10-08

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
| Requests | 98.97K | ▼ -17.9%  |
| Errors | 95 | ▼ -42.8% ✅ |
| Subrequests | 42 | ▼ -65.6% ✅ |

**Error rate**: 0.10% (95/98967)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 49.85K | ▼ -50.0% ✅ |
| Class B ops (reads) | 1.00M | ▼ -24.8% ✅ |
| Egress | 118369MB | ▼ -37.3% ✅ |
| Storage | 33.63GB | ▼ -0.3% ✅ |
| Objects | 117,879 | ▼ -0.6%  |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 0.19 | 1,707 | 56 | 98 | 36 |
| stats47 | 25.79 | 100,986 | 17.53K | 520.02K | 114376 |
| doboku-note | 0.94 | 12,132 | 32.24K | 480.44K | 3953 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 6.71 | 3,054 | 25 | 390 | 4 |

## History

Last 7 days (`data/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-10-03,0,0,0,0,0,115250,208,41,19043,455150,79503,33.386,115955
2026-10-04,0,0,0,0,0,67880,65,33,3888,192885,41814,33.399,115640
2026-10-05,0,0,0,0,0,108063,104,54,34831,469975,88343,33.592,116619
2026-10-06,0,0,0,0,0,103583,206,55,39490,1139598,199778,33.587,116829
2026-10-07,0,0,0,0,0,106021,194,64,70285,881513,169098,33.896,118333
2026-10-08,0,0,0,0,0,120617,166,122,99666,1330642,188895,33.724,118576
2026-10-09,0,0,0,0,0,98967,95,42,49848,1000951,118369,33.635,117879
```
