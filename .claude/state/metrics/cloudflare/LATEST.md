# Cloudflare Usage — 2026-07-02

> 計測時刻: 2026-07-03T18:47:11.382Z
> 前日比: 2026-07-01

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
| Requests | 31.75K | ▼ -1.6%  |
| Errors | 120 | ▲ +421.7% ⚠️ |
| Subrequests | 8.99K | ▼ -4.4% ✅ |

**Error rate**: 0.38% (120/31745)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 20.31K | ▲ +499.4% ⚠️ |
| Class B ops (reads) | 77.73K | ▼ -19.9% ✅ |
| Egress | 35261MB | ▲ +0.3%  |
| Storage | 20.09GB | ▲ +1.1%  |
| Objects | 53,175 | ▲ +2.8% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 17.81 | 44,356 | 3 | 71.71K | 31550 |
| doboku-note | 2.28 | 8,819 | 20.31K | 6.03K | 3711 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-06-26,0,0,0,0,0,26170,23,6711,3467,54508,18593,19.343,51517
2026-06-27,0,0,0,0,0,19652,23,4544,117,72914,23825,19.428,51523
2026-06-28,0,0,0,0,0,27048,33,5462,6946,67048,29311,19.429,51627
2026-06-29,0,0,0,0,0,42455,49,7737,3366,111747,55879,19.357,51673
2026-06-30,0,0,0,0,0,49144,22,12877,6775,201806,56571,19.357,51693
2026-07-01,0,0,0,0,0,32257,23,9396,3388,97048,35148,19.880,51703
2026-07-02,0,0,0,0,0,31745,120,8986,20309,77732,35261,20.093,53175
```
