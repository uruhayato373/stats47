# Cloudflare Usage — 2026-11-11

> 計測時刻: 2026-11-12T22:50:15.485Z
> 前日比: 2026-11-10

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
| Requests | 86.31K | ▲ +29.7% ✅ |
| Errors | 93 | ▲ +304.3% ⚠️ |
| Subrequests | 1.50K | ▲ +9.3%  |

**Error rate**: 0.11% (93/86313)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 14.12K | ▲ +683.2% ⚠️ |
| Class B ops (reads) | 1.11M | ▲ +119.2% ⚠️ |
| Egress | 193207MB | ▲ +95.7% ⚠️ |
| Storage | 45.33GB | ▲ +0.4%  |
| Objects | 146,499 | ▲ +1.7% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 3.05 | 10,159 | 0 | 0 | 0 |
| stats47 | 33.59 | 117,469 | 14.11K | 1.08M | 181820 |
| doboku-note | 1.04 | 14,585 | 2 | 12.53K | 496 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 7.65 | 4,286 | 5 | 15.40K | 10891 |

## History

Last 7 days (`data/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-11-04,0,0,0,0,0,76091,571,1491,63127,1392289,246061,44.235,139069
2026-11-05,0,0,0,0,0,93998,138,9889,31613,1455155,282998,44.591,142111
2026-11-06,0,0,0,0,0,100466,26,2086,12710,1279958,250859,44.844,142301
2026-11-07,0,0,0,0,0,85537,6,2095,16652,847923,161272,44.842,142370
2026-11-09,0,0,0,0,0,92043,19,1770,3658,639027,112875,45.078,143854
2026-11-10,0,0,0,0,0,66572,23,1377,1803,506913,98751,45.160,144001
2026-11-11,0,0,0,0,0,86313,93,1505,14121,1111382,193207,45.328,146499
```
