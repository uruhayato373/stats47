# Cloudflare Usage — 2026-09-21

> 計測時刻: 2026-09-22T20:22:38.909Z
> 前日比: 2026-09-19

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
| Requests | 84.22K | ▼ -10.9%  |
| Errors | 88 | ▲ +120.0% ⚠️ |
| Subrequests | 1.44K | ▲ +21.8%  |

**Error rate**: 0.10% (88/84223)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 7.02K | ▼ -19.5% ✅ |
| Class B ops (reads) | 290.71K | ▼ -28.7% ✅ |
| Egress | 49518MB | ▼ -10.9% ✅ |
| Storage | 32.87GB | ▼ -0.1% ✅ |
| Objects | 110,484 | ▼ -0.4%  |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 0.04 | 668 | 286 | 526 | 134 |
| stats47 | 24.93 | 95,867 | 6.63K | 280.44K | 47855 |
| doboku-note | 0.90 | 10,938 | 0 | 9.23K | 1522 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 7.00 | 3,011 | 103 | 512 | 7 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-09-14,0,0,0,0,0,94328,1075,1265,7553,228700,54181,32.303,101734
2026-09-15,0,0,0,0,0,124832,1691,1151,8226,616417,99913,33.034,111412
2026-09-16,0,0,0,0,0,105025,1801,1757,16995,283741,64224,33.076,112001
2026-09-17,0,0,0,0,0,123028,89,2812,9287,372630,71733,32.815,110571
2026-09-18,0,0,0,0,0,110908,117,1974,7610,301148,53649,32.876,111101
2026-09-19,0,0,0,0,0,94541,40,1182,8715,407873,55575,32.917,110907
2026-09-21,0,0,0,0,0,84223,88,1440,7019,290709,49518,32.872,110484
```
