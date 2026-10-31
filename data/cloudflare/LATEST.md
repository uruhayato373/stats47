# Cloudflare Usage — 2026-10-29

> 計測時刻: 2026-10-30T21:39:54.155Z
> 前日比: 2026-10-28

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
| Requests | 71.84K | ▼ -8.7%  |
| Errors | 65 | ▼ -66.1% ✅ |
| Subrequests | 972 | ▼ -54.9% ✅ |

**Error rate**: 0.09% (65/71837)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 24.13K | ▼ -27.8% ✅ |
| Class B ops (reads) | 593.52K | ▼ -47.8% ✅ |
| Egress | 110395MB | ▼ -43.7% ✅ |
| Storage | 42.86GB | ▲ +0.6%  |
| Objects | 130,913 | ▲ +0.6% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 2.32 | 7,611 | 1 | 2 | 0 |
| stats47 | 32.39 | 107,082 | 24.13K | 580.67K | 108879 |
| doboku-note | 0.91 | 12,104 | 0 | 10.94K | 195 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 7.24 | 4,116 | 0 | 1.92K | 1321 |

## History

Last 7 days (`data/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-10-23,0,0,0,0,0,86075,40,664,13237,839612,152506,37.920,127321
2026-10-24,0,0,0,0,0,143318,8,598,6596,952980,138351,37.939,127032
2026-10-25,0,0,0,0,0,56457,10,211,3798,444138,93060,39.915,128508
2026-10-26,0,0,0,0,0,79966,4,508,14414,1081199,198874,41.207,127218
2026-10-27,0,0,0,0,0,76285,7,72,13935,799316,156624,41.745,129127
2026-10-28,0,0,0,0,0,78643,192,2153,33401,1138059,195943,42.594,130182
2026-10-29,0,0,0,0,0,71837,65,972,24126,593520,110395,42.860,130913
```
