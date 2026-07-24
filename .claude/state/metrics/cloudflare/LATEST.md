# Cloudflare Usage — 2026-07-23

> 計測時刻: 2026-07-24T18:57:42.935Z
> 前日比: 2026-07-22

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
| Requests | 48.89K | ▼ -5.1%  |
| Errors | 0 | → |
| Subrequests | 9.72K | ▼ -0.8% ✅ |

**Error rate**: 0.00% (0/48886)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 1.51K | ▼ -6.2% ✅ |
| Class B ops (reads) | 149.67K | ▲ +23.0%  |
| Egress | 57440MB | ▲ +39.3% ⚠️ |
| Storage | 25.27GB | ▲ +1.4%  |
| Objects | 80,274 | ▲ +2.6% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 21.26 | 71,055 | 1.51K | 146.71K | 57091 |
| doboku-note | 2.34 | 8,924 | 0 | 2.96K | 349 |
| stats47-cache | 0.00 | 0 | 1 | 0 | 0 |
| doboku-note-archive | 1.67 | 295 | 0 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-07-17,0,0,0,0,0,39056,32,10606,5884,128602,31456,22.420,72271
2026-07-18,0,0,0,0,0,32999,34,8924,2570,134560,34375,22.671,73932
2026-07-19,0,0,0,0,0,58362,29,8772,8489,169968,57275,24.586,75852
2026-07-20,0,0,0,0,0,45817,21,10054,6805,141238,40654,24.636,76064
2026-07-21,0,0,0,0,0,50853,0,12628,94,123070,25902,24.745,77001
2026-07-22,0,0,0,0,0,51526,0,9797,1610,121714,41225,24.931,78203
2026-07-23,0,0,0,0,0,48886,0,9718,1510,149671,57440,25.269,80274
```
