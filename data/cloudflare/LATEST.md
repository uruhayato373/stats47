# Cloudflare Usage — 2026-11-02

> 計測時刻: 2026-11-03T22:28:37.043Z
> 前日比: 2026-11-01

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
| Requests | 68.45K | ▲ +8.4% ✅ |
| Errors | 85 | ▲ +25.0%  |
| Subrequests | 1.96K | ▲ +19.5%  |

**Error rate**: 0.12% (85/68453)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 78.36K | ▲ +26.6%  |
| Class B ops (reads) | 934.21K | ▲ +4.7%  |
| Egress | 159936MB | ▼ -6.3% ✅ |
| Storage | 43.45GB | ▲ +0.7%  |
| Objects | 134,729 | ▲ +2.8% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 2.37 | 7,750 | 107 | 710 | 128 |
| stats47 | 32.88 | 110,744 | 78.25K | 907.90K | 155118 |
| doboku-note | 0.91 | 12,108 | 0 | 18.89K | 143 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 7.29 | 4,127 | 0 | 6.71K | 4548 |

## History

Last 7 days (`data/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-10-27,0,0,0,0,0,76285,7,72,13935,799316,156624,41.745,129127
2026-10-28,0,0,0,0,0,78643,192,2153,33401,1138059,195943,42.594,130182
2026-10-29,0,0,0,0,0,71837,65,972,24126,593520,110395,42.860,130913
2026-10-30,0,0,0,0,0,93886,4,1628,17707,723369,151237,43.262,131223
2026-10-31,0,0,0,0,0,55696,5,1377,1188,319315,66168,43.244,131298
2026-11-01,0,0,0,0,0,63157,68,1639,61882,892102,170737,43.158,131123
2026-11-02,0,0,0,0,0,68453,85,1958,78355,934212,159936,43.448,134729
```
