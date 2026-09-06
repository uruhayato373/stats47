# Cloudflare Usage — 2026-09-05

> 計測時刻: 2026-09-06T19:26:13.466Z
> 前日比: 2026-09-04

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
| Requests | 75.83K | ▼ -38.9% ⚠️ |
| Errors | 0 | → |
| Subrequests | 644 | ▼ -61.5% ✅ |

**Error rate**: 0.00% (0/75828)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 39.32K | ▲ +216.8% ⚠️ |
| Class B ops (reads) | 518.63K | ▲ +25.9%  |
| Egress | 87142MB | ▲ +1.7%  |
| Storage | 23.11GB | ▼ -27.3% ✅ |
| Objects | 71,833 | ▼ -14.7%  |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 0.03 | 631 | 85 | 191 | 2 |
| stats47 | 18.05 | 63,693 | 30.54K | 474.01K | 75719 |
| doboku-note | 1.13 | 6,168 | 2.59K | 13.10K | 1253 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 3.90 | 1,341 | 6.11K | 31.33K | 10168 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-08-30,0,0,0,0,0,60853,0,942,19900,323054,69823,26.558,78011
2026-08-31,0,0,0,0,0,64732,0,1070,26377,326455,57100,26.582,78164
2026-09-01,0,0,0,0,0,66365,0,1388,7427,229939,56971,26.661,78701
2026-09-02,0,0,0,0,0,65993,0,724,4866,145152,34715,26.729,79053
2026-09-03,0,0,0,0,0,71694,0,1316,5464,188259,45573,26.889,79562
2026-09-04,0,0,0,0,0,124087,0,1671,12413,411784,85660,31.809,84221
2026-09-05,0,0,0,0,0,75828,0,644,39324,518633,87142,23.110,71833
```
