# Cloudflare Usage — 2026-09-09

> 計測時刻: 2026-09-10T19:58:23.670Z
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
| Requests | 71.87K | ▼ -2.5%  |
| Errors | 0 | → |
| Subrequests | 608 | ▼ -48.3% ✅ |

**Error rate**: 0.00% (0/71866)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 7.89K | ▼ -32.2% ✅ |
| Class B ops (reads) | 190.85K | ▼ -52.2% ✅ |
| Egress | 66315MB | ▼ -9.2% ✅ |
| Storage | 26.30GB | ▲ +14.7%  |
| Objects | 80,043 | ▲ +9.4% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 0.03 | 631 | 0 | 0 | 0 |
| stats47 | 18.33 | 66,123 | 5.84K | 176.16K | 50288 |
| doboku-note | 0.88 | 10,629 | 0 | 6.08K | 192 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 7.06 | 2,660 | 2.06K | 8.62K | 15835 |

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
2026-09-09,0,0,0,0,0,71866,0,608,7892,190853,66315,26.305,80043
```
