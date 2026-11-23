# Cloudflare Usage — 2026-11-21

> 計測時刻: 2026-11-22T22:41:13.089Z
> 前日比: 2026-11-20

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
| Requests | 93.06K | ▼ -14.5%  |
| Errors | 102 | ▼ -69.7% ✅ |
| Subrequests | 1.36K | ▲ +9.2%  |

**Error rate**: 0.11% (102/93060)

### Route 別 CPU

取得不能: telemetry query total: HTTP 403 [{"message":"Forbidden"}]

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 9.94K | ▲ +100.9% ⚠️ |
| Class B ops (reads) | 960.55K | ▼ -17.5% ✅ |
| Egress | 158678MB | ▼ -0.1% ✅ |
| Storage | 65.69GB | ▲ +11.3%  |
| Objects | 183,735 | ▼ -0.0%  |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 7.96 | 35,369 | 0 | 308 | 2 |
| stats47 | 47.06 | 127,792 | 9.90K | 938.80K | 150052 |
| doboku-note | 1.99 | 16,152 | 0 | 9.87K | 355 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 8.69 | 4,422 | 38 | 11.57K | 8269 |

## History

Last 7 days (`data/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-11-14,0,0,0,0,0,113511,56,4067,26518,1360613,204324,52.478,174957
2026-11-16,0,0,0,0,0,148990,93,794,8478,979487,163026,55.298,178721
2026-11-17,0,0,0,0,0,104257,187,1183,3283,994945,144268,56.680,180659
2026-11-18,0,0,0,0,0,73112,137,928,2181,744297,137354,57.411,181588
2026-11-19,0,0,0,0,0,67471,107,582,1059,788311,122469,58.211,183024
2026-11-20,0,0,0,0,0,108886,337,1244,4949,1164900,158763,59.002,183777
2026-11-21,0,0,0,0,0,93060,102,1358,9941,960554,158678,65.693,183735
```
