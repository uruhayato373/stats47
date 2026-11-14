# Cloudflare Usage — 2026-11-13

> 計測時刻: 2026-11-14T21:39:18.875Z
> 前日比: 2026-11-12

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
| Requests | 159.64K | ▲ +96.5% ✅ |
| Errors | 138 | ▲ +146.4% ⚠️ |
| Subrequests | 27.51K | ▲ +636.9% ⚠️ |

**Error rate**: 0.09% (138/159636)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 19.62K | ▲ +181.4% ⚠️ |
| Class B ops (reads) | 1.91M | ▲ +100.2% ⚠️ |
| Egress | 331859MB | ▲ +94.2% ⚠️ |
| Storage | 47.02GB | ▲ +1.6%  |
| Objects | 170,725 | ▲ +14.9% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 3.57 | 32,539 | 567 | 1.28K | 207 |
| stats47 | 33.60 | 117,750 | 13.44K | 1.86M | 318915 |
| doboku-note | 1.99 | 16,120 | 5.55K | 40.20K | 4657 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 7.86 | 4,316 | 59 | 10.88K | 8080 |

## History

Last 7 days (`data/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-11-06,0,0,0,0,0,100466,26,2086,12710,1279958,250859,44.844,142301
2026-11-07,0,0,0,0,0,85537,6,2095,16652,847923,161272,44.842,142370
2026-11-09,0,0,0,0,0,92043,19,1770,3658,639027,112875,45.078,143854
2026-11-10,0,0,0,0,0,66572,23,1377,1803,506913,98751,45.160,144001
2026-11-11,0,0,0,0,0,86313,93,1505,14121,1111382,193207,45.328,146499
2026-11-12,0,0,0,0,0,81226,56,3733,6973,953605,170884,46.267,148575
2026-11-13,0,0,0,0,0,159636,138,27509,19623,1909517,331859,47.016,170725
```
