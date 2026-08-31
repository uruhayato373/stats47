# Cloudflare Usage — 2026-08-30

> 計測時刻: 2026-08-31T22:01:24.229Z
> 前日比: 2026-08-29

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
| Requests | 60.85K | ▲ +9.3% ✅ |
| Errors | 0 | → |
| Subrequests | 942 | ▼ -23.4% ✅ |

**Error rate**: 0.00% (0/60853)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 19.90K | ▲ +99.7% ⚠️ |
| Class B ops (reads) | 323.05K | ▲ +13.0%  |
| Egress | 69823MB | ▲ +22.4%  |
| Storage | 26.56GB | ▲ +12.1%  |
| Objects | 78,011 | ▲ +6.5% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 15.14 | 63,457 | 19.12K | 317.12K | 68414 |
| doboku-note | 1.69 | 6,733 | 737 | 5.89K | 560 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 9.73 | 7,821 | 44 | 49 | 850 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-08-23,0,0,0,0,0,54994,3,858,3811,99785,52173,22.119,67416
2026-08-24,0,0,0,0,0,58809,1,1243,4466,160096,71543,22.052,67201
2026-08-25,0,0,0,0,0,55163,0,904,21951,197726,69555,22.038,66966
2026-08-27,0,0,0,0,0,56307,0,845,44040,395892,98011,22.062,67145
2026-08-28,0,0,0,0,0,68693,0,1633,18071,302741,53651,22.857,67541
2026-08-29,0,0,0,0,0,55692,0,1229,9963,285878,57066,23.700,73259
2026-08-30,0,0,0,0,0,60853,0,942,19900,323054,69823,26.558,78011
```
