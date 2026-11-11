# Cloudflare Usage — 2026-11-09

> 計測時刻: 2026-11-10T22:29:20.980Z
> 前日比: 2026-11-07

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
| Requests | 92.04K | ▲ +7.6% ✅ |
| Errors | 19 | ▲ +216.7% ⚠️ |
| Subrequests | 1.77K | ▼ -15.5% ✅ |

**Error rate**: 0.02% (19/92043)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 3.66K | ▼ -78.0% ✅ |
| Class B ops (reads) | 639.03K | ▼ -24.6% ✅ |
| Egress | 112875MB | ▼ -30.0% ✅ |
| Storage | 45.08GB | ▲ +0.5%  |
| Objects | 143,854 | ▲ +1.0% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 3.05 | 10,159 | 179 | 405 | 3 |
| stats47 | 33.57 | 115,233 | 3.44K | 615.26K | 108832 |
| doboku-note | 0.99 | 14,201 | 2 | 17.65K | 152 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 7.47 | 4,261 | 34 | 5.71K | 3887 |

## History

Last 7 days (`data/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-11-02,0,0,0,0,0,68453,85,1958,78355,934212,159936,43.448,134729
2026-11-03,0,0,0,0,0,75571,121,1031,20137,1260755,231649,44.096,136999
2026-11-04,0,0,0,0,0,76091,571,1491,63127,1392289,246061,44.235,139069
2026-11-05,0,0,0,0,0,93998,138,9889,31613,1455155,282998,44.591,142111
2026-11-06,0,0,0,0,0,100466,26,2086,12710,1279958,250859,44.844,142301
2026-11-07,0,0,0,0,0,85537,6,2095,16652,847923,161272,44.842,142370
2026-11-09,0,0,0,0,0,92043,19,1770,3658,639027,112875,45.078,143854
```
