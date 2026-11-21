# Cloudflare Usage — 2026-11-19

> 計測時刻: 2026-11-20T23:16:39.768Z
> 前日比: 2026-11-18

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
| Requests | 67.47K | ▼ -7.7%  |
| Errors | 107 | ▼ -21.9% ✅ |
| Subrequests | 582 | ▼ -37.3% ✅ |

**Error rate**: 0.16% (107/67471)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 1.06K | ▼ -51.4% ✅ |
| Class B ops (reads) | 788.31K | ▲ +5.9%  |
| Egress | 122469MB | ▼ -10.8% ✅ |
| Storage | 58.21GB | ▲ +1.4%  |
| Objects | 183,024 | ▲ +0.8% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 7.96 | 35,366 | 0 | 924 | 6 |
| stats47 | 39.73 | 127,108 | 1.02K | 757.15K | 112626 |
| doboku-note | 1.99 | 16,152 | 6 | 17.30K | 416 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 8.53 | 4,398 | 37 | 12.94K | 9421 |

## History

Last 7 days (`data/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-11-12,0,0,0,0,0,81226,56,3733,6973,953605,170884,46.267,148575
2026-11-13,0,0,0,0,0,159636,138,27509,19623,1909517,331859,47.016,170725
2026-11-14,0,0,0,0,0,113511,56,4067,26518,1360613,204324,52.478,174957
2026-11-16,0,0,0,0,0,148990,93,794,8478,979487,163026,55.298,178721
2026-11-17,0,0,0,0,0,104257,187,1183,3283,994945,144268,56.680,180659
2026-11-18,0,0,0,0,0,73112,137,928,2181,744297,137354,57.411,181588
2026-11-19,0,0,0,0,0,67471,107,582,1059,788311,122469,58.211,183024
```
