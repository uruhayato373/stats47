# Cloudflare Usage — 2026-09-07

> 計測時刻: 2026-09-08T20:06:55.019Z
> 前日比: 2026-09-06

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
| Requests | 108.32K | ▲ +46.9% ✅ |
| Errors | 0 | → |
| Subrequests | 1.74K | ▲ +48.3% ⚠️ |

**Error rate**: 0.00% (0/108324)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 34.97K | ▲ +200.6% ⚠️ |
| Class B ops (reads) | 484.40K | ▲ +21.3%  |
| Egress | 83678MB | ▲ +14.6%  |
| Storage | 23.01GB | ▲ +0.3%  |
| Objects | 77,794 | ▲ +6.4% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 0.03 | 631 | 0 | 0 | 0 |
| stats47 | 18.19 | 65,205 | 33.56K | 476.03K | 82715 |
| doboku-note | 0.88 | 10,609 | 1.40K | 8.30K | 908 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 3.91 | 1,349 | 0 | 74 | 54 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-09-01,0,0,0,0,0,66365,0,1388,7427,229939,56971,26.661,78701
2026-09-02,0,0,0,0,0,65993,0,724,4866,145152,34715,26.729,79053
2026-09-03,0,0,0,0,0,71694,0,1316,5464,188259,45573,26.889,79562
2026-09-04,0,0,0,0,0,124087,0,1671,12413,411784,85660,31.809,84221
2026-09-05,0,0,0,0,0,75828,0,644,39324,518633,87142,23.110,71833
2026-09-06,0,0,0,0,0,73726,0,1175,11633,399353,73017,22.934,73143
2026-09-07,0,0,0,0,0,108324,0,1743,34965,484405,83678,23.007,77794
```
