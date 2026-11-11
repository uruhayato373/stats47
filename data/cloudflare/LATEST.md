# Cloudflare Usage — 2026-11-10

> 計測時刻: 2026-11-11T04:19:28.126Z
> 前日比: 2026-11-09

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
| Requests | 66.57K | ▼ -27.7%  |
| Errors | 23 | ▲ +21.1%  |
| Subrequests | 1.38K | ▼ -22.2% ✅ |

**Error rate**: 0.03% (23/66572)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 1.80K | ▼ -50.7% ✅ |
| Class B ops (reads) | 506.91K | ▼ -20.7% ✅ |
| Egress | 98751MB | ▼ -12.5% ✅ |
| Storage | 45.16GB | ▲ +0.2%  |
| Objects | 144,000 | ▲ +0.1% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 3.05 | 10,159 | 132 | 624 | 68 |
| stats47 | 33.65 | 115,379 | 935 | 461.54K | 81736 |
| doboku-note | 0.99 | 14,201 | 357 | 21.59K | 205 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 7.47 | 4,261 | 379 | 23.16K | 16742 |

## History

Last 7 days (`data/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-11-03,0,0,0,0,0,75571,121,1031,20137,1260755,231649,44.096,136999
2026-11-04,0,0,0,0,0,76091,571,1491,63127,1392289,246061,44.235,139069
2026-11-05,0,0,0,0,0,93998,138,9889,31613,1455155,282998,44.591,142111
2026-11-06,0,0,0,0,0,100466,26,2086,12710,1279958,250859,44.844,142301
2026-11-07,0,0,0,0,0,85537,6,2095,16652,847923,161272,44.842,142370
2026-11-09,0,0,0,0,0,92043,19,1770,3658,639027,112875,45.078,143854
2026-11-10,0,0,0,0,0,66572,23,1377,1803,506913,98751,45.156,144000
```
