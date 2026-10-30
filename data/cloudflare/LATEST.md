# Cloudflare Usage — 2026-10-28

> 計測時刻: 2026-10-29T21:56:17.105Z
> 前日比: 2026-10-27

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
| Requests | 78.64K | ▲ +3.1% ✅ |
| Errors | 192 | ▲ +2642.9% ⚠️ |
| Subrequests | 2.15K | ▲ +2890.3% ⚠️ |

**Error rate**: 0.24% (192/78643)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 33.40K | ▲ +139.7% ⚠️ |
| Class B ops (reads) | 1.14M | ▲ +42.4% ⚠️ |
| Egress | 195943MB | ▲ +25.1%  |
| Storage | 42.59GB | ▲ +2.0%  |
| Objects | 130,182 | ▲ +0.8% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 2.32 | 7,611 | 762 | 2.02K | 22 |
| stats47 | 32.10 | 106,350 | 32.29K | 1.11M | 190818 |
| doboku-note | 0.91 | 12,104 | 224 | 22.78K | 425 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 7.26 | 4,117 | 120 | 5.31K | 4678 |

## History

Last 7 days (`data/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-10-22,0,0,0,0,0,85765,59,228,30536,680759,148403,37.601,126914
2026-10-23,0,0,0,0,0,86075,40,664,13237,839612,152506,37.920,127321
2026-10-24,0,0,0,0,0,143318,8,598,6596,952980,138351,37.939,127032
2026-10-25,0,0,0,0,0,56457,10,211,3798,444138,93060,39.915,128508
2026-10-26,0,0,0,0,0,79966,4,508,14414,1081199,198874,41.207,127218
2026-10-27,0,0,0,0,0,76285,7,72,13935,799316,156624,41.745,129127
2026-10-28,0,0,0,0,0,78643,192,2153,33401,1138059,195943,42.594,130182
```
