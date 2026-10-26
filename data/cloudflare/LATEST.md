# Cloudflare Usage — 2026-10-25

> 計測時刻: 2026-10-26T21:47:10.440Z
> 前日比: 2026-10-24

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
| Requests | 56.46K | ▼ -60.6% ⚠️ |
| Errors | 10 | ▲ +25.0%  |
| Subrequests | 211 | ▼ -64.7% ✅ |

**Error rate**: 0.02% (10/56457)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 3.80K | ▼ -42.4% ✅ |
| Class B ops (reads) | 444.14K | ▼ -53.4% ✅ |
| Egress | 93060MB | ▼ -32.7% ✅ |
| Storage | 39.92GB | ▲ +5.2%  |
| Objects | 128,508 | ▲ +1.2% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 2.31 | 6,813 | 0 | 4 | 0 |
| stats47 | 29.65 | 105,721 | 2.63K | 419.63K | 87953 |
| doboku-note | 0.90 | 11,887 | 1.17K | 17.64K | 220 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 7.05 | 4,087 | 0 | 6.87K | 4887 |

## History

Last 7 days (`data/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-10-19,0,0,0,0,0,85167,90,317,14430,964212,152967,34.854,122829
2026-10-20,0,0,0,0,0,62561,11,276,7587,664002,130567,35.059,125055
2026-10-21,0,0,0,0,0,65168,32,218,12712,865382,167044,36.487,124744
2026-10-22,0,0,0,0,0,85765,59,228,30536,680759,148403,37.601,126914
2026-10-23,0,0,0,0,0,86075,40,664,13237,839612,152506,37.920,127321
2026-10-24,0,0,0,0,0,143318,8,598,6596,952980,138351,37.939,127032
2026-10-25,0,0,0,0,0,56457,10,211,3798,444138,93060,39.915,128508
```
