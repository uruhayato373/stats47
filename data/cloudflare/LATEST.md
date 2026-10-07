# Cloudflare Usage — 2026-10-05

> 計測時刻: 2026-10-06T21:50:16.435Z
> 前日比: 2026-10-04

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
| Requests | 108.06K | ▲ +59.2% ✅ |
| Errors | 104 | ▲ +60.0% ⚠️ |
| Subrequests | 54 | ▲ +63.6% ⚠️ |

**Error rate**: 0.10% (104/108063)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 34.83K | ▲ +795.9% ⚠️ |
| Class B ops (reads) | 469.98K | ▲ +143.7% ⚠️ |
| Egress | 88343MB | ▲ +111.3% ⚠️ |
| Storage | 33.59GB | ▲ +0.6%  |
| Objects | 116,619 | ▲ +0.8% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 0.18 | 1,683 | 84 | 147 | 60 |
| stats47 | 25.79 | 100,484 | 30.59K | 425.47K | 87666 |
| doboku-note | 0.93 | 11,422 | 4.11K | 44.28K | 617 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 6.69 | 3,030 | 45 | 73 | 0 |

## History

Last 7 days (`data/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-09-29,0,0,0,0,0,93413,116,49,10170,325802,79628,33.356,115096
2026-09-30,0,0,0,0,0,117173,142,67,64579,716391,124624,33.174,114560
2026-10-01,0,0,0,0,0,91109,124,47,24218,585086,109641,33.258,115111
2026-10-02,0,0,0,0,0,80902,102,47,19559,358660,70106,33.338,115281
2026-10-03,0,0,0,0,0,115250,208,41,19043,455150,79503,33.386,115955
2026-10-04,0,0,0,0,0,67880,65,33,3888,192885,41814,33.399,115640
2026-10-05,0,0,0,0,0,108063,104,54,34831,469975,88343,33.592,116619
```
