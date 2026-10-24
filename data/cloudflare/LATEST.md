# Cloudflare Usage — 2026-10-23

> 計測時刻: 2026-10-24T19:41:11.907Z
> 前日比: 2026-10-22

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
| Requests | 86.08K | ▲ +0.4% ✅ |
| Errors | 40 | ▼ -32.2% ✅ |
| Subrequests | 664 | ▲ +191.2% ⚠️ |

**Error rate**: 0.05% (40/86075)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 13.24K | ▼ -56.7% ✅ |
| Class B ops (reads) | 839.61K | ▲ +23.3%  |
| Egress | 152506MB | ▲ +2.8%  |
| Storage | 37.92GB | ▲ +0.8%  |
| Objects | 127,321 | ▲ +0.3% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 2.20 | 6,693 | 732 | 5.80K | 6024 |
| stats47 | 27.80 | 105,798 | 12.47K | 816.30K | 144331 |
| doboku-note | 0.89 | 10,746 | 0 | 14.60K | 176 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 7.03 | 4,084 | 32 | 2.92K | 1975 |

## History

Last 7 days (`data/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-10-17,0,0,0,0,0,81896,51,540,12225,680649,116447,34.924,124647
2026-10-18,0,0,0,0,0,49345,25,478,15143,607191,82314,35.159,127135
2026-10-19,0,0,0,0,0,85167,90,317,14430,964212,152967,34.854,122829
2026-10-20,0,0,0,0,0,62561,11,276,7587,664002,130567,35.059,125055
2026-10-21,0,0,0,0,0,65168,32,218,12712,865382,167044,36.487,124744
2026-10-22,0,0,0,0,0,85765,59,228,30536,680759,148403,37.601,126914
2026-10-23,0,0,0,0,0,86075,40,664,13237,839612,152506,37.920,127321
```
