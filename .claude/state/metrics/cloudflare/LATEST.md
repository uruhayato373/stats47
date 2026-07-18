# Cloudflare Usage — 2026-07-16

> 計測時刻: 2026-07-17T18:33:51.888Z
> 前日比: 2026-07-15

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
| Requests | 52.44K | ▲ +0.8% ✅ |
| Errors | 32 | ▲ +18.5%  |
| Subrequests | 11.17K | ▲ +5.0%  |

**Error rate**: 0.06% (32/52437)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 5.81K | ▲ +820.8% ⚠️ |
| Class B ops (reads) | 115.58K | ▼ -10.7% ✅ |
| Egress | 21505MB | ▼ -40.1% ✅ |
| Storage | 22.31GB | ▲ +0.5%  |
| Objects | 71,552 | ▲ +1.4% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 20.00 | 62,646 | 2.25K | 111.77K | 20335 |
| doboku-note | 2.31 | 8,906 | 3.56K | 3.81K | 1170 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-07-10,0,0,0,0,0,42341,11,9476,10182,167181,44895,21.734,67262
2026-07-11,0,0,0,0,0,40134,7,7291,2102,150545,49973,21.808,68608
2026-07-12,0,0,0,0,0,39567,13,7661,1980,129243,46457,21.844,68814
2026-07-13,0,0,0,0,0,51198,20,13101,14076,186018,42339,21.999,70044
2026-07-14,0,0,0,0,0,49185,27,11803,248,126320,45543,22.108,70542
2026-07-15,0,0,0,0,0,52037,27,10632,631,129474,35886,22.189,70591
2026-07-16,0,0,0,0,0,52437,32,11168,5810,115576,21505,22.310,71552
```
