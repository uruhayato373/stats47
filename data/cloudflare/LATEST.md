# Cloudflare Usage — 2026-11-12

> 計測時刻: 2026-11-13T22:46:05.747Z
> 前日比: 2026-11-11

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
| Requests | 81.23K | ▼ -5.9%  |
| Errors | 56 | ▼ -39.8% ✅ |
| Subrequests | 3.73K | ▲ +148.0% ⚠️ |

**Error rate**: 0.07% (56/81226)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 6.97K | ▼ -50.6% ✅ |
| Class B ops (reads) | 953.61K | ▼ -14.2% ✅ |
| Egress | 170884MB | ▼ -11.6% ✅ |
| Storage | 46.27GB | ▲ +2.1%  |
| Objects | 148,575 | ▲ +1.4% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 3.12 | 10,721 | 0 | 29 | 257 |
| stats47 | 33.41 | 117,436 | 6.45K | 895.03K | 146075 |
| doboku-note | 1.99 | 16,120 | 413 | 26.17K | 863 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 7.74 | 4,298 | 110 | 32.37K | 23688 |

## History

Last 7 days (`data/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-11-05,0,0,0,0,0,93998,138,9889,31613,1455155,282998,44.591,142111
2026-11-06,0,0,0,0,0,100466,26,2086,12710,1279958,250859,44.844,142301
2026-11-07,0,0,0,0,0,85537,6,2095,16652,847923,161272,44.842,142370
2026-11-09,0,0,0,0,0,92043,19,1770,3658,639027,112875,45.078,143854
2026-11-10,0,0,0,0,0,66572,23,1377,1803,506913,98751,45.160,144001
2026-11-11,0,0,0,0,0,86313,93,1505,14121,1111382,193207,45.328,146499
2026-11-12,0,0,0,0,0,81226,56,3733,6973,953605,170884,46.267,148575
```
