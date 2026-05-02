# Cloudflare Usage — 2026-05-01

> 計測時刻: 2026-05-02T17:47:25.431Z
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
| Requests | 16.07K | ▲ +25.2% ✅ |
| Errors | 75 | ▲ +3650.0% ⚠️ |
| Subrequests | 8.88K | ▲ +77.4% ⚠️ |

**Error rate**: 0.47% (75/16069)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 0 | ▼ -100.0% ✅ |
| Class B ops (reads) | 45.14K | ▼ -6.7% ✅ |
| Egress | 42479MB | ▲ +4.9%  |
| Storage | 10.70GB | ▼ -0.0% ✅ |
| Objects | 56,354 | ▲ +0.6% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 9.52 | 47,333 | 0 | 42.57K | 42437 |
| doboku-note | 0.66 | 6,390 | 0 | 2.57K | 42 |
| kakkom | 0.52 | 2,631 | 0 | 0 | 0 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| obsidian-pdf | 0.00 | 0 | 0 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-04-28,1,95079,1939989902,0,0,18431,6,9556,3870,15907,8777,10.703,55993
2026-04-29,1,7493,23065123,0,0,12837,2,5008,33005,48390,40509,10.703,55993
2026-05-01,0,0,0,0,0,16069,75,8884,0,45138,42479,10.699,56354
```
