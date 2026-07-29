# Cloudflare Usage — 2026-07-28

> 計測時刻: 2026-07-29T18:32:41.027Z
> 前日比: 2026-07-27

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
| Requests | 43.27K | ▼ -13.0%  |
| Errors | 3 | ▲ +200.0% ⚠️ |
| Subrequests | 8.11K | ▼ -7.0% ✅ |

**Error rate**: 0.01% (3/43273)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 1.90K | ▼ -92.6% ✅ |
| Class B ops (reads) | 109.65K | ▼ -42.6% ✅ |
| Egress | 44397MB | ▼ -26.7% ✅ |
| Storage | 16.09GB | ▲ +1.5%  |
| Objects | 55,538 | ▲ +3.4% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 12.08 | 46,317 | 1.90K | 106.83K | 44068 |
| doboku-note | 2.34 | 8,926 | 0 | 2.82K | 329 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 1.67 | 295 | 0 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-07-22,0,0,0,0,0,51526,0,9797,1610,121714,41225,24.931,78203
2026-07-23,0,0,0,0,0,48886,0,9718,1510,149671,57440,25.269,80274
2026-07-24,0,0,0,0,0,49608,0,16955,6935,242107,72927,25.308,80563
2026-07-25,0,0,0,0,0,35824,0,10081,4234,134099,33316,25.463,81506
2026-07-26,0,0,0,0,0,40106,0,7055,1316,162881,36436,25.531,82016
2026-07-27,0,0,0,0,0,49767,1,8720,25724,191019,60583,15.855,53694
2026-07-28,0,0,0,0,0,43273,3,8106,1899,109651,44397,16.089,55538
```
