# Cloudflare Usage — 2026-07-30

> 計測時刻: 2026-07-31T18:53:39.807Z
> 前日比: 2026-07-29

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
| Requests | 46.28K | ▲ +2.5% ✅ |
| Errors | 1 | ▼ -50.0% ✅ |
| Subrequests | 11.00K | ▲ +21.7%  |

**Error rate**: 0.00% (1/46282)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 15.66K | ▲ +113.2% ⚠️ |
| Class B ops (reads) | 211.86K | ▼ -8.7% ✅ |
| Egress | 46543MB | ▼ -25.7% ✅ |
| Storage | 15.72GB | ▼ -2.4% ✅ |
| Objects | 56,064 | ▲ +0.6% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 11.72 | 46,817 | 15.66K | 209.25K | 46142 |
| doboku-note | 2.34 | 8,952 | 0 | 2.61K | 401 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 1.67 | 295 | 0 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-07-24,0,0,0,0,0,49608,0,16955,6935,242107,72927,25.308,80563
2026-07-25,0,0,0,0,0,35824,0,10081,4234,134099,33316,25.463,81506
2026-07-26,0,0,0,0,0,40106,0,7055,1316,162881,36436,25.531,82016
2026-07-27,0,0,0,0,0,49767,1,8720,25724,191019,60583,15.855,53694
2026-07-28,0,0,0,0,0,43273,3,8106,1899,109651,44397,16.089,55538
2026-07-29,0,0,0,0,0,45163,2,9036,7344,232174,62611,16.109,55722
2026-07-30,0,0,0,0,0,46282,1,11001,15657,211862,46543,15.723,56064
```
