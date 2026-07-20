# Cloudflare Usage — 2026-07-18

> 計測時刻: 2026-07-19T18:26:43.789Z
> 前日比: 2026-07-17

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
| Requests | 33.00K | ▼ -15.5%  |
| Errors | 34 | ▲ +6.3%  |
| Subrequests | 8.92K | ▼ -15.9% ✅ |

**Error rate**: 0.10% (34/32999)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 2.57K | ▼ -56.3% ✅ |
| Class B ops (reads) | 134.56K | ▲ +4.6%  |
| Egress | 34375MB | ▲ +9.3%  |
| Storage | 22.67GB | ▲ +1.1%  |
| Objects | 73,932 | ▲ +2.3% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 20.36 | 65,012 | 2.57K | 130.03K | 33832 |
| doboku-note | 2.31 | 8,920 | 0 | 4.53K | 543 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-07-12,0,0,0,0,0,39567,13,7661,1980,129243,46457,21.844,68814
2026-07-13,0,0,0,0,0,51198,20,13101,14076,186018,42339,21.999,70044
2026-07-14,0,0,0,0,0,49185,27,11803,248,126320,45543,22.108,70542
2026-07-15,0,0,0,0,0,52037,27,10632,631,129474,35886,22.189,70591
2026-07-16,0,0,0,0,0,52437,32,11168,5810,115576,21505,22.310,71552
2026-07-17,0,0,0,0,0,39056,32,10606,5884,128602,31456,22.420,72271
2026-07-18,0,0,0,0,0,32999,34,8924,2570,134560,34375,22.671,73932
```
