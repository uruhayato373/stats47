# Cloudflare Usage — 2026-10-02

> 計測時刻: 2026-10-03T20:05:52.604Z
> 前日比: 2026-09-29

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
| Requests | 80.90K | ▼ -13.4%  |
| Errors | 102 | ▼ -12.1% ✅ |
| Subrequests | 47 | ▼ -4.1% ✅ |

**Error rate**: 0.13% (102/80902)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 19.56K | ▲ +92.3% ⚠️ |
| Class B ops (reads) | 358.66K | ▲ +10.1%  |
| Egress | 70106MB | ▼ -12.0% ✅ |
| Storage | 33.34GB | ▼ -0.1% ✅ |
| Objects | 115,281 | ▲ +0.2% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 0.16 | 1,665 | 617 | 2.87K | 263 |
| stats47 | 25.55 | 99,168 | 8.73K | 285.19K | 69034 |
| doboku-note | 0.93 | 11,418 | 10.19K | 70.21K | 804 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 6.69 | 3,030 | 25 | 395 | 4 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-09-24,0,0,0,0,0,117560,103,1691,18077,548557,112440,33.066,111682
2026-09-25,0,0,0,0,0,116089,70,233,7782,398066,91467,33.079,111507
2026-09-26,0,0,0,0,0,97647,185,50,11291,442798,86233,33.368,112652
2026-09-27,0,0,0,0,0,86174,256,70,21434,687463,109911,33.310,111989
2026-09-28,0,0,0,0,0,91961,124,51,7267,348636,87338,33.084,112177
2026-09-29,0,0,0,0,0,93413,116,49,10170,325802,79628,33.356,115096
2026-10-02,0,0,0,0,0,80902,102,47,19559,358660,70106,33.338,115281
```
