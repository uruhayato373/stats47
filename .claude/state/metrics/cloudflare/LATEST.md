# Cloudflare Usage — 2026-09-28

> 計測時刻: 2026-09-29T21:31:56.740Z
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
| Requests | 91.96K | ▼ -20.8%  |
| Errors | 124 | ▲ +77.1% ⚠️ |
| Subrequests | 51 | ▼ -78.1% ✅ |

**Error rate**: 0.13% (124/91961)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 7.27K | ▼ -6.6% ✅ |
| Class B ops (reads) | 348.64K | ▼ -12.4% ✅ |
| Egress | 87338MB | ▼ -4.5% ✅ |
| Storage | 33.08GB | ▲ +0.0%  |
| Objects | 112,177 | ▲ +0.6% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 0.07 | 706 | 53 | 95 | 37 |
| stats47 | 25.43 | 97,516 | 6.17K | 333.78K | 86183 |
| doboku-note | 0.90 | 10,944 | 11 | 12.72K | 250 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 6.68 | 3,011 | 1.04K | 2.04K | 869 |

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
2026-09-28,0,0,0,0,0,91961,124,51,7267,348636,87338,33.084,112177
```
