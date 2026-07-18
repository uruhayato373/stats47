# Cloudflare Usage — 2026-07-17

> 計測時刻: 2026-07-18T18:27:06.087Z
> 前日比: 2026-07-16

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
| Requests | 39.06K | ▼ -25.5%  |
| Errors | 32 | → |
| Subrequests | 10.61K | ▼ -5.0% ✅ |

**Error rate**: 0.08% (32/39056)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 5.88K | ▲ +1.3%  |
| Class B ops (reads) | 128.60K | ▲ +11.3%  |
| Egress | 31456MB | ▲ +46.3% ⚠️ |
| Storage | 22.42GB | ▲ +0.5%  |
| Objects | 72,271 | ▲ +1.0% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 20.11 | 63,365 | 5.88K | 124.32K | 30939 |
| doboku-note | 2.31 | 8,906 | 0 | 4.28K | 517 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-07-11,0,0,0,0,0,40134,7,7291,2102,150545,49973,21.808,68608
2026-07-12,0,0,0,0,0,39567,13,7661,1980,129243,46457,21.844,68814
2026-07-13,0,0,0,0,0,51198,20,13101,14076,186018,42339,21.999,70044
2026-07-14,0,0,0,0,0,49185,27,11803,248,126320,45543,22.108,70542
2026-07-15,0,0,0,0,0,52037,27,10632,631,129474,35886,22.189,70591
2026-07-16,0,0,0,0,0,52437,32,11168,5810,115576,21505,22.310,71552
2026-07-17,0,0,0,0,0,39056,32,10606,5884,128602,31456,22.420,72271
```
