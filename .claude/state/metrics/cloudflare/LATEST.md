# Cloudflare Usage — 2026-08-28

> 計測時刻: 2026-08-29T01:07:12.542Z
> 前日比: 2026-08-27

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
| Requests | 68.69K | ▲ +22.0% ✅ |
| Errors | 0 | → |
| Subrequests | 1.63K | ▲ +93.3% ⚠️ |

**Error rate**: 0.00% (0/68693)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 18.07K | ▼ -59.0% ✅ |
| Class B ops (reads) | 302.74K | ▼ -23.5% ✅ |
| Egress | 53651MB | ▼ -45.3% ✅ |
| Storage | 22.09GB | ▲ +0.1%  |
| Objects | 67,492 | ▲ +0.5% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 11.45 | 53,502 | 14.28K | 298.88K | 52529 |
| doboku-note | 1.66 | 6,383 | 3.79K | 3.87K | 1122 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 8.98 | 7,607 | 0 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-08-21,0,0,0,0,0,55401,0,1000,15475,123974,71748,23.695,71049
2026-08-22,0,0,0,0,0,67500,0,500,16373,348810,223614,22.197,67386
2026-08-23,0,0,0,0,0,54994,3,858,3811,99785,52173,22.119,67416
2026-08-24,0,0,0,0,0,58809,1,1243,4466,160096,71543,22.052,67201
2026-08-25,0,0,0,0,0,55163,0,904,21951,197726,69555,22.038,66966
2026-08-27,0,0,0,0,0,56307,0,845,44040,395892,98011,22.062,67145
2026-08-28,0,0,0,0,0,68693,0,1633,18071,302741,53651,22.091,67492
```
