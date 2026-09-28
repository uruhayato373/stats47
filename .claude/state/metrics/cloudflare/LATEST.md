# Cloudflare Usage — 2026-09-27

> 計測時刻: 2026-09-28T22:38:36.218Z
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
| Requests | 86.17K | ▼ -25.8%  |
| Errors | 256 | ▲ +265.7% ⚠️ |
| Subrequests | 70 | ▼ -70.0% ✅ |

**Error rate**: 0.30% (256/86174)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 21.43K | ▲ +175.4% ⚠️ |
| Class B ops (reads) | 687.46K | ▲ +72.7% ⚠️ |
| Egress | 109911MB | ▲ +20.2%  |
| Storage | 33.31GB | ▲ +0.7%  |
| Objects | 111,989 | ▲ +0.4% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 0.07 | 701 | 105 | 186 | 59 |
| stats47 | 25.34 | 97,333 | 18.00K | 613.15K | 105664 |
| doboku-note | 0.90 | 10,944 | 3.32K | 73.77K | 4180 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 7.00 | 3,011 | 12 | 352 | 8 |

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
2026-09-27,0,0,0,0,0,86174,256,70,21434,687463,109911,33.310,111989
```
