# Cloudflare Usage — 2026-11-24

> 計測時刻: 2026-11-25T01:30:30.904Z
> 前日比: 2026-11-23

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
| Requests | 65.92K | ▼ -15.6%  |
| Errors | 19 | ▼ -42.4% ✅ |
| Subrequests | 597 | ▼ -31.1% ✅ |

**Error rate**: 0.03% (19/65922)

### Route 別 CPU

取得不能: telemetry query total: HTTP 403 [{"message":"Forbidden"}]

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 10.31K | ▼ -60.7% ✅ |
| Class B ops (reads) | 519.32K | ▼ -32.8% ✅ |
| Egress | 87784MB | ▼ -37.4% ✅ |
| Storage | 86.16GB | ▲ +7.2%  |
| Objects | 201,840 | ▲ +2.6% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 7.97 | 35,534 | 86 | 812 | 36 |
| stats47 | 67.33 | 145,692 | 9.76K | 486.88K | 79318 |
| doboku-note | 1.99 | 16,168 | 85 | 21.11K | 647 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 8.87 | 4,446 | 377 | 10.52K | 7783 |

## History

Last 7 days (`data/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-11-17,0,0,0,0,0,104257,187,1183,3283,994945,144268,56.680,180659
2026-11-18,0,0,0,0,0,73112,137,928,2181,744297,137354,57.411,181588
2026-11-19,0,0,0,0,0,67471,107,582,1059,788311,122469,58.211,183024
2026-11-20,0,0,0,0,0,108886,337,1244,4949,1164900,158763,59.002,183777
2026-11-21,0,0,0,0,0,93060,102,1358,9941,960554,158678,65.693,183735
2026-11-23,0,0,0,0,0,78073,33,866,26265,773308,140187,80.363,196737
2026-11-24,0,0,0,0,0,65922,19,597,10312,519315,87784,86.159,201840
```
