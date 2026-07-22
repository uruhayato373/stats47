# Cloudflare Usage — 2026-07-21

> 計測時刻: 2026-07-22T18:41:45.393Z
> 前日比: 2026-07-18

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
| Requests | 50.85K | ▲ +54.1% ✅ |
| Errors | 0 | ▼ -100.0% ✅ |
| Subrequests | 12.63K | ▲ +41.5% ⚠️ |

**Error rate**: 0.00% (0/50853)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 94 | ▼ -96.3% ✅ |
| Class B ops (reads) | 123.07K | ▼ -8.5% ✅ |
| Egress | 25902MB | ▼ -24.6% ✅ |
| Storage | 24.75GB | ▲ +9.1%  |
| Objects | 77,001 | ▲ +4.2% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 20.74 | 67,784 | 94 | 119.85K | 25539 |
| doboku-note | 2.34 | 8,922 | 0 | 3.22K | 363 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 1.67 | 295 | 0 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-07-13,0,0,0,0,0,51198,20,13101,14076,186018,42339,21.999,70044
2026-07-14,0,0,0,0,0,49185,27,11803,248,126320,45543,22.108,70542
2026-07-15,0,0,0,0,0,52037,27,10632,631,129474,35886,22.189,70591
2026-07-16,0,0,0,0,0,52437,32,11168,5810,115576,21505,22.310,71552
2026-07-17,0,0,0,0,0,39056,32,10606,5884,128602,31456,22.420,72271
2026-07-18,0,0,0,0,0,32999,34,8924,2570,134560,34375,22.671,73932
2026-07-21,0,0,0,0,0,50853,0,12628,94,123070,25902,24.745,77001
```
