# Cloudflare Usage — 2026-11-16

> 計測時刻: 2026-11-17T23:56:18.879Z
> 前日比: 2026-11-14

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
| Requests | 148.99K | ▲ +31.3% ✅ |
| Errors | 93 | ▲ +66.1% ⚠️ |
| Subrequests | 794 | ▼ -80.5% ✅ |

**Error rate**: 0.06% (93/148990)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 8.48K | ▼ -68.0% ✅ |
| Class B ops (reads) | 979.49K | ▼ -28.0% ✅ |
| Egress | 163026MB | ▼ -20.2% ✅ |
| Storage | 55.30GB | ▲ +5.4%  |
| Objects | 178,721 | ▲ +2.2% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 7.96 | 35,365 | 4 | 13 | 0 |
| stats47 | 37.17 | 122,877 | 8.43K | 942.31K | 155914 |
| doboku-note | 1.99 | 16,124 | 6 | 28.06K | 436 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 8.18 | 4,355 | 37 | 9.10K | 6675 |

## History

Last 7 days (`data/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-11-09,0,0,0,0,0,92043,19,1770,3658,639027,112875,45.078,143854
2026-11-10,0,0,0,0,0,66572,23,1377,1803,506913,98751,45.160,144001
2026-11-11,0,0,0,0,0,86313,93,1505,14121,1111382,193207,45.328,146499
2026-11-12,0,0,0,0,0,81226,56,3733,6973,953605,170884,46.267,148575
2026-11-13,0,0,0,0,0,159636,138,27509,19623,1909517,331859,47.016,170725
2026-11-14,0,0,0,0,0,113511,56,4067,26518,1360613,204324,52.478,174957
2026-11-16,0,0,0,0,0,148990,93,794,8478,979487,163026,55.298,178721
```
