# Cloudflare Usage — 2026-07-11

> 計測時刻: 2026-07-12T18:27:17.039Z
> 前日比: 2026-07-10

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
| Requests | 40.13K | ▼ -5.2%  |
| Errors | 7 | ▼ -36.4% ✅ |
| Subrequests | 7.29K | ▼ -23.1% ✅ |

**Error rate**: 0.02% (7/40134)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 2.10K | ▼ -79.4% ✅ |
| Class B ops (reads) | 150.54K | ▼ -10.0% ✅ |
| Egress | 49973MB | ▲ +11.3%  |
| Storage | 21.81GB | ▲ +0.3%  |
| Objects | 68,608 | ▲ +2.0% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 19.50 | 59,712 | 2.10K | 147.84K | 49673 |
| doboku-note | 2.31 | 8,896 | 0 | 2.70K | 300 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-07-05,0,0,0,0,0,33639,35,5711,2307,114598,39126,21.193,62348
2026-07-06,0,0,0,0,0,63263,785,16851,16675,242511,61022,21.296,63018
2026-07-07,0,0,0,0,0,40406,5,8696,648,118652,53035,21.321,63150
2026-07-08,0,0,0,0,0,43956,10,11227,3589,97096,36769,21.413,63582
2026-07-09,0,0,0,0,0,50673,7,13428,10733,150443,47537,21.475,64733
2026-07-10,0,0,0,0,0,42341,11,9476,10182,167181,44895,21.734,67262
2026-07-11,0,0,0,0,0,40134,7,7291,2102,150545,49973,21.808,68608
```
