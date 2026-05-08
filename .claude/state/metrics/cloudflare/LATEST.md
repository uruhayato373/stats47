# Cloudflare Usage — 2026-05-07

> 計測時刻: 2026-05-08T17:56:56.597Z
> 前日比: 2026-05-04

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
| Requests | 8.34K | ▼ -42.3% ⚠️ |
| Errors | 0 | ▼ -100.0% ✅ |
| Subrequests | 48 | ▼ -99.2% ✅ |

**Error rate**: 0.00% (0/8341)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 0 | ▼ -100.0% ✅ |
| Class B ops (reads) | 2.18K | ▼ -96.4% ✅ |
| Egress | 22MB | ▼ -100.0% ✅ |
| Storage | 7.24GB | ▼ -44.6% ✅ |
| Objects | 23,630 | ▼ -60.2% ⚠️ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 6.06 | 14,609 | 0 | 536 | 0 |
| doboku-note | 0.66 | 6,390 | 0 | 1.64K | 22 |
| kakkom | 0.52 | 2,631 | 0 | 0 | 0 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| obsidian-pdf | 0.00 | 0 | 0 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-04-29,1,7493,23065123,0,0,12837,2,5008,33005,48390,40509,10.703,55993
2026-04-30,0,0,0,0,0,18382,0,8004,7295,55795,46120,10.699,56354
2026-05-01,0,0,0,0,0,16069,75,8884,0,45138,42479,10.699,56354
2026-05-02,0,0,0,0,0,14649,0,4759,0,37813,33490,10.699,56384
2026-05-03,0,0,0,0,0,13738,6,5610,325,55734,48185,13.063,59254
2026-05-04,0,0,0,0,0,14447,1,5963,7460,60749,53743,13.071,59300
2026-05-07,0,0,0,0,0,8341,0,48,0,2180,22,7.245,23630
```
