# Cloudflare Usage — 2026-04-29

> 計測時刻: 2026-04-29T22:06:45.840Z
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
| Requests | 12.84K | ▼ -30.4% ⚠️ |
| Errors | 2 | ▼ -66.7% ✅ |
| Subrequests | 5.01K | ▼ -47.6% ✅ |

**Error rate**: 0.02% (2/12837)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 33.01K | ▲ +752.8% ⚠️ |
| Class B ops (reads) | 48.39K | ▲ +204.2% ⚠️ |
| Egress | 40509MB | ▲ +361.5% ⚠️ |
| Storage | 10.70GB | → |
| Objects | 55,993 | → |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 9.52 | 47,117 | 33.01K | 46.54K | 40491 |
| doboku-note | 0.66 | 6,245 | 0 | 1.85K | 19 |
| kakkom | 0.52 | 2,631 | 0 | 0 | 0 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| obsidian-pdf | 0.00 | 0 | 0 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-04-28,1,95079,1939989902,0,0,18431,6,9556,3870,15907,8777,10.703,55993
2026-04-29,1,7493,23065123,0,0,12837,2,5008,33005,48390,40509,10.703,55993
```
