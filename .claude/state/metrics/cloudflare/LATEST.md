# Cloudflare Usage — 2026-07-03

> 計測時刻: 2026-07-04T18:32:06.449Z
> 前日比: 2026-07-02

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
| Requests | 40.64K | ▲ +28.0% ✅ |
| Errors | 137 | ▲ +14.2%  |
| Subrequests | 9.20K | ▲ +2.4%  |

**Error rate**: 0.34% (137/40638)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 15.54K | ▼ -23.5% ✅ |
| Class B ops (reads) | 126.49K | ▲ +62.7% ⚠️ |
| Egress | 50706MB | ▲ +43.8% ⚠️ |
| Storage | 20.23GB | ▲ +0.7%  |
| Objects | 53,900 | ▲ +1.4% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 17.94 | 45,067 | 1.66K | 121.72K | 47845 |
| doboku-note | 2.29 | 8,833 | 13.88K | 4.78K | 2861 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-06-27,0,0,0,0,0,19652,23,4544,117,72914,23825,19.428,51523
2026-06-28,0,0,0,0,0,27048,33,5462,6946,67048,29311,19.429,51627
2026-06-29,0,0,0,0,0,42455,49,7737,3366,111747,55879,19.357,51673
2026-06-30,0,0,0,0,0,49144,22,12877,6775,201806,56571,19.357,51693
2026-07-01,0,0,0,0,0,32257,23,9396,3388,97048,35148,19.880,51703
2026-07-02,0,0,0,0,0,31745,120,8986,20309,77732,35261,20.093,53175
2026-07-03,0,0,0,0,0,40638,137,9198,15537,126494,50706,20.232,53900
```
