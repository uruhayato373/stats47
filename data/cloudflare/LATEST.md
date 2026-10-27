# Cloudflare Usage — 2026-10-26

> 計測時刻: 2026-10-27T21:27:43.283Z
> 前日比: 2026-10-25

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
| Requests | 79.97K | ▲ +41.6% ✅ |
| Errors | 4 | ▼ -60.0% ✅ |
| Subrequests | 508 | ▲ +140.8% ⚠️ |

**Error rate**: 0.01% (4/79966)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 14.41K | ▲ +279.5% ⚠️ |
| Class B ops (reads) | 1.08M | ▲ +143.4% ⚠️ |
| Egress | 198874MB | ▲ +113.7% ⚠️ |
| Storage | 41.21GB | ▲ +3.2%  |
| Objects | 127,218 | ▼ -1.0%  |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 2.31 | 6,821 | 87 | 220 | 279 |
| stats47 | 30.82 | 104,394 | 14.23K | 1.04M | 186736 |
| doboku-note | 0.90 | 11,903 | 82 | 22.86K | 213 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 7.18 | 4,100 | 16 | 16.70K | 11646 |

## History

Last 7 days (`data/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-10-20,0,0,0,0,0,62561,11,276,7587,664002,130567,35.059,125055
2026-10-21,0,0,0,0,0,65168,32,218,12712,865382,167044,36.487,124744
2026-10-22,0,0,0,0,0,85765,59,228,30536,680759,148403,37.601,126914
2026-10-23,0,0,0,0,0,86075,40,664,13237,839612,152506,37.920,127321
2026-10-24,0,0,0,0,0,143318,8,598,6596,952980,138351,37.939,127032
2026-10-25,0,0,0,0,0,56457,10,211,3798,444138,93060,39.915,128508
2026-10-26,0,0,0,0,0,79966,4,508,14414,1081199,198874,41.207,127218
```
