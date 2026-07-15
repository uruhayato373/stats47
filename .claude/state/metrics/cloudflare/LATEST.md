# Cloudflare Usage — 2026-07-14

> 計測時刻: 2026-07-15T18:37:54.144Z
> 前日比: 2026-07-12

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
| Requests | 49.19K | ▲ +24.3% ✅ |
| Errors | 27 | ▲ +107.7% ⚠️ |
| Subrequests | 11.80K | ▲ +54.1% ⚠️ |

**Error rate**: 0.05% (27/49185)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 248 | ▼ -87.5% ✅ |
| Class B ops (reads) | 126.32K | ▼ -2.3% ✅ |
| Egress | 45543MB | ▼ -2.0% ✅ |
| Storage | 22.11GB | ▲ +1.2%  |
| Objects | 70,542 | ▲ +2.5% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 19.80 | 61,636 | 248 | 122.71K | 45009 |
| doboku-note | 2.31 | 8,906 | 0 | 3.61K | 534 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-07-07,0,0,0,0,0,40406,5,8696,648,118652,53035,21.321,63150
2026-07-08,0,0,0,0,0,43956,10,11227,3589,97096,36769,21.413,63582
2026-07-09,0,0,0,0,0,50673,7,13428,10733,150443,47537,21.475,64733
2026-07-10,0,0,0,0,0,42341,11,9476,10182,167181,44895,21.734,67262
2026-07-11,0,0,0,0,0,40134,7,7291,2102,150545,49973,21.808,68608
2026-07-12,0,0,0,0,0,39567,13,7661,1980,129243,46457,21.844,68814
2026-07-14,0,0,0,0,0,49185,27,11803,248,126320,45543,22.108,70542
```
