# Cloudflare Usage — 2026-11-06

> 計測時刻: 2026-11-07T21:01:29.989Z
> 前日比: 2026-11-05

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
| Requests | 100.47K | ▲ +6.9% ✅ |
| Errors | 26 | ▼ -81.2% ✅ |
| Subrequests | 2.09K | ▼ -78.9% ✅ |

**Error rate**: 0.03% (26/100466)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 12.71K | ▼ -59.8% ✅ |
| Class B ops (reads) | 1.28M | ▼ -12.0% ✅ |
| Egress | 250859MB | ▼ -11.4% ✅ |
| Storage | 44.84GB | ▲ +0.6%  |
| Objects | 142,301 | ▲ +0.1% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 3.01 | 9,720 | 13 | 332 | 17 |
| stats47 | 33.54 | 114,341 | 11.02K | 1.25M | 243406 |
| doboku-note | 0.98 | 14,041 | 1.68K | 14.75K | 230 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 7.32 | 4,199 | 0 | 10.70K | 7205 |

## History

Last 7 days (`data/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-10-31,0,0,0,0,0,55696,5,1377,1188,319315,66168,43.244,131298
2026-11-01,0,0,0,0,0,63157,68,1639,61882,892102,170737,43.158,131123
2026-11-02,0,0,0,0,0,68453,85,1958,78355,934212,159936,43.448,134729
2026-11-03,0,0,0,0,0,75571,121,1031,20137,1260755,231649,44.096,136999
2026-11-04,0,0,0,0,0,76091,571,1491,63127,1392289,246061,44.235,139069
2026-11-05,0,0,0,0,0,93998,138,9889,31613,1455155,282998,44.591,142111
2026-11-06,0,0,0,0,0,100466,26,2086,12710,1279958,250859,44.844,142301
```
