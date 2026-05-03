# Cloudflare Usage — 2026-05-02

> 計測時刻: 2026-05-03T17:47:41.494Z
> 前日比: 2026-04-29

## D1

| 指標 | 当日 | 前日比 |
|---|---|---|
| Databases (active) | 0 | ▼ -100.0% ✅ |
| Read queries | 0 | ▼ -100.0% ✅ |
| Rows read | 0 | ▼ -100.0% ✅ |
| Write queries | 0 | → |
| Rows written | 0 | → |

## Workers

| 指標 | 当日 | 前日比 |
|---|---|---|
| Requests | 14.65K | ▲ +14.1% ✅ |
| Errors | 0 | ▼ -100.0% ✅ |
| Subrequests | 4.76K | ▼ -5.0% ✅ |

**Error rate**: 0.00% (0/14649)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 0 | ▼ -100.0% ✅ |
| Class B ops (reads) | 37.81K | ▼ -21.9% ✅ |
| Egress | 33490MB | ▼ -17.3% ✅ |
| Storage | 10.70GB | ▼ -0.0% ✅ |
| Objects | 56,384 | ▲ +0.7% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 9.52 | 47,363 | 0 | 36.71K | 33476 |
| doboku-note | 0.66 | 6,390 | 0 | 1.10K | 14 |
| kakkom | 0.52 | 2,631 | 0 | 0 | 0 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| obsidian-pdf | 0.00 | 0 | 0 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-04-28,1,95079,1939989902,0,0,18431,6,9556,3870,15907,8777,10.703,55993
2026-04-29,1,7493,23065123,0,0,12837,2,5008,33005,48390,40509,10.703,55993
2026-05-02,0,0,0,0,0,14649,0,4759,0,37813,33490,10.699,56384
```
