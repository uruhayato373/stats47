# Cloudflare Usage — 2026-11-04

> 計測時刻: 2026-11-05T22:46:20.074Z
> 前日比: 2026-11-03

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
| Requests | 76.09K | ▲ +0.7% ✅ |
| Errors | 571 | ▲ +371.9% ⚠️ |
| Subrequests | 1.49K | ▲ +44.6% ⚠️ |

**Error rate**: 0.75% (571/76091)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 63.13K | ▲ +213.5% ⚠️ |
| Class B ops (reads) | 1.39M | ▲ +10.4%  |
| Egress | 246061MB | ▲ +6.2%  |
| Storage | 44.24GB | ▲ +0.3%  |
| Objects | 139,069 | ▲ +1.5% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 3.01 | 9,717 | 1.79K | 12.15K | 6837 |
| stats47 | 32.91 | 112,962 | 60.81K | 1.34M | 228565 |
| doboku-note | 0.91 | 12,184 | 90 | 30.29K | 401 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 7.40 | 4,206 | 429 | 14.61K | 10258 |

## History

Last 7 days (`data/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-10-29,0,0,0,0,0,71837,65,972,24126,593520,110395,42.860,130913
2026-10-30,0,0,0,0,0,93886,4,1628,17707,723369,151237,43.262,131223
2026-10-31,0,0,0,0,0,55696,5,1377,1188,319315,66168,43.244,131298
2026-11-01,0,0,0,0,0,63157,68,1639,61882,892102,170737,43.158,131123
2026-11-02,0,0,0,0,0,68453,85,1958,78355,934212,159936,43.448,134729
2026-11-03,0,0,0,0,0,75571,121,1031,20137,1260755,231649,44.096,136999
2026-11-04,0,0,0,0,0,76091,571,1491,63127,1392289,246061,44.235,139069
```
