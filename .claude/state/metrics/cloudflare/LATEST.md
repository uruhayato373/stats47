# Cloudflare Usage — 2026-04-29

> 計測時刻: 2026-04-30T17:56:22.187Z
> 前日比: 2026-04-28

## D1

| 指標 | 当日 | 前日比 |
|---|---|---|
| Databases (active) | 1 | → |
| Read queries | 7.49K | ▼ -92.1% ✅ |
| Rows read | 23.07M | ▼ -98.8% ✅ |
| Write queries | 0 | → |
| Rows written | 0 | → |

**⚠️ D1 database が検出されています**: 6cea2d7a-87c2-408b-9de3-72b1bc240478

Phase 10 で削除済のはずです。新規作成された場合は意図を確認してください。

## Workers

| 指標 | 当日 | 前日比 |
|---|---|---|
| Requests | 14.12K | ▼ -23.4%  |
| Errors | 2 | ▼ -66.7% ✅ |
| Subrequests | 5.46K | ▼ -42.9% ✅ |

**Error rate**: 0.01% (2/14124)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 33.01K | ▲ +752.8% ⚠️ |
| Class B ops (reads) | 52.43K | ▲ +229.6% ⚠️ |
| Egress | 43686MB | ▲ +397.7% ⚠️ |
| Storage | 10.70GB | ▲ +0.0%  |
| Objects | 56,354 | ▲ +0.6% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 9.52 | 47,333 | 33.01K | 50.54K | 43667 |
| doboku-note | 0.66 | 6,390 | 0 | 1.89K | 19 |
| kakkom | 0.52 | 2,631 | 0 | 0 | 0 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| obsidian-pdf | 0.00 | 0 | 0 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-04-28,1,95079,1939989902,0,0,18431,6,9556,3870,15907,8777,10.703,55993
2026-04-29,1,7493,23065123,0,0,14124,2,5458,33005,52431,43686,10.705,56354
```
