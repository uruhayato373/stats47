# Cloudflare Usage — 2026-09-18

> 計測時刻: 2026-09-19T19:29:34.094Z
> 前日比: 2026-09-17

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
| Requests | 110.91K | ▼ -9.9%  |
| Errors | 117 | ▲ +31.5% ⚠️ |
| Subrequests | 1.97K | ▼ -29.8% ✅ |

**Error rate**: 0.11% (117/110908)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 7.61K | ▼ -18.1% ✅ |
| Class B ops (reads) | 301.15K | ▼ -19.2% ✅ |
| Egress | 53649MB | ▼ -25.2% ✅ |
| Storage | 32.88GB | ▲ +0.2%  |
| Objects | 111,101 | ▲ +0.5% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 0.03 | 631 | 0 | 0 | 0 |
| stats47 | 24.97 | 96,591 | 6.85K | 282.90K | 52714 |
| doboku-note | 0.90 | 10,922 | 650 | 17.73K | 906 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 6.97 | 2,957 | 111 | 522 | 28 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-09-12,0,0,0,0,0,67207,123,543,9682,279017,49400,32.179,100849
2026-09-13,0,0,0,0,0,96601,632,1610,27152,470812,68533,32.260,101521
2026-09-14,0,0,0,0,0,94328,1075,1265,7553,228700,54181,32.303,101734
2026-09-15,0,0,0,0,0,124832,1691,1151,8226,616417,99913,33.034,111412
2026-09-16,0,0,0,0,0,105025,1801,1757,16995,283741,64224,33.076,112001
2026-09-17,0,0,0,0,0,123028,89,2812,9287,372630,71733,32.815,110571
2026-09-18,0,0,0,0,0,110908,117,1974,7610,301148,53649,32.876,111101
```
