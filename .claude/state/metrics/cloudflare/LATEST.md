# Cloudflare Usage — 2026-09-04

> 計測時刻: 2026-09-05T19:16:40.419Z
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
| Requests | 124.09K | ▲ +88.0% ✅ |
| Errors | 0 | → |
| Subrequests | 1.67K | ▲ +130.8% ⚠️ |

**Error rate**: 0.00% (0/124087)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 12.41K | ▲ +155.1% ⚠️ |
| Class B ops (reads) | 411.78K | ▲ +183.7% ⚠️ |
| Egress | 85660MB | ▲ +146.8% ⚠️ |
| Storage | 31.81GB | ▲ +19.0%  |
| Objects | 84,221 | ▲ +6.5% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 0.03 | 631 | 0 | 0 | 0 |
| stats47 | 18.22 | 64,088 | 7.53K | 404.38K | 84435 |
| doboku-note | 1.88 | 6,996 | 4.54K | 6.67K | 864 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 11.68 | 12,506 | 345 | 732 | 361 |

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
2026-09-04,0,0,0,0,0,124087,0,1671,12413,411784,85660,31.809,84221
```
