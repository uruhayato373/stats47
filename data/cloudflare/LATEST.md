# Cloudflare Usage — 2026-10-24

> 計測時刻: 2026-10-25T19:53:37.774Z
> 前日比: 2026-10-23

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
| Requests | 143.32K | ▲ +66.5% ✅ |
| Errors | 8 | ▼ -80.0% ✅ |
| Subrequests | 598 | ▼ -9.9% ✅ |

**Error rate**: 0.01% (8/143318)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 6.60K | ▼ -50.2% ✅ |
| Class B ops (reads) | 952.98K | ▲ +13.5%  |
| Egress | 138351MB | ▼ -9.3% ✅ |
| Storage | 37.94GB | ▲ +0.1%  |
| Objects | 127,032 | ▼ -0.2%  |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 2.21 | 6,726 | 311 | 2.13K | 1013 |
| stats47 | 27.81 | 105,476 | 6.24K | 924.91K | 130939 |
| doboku-note | 0.89 | 10,746 | 11 | 16.90K | 255 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 7.03 | 4,084 | 32 | 9.04K | 6143 |

## History

Last 7 days (`data/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-10-18,0,0,0,0,0,49345,25,478,15143,607191,82314,35.159,127135
2026-10-19,0,0,0,0,0,85167,90,317,14430,964212,152967,34.854,122829
2026-10-20,0,0,0,0,0,62561,11,276,7587,664002,130567,35.059,125055
2026-10-21,0,0,0,0,0,65168,32,218,12712,865382,167044,36.487,124744
2026-10-22,0,0,0,0,0,85765,59,228,30536,680759,148403,37.601,126914
2026-10-23,0,0,0,0,0,86075,40,664,13237,839612,152506,37.920,127321
2026-10-24,0,0,0,0,0,143318,8,598,6596,952980,138351,37.939,127032
```
