# Cloudflare Usage — 2026-10-27

> 計測時刻: 2026-10-28T21:49:57.075Z
> 前日比: 2026-10-26

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
| Requests | 76.28K | ▼ -4.6%  |
| Errors | 7 | ▲ +75.0% ⚠️ |
| Subrequests | 72 | ▼ -85.8% ✅ |

**Error rate**: 0.01% (7/76285)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 13.94K | ▼ -3.3% ✅ |
| Class B ops (reads) | 799.32K | ▼ -26.1% ✅ |
| Egress | 156624MB | ▼ -21.2% ✅ |
| Storage | 41.75GB | ▲ +1.3%  |
| Objects | 129,127 | ▲ +1.5% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 2.32 | 7,610 | 21 | 106 | 158 |
| stats47 | 31.21 | 105,292 | 13.88K | 773.41K | 146198 |
| doboku-note | 0.91 | 12,104 | 0 | 12.11K | 219 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 7.31 | 4,121 | 31 | 13.69K | 10049 |

## History

Last 7 days (`data/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-10-21,0,0,0,0,0,65168,32,218,12712,865382,167044,36.487,124744
2026-10-22,0,0,0,0,0,85765,59,228,30536,680759,148403,37.601,126914
2026-10-23,0,0,0,0,0,86075,40,664,13237,839612,152506,37.920,127321
2026-10-24,0,0,0,0,0,143318,8,598,6596,952980,138351,37.939,127032
2026-10-25,0,0,0,0,0,56457,10,211,3798,444138,93060,39.915,128508
2026-10-26,0,0,0,0,0,79966,4,508,14414,1081199,198874,41.207,127218
2026-10-27,0,0,0,0,0,76285,7,72,13935,799316,156624,41.745,129127
```
