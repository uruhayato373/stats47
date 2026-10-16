# Cloudflare Usage — 2026-10-14

> 計測時刻: 2026-10-15T20:29:38.187Z
> 前日比: 2026-10-13

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
| Requests | 109.88K | ▼ -28.3%  |
| Errors | 128 | ▼ -40.7% ✅ |
| Subrequests | 137 | ▼ -35.1% ✅ |

**Error rate**: 0.12% (128/109881)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 7.92K | ▼ -47.5% ✅ |
| Class B ops (reads) | 394.75K | ▼ -49.7% ✅ |
| Egress | 89245MB | ▼ -47.1% ✅ |
| Storage | 35.07GB | ▲ +1.0%  |
| Objects | 124,731 | ▲ +0.7% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 0.88 | 4,976 | 86 | 468 | 490 |
| stats47 | 26.26 | 103,905 | 7.82K | 382.20K | 86532 |
| doboku-note | 0.96 | 12,609 | 0 | 8.90K | 160 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 6.98 | 3,241 | 19 | 3.18K | 2063 |

## History

Last 7 days (`data/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-10-08,0,0,0,0,0,120617,166,122,99666,1330642,188895,33.724,118576
2026-10-09,0,0,0,0,0,98967,95,42,49848,1000951,118369,33.635,117879
2026-10-10,0,0,0,0,0,108703,47,519,29760,778461,114834,33.769,119071
2026-10-11,0,0,0,0,0,66087,36,55,21610,506298,74537,34.152,120843
2026-10-12,0,0,0,0,0,96597,76,78,11706,450599,86216,34.582,123347
2026-10-13,0,0,0,0,0,153311,216,211,15103,784526,168686,34.728,123890
2026-10-14,0,0,0,0,0,109881,128,137,7925,394745,89245,35.073,124731
```
