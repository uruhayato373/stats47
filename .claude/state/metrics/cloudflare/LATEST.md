# Cloudflare Usage — 2026-05-16

> 計測時刻: 2026-05-17T17:49:50.835Z
> 前日比: 2026-05-15

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
| Requests | 20.28K | ▲ +15.2% ✅ |
| Errors | 15 | ▼ -11.8% ✅ |
| Subrequests | 4.85K | ▼ -49.6% ✅ |

**Error rate**: 0.07% (15/20281)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 22.75K | ▲ +48308.5% ⚠️ |
| Class B ops (reads) | 87.40K | ▼ -22.2% ✅ |
| Egress | 27713MB | ▼ -20.4% ✅ |
| Storage | 8.15GB | ▲ +3.2%  |
| Objects | 29,008 | ▲ +6.6% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 6.97 | 19,987 | 22.75K | 85.31K | 27683 |
| doboku-note | 0.66 | 6,390 | 0 | 2.08K | 30 |
| kakkom | 0.52 | 2,631 | 0 | 0 | 0 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| obsidian-pdf | 0.00 | 0 | 0 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-05-10,0,0,0,0,0,17555,182,9439,16416,99491,22026,7.841,27135
2026-05-11,0,0,0,0,0,16112,26,8298,18,76355,20849,7.842,27140
2026-05-12,0,0,0,0,0,14983,11,8441,16,91357,25016,7.850,27187
2026-05-13,0,0,0,0,0,12981,12,6486,64,65617,21356,7.850,27187
2026-05-14,0,0,0,0,0,16827,14,8138,3,86452,24446,7.850,27189
2026-05-15,0,0,0,0,0,17612,17,9619,47,112401,34825,7.900,27207
2026-05-16,0,0,0,0,0,20281,15,4848,22752,87398,27713,8.153,29008
```
