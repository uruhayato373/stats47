# Cloudflare Usage — 2026-08-01

> 計測時刻: 2026-08-02T18:29:57.953Z
> 前日比: 2026-07-31

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
| Requests | 35.25K | ▼ -19.1%  |
| Errors | 0 | → |
| Subrequests | 9.85K | ▼ -10.0% ✅ |

**Error rate**: 0.00% (0/35250)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 971 | ▼ -88.0% ✅ |
| Class B ops (reads) | 171.98K | ▼ -14.9% ✅ |
| Egress | 48197MB | ▲ +16.3%  |
| Storage | 15.75GB | ▲ +0.2%  |
| Objects | 57,390 | ▲ +2.6% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 11.75 | 48,222 | 971 | 170.46K | 47978 |
| doboku-note | 2.34 | 8,873 | 0 | 1.52K | 218 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 1.67 | 295 | 0 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-07-26,0,0,0,0,0,40106,0,7055,1316,162881,36436,25.531,82016
2026-07-27,0,0,0,0,0,49767,1,8720,25724,191019,60583,15.855,53694
2026-07-28,0,0,0,0,0,43273,3,8106,1899,109651,44397,16.089,55538
2026-07-29,0,0,0,0,0,45163,2,9036,7344,232174,62611,16.109,55722
2026-07-30,0,0,0,0,0,46282,1,11001,15657,211862,46543,15.723,56064
2026-07-31,0,0,0,0,0,43562,0,10953,8125,202130,41445,15.718,55925
2026-08-01,0,0,0,0,0,35250,0,9854,971,171979,48197,15.751,57390
```
