# Cloudflare Usage — 2026-09-23

> 計測時刻: 2026-09-24T20:40:53.920Z
> 前日比: 2026-09-22

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
| Requests | 138.47K | ▲ +98.2% ✅ |
| Errors | 133 | ▲ +62.2% ⚠️ |
| Subrequests | 1.57K | ▲ +11.6%  |

**Error rate**: 0.10% (133/138466)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 15.31K | ▲ +180.2% ⚠️ |
| Class B ops (reads) | 652.01K | ▲ +177.4% ⚠️ |
| Egress | 117461MB | ▲ +157.0% ⚠️ |
| Storage | 33.16GB | ▲ +0.5%  |
| Objects | 111,936 | ▲ +0.4% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 0.05 | 676 | 24 | 42 | 13 |
| stats47 | 25.21 | 97,311 | 14.92K | 631.85K | 108802 |
| doboku-note | 0.90 | 10,938 | 322 | 19.69K | 3075 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 7.00 | 3,011 | 41 | 425 | 5572 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-09-17,0,0,0,0,0,123028,89,2812,9287,372630,71733,32.815,110571
2026-09-18,0,0,0,0,0,110908,117,1974,7610,301148,53649,32.876,111101
2026-09-19,0,0,0,0,0,94541,40,1182,8715,407873,55575,32.917,110907
2026-09-20,0,0,0,0,0,92999,25,2029,7718,262040,46473,32.952,111098
2026-09-21,0,0,0,0,0,84223,88,1440,7019,290709,49518,32.872,110484
2026-09-22,0,0,0,0,0,69848,82,1408,5463,235003,45707,32.993,111510
2026-09-23,0,0,0,0,0,138466,133,1572,15308,652008,117461,33.156,111936
```
