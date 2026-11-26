# Cloudflare Usage — 2026-11-25

> 計測時刻: 2026-11-26T01:05:22.496Z
> 前日比: 2026-11-24

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
| Requests | 67.26K | ▲ +2.0% ✅ |
| Errors | 22 | ▲ +15.8%  |
| Subrequests | 724 | ▲ +21.3%  |

**Error rate**: 0.03% (22/67259)

### Route 別 CPU

取得不能: telemetry query total: HTTP 403 [{"message":"Forbidden"}]

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 13.78K | ▲ +33.6% ⚠️ |
| Class B ops (reads) | 605.45K | ▲ +16.6%  |
| Egress | 111388MB | ▲ +26.9%  |
| Storage | 73.26GB | ▼ -15.0% ✅ |
| Objects | 190,843 | ▼ -5.4%  |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 7.97 | 35,535 | 1 | 262 | 32 |
| stats47 | 54.36 | 134,565 | 13.60K | 580.45K | 105922 |
| doboku-note | 1.99 | 16,282 | 146 | 18.63K | 1093 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 8.94 | 4,461 | 31 | 6.11K | 4340 |

## History

Last 7 days (`data/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-11-18,0,0,0,0,0,73112,137,928,2181,744297,137354,57.411,181588
2026-11-19,0,0,0,0,0,67471,107,582,1059,788311,122469,58.211,183024
2026-11-20,0,0,0,0,0,108886,337,1244,4949,1164900,158763,59.002,183777
2026-11-21,0,0,0,0,0,93060,102,1358,9941,960554,158678,65.693,183735
2026-11-23,0,0,0,0,0,78073,33,866,26265,773308,140187,80.363,196737
2026-11-24,0,0,0,0,0,65922,19,597,10312,519315,87784,86.159,201840
2026-11-25,0,0,0,0,0,67259,22,724,13776,605448,111388,73.256,190843
```
