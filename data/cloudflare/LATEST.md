# Cloudflare Usage — 2026-11-26

> 計測時刻: 2026-11-27T01:06:21.353Z
> 前日比: 2026-11-25

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
| Requests | 88.97K | ▲ +32.3% ✅ |
| Errors | 39 | ▲ +77.3% ⚠️ |
| Subrequests | 829 | ▲ +14.5%  |

**Error rate**: 0.04% (39/88967)

### Route 別 CPU

取得不能: telemetry query total: HTTP 403 [{"message":"Forbidden"}]

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 11.62K | ▼ -15.6% ✅ |
| Class B ops (reads) | 549.11K | ▼ -9.3% ✅ |
| Egress | 85859MB | ▼ -22.9% ✅ |
| Storage | 81.79GB | ▲ +11.6%  |
| Objects | 198,856 | ▲ +4.2% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 7.97 | 35,535 | 0 | 0 | 0 |
| stats47 | 62.88 | 142,572 | 11.57K | 526.31K | 81849 |
| doboku-note | 1.99 | 16,282 | 6 | 17.84K | 384 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 8.95 | 4,467 | 42 | 4.96K | 3626 |

## History

Last 7 days (`data/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-11-19,0,0,0,0,0,67471,107,582,1059,788311,122469,58.211,183024
2026-11-20,0,0,0,0,0,108886,337,1244,4949,1164900,158763,59.002,183777
2026-11-21,0,0,0,0,0,93060,102,1358,9941,960554,158678,65.693,183735
2026-11-23,0,0,0,0,0,78073,33,866,26265,773308,140187,80.363,196737
2026-11-24,0,0,0,0,0,65922,19,597,10312,519315,87784,86.159,201840
2026-11-25,0,0,0,0,0,67259,22,724,13776,605448,111388,73.256,190843
2026-11-26,0,0,0,0,0,88967,39,829,11622,549109,85859,81.787,198856
```
