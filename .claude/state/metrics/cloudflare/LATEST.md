# Cloudflare Usage — 2026-09-20

> 計測時刻: 2026-09-21T21:12:44.530Z
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
| Requests | 93.00K | ▼ -1.6%  |
| Errors | 25 | ▼ -37.5% ✅ |
| Subrequests | 2.03K | ▲ +71.7% ⚠️ |

**Error rate**: 0.03% (25/92999)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 7.72K | ▼ -11.4% ✅ |
| Class B ops (reads) | 262.04K | ▼ -35.8% ✅ |
| Egress | 46473MB | ▼ -16.4% ✅ |
| Storage | 32.95GB | ▲ +0.1%  |
| Objects | 111,098 | ▲ +0.2% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 0.04 | 664 | 0 | 0 | 0 |
| stats47 | 25.02 | 96,506 | 5.27K | 237.27K | 45105 |
| doboku-note | 0.90 | 10,922 | 2.16K | 24.05K | 973 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 6.99 | 3,006 | 283 | 723 | 395 |

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
2026-09-20,0,0,0,0,0,92999,25,2029,7718,262040,46473,32.952,111098
```
