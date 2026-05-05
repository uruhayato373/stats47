# Cloudflare Usage — 2026-05-03

> 計測時刻: 2026-05-04T18:02:38.285Z
> 前日比: 2026-05-02

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
| Requests | 13.74K | ▼ -6.2%  |
| Errors | 6 | → |
| Subrequests | 5.61K | ▲ +17.9%  |

**Error rate**: 0.04% (6/13738)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 325 | → |
| Class B ops (reads) | 55.73K | ▲ +47.4% ⚠️ |
| Egress | 48185MB | ▲ +43.9% ⚠️ |
| Storage | 13.06GB | ▲ +22.1%  |
| Objects | 59,254 | ▲ +5.1% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 11.88 | 50,233 | 325 | 53.98K | 48163 |
| doboku-note | 0.66 | 6,390 | 0 | 1.75K | 22 |
| kakkom | 0.52 | 2,631 | 0 | 0 | 0 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| obsidian-pdf | 0.00 | 0 | 0 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-04-28,1,95079,1939989902,0,0,18431,6,9556,3870,15907,8777,10.703,55993
2026-04-29,1,7493,23065123,0,0,12837,2,5008,33005,48390,40509,10.703,55993
2026-04-30,0,0,0,0,0,18382,0,8004,7295,55795,46120,10.699,56354
2026-05-01,0,0,0,0,0,16069,75,8884,0,45138,42479,10.699,56354
2026-05-02,0,0,0,0,0,14649,0,4759,0,37813,33490,10.699,56384
2026-05-03,0,0,0,0,0,13738,6,5610,325,55734,48185,13.063,59254
```
