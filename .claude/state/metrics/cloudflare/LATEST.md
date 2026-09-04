# Cloudflare Usage — 2026-09-03

> 計測時刻: 2026-09-04T19:48:50.651Z
> 前日比: 2026-09-02

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
| Requests | 71.69K | ▲ +8.6% ✅ |
| Errors | 0 | → |
| Subrequests | 1.32K | ▲ +81.8% ⚠️ |

**Error rate**: 0.00% (0/71694)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 5.46K | ▲ +12.3%  |
| Class B ops (reads) | 188.26K | ▲ +29.7%  |
| Egress | 45573MB | ▲ +31.3% ⚠️ |
| Storage | 26.89GB | ▲ +0.6%  |
| Objects | 79,562 | ▲ +0.6% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 0.03 | 631 | 0 | 0 | 0 |
| stats47 | 15.27 | 63,951 | 5.46K | 182.86K | 44984 |
| doboku-note | 1.73 | 6,857 | 0 | 5.40K | 589 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 9.86 | 8,123 | 0 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-08-28,0,0,0,0,0,68693,0,1633,18071,302741,53651,22.857,67541
2026-08-29,0,0,0,0,0,55692,0,1229,9963,285878,57066,23.700,73259
2026-08-30,0,0,0,0,0,60853,0,942,19900,323054,69823,26.558,78011
2026-08-31,0,0,0,0,0,64732,0,1070,26377,326455,57100,26.582,78164
2026-09-01,0,0,0,0,0,66365,0,1388,7427,229939,56971,26.661,78701
2026-09-02,0,0,0,0,0,65993,0,724,4866,145152,34715,26.729,79053
2026-09-03,0,0,0,0,0,71694,0,1316,5464,188259,45573,26.889,79562
```
