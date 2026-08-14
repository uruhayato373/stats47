# Cloudflare Usage — 2026-08-13

> 計測時刻: 2026-08-14T18:24:22.220Z
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
| Requests | 37.72K | ▲ +2.9% ✅ |
| Errors | 0 | → |
| Subrequests | 4.49K | ▼ -25.8% ✅ |

**Error rate**: 0.00% (0/37720)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 4.10K | ▼ -76.2% ✅ |
| Class B ops (reads) | 158.19K | ▼ -13.8% ✅ |
| Egress | 89439MB | ▲ +5.4%  |
| Storage | 15.78GB | ▲ +0.2%  |
| Objects | 61,080 | ▲ +0.3% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 11.78 | 51,785 | 4.10K | 156.04K | 89176 |
| doboku-note | 2.34 | 9,000 | 0 | 2.15K | 263 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 1.67 | 295 | 0 | 0 | 0 |

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
2026-08-13,0,0,0,0,0,37720,0,4485,4098,158186,89439,15.784,61080
```
