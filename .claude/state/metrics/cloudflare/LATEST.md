# Cloudflare Usage — 2026-07-10

> 計測時刻: 2026-07-11T18:25:54.066Z
> 前日比: 2026-07-09

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
| Requests | 42.34K | ▼ -16.4%  |
| Errors | 11 | ▲ +57.1% ⚠️ |
| Subrequests | 9.48K | ▼ -29.4% ✅ |

**Error rate**: 0.03% (11/42341)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 10.18K | ▼ -5.1% ✅ |
| Class B ops (reads) | 167.18K | ▲ +11.1%  |
| Egress | 44895MB | ▼ -5.6% ✅ |
| Storage | 21.73GB | ▲ +1.2%  |
| Objects | 67,262 | ▲ +3.9% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 19.43 | 58,366 | 3.10K | 162.19K | 43109 |
| doboku-note | 2.31 | 8,896 | 7.08K | 4.99K | 1786 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-07-04,0,0,0,0,0,32247,64,6652,14664,120744,43133,20.649,54354
2026-07-05,0,0,0,0,0,33639,35,5711,2307,114598,39126,21.193,62348
2026-07-06,0,0,0,0,0,63263,785,16851,16675,242511,61022,21.296,63018
2026-07-07,0,0,0,0,0,40406,5,8696,648,118652,53035,21.321,63150
2026-07-08,0,0,0,0,0,43956,10,11227,3589,97096,36769,21.413,63582
2026-07-09,0,0,0,0,0,50673,7,13428,10733,150443,47537,21.475,64733
2026-07-10,0,0,0,0,0,42341,11,9476,10182,167181,44895,21.734,67262
```
