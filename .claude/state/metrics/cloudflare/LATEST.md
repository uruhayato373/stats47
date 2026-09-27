# Cloudflare Usage — 2026-09-25

> 計測時刻: 2026-09-26T20:04:50.105Z
> 前日比: 2026-09-24

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
| Requests | 116.09K | ▼ -1.3%  |
| Errors | 70 | ▼ -32.0% ✅ |
| Subrequests | 233 | ▼ -86.2% ✅ |

**Error rate**: 0.06% (70/116089)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 7.78K | ▼ -57.0% ✅ |
| Class B ops (reads) | 398.07K | ▼ -27.4% ✅ |
| Egress | 91467MB | ▼ -18.7% ✅ |
| Storage | 33.08GB | ▲ +0.0%  |
| Objects | 111,507 | ▼ -0.2%  |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 0.06 | 686 | 24 | 42 | 13 |
| stats47 | 25.12 | 96,864 | 7.42K | 376.40K | 89687 |
| doboku-note | 0.90 | 10,946 | 339 | 21.27K | 1760 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 7.00 | 3,011 | 1 | 347 | 6 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-09-19,0,0,0,0,0,94541,40,1182,8715,407873,55575,32.917,110907
2026-09-20,0,0,0,0,0,92999,25,2029,7718,262040,46473,32.952,111098
2026-09-21,0,0,0,0,0,84223,88,1440,7019,290709,49518,32.872,110484
2026-09-22,0,0,0,0,0,69848,82,1408,5463,235003,45707,32.993,111510
2026-09-23,0,0,0,0,0,138466,133,1572,15308,652008,117461,33.156,111936
2026-09-24,0,0,0,0,0,117560,103,1691,18077,548557,112440,33.066,111682
2026-09-25,0,0,0,0,0,116089,70,233,7782,398066,91467,33.079,111507
```
