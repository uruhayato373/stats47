# Cloudflare Usage — 2026-11-23

> 計測時刻: 2026-11-24T03:25:42.669Z
> 前日比: 2026-11-21

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
| Requests | 78.07K | ▼ -16.1%  |
| Errors | 33 | ▼ -67.6% ✅ |
| Subrequests | 866 | ▼ -36.2% ✅ |

**Error rate**: 0.04% (33/78073)

### Route 別 CPU

取得不能: telemetry query total: HTTP 403 [{"message":"Forbidden"}]

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 26.27K | ▲ +164.2% ⚠️ |
| Class B ops (reads) | 773.31K | ▼ -19.5% ✅ |
| Egress | 140187MB | ▼ -11.7% ✅ |
| Storage | 80.36GB | ▲ +22.3%  |
| Objects | 196,737 | ▲ +7.1% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 7.97 | 35,449 | 221 | 825 | 8 |
| stats47 | 61.63 | 140,702 | 26.00K | 735.32K | 134593 |
| doboku-note | 1.99 | 16,152 | 12 | 29.85K | 244 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 8.78 | 4,434 | 36 | 7.32K | 5341 |

## History

Last 7 days (`data/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-11-16,0,0,0,0,0,148990,93,794,8478,979487,163026,55.298,178721
2026-11-17,0,0,0,0,0,104257,187,1183,3283,994945,144268,56.680,180659
2026-11-18,0,0,0,0,0,73112,137,928,2181,744297,137354,57.411,181588
2026-11-19,0,0,0,0,0,67471,107,582,1059,788311,122469,58.211,183024
2026-11-20,0,0,0,0,0,108886,337,1244,4949,1164900,158763,59.002,183777
2026-11-21,0,0,0,0,0,93060,102,1358,9941,960554,158678,65.693,183735
2026-11-23,0,0,0,0,0,78073,33,866,26265,773308,140187,80.363,196737
```
