# Cloudflare Usage — 2026-07-12

> 計測時刻: 2026-07-13T18:55:35.930Z
> 前日比: 2026-07-11

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
| Requests | 39.57K | ▼ -1.4%  |
| Errors | 13 | ▲ +85.7% ⚠️ |
| Subrequests | 7.66K | ▲ +5.1%  |

**Error rate**: 0.03% (13/39567)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 1.98K | ▼ -5.8% ✅ |
| Class B ops (reads) | 129.24K | ▼ -14.1% ✅ |
| Egress | 46457MB | ▼ -7.0% ✅ |
| Storage | 21.84GB | ▲ +0.2%  |
| Objects | 68,814 | ▲ +0.3% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 19.54 | 59,918 | 1.98K | 126.31K | 46139 |
| doboku-note | 2.31 | 8,896 | 0 | 2.93K | 318 |
| stats47-cache | 0.00 | 0 | 1 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-07-06,0,0,0,0,0,63263,785,16851,16675,242511,61022,21.296,63018
2026-07-07,0,0,0,0,0,40406,5,8696,648,118652,53035,21.321,63150
2026-07-08,0,0,0,0,0,43956,10,11227,3589,97096,36769,21.413,63582
2026-07-09,0,0,0,0,0,50673,7,13428,10733,150443,47537,21.475,64733
2026-07-10,0,0,0,0,0,42341,11,9476,10182,167181,44895,21.734,67262
2026-07-11,0,0,0,0,0,40134,7,7291,2102,150545,49973,21.808,68608
2026-07-12,0,0,0,0,0,39567,13,7661,1980,129243,46457,21.844,68814
```
