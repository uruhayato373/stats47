# Cloudflare Usage — 2026-09-26

> 計測時刻: 2026-09-27T20:19:12.366Z
> 前日比: 2026-09-25

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
| Requests | 97.65K | ▼ -15.9%  |
| Errors | 185 | ▲ +164.3% ⚠️ |
| Subrequests | 50 | ▼ -78.5% ✅ |

**Error rate**: 0.19% (185/97647)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 11.29K | ▲ +45.1% ⚠️ |
| Class B ops (reads) | 442.80K | ▲ +11.2%  |
| Egress | 86233MB | ▼ -5.7% ✅ |
| Storage | 33.37GB | ▲ +0.9%  |
| Objects | 112,652 | ▲ +1.0% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 0.06 | 693 | 25 | 43 | 14 |
| stats47 | 25.41 | 98,004 | 11.27K | 436.05K | 86054 |
| doboku-note | 0.90 | 10,944 | 0 | 6.35K | 161 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 7.00 | 3,011 | 0 | 348 | 4 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-09-20,0,0,0,0,0,92999,25,2029,7718,262040,46473,32.952,111098
2026-09-21,0,0,0,0,0,84223,88,1440,7019,290709,49518,32.872,110484
2026-09-22,0,0,0,0,0,69848,82,1408,5463,235003,45707,32.993,111510
2026-09-23,0,0,0,0,0,138466,133,1572,15308,652008,117461,33.156,111936
2026-09-24,0,0,0,0,0,117560,103,1691,18077,548557,112440,33.066,111682
2026-09-25,0,0,0,0,0,116089,70,233,7782,398066,91467,33.079,111507
2026-09-26,0,0,0,0,0,97647,185,50,11291,442798,86233,33.368,112652
```
