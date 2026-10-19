# Cloudflare Usage — 2026-10-18

> 計測時刻: 2026-10-19T21:41:50.313Z
> 前日比: 2026-10-17

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
| Requests | 49.34K | ▼ -39.7% ⚠️ |
| Errors | 25 | ▼ -51.0% ✅ |
| Subrequests | 478 | ▼ -11.5% ✅ |

**Error rate**: 0.05% (25/49345)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 15.14K | ▲ +23.9%  |
| Class B ops (reads) | 607.19K | ▼ -10.8% ✅ |
| Egress | 82314MB | ▼ -29.3% ✅ |
| Storage | 35.16GB | ▲ +0.7%  |
| Objects | 127,135 | ▲ +2.0% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 1.05 | 5,727 | 64 | 131 | 58 |
| stats47 | 26.08 | 103,573 | 12.13K | 582.59K | 77763 |
| doboku-note | 1.00 | 13,753 | 2.94K | 18.30K | 232 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 7.03 | 4,082 | 16 | 6.18K | 4260 |

## History

Last 7 days (`data/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-10-12,0,0,0,0,0,96597,76,78,11706,450599,86216,34.582,123347
2026-10-13,0,0,0,0,0,153311,216,211,15103,784526,168686,34.728,123890
2026-10-14,0,0,0,0,0,109881,128,137,7925,394745,89245,35.073,124731
2026-10-15,0,0,0,0,0,130494,125,161,22953,804371,137415,35.224,126026
2026-10-16,0,0,0,0,0,79591,37,264,19584,750975,116859,34.772,123785
2026-10-17,0,0,0,0,0,81896,51,540,12225,680649,116447,34.924,124647
2026-10-18,0,0,0,0,0,49345,25,478,15143,607191,82314,35.159,127135
```
