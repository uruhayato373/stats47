# Cloudflare Usage — 2026-09-30

> 計測時刻: 2026-10-01T21:56:12.916Z
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
| Requests | 117.17K | ▲ +25.4% ✅ |
| Errors | 142 | ▲ +22.4%  |
| Subrequests | 67 | ▲ +36.7% ⚠️ |

**Error rate**: 0.12% (142/117173)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 64.58K | ▲ +535.0% ⚠️ |
| Class B ops (reads) | 716.39K | ▲ +119.9% ⚠️ |
| Egress | 124624MB | ▲ +56.5% ⚠️ |
| Storage | 33.17GB | ▼ -0.5% ✅ |
| Objects | 114,560 | ▼ -0.5%  |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 0.08 | 727 | 141 | 229 | 93 |
| stats47 | 25.49 | 99,574 | 54.03K | 587.10K | 123347 |
| doboku-note | 0.91 | 11,233 | 10.40K | 128.70K | 1164 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 6.69 | 3,026 | 9 | 368 | 19 |

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
2026-09-30,0,0,0,0,0,117173,142,67,64579,716391,124624,33.174,114560
```
