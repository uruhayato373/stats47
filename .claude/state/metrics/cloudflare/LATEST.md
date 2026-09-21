# Cloudflare Usage — 2026-09-19

> 計測時刻: 2026-09-20T19:40:34.751Z
> 前日比: 2026-09-18

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
| Requests | 94.54K | ▼ -14.8%  |
| Errors | 40 | ▼ -65.8% ✅ |
| Subrequests | 1.18K | ▼ -40.1% ✅ |

**Error rate**: 0.04% (40/94541)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 8.71K | ▲ +14.5%  |
| Class B ops (reads) | 407.87K | ▲ +35.4% ⚠️ |
| Egress | 55575MB | ▲ +3.6%  |
| Storage | 32.92GB | ▲ +0.1%  |
| Objects | 110,907 | ▼ -0.2%  |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 0.03 | 631 | 0 | 0 | 0 |
| stats47 | 24.99 | 96,369 | 8.35K | 391.93K | 52953 |
| doboku-note | 0.90 | 10,922 | 338 | 15.56K | 2580 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 6.99 | 2,985 | 23 | 390 | 42 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-09-13,0,0,0,0,0,96601,632,1610,27152,470812,68533,32.260,101521
2026-09-14,0,0,0,0,0,94328,1075,1265,7553,228700,54181,32.303,101734
2026-09-15,0,0,0,0,0,124832,1691,1151,8226,616417,99913,33.034,111412
2026-09-16,0,0,0,0,0,105025,1801,1757,16995,283741,64224,33.076,112001
2026-09-17,0,0,0,0,0,123028,89,2812,9287,372630,71733,32.815,110571
2026-09-18,0,0,0,0,0,110908,117,1974,7610,301148,53649,32.876,111101
2026-09-19,0,0,0,0,0,94541,40,1182,8715,407873,55575,32.917,110907
```
