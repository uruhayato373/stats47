# Cloudflare Usage — 2026-07-19

> 計測時刻: 2026-07-20T19:13:23.879Z
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
| Requests | 58.36K | ▲ +76.9% ✅ |
| Errors | 29 | ▼ -14.7% ✅ |
| Subrequests | 8.77K | ▼ -1.7% ✅ |

**Error rate**: 0.05% (29/58362)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 8.49K | ▲ +230.3% ⚠️ |
| Class B ops (reads) | 169.97K | ▲ +26.3%  |
| Egress | 57275MB | ▲ +66.6% ⚠️ |
| Storage | 24.59GB | ▲ +8.4%  |
| Objects | 75,852 | ▲ +2.6% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 20.58 | 66,637 | 969 | 166.64K | 53495 |
| doboku-note | 2.34 | 8,920 | 7.14K | 3.04K | 1898 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 1.67 | 295 | 374 | 292 | 1882 |

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
2026-07-19,0,0,0,0,0,58362,29,8772,8489,169968,57275,24.586,75852
```
