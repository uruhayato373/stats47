# Cloudflare Usage — 2026-11-17

> 計測時刻: 2026-11-18T23:29:50.721Z
> 前日比: 2026-11-16

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
| Requests | 104.26K | ▼ -30.0% ⚠️ |
| Errors | 187 | ▲ +101.1% ⚠️ |
| Subrequests | 1.18K | ▲ +49.0% ⚠️ |

**Error rate**: 0.18% (187/104257)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 3.28K | ▼ -61.3% ✅ |
| Class B ops (reads) | 994.95K | ▲ +1.6%  |
| Egress | 144268MB | ▼ -11.5% ✅ |
| Storage | 56.68GB | ▲ +2.5%  |
| Objects | 180,659 | ▲ +1.1% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 7.96 | 35,365 | 9 | 1.56K | 978 |
| stats47 | 38.42 | 124,775 | 3.22K | 961.18K | 134208 |
| doboku-note | 1.99 | 16,152 | 8 | 20.64K | 433 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 8.32 | 4,367 | 46 | 11.56K | 8649 |

## History

Last 7 days (`data/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-11-10,0,0,0,0,0,66572,23,1377,1803,506913,98751,45.160,144001
2026-11-11,0,0,0,0,0,86313,93,1505,14121,1111382,193207,45.328,146499
2026-11-12,0,0,0,0,0,81226,56,3733,6973,953605,170884,46.267,148575
2026-11-13,0,0,0,0,0,159636,138,27509,19623,1909517,331859,47.016,170725
2026-11-14,0,0,0,0,0,113511,56,4067,26518,1360613,204324,52.478,174957
2026-11-16,0,0,0,0,0,148990,93,794,8478,979487,163026,55.298,178721
2026-11-17,0,0,0,0,0,104257,187,1183,3283,994945,144268,56.680,180659
```
