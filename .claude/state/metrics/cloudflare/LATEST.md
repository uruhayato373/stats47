# Cloudflare Usage — 2026-08-14

> 計測時刻: 2026-08-15T17:45:24.945Z
> 前日比: 2026-08-12

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
| Requests | 42.89K | ▲ +17.0% ✅ |
| Errors | 0 | → |
| Subrequests | 5.77K | ▼ -4.5% ✅ |

**Error rate**: 0.00% (0/42894)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 4.40K | ▼ -74.5% ✅ |
| Class B ops (reads) | 170.81K | ▼ -6.9% ✅ |
| Egress | 84328MB | ▼ -0.6% ✅ |
| Storage | 15.55GB | ▼ -1.3% ✅ |
| Objects | 59,860 | ▼ -1.7%  |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 11.54 | 50,565 | 4.39K | 168.61K | 84111 |
| doboku-note | 2.34 | 9,000 | 0 | 2.21K | 217 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 1.67 | 295 | 3 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-08-07,0,0,0,0,0,48061,0,6440,3704,225720,89630,15.584,58168
2026-08-08,0,0,0,0,0,41786,0,4553,8887,273973,96011,15.600,59502
2026-08-09,0,0,0,0,0,36646,0,3164,3347,154107,75711,15.470,59430
2026-08-10,0,0,0,0,0,38399,0,4566,3221,165565,89142,15.485,59486
2026-08-11,0,0,0,0,0,33608,0,5013,2756,150528,79648,15.630,60270
2026-08-12,0,0,0,0,0,36673,0,6044,17210,183539,84842,15.756,60918
2026-08-14,0,0,0,0,0,42894,0,5773,4396,170812,84328,15.549,59860
```
