# Cloudflare Usage — 2026-07-29

> 計測時刻: 2026-07-30T18:55:47.804Z
> 前日比: 2026-07-28

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
| Requests | 45.16K | ▲ +4.4% ✅ |
| Errors | 2 | ▼ -33.3% ✅ |
| Subrequests | 9.04K | ▲ +11.5%  |

**Error rate**: 0.00% (2/45163)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 7.34K | ▲ +286.7% ⚠️ |
| Class B ops (reads) | 232.17K | ▲ +111.7% ⚠️ |
| Egress | 62611MB | ▲ +41.0% ⚠️ |
| Storage | 16.11GB | ▲ +0.1%  |
| Objects | 55,722 | ▲ +0.3% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 12.10 | 46,501 | 7.34K | 230.26K | 62355 |
| doboku-note | 2.34 | 8,926 | 0 | 1.92K | 256 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 1.67 | 295 | 0 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-07-23,0,0,0,0,0,48886,0,9718,1510,149671,57440,25.269,80274
2026-07-24,0,0,0,0,0,49608,0,16955,6935,242107,72927,25.308,80563
2026-07-25,0,0,0,0,0,35824,0,10081,4234,134099,33316,25.463,81506
2026-07-26,0,0,0,0,0,40106,0,7055,1316,162881,36436,25.531,82016
2026-07-27,0,0,0,0,0,49767,1,8720,25724,191019,60583,15.855,53694
2026-07-28,0,0,0,0,0,43273,3,8106,1899,109651,44397,16.089,55538
2026-07-29,0,0,0,0,0,45163,2,9036,7344,232174,62611,16.109,55722
```
