# Cloudflare Usage — 2026-07-24

> 計測時刻: 2026-07-25T18:27:04.403Z
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
| Requests | 49.61K | ▼ -3.7%  |
| Errors | 0 | → |
| Subrequests | 16.95K | ▲ +73.1% ⚠️ |

**Error rate**: 0.00% (0/49608)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 6.93K | ▲ +330.7% ⚠️ |
| Class B ops (reads) | 242.11K | ▲ +98.9% ⚠️ |
| Egress | 72927MB | ▲ +76.9% ⚠️ |
| Storage | 25.31GB | ▲ +1.5%  |
| Objects | 80,563 | ▲ +3.0% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 21.30 | 71,342 | 3.36K | 240.10K | 71904 |
| doboku-note | 2.34 | 8,926 | 3.57K | 2.00K | 1023 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
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
2026-07-24,0,0,0,0,0,49608,0,16955,6935,242107,72927,25.308,80563
```
