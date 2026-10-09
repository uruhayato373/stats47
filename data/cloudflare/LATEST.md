# Cloudflare Usage — 2026-10-07

> 計測時刻: 2026-10-08T22:21:57.024Z
> 前日比: 2026-10-06

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
| Requests | 106.02K | ▲ +2.4% ✅ |
| Errors | 194 | ▼ -5.8% ✅ |
| Subrequests | 64 | ▲ +16.4%  |

**Error rate**: 0.18% (194/106021)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 70.28K | ▲ +78.0% ⚠️ |
| Class B ops (reads) | 881.51K | ▼ -22.6% ✅ |
| Egress | 169098MB | ▼ -15.4% ✅ |
| Storage | 33.90GB | ▲ +0.9%  |
| Objects | 118,333 | ▲ +1.3% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 0.18 | 1,695 | 118 | 203 | 80 |
| stats47 | 26.09 | 102,015 | 54.86K | 752.79K | 167706 |
| doboku-note | 0.93 | 11,593 | 15.25K | 128.08K | 1300 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 6.69 | 3,030 | 56 | 445 | 12 |

## History

Last 7 days (`data/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-10-01,0,0,0,0,0,91109,124,47,24218,585086,109641,33.258,115111
2026-10-02,0,0,0,0,0,80902,102,47,19559,358660,70106,33.338,115281
2026-10-03,0,0,0,0,0,115250,208,41,19043,455150,79503,33.386,115955
2026-10-04,0,0,0,0,0,67880,65,33,3888,192885,41814,33.399,115640
2026-10-05,0,0,0,0,0,108063,104,54,34831,469975,88343,33.592,116619
2026-10-06,0,0,0,0,0,103583,206,55,39490,1139598,199778,33.587,116829
2026-10-07,0,0,0,0,0,106021,194,64,70285,881513,169098,33.896,118333
```
