# Cloudflare Usage — 2026-10-04

> 計測時刻: 2026-10-05T23:17:58.265Z
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
| Requests | 67.88K | ▼ -27.3%  |
| Errors | 65 | ▼ -44.0% ✅ |
| Subrequests | 33 | ▼ -32.7% ✅ |

**Error rate**: 0.10% (65/67880)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 3.89K | ▼ -61.8% ✅ |
| Class B ops (reads) | 192.88K | ▼ -40.8% ✅ |
| Egress | 41814MB | ▼ -47.5% ✅ |
| Storage | 33.40GB | ▲ +0.1%  |
| Objects | 115,640 | ▲ +0.5% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 0.17 | 1,677 | 29 | 58 | 22 |
| stats47 | 25.60 | 99,515 | 3.52K | 180.71K | 41648 |
| doboku-note | 0.93 | 11,418 | 317 | 11.74K | 140 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 6.69 | 3,030 | 24 | 381 | 4 |

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
2026-10-04,0,0,0,0,0,67880,65,33,3888,192885,41814,33.399,115640
```
