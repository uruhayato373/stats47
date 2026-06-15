# Cloudflare Usage — 2026-06-14

> 計測時刻: 2026-06-15T18:55:15.750Z
> 前日比: 2026-06-11

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
| Requests | 20.38K | ▼ -19.2%  |
| Errors | 22 | ▼ -43.6% ✅ |
| Subrequests | 5.36K | ▼ -55.0% ✅ |

**Error rate**: 0.11% (22/20382)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 5.39K | ▲ +15750.0% ⚠️ |
| Class B ops (reads) | 77.92K | ▼ -53.0% ✅ |
| Egress | 50734MB | ▼ -45.7% ✅ |
| Storage | 23.52GB | ▲ +100.9% ⚠️ |
| Objects | 46,780 | ▲ +34.2% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 22.61 | 39,447 | 5.39K | 76.70K | 50719 |
| doboku-note | 0.91 | 7,333 | 0 | 1.23K | 16 |
| kakkom | 0.00 | 0 | 0 | 0 | 0 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-06-06,0,0,0,0,0,21761,28,8652,2436,174520,76916,11.639,34121
2026-06-07,0,0,0,0,0,24080,41,11606,3649,193410,78126,11.690,34451
2026-06-08,0,0,0,0,0,30966,117,13769,3162,260274,120544,11.690,34453
2026-06-09,0,0,0,0,0,32299,51,14654,2828,230255,114795,11.691,34648
2026-06-10,0,0,0,0,0,25442,38,12758,337,188205,87275,11.691,34648
2026-06-11,0,0,0,0,0,25211,39,11909,34,165637,93385,11.704,34861
2026-06-14,0,0,0,0,0,20382,22,5356,5389,77923,50734,23.516,46780
```
