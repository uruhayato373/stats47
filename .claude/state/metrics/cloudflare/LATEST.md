# Cloudflare Usage — 2026-05-10

> 計測時刻: 2026-05-11T18:08:51.196Z
> 前日比: 2026-05-08

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
| Requests | 17.55K | ▲ +7.0% ✅ |
| Errors | 182 | ▲ +18100.0% ⚠️ |
| Subrequests | 9.44K | ▲ +135.9% ⚠️ |

**Error rate**: 1.04% (182/17555)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 16.42K | ▲ +81.0% ⚠️ |
| Class B ops (reads) | 99.49K | ▲ +125.7% ⚠️ |
| Egress | 22026MB | ▲ +133.3% ⚠️ |
| Storage | 7.84GB | ▲ +7.6%  |
| Objects | 27,135 | ▲ +14.4% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 6.66 | 18,114 | 16.42K | 98.22K | 22010 |
| doboku-note | 0.66 | 6,390 | 0 | 1.27K | 16 |
| kakkom | 0.52 | 2,631 | 0 | 0 | 0 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| obsidian-pdf | 0.00 | 0 | 0 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-05-01,0,0,0,0,0,16069,75,8884,0,45138,42479,10.699,56354
2026-05-02,0,0,0,0,0,14649,0,4759,0,37813,33490,10.699,56384
2026-05-03,0,0,0,0,0,13738,6,5610,325,55734,48185,13.063,59254
2026-05-04,0,0,0,0,0,14447,1,5963,7460,60749,53743,13.071,59300
2026-05-07,0,0,0,0,0,8341,0,48,0,2180,22,7.245,23630
2026-05-08,0,0,0,0,0,16399,1,4002,9071,44085,9441,7.286,23728
2026-05-10,0,0,0,0,0,17555,182,9439,16416,99491,22026,7.841,27135
```
