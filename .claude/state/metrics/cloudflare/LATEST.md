# Cloudflare Usage — 2026-09-22

> 計測時刻: 2026-09-23T20:38:00.179Z
> 前日比: 2026-09-21

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
| Requests | 69.85K | ▼ -17.1%  |
| Errors | 82 | ▼ -6.8% ✅ |
| Subrequests | 1.41K | ▼ -2.2% ✅ |

**Error rate**: 0.12% (82/69848)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 5.46K | ▼ -22.2% ✅ |
| Class B ops (reads) | 235.00K | ▼ -19.2% ✅ |
| Egress | 45707MB | ▼ -7.7% ✅ |
| Storage | 32.99GB | ▲ +0.4%  |
| Objects | 111,510 | ▲ +0.9% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 0.04 | 672 | 24 | 42 | 13 |
| stats47 | 25.05 | 96,889 | 4.40K | 211.17K | 44740 |
| doboku-note | 0.90 | 10,938 | 1.03K | 23.43K | 939 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 7.00 | 3,011 | 9 | 361 | 15 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-09-16,0,0,0,0,0,105025,1801,1757,16995,283741,64224,33.076,112001
2026-09-17,0,0,0,0,0,123028,89,2812,9287,372630,71733,32.815,110571
2026-09-18,0,0,0,0,0,110908,117,1974,7610,301148,53649,32.876,111101
2026-09-19,0,0,0,0,0,94541,40,1182,8715,407873,55575,32.917,110907
2026-09-20,0,0,0,0,0,92999,25,2029,7718,262040,46473,32.952,111098
2026-09-21,0,0,0,0,0,84223,88,1440,7019,290709,49518,32.872,110484
2026-09-22,0,0,0,0,0,69848,82,1408,5463,235003,45707,32.993,111510
```
