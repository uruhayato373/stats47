# Cloudflare Usage — 2026-08-07

> 計測時刻: 2026-08-08T17:58:03.138Z
> 前日比: 2026-08-04

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
| Requests | 48.06K | ▼ -24.6%  |
| Errors | 0 | → |
| Subrequests | 6.44K | ▼ -52.2% ✅ |

**Error rate**: 0.00% (0/48061)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 3.70K | ▼ -59.4% ✅ |
| Class B ops (reads) | 225.72K | ▼ -4.7% ✅ |
| Egress | 89630MB | ▲ +32.9% ⚠️ |
| Storage | 15.58GB | ▼ -0.7% ✅ |
| Objects | 58,168 | ▼ -0.9%  |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 11.58 | 48,873 | 3.70K | 223.42K | 89357 |
| doboku-note | 2.34 | 9,000 | 0 | 2.30K | 273 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 1.67 | 295 | 0 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-07-30,0,0,0,0,0,46282,1,11001,15657,211862,46543,15.723,56064
2026-07-31,0,0,0,0,0,43562,0,10953,8125,202130,41445,15.718,55925
2026-08-01,0,0,0,0,0,35250,0,9854,971,171979,48197,15.751,57390
2026-08-02,0,0,0,0,0,32161,0,4641,29729,247682,53773,15.611,57123
2026-08-03,0,0,0,0,0,58689,0,11662,9461,188243,61842,15.719,57501
2026-08-04,0,0,0,0,0,63781,0,13479,9127,236759,67420,15.697,58691
2026-08-07,0,0,0,0,0,48061,0,6440,3704,225720,89630,15.584,58168
```
