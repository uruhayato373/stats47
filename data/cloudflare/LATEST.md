# Cloudflare Usage — 2026-11-05

> 計測時刻: 2026-11-06T22:15:51.469Z
> 前日比: 2026-11-04

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
| Requests | 94.00K | ▲ +23.5% ✅ |
| Errors | 138 | ▼ -75.8% ✅ |
| Subrequests | 9.89K | ▲ +563.2% ⚠️ |

**Error rate**: 0.15% (138/93998)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 31.61K | ▼ -49.9% ✅ |
| Class B ops (reads) | 1.46M | ▲ +4.5%  |
| Egress | 282998MB | ▲ +15.0%  |
| Storage | 44.59GB | ▲ +0.8%  |
| Objects | 142,111 | ▲ +2.2% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 3.01 | 9,717 | 45 | 1.33K | 65 |
| stats47 | 33.30 | 114,337 | 30.65K | 1.42M | 273431 |
| doboku-note | 0.97 | 13,858 | 90 | 15.95K | 232 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 7.32 | 4,199 | 826 | 13.30K | 9269 |

## History

Last 7 days (`data/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-10-30,0,0,0,0,0,93886,4,1628,17707,723369,151237,43.262,131223
2026-10-31,0,0,0,0,0,55696,5,1377,1188,319315,66168,43.244,131298
2026-11-01,0,0,0,0,0,63157,68,1639,61882,892102,170737,43.158,131123
2026-11-02,0,0,0,0,0,68453,85,1958,78355,934212,159936,43.448,134729
2026-11-03,0,0,0,0,0,75571,121,1031,20137,1260755,231649,44.096,136999
2026-11-04,0,0,0,0,0,76091,571,1491,63127,1392289,246061,44.235,139069
2026-11-05,0,0,0,0,0,93998,138,9889,31613,1455155,282998,44.591,142111
```
