# Cloudflare Usage — 2026-10-20

> 計測時刻: 2026-10-21T20:49:23.966Z
> 前日比: 2026-10-19

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
| Requests | 62.56K | ▼ -26.5%  |
| Errors | 11 | ▼ -87.8% ✅ |
| Subrequests | 276 | ▼ -12.9% ✅ |

**Error rate**: 0.02% (11/62561)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 7.59K | ▼ -47.4% ✅ |
| Class B ops (reads) | 664.00K | ▼ -31.1% ✅ |
| Egress | 130567MB | ▼ -14.6% ✅ |
| Storage | 35.06GB | ▲ +0.6%  |
| Objects | 125,055 | ▲ +1.8% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 1.05 | 5,786 | 94 | 367 | 50 |
| stats47 | 26.09 | 104,515 | 7.46K | 635.73K | 119770 |
| doboku-note | 0.89 | 10,670 | 13 | 12.54K | 194 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 7.03 | 4,084 | 18 | 15.37K | 10553 |

## History

Last 7 days (`data/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-10-14,0,0,0,0,0,109881,128,137,7925,394745,89245,35.073,124731
2026-10-15,0,0,0,0,0,130494,125,161,22953,804371,137415,35.224,126026
2026-10-16,0,0,0,0,0,79591,37,264,19584,750975,116859,34.772,123785
2026-10-17,0,0,0,0,0,81896,51,540,12225,680649,116447,34.924,124647
2026-10-18,0,0,0,0,0,49345,25,478,15143,607191,82314,35.159,127135
2026-10-19,0,0,0,0,0,85167,90,317,14430,964212,152967,34.854,122829
2026-10-20,0,0,0,0,0,62561,11,276,7587,664002,130567,35.059,125055
```
