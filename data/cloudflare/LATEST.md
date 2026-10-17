# Cloudflare Usage — 2026-10-16

> 計測時刻: 2026-10-17T19:39:07.953Z
> 前日比: 2026-10-15

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
| Requests | 79.59K | ▼ -39.0% ⚠️ |
| Errors | 37 | ▼ -70.4% ✅ |
| Subrequests | 264 | ▲ +64.0% ⚠️ |

**Error rate**: 0.05% (37/79591)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 19.58K | ▼ -14.7% ✅ |
| Class B ops (reads) | 750.98K | ▼ -6.6% ✅ |
| Egress | 116859MB | ▼ -15.0% ✅ |
| Storage | 34.77GB | ▼ -1.3% ✅ |
| Objects | 123,785 | ▼ -1.8%  |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 0.99 | 5,372 | 417 | 1.75K | 368 |
| stats47 | 25.83 | 102,097 | 8.63K | 613.50K | 106975 |
| doboku-note | 0.97 | 13,075 | 10.53K | 122.91K | 486 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 6.98 | 3,241 | 8 | 12.82K | 9030 |

## History

Last 7 days (`data/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-10-10,0,0,0,0,0,108703,47,519,29760,778461,114834,33.769,119071
2026-10-11,0,0,0,0,0,66087,36,55,21610,506298,74537,34.152,120843
2026-10-12,0,0,0,0,0,96597,76,78,11706,450599,86216,34.582,123347
2026-10-13,0,0,0,0,0,153311,216,211,15103,784526,168686,34.728,123890
2026-10-14,0,0,0,0,0,109881,128,137,7925,394745,89245,35.073,124731
2026-10-15,0,0,0,0,0,130494,125,161,22953,804371,137415,35.224,126026
2026-10-16,0,0,0,0,0,79591,37,264,19584,750975,116859,34.772,123785
```
