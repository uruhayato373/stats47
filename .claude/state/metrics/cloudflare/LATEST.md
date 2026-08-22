# Cloudflare Usage — 2026-08-21

> 計測時刻: 2026-08-22T17:46:10.786Z
> 前日比: 2026-08-19

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
| Requests | 55.40K | ▼ -21.3%  |
| Errors | 0 | → |
| Subrequests | 1.00K | ▲ +104.5% ⚠️ |

**Error rate**: 0.00% (0/55401)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 15.47K | ▲ +275.0% ⚠️ |
| Class B ops (reads) | 123.97K | ▼ -8.8% ✅ |
| Egress | 71748MB | ▲ +9.1%  |
| Storage | 23.69GB | ▲ +54.1% ⚠️ |
| Objects | 71,049 | ▲ +15.0% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 11.59 | 53,562 | 3.75K | 111.03K | 64013 |
| doboku-note | 3.13 | 9,883 | 8.13K | 4.77K | 3343 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 8.98 | 7,604 | 3.60K | 8.17K | 4392 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-08-14,0,0,0,0,0,42894,0,5773,4396,170812,84328,15.549,59860
2026-08-15,0,0,0,0,0,42945,1,3655,9733,277175,95286,15.541,61182
2026-08-16,0,0,0,0,0,48983,0,906,13128,225574,71975,15.400,61727
2026-08-17,0,0,0,0,0,61948,0,1147,44103,411319,86687,15.339,61363
2026-08-18,0,0,0,0,0,79709,2,1095,4306,174542,73909,15.354,61423
2026-08-19,0,0,0,0,0,70399,0,489,4127,135916,65765,15.379,61767
2026-08-21,0,0,0,0,0,55401,0,1000,15475,123974,71748,23.695,71049
```
