# Cloudflare Usage — 2026-07-13

> 計測時刻: 2026-07-14T18:38:58.522Z
> 前日比: 2026-07-12

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
| Requests | 51.20K | ▲ +29.4% ✅ |
| Errors | 20 | ▲ +53.8% ⚠️ |
| Subrequests | 13.10K | ▲ +71.0% ⚠️ |

**Error rate**: 0.04% (20/51198)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 14.08K | ▲ +610.9% ⚠️ |
| Class B ops (reads) | 186.02K | ▲ +43.9% ⚠️ |
| Egress | 42339MB | ▼ -8.9% ✅ |
| Storage | 22.00GB | ▲ +0.7%  |
| Objects | 70,044 | ▲ +1.8% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 19.69 | 61,138 | 10.52K | 182.10K | 41179 |
| doboku-note | 2.31 | 8,906 | 3.56K | 3.92K | 1160 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-07-07,0,0,0,0,0,40406,5,8696,648,118652,53035,21.321,63150
2026-07-08,0,0,0,0,0,43956,10,11227,3589,97096,36769,21.413,63582
2026-07-09,0,0,0,0,0,50673,7,13428,10733,150443,47537,21.475,64733
2026-07-10,0,0,0,0,0,42341,11,9476,10182,167181,44895,21.734,67262
2026-07-11,0,0,0,0,0,40134,7,7291,2102,150545,49973,21.808,68608
2026-07-12,0,0,0,0,0,39567,13,7661,1980,129243,46457,21.844,68814
2026-07-13,0,0,0,0,0,51198,20,13101,14076,186018,42339,21.999,70044
```
