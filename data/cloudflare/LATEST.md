# Cloudflare Usage — 2026-11-14

> 計測時刻: 2026-11-15T21:59:02.911Z
> 前日比: 2026-11-13

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
| Requests | 113.51K | ▼ -28.9%  |
| Errors | 56 | ▼ -59.4% ✅ |
| Subrequests | 4.07K | ▼ -85.2% ✅ |

**Error rate**: 0.05% (56/113511)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 26.52K | ▲ +35.1% ⚠️ |
| Class B ops (reads) | 1.36M | ▼ -28.7% ✅ |
| Egress | 204324MB | ▼ -38.4% ✅ |
| Storage | 52.48GB | ▲ +11.6%  |
| Objects | 174,957 | ▲ +2.5% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 7.96 | 35,352 | 22.95K | 54.00K | 1210 |
| stats47 | 34.60 | 119,156 | 3.54K | 1.28M | 192554 |
| doboku-note | 1.99 | 16,124 | 2 | 15.61K | 1214 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 7.93 | 4,325 | 34 | 12.59K | 9347 |

## History

Last 7 days (`data/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-11-07,0,0,0,0,0,85537,6,2095,16652,847923,161272,44.842,142370
2026-11-09,0,0,0,0,0,92043,19,1770,3658,639027,112875,45.078,143854
2026-11-10,0,0,0,0,0,66572,23,1377,1803,506913,98751,45.160,144001
2026-11-11,0,0,0,0,0,86313,93,1505,14121,1111382,193207,45.328,146499
2026-11-12,0,0,0,0,0,81226,56,3733,6973,953605,170884,46.267,148575
2026-11-13,0,0,0,0,0,159636,138,27509,19623,1909517,331859,47.016,170725
2026-11-14,0,0,0,0,0,113511,56,4067,26518,1360613,204324,52.478,174957
```
