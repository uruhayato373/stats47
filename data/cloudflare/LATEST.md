# Cloudflare Usage — 2026-11-07

> 計測時刻: 2026-11-08T21:18:26.852Z
> 前日比: 2026-11-06

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
| Requests | 85.54K | ▼ -14.9%  |
| Errors | 6 | ▼ -76.9% ✅ |
| Subrequests | 2.10K | ▲ +0.4%  |

**Error rate**: 0.01% (6/85537)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 16.65K | ▲ +31.0% ⚠️ |
| Class B ops (reads) | 847.92K | ▼ -33.8% ✅ |
| Egress | 161272MB | ▼ -35.7% ✅ |
| Storage | 44.84GB | ▼ -0.0% ✅ |
| Objects | 142,370 | ▲ +0.0% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 3.04 | 9,849 | 144 | 336 | 94 |
| stats47 | 33.51 | 114,281 | 10.45K | 819.65K | 156476 |
| doboku-note | 0.98 | 14,041 | 6.06K | 23.46K | 1701 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 7.32 | 4,199 | 4 | 4.47K | 3001 |

## History

Last 7 days (`data/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-11-01,0,0,0,0,0,63157,68,1639,61882,892102,170737,43.158,131123
2026-11-02,0,0,0,0,0,68453,85,1958,78355,934212,159936,43.448,134729
2026-11-03,0,0,0,0,0,75571,121,1031,20137,1260755,231649,44.096,136999
2026-11-04,0,0,0,0,0,76091,571,1491,63127,1392289,246061,44.235,139069
2026-11-05,0,0,0,0,0,93998,138,9889,31613,1455155,282998,44.591,142111
2026-11-06,0,0,0,0,0,100466,26,2086,12710,1279958,250859,44.844,142301
2026-11-07,0,0,0,0,0,85537,6,2095,16652,847923,161272,44.842,142370
```
