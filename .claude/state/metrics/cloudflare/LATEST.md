# Cloudflare Usage — 2026-07-06

> 計測時刻: 2026-07-07T19:20:55.657Z
> 前日比: 2026-07-05

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
| Requests | 63.26K | ▲ +88.1% ✅ |
| Errors | 785 | ▲ +2142.9% ⚠️ |
| Subrequests | 16.85K | ▲ +195.1% ⚠️ |

**Error rate**: 1.24% (785/63263)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 16.68K | ▲ +622.8% ⚠️ |
| Class B ops (reads) | 242.51K | ▲ +111.6% ⚠️ |
| Egress | 61022MB | ▲ +56.0% ⚠️ |
| Storage | 21.30GB | ▲ +0.5%  |
| Objects | 63,018 | ▲ +1.1% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 19.01 | 54,173 | 16.68K | 235.50K | 60546 |
| doboku-note | 2.29 | 8,845 | 0 | 7.01K | 475 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-06-30,0,0,0,0,0,49144,22,12877,6775,201806,56571,19.357,51693
2026-07-01,0,0,0,0,0,32257,23,9396,3388,97048,35148,19.880,51703
2026-07-02,0,0,0,0,0,31745,120,8986,20309,77732,35261,20.093,53175
2026-07-03,0,0,0,0,0,40638,137,9198,15537,126494,50706,20.232,53900
2026-07-04,0,0,0,0,0,32247,64,6652,14664,120744,43133,20.649,54354
2026-07-05,0,0,0,0,0,33639,35,5711,2307,114598,39126,21.193,62348
2026-07-06,0,0,0,0,0,63263,785,16851,16675,242511,61022,21.296,63018
```
