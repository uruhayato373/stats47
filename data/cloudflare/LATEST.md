# Cloudflare Usage — 2026-10-17

> 計測時刻: 2026-10-18T19:33:53.420Z
> 前日比: 2026-10-16

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
| Requests | 81.90K | ▲ +2.9% ✅ |
| Errors | 51 | ▲ +37.8% ⚠️ |
| Subrequests | 540 | ▲ +104.5% ⚠️ |

**Error rate**: 0.06% (51/81896)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 12.22K | ▼ -37.6% ✅ |
| Class B ops (reads) | 680.65K | ▼ -9.4% ✅ |
| Egress | 116447MB | ▼ -0.4% ✅ |
| Storage | 34.92GB | ▲ +0.4%  |
| Objects | 124,647 | ▲ +0.7% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 1.03 | 5,647 | 403 | 779 | 194 |
| stats47 | 25.95 | 102,684 | 9.19K | 666.69K | 112228 |
| doboku-note | 0.97 | 13,075 | 2.62K | 7.53K | 223 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 6.98 | 3,241 | 17 | 5.65K | 3802 |

## History

Last 7 days (`data/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-10-11,0,0,0,0,0,66087,36,55,21610,506298,74537,34.152,120843
2026-10-12,0,0,0,0,0,96597,76,78,11706,450599,86216,34.582,123347
2026-10-13,0,0,0,0,0,153311,216,211,15103,784526,168686,34.728,123890
2026-10-14,0,0,0,0,0,109881,128,137,7925,394745,89245,35.073,124731
2026-10-15,0,0,0,0,0,130494,125,161,22953,804371,137415,35.224,126026
2026-10-16,0,0,0,0,0,79591,37,264,19584,750975,116859,34.772,123785
2026-10-17,0,0,0,0,0,81896,51,540,12225,680649,116447,34.924,124647
```
