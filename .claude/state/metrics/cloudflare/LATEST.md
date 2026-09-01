# Cloudflare Usage — 2026-08-31

> 計測時刻: 2026-09-01T20:04:24.347Z
> 前日比: 2026-08-30

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
| Requests | 64.73K | ▲ +6.4% ✅ |
| Errors | 0 | → |
| Subrequests | 1.07K | ▲ +13.6%  |

**Error rate**: 0.00% (0/64732)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 26.38K | ▲ +32.5% ⚠️ |
| Class B ops (reads) | 326.45K | ▲ +1.1%  |
| Egress | 57100MB | ▼ -18.2% ✅ |
| Storage | 26.58GB | ▲ +0.1%  |
| Objects | 78,164 | ▲ +0.2% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 0.03 | 631 | 810 | 64 | 46 |
| stats47 | 15.10 | 62,925 | 23.89K | 319.58K | 55701 |
| doboku-note | 1.70 | 6,752 | 1.51K | 6.43K | 650 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 9.75 | 7,856 | 166 | 386 | 703 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-08-24,0,0,0,0,0,58809,1,1243,4466,160096,71543,22.052,67201
2026-08-25,0,0,0,0,0,55163,0,904,21951,197726,69555,22.038,66966
2026-08-27,0,0,0,0,0,56307,0,845,44040,395892,98011,22.062,67145
2026-08-28,0,0,0,0,0,68693,0,1633,18071,302741,53651,22.857,67541
2026-08-29,0,0,0,0,0,55692,0,1229,9963,285878,57066,23.700,73259
2026-08-30,0,0,0,0,0,60853,0,942,19900,323054,69823,26.558,78011
2026-08-31,0,0,0,0,0,64732,0,1070,26377,326455,57100,26.582,78164
```
