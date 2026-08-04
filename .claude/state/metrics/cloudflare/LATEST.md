# Cloudflare Usage — 2026-08-03

> 計測時刻: 2026-08-04T19:07:50.462Z
> 前日比: 2026-08-02

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
| Requests | 58.69K | ▲ +82.5% ✅ |
| Errors | 0 | → |
| Subrequests | 11.66K | ▲ +151.3% ⚠️ |

**Error rate**: 0.00% (0/58689)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 9.46K | ▼ -68.2% ✅ |
| Class B ops (reads) | 188.24K | ▼ -24.0% ✅ |
| Egress | 61842MB | ▲ +15.0%  |
| Storage | 15.72GB | ▲ +0.7%  |
| Objects | 57,501 | ▲ +0.7% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 11.71 | 48,205 | 2.25K | 185.26K | 59853 |
| doboku-note | 2.34 | 9,001 | 7.21K | 2.98K | 1989 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 1.67 | 295 | 0 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-07-28,0,0,0,0,0,43273,3,8106,1899,109651,44397,16.089,55538
2026-07-29,0,0,0,0,0,45163,2,9036,7344,232174,62611,16.109,55722
2026-07-30,0,0,0,0,0,46282,1,11001,15657,211862,46543,15.723,56064
2026-07-31,0,0,0,0,0,43562,0,10953,8125,202130,41445,15.718,55925
2026-08-01,0,0,0,0,0,35250,0,9854,971,171979,48197,15.751,57390
2026-08-02,0,0,0,0,0,32161,0,4641,29729,247682,53773,15.611,57123
2026-08-03,0,0,0,0,0,58689,0,11662,9461,188243,61842,15.719,57501
```
