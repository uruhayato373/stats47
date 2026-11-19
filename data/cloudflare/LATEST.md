# Cloudflare Usage — 2026-11-18

> 計測時刻: 2026-11-19T23:42:48.462Z
> 前日比: 2026-11-17

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
| Requests | 73.11K | ▼ -29.9%  |
| Errors | 137 | ▼ -26.7% ✅ |
| Subrequests | 928 | ▼ -21.6% ✅ |

**Error rate**: 0.19% (137/73112)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 2.18K | ▼ -33.6% ✅ |
| Class B ops (reads) | 744.30K | ▼ -25.2% ✅ |
| Egress | 137354MB | ▼ -4.8% ✅ |
| Storage | 57.41GB | ▲ +1.3%  |
| Objects | 181,588 | ▲ +0.5% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 7.96 | 35,365 | 0 | 436 | 538 |
| stats47 | 39.03 | 125,692 | 2.09K | 712.78K | 123805 |
| doboku-note | 1.99 | 16,152 | 29 | 14.15K | 539 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 8.43 | 4,379 | 59 | 16.93K | 12473 |

## History

Last 7 days (`data/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-11-11,0,0,0,0,0,86313,93,1505,14121,1111382,193207,45.328,146499
2026-11-12,0,0,0,0,0,81226,56,3733,6973,953605,170884,46.267,148575
2026-11-13,0,0,0,0,0,159636,138,27509,19623,1909517,331859,47.016,170725
2026-11-14,0,0,0,0,0,113511,56,4067,26518,1360613,204324,52.478,174957
2026-11-16,0,0,0,0,0,148990,93,794,8478,979487,163026,55.298,178721
2026-11-17,0,0,0,0,0,104257,187,1183,3283,994945,144268,56.680,180659
2026-11-18,0,0,0,0,0,73112,137,928,2181,744297,137354,57.411,181588
```
