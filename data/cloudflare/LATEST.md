# Cloudflare Usage — 2026-11-27

> 計測時刻: 2026-11-28T00:38:40.495Z
> 前日比: 2026-11-26

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
| Requests | 103.54K | ▲ +16.4% ✅ |
| Errors | 38 | ▼ -2.6% ✅ |
| Subrequests | 4.59K | ▲ +454.2% ⚠️ |

**Error rate**: 0.04% (38/103537)

### Route 別 CPU

取得不能: telemetry query total: HTTP 403 [{"message":"Forbidden"}]

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 12.79K | ▲ +10.1%  |
| Class B ops (reads) | 501.63K | ▼ -8.6% ✅ |
| Egress | 91805MB | ▲ +6.9%  |
| Storage | 87.16GB | ▲ +6.6%  |
| Objects | 202,906 | ▲ +2.0% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 7.97 | 35,536 | 6 | 20 | 3 |
| stats47 | 68.22 | 146,609 | 12.77K | 489.02K | 89719 |
| doboku-note | 1.99 | 16,282 | 0 | 10.11K | 285 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 8.98 | 4,479 | 20 | 2.49K | 1799 |

## History

Last 7 days (`data/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-11-20,0,0,0,0,0,108886,337,1244,4949,1164900,158763,59.002,183777
2026-11-21,0,0,0,0,0,93060,102,1358,9941,960554,158678,65.693,183735
2026-11-23,0,0,0,0,0,78073,33,866,26265,773308,140187,80.363,196737
2026-11-24,0,0,0,0,0,65922,19,597,10312,519315,87784,86.159,201840
2026-11-25,0,0,0,0,0,67259,22,724,13776,605448,111388,73.256,190843
2026-11-26,0,0,0,0,0,88967,39,829,11622,549109,85859,81.787,198856
2026-11-27,0,0,0,0,0,103537,38,4594,12792,501633,91805,87.160,202906
```
