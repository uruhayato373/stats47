# Cloudflare Usage — 2026-09-17

> 計測時刻: 2026-09-18T19:53:45.755Z
> 前日比: 2026-09-16

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
| Requests | 123.03K | ▲ +17.1% ✅ |
| Errors | 89 | ▼ -95.1% ✅ |
| Subrequests | 2.81K | ▲ +60.0% ⚠️ |

**Error rate**: 0.07% (89/123028)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 9.29K | ▼ -45.4% ✅ |
| Class B ops (reads) | 372.63K | ▲ +31.3% ⚠️ |
| Egress | 71733MB | ▲ +11.7%  |
| Storage | 32.81GB | ▼ -0.8% ✅ |
| Objects | 110,571 | ▼ -1.3%  |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 0.03 | 631 | 0 | 0 | 0 |
| stats47 | 24.93 | 96,079 | 8.15K | 360.12K | 69379 |
| doboku-note | 0.90 | 10,922 | 0 | 10.11K | 907 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 6.96 | 2,939 | 1.14K | 2.39K | 1447 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-09-11,0,0,0,0,0,122768,142,1021,10065,336374,63786,29.852,82632
2026-09-12,0,0,0,0,0,67207,123,543,9682,279017,49400,32.179,100849
2026-09-13,0,0,0,0,0,96601,632,1610,27152,470812,68533,32.260,101521
2026-09-14,0,0,0,0,0,94328,1075,1265,7553,228700,54181,32.303,101734
2026-09-15,0,0,0,0,0,124832,1691,1151,8226,616417,99913,33.034,111412
2026-09-16,0,0,0,0,0,105025,1801,1757,16995,283741,64224,33.076,112001
2026-09-17,0,0,0,0,0,123028,89,2812,9287,372630,71733,32.815,110571
```
