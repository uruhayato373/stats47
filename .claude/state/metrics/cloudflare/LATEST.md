# Cloudflare Usage — 2026-08-12

> 計測時刻: 2026-08-13T18:27:04.632Z
> 前日比: 2026-08-11

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
| Requests | 36.67K | ▲ +9.1% ✅ |
| Errors | 0 | → |
| Subrequests | 6.04K | ▲ +20.6%  |

**Error rate**: 0.00% (0/36673)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 17.21K | ▲ +524.5% ⚠️ |
| Class B ops (reads) | 183.54K | ▲ +21.9%  |
| Egress | 84842MB | ▲ +6.5%  |
| Storage | 15.76GB | ▲ +0.8%  |
| Objects | 60,918 | ▲ +1.1% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 11.75 | 51,623 | 17.21K | 180.82K | 84504 |
| doboku-note | 2.34 | 9,000 | 0 | 2.72K | 338 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 1.67 | 295 | 0 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-08-06,0,0,0,0,0,48988,0,6225,4025,203453,65169,15.527,57889
2026-08-07,0,0,0,0,0,48061,0,6440,3704,225720,89630,15.584,58168
2026-08-08,0,0,0,0,0,41786,0,4553,8887,273973,96011,15.600,59502
2026-08-09,0,0,0,0,0,36646,0,3164,3347,154107,75711,15.470,59430
2026-08-10,0,0,0,0,0,38399,0,4566,3221,165565,89142,15.485,59486
2026-08-11,0,0,0,0,0,33608,0,5013,2756,150528,79648,15.630,60270
2026-08-12,0,0,0,0,0,36673,0,6044,17210,183539,84842,15.756,60918
```
