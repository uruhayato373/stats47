# Cloudflare Usage — 2026-11-20

> 計測時刻: 2026-11-21T22:16:56.332Z
> 前日比: 2026-11-19

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
| Requests | 108.89K | ▲ +61.4% ✅ |
| Errors | 337 | ▲ +215.0% ⚠️ |
| Subrequests | 1.24K | ▲ +113.7% ⚠️ |

**Error rate**: 0.31% (337/108886)

### Route 別 CPU

取得不能: telemetry query total: HTTP 403 [{"message":"Forbidden"}]

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 4.95K | ▲ +367.3% ⚠️ |
| Class B ops (reads) | 1.16M | ▲ +47.8% ⚠️ |
| Egress | 158763MB | ▲ +29.6%  |
| Storage | 59.00GB | ▲ +1.4%  |
| Objects | 183,777 | ▲ +0.4% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 7.96 | 35,366 | 14 | 347 | 37 |
| stats47 | 40.42 | 127,843 | 3.89K | 1.14M | 151594 |
| doboku-note | 1.99 | 16,152 | 840 | 13.20K | 353 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 8.63 | 4,416 | 203 | 9.44K | 6779 |

## History

Last 7 days (`data/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-11-13,0,0,0,0,0,159636,138,27509,19623,1909517,331859,47.016,170725
2026-11-14,0,0,0,0,0,113511,56,4067,26518,1360613,204324,52.478,174957
2026-11-16,0,0,0,0,0,148990,93,794,8478,979487,163026,55.298,178721
2026-11-17,0,0,0,0,0,104257,187,1183,3283,994945,144268,56.680,180659
2026-11-18,0,0,0,0,0,73112,137,928,2181,744297,137354,57.411,181588
2026-11-19,0,0,0,0,0,67471,107,582,1059,788311,122469,58.211,183024
2026-11-20,0,0,0,0,0,108886,337,1244,4949,1164900,158763,59.002,183777
```
