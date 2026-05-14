# Cloudflare Usage — 2026-05-13

> 計測時刻: 2026-05-14T18:09:53.874Z
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
| Requests | 12.98K | ▼ -20.8%  |
| Errors | 12 | ▲ +1100.0% ⚠️ |
| Subrequests | 6.49K | ▲ +62.1% ⚠️ |

**Error rate**: 0.09% (12/12981)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 64 | ▼ -99.3% ✅ |
| Class B ops (reads) | 65.62K | ▲ +48.8% ⚠️ |
| Egress | 21356MB | ▲ +126.2% ⚠️ |
| Storage | 7.85GB | ▲ +7.7%  |
| Objects | 27,187 | ▲ +14.6% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 6.67 | 18,166 | 64 | 64.02K | 21337 |
| doboku-note | 0.66 | 6,390 | 0 | 1.60K | 20 |
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
2026-05-13,0,0,0,0,0,12981,12,6486,64,65617,21356,7.850,27187
```
