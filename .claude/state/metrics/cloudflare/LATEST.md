# Cloudflare Usage — 2026-07-27

> 計測時刻: 2026-07-28T18:53:38.582Z
> 前日比: 2026-07-26

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
| Requests | 49.77K | ▲ +24.1% ✅ |
| Errors | 1 | → |
| Subrequests | 8.72K | ▲ +23.6%  |

**Error rate**: 0.00% (1/49767)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 25.72K | ▲ +1854.7% ⚠️ |
| Class B ops (reads) | 191.02K | ▲ +17.3%  |
| Egress | 60583MB | ▲ +66.3% ⚠️ |
| Storage | 15.86GB | ▼ -37.9% ✅ |
| Objects | 53,694 | ▼ -34.5% ⚠️ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 11.85 | 44,473 | 25.72K | 188.64K | 60264 |
| doboku-note | 2.34 | 8,926 | 0 | 2.38K | 319 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 1.67 | 295 | 0 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-07-21,0,0,0,0,0,50853,0,12628,94,123070,25902,24.745,77001
2026-07-22,0,0,0,0,0,51526,0,9797,1610,121714,41225,24.931,78203
2026-07-23,0,0,0,0,0,48886,0,9718,1510,149671,57440,25.269,80274
2026-07-24,0,0,0,0,0,49608,0,16955,6935,242107,72927,25.308,80563
2026-07-25,0,0,0,0,0,35824,0,10081,4234,134099,33316,25.463,81506
2026-07-26,0,0,0,0,0,40106,0,7055,1316,162881,36436,25.531,82016
2026-07-27,0,0,0,0,0,49767,1,8720,25724,191019,60583,15.855,53694
```
