# Cloudflare Usage — 2026-08-25

> 計測時刻: 2026-08-26T19:25:38.771Z
> 前日比: 2026-08-24

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
| Requests | 55.16K | ▼ -6.2%  |
| Errors | 0 | ▼ -100.0% ✅ |
| Subrequests | 904 | ▼ -27.3% ✅ |

**Error rate**: 0.00% (0/55163)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 21.95K | ▲ +391.5% ⚠️ |
| Class B ops (reads) | 197.73K | ▲ +23.5%  |
| Egress | 69555MB | ▼ -2.8% ✅ |
| Storage | 22.04GB | ▼ -0.1% ✅ |
| Objects | 66,966 | ▼ -0.3%  |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 11.39 | 53,160 | 21.02K | 193.08K | 67681 |
| doboku-note | 1.67 | 6,199 | 918 | 4.61K | 1829 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 8.98 | 7,607 | 18 | 42 | 44 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-08-19,0,0,0,0,0,70399,0,489,4127,135916,65765,15.379,61767
2026-08-20,0,0,0,0,0,81839,0,1032,5161,169746,75242,17.340,66379
2026-08-21,0,0,0,0,0,55401,0,1000,15475,123974,71748,23.695,71049
2026-08-22,0,0,0,0,0,67500,0,500,16373,348810,223614,22.197,67386
2026-08-23,0,0,0,0,0,54994,3,858,3811,99785,52173,22.119,67416
2026-08-24,0,0,0,0,0,58809,1,1243,4466,160096,71543,22.052,67201
2026-08-25,0,0,0,0,0,55163,0,904,21951,197726,69555,22.038,66966
```
