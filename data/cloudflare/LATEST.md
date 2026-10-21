# Cloudflare Usage — 2026-10-19

> 計測時刻: 2026-10-20T20:48:53.847Z
> 前日比: 2026-10-18

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
| Requests | 85.17K | ▲ +72.6% ✅ |
| Errors | 90 | ▲ +260.0% ⚠️ |
| Subrequests | 317 | ▼ -33.7% ✅ |

**Error rate**: 0.11% (90/85167)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 14.43K | ▼ -4.7% ✅ |
| Class B ops (reads) | 964.21K | ▲ +58.8% ⚠️ |
| Egress | 152967MB | ▲ +85.8% ⚠️ |
| Storage | 34.85GB | ▼ -0.9% ✅ |
| Objects | 122,829 | ▼ -3.4%  |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 1.05 | 5,786 | 210 | 1.11K | 222 |
| stats47 | 25.88 | 102,317 | 10.28K | 916.97K | 146912 |
| doboku-note | 0.89 | 10,642 | 3.08K | 38.25K | 379 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 7.03 | 4,084 | 857 | 7.88K | 5453 |

## History

Last 7 days (`data/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-10-13,0,0,0,0,0,153311,216,211,15103,784526,168686,34.728,123890
2026-10-14,0,0,0,0,0,109881,128,137,7925,394745,89245,35.073,124731
2026-10-15,0,0,0,0,0,130494,125,161,22953,804371,137415,35.224,126026
2026-10-16,0,0,0,0,0,79591,37,264,19584,750975,116859,34.772,123785
2026-10-17,0,0,0,0,0,81896,51,540,12225,680649,116447,34.924,124647
2026-10-18,0,0,0,0,0,49345,25,478,15143,607191,82314,35.159,127135
2026-10-19,0,0,0,0,0,85167,90,317,14430,964212,152967,34.854,122829
```
