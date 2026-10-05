# Cloudflare Usage — 2026-10-03

> 計測時刻: 2026-10-04T20:22:25.507Z
> 前日比: 2026-10-02

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
| Requests | 115.25K | ▲ +42.5% ✅ |
| Errors | 208 | ▲ +103.9% ⚠️ |
| Subrequests | 41 | ▼ -12.8% ✅ |

**Error rate**: 0.18% (208/115250)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 19.04K | ▼ -2.6% ✅ |
| Class B ops (reads) | 455.15K | ▲ +26.9%  |
| Egress | 79503MB | ▲ +13.4%  |
| Storage | 33.39GB | ▲ +0.1%  |
| Objects | 115,955 | ▲ +0.6% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 0.16 | 1,671 | 424 | 6.76K | 545 |
| stats47 | 25.60 | 99,836 | 11.60K | 405.29K | 78164 |
| doboku-note | 0.93 | 11,418 | 6.98K | 42.69K | 772 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 6.69 | 3,030 | 47 | 408 | 23 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-09-27,0,0,0,0,0,86174,256,70,21434,687463,109911,33.310,111989
2026-09-28,0,0,0,0,0,91961,124,51,7267,348636,87338,33.084,112177
2026-09-29,0,0,0,0,0,93413,116,49,10170,325802,79628,33.356,115096
2026-09-30,0,0,0,0,0,117173,142,67,64579,716391,124624,33.174,114560
2026-10-01,0,0,0,0,0,91109,124,47,24218,585086,109641,33.258,115111
2026-10-02,0,0,0,0,0,80902,102,47,19559,358660,70106,33.338,115281
2026-10-03,0,0,0,0,0,115250,208,41,19043,455150,79503,33.386,115955
```
