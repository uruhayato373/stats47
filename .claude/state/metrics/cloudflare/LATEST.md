# Cloudflare Usage — 2026-09-02

> 計測時刻: 2026-09-03T20:02:48.189Z
> 前日比: 2026-09-01

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
| Requests | 65.99K | ▼ -0.6%  |
| Errors | 0 | → |
| Subrequests | 724 | ▼ -47.8% ✅ |

**Error rate**: 0.00% (0/65993)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 4.87K | ▼ -34.5% ✅ |
| Class B ops (reads) | 145.15K | ▼ -36.9% ✅ |
| Egress | 34715MB | ▼ -39.1% ✅ |
| Storage | 26.73GB | ▲ +0.3%  |
| Objects | 79,053 | ▲ +0.4% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 0.03 | 631 | 0 | 0 | 0 |
| stats47 | 15.25 | 63,814 | 4.87K | 140.61K | 34160 |
| doboku-note | 1.70 | 6,752 | 0 | 4.54K | 554 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 9.75 | 7,856 | 0 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-08-27,0,0,0,0,0,56307,0,845,44040,395892,98011,22.062,67145
2026-08-28,0,0,0,0,0,68693,0,1633,18071,302741,53651,22.857,67541
2026-08-29,0,0,0,0,0,55692,0,1229,9963,285878,57066,23.700,73259
2026-08-30,0,0,0,0,0,60853,0,942,19900,323054,69823,26.558,78011
2026-08-31,0,0,0,0,0,64732,0,1070,26377,326455,57100,26.582,78164
2026-09-01,0,0,0,0,0,66365,0,1388,7427,229939,56971,26.661,78701
2026-09-02,0,0,0,0,0,65993,0,724,4866,145152,34715,26.729,79053
```
