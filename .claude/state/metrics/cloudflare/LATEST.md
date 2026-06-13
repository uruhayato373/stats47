# Cloudflare Usage — 2026-06-12

> 計測時刻: 2026-06-13T17:57:00.813Z
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
| Requests | 49.37K | ▲ +95.8% ✅ |
| Errors | 43 | ▲ +10.3%  |
| Subrequests | 21.57K | ▲ +81.1% ⚠️ |

**Error rate**: 0.09% (43/49367)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 3.04K | ▲ +8844.1% ⚠️ |
| Class B ops (reads) | 266.06K | ▲ +60.6% ⚠️ |
| Egress | 119703MB | ▲ +28.2%  |
| Storage | 15.05GB | ▲ +28.6%  |
| Objects | 40,467 | ▲ +16.1% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 14.14 | 33,156 | 0 | 264.52K | 119549 |
| doboku-note | 0.90 | 7,311 | 3.04K | 1.55K | 154 |
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
2026-06-12,0,0,0,0,0,49367,43,21568,3041,266064,119703,15.046,40467
```
