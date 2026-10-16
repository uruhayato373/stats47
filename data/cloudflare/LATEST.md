# Cloudflare Usage — 2026-10-15

> 計測時刻: 2026-10-16T20:02:47.299Z
> 前日比: 2026-10-14

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
| Requests | 130.49K | ▲ +18.8% ✅ |
| Errors | 125 | ▼ -2.3% ✅ |
| Subrequests | 161 | ▲ +17.5%  |

**Error rate**: 0.10% (125/130494)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 22.95K | ▲ +189.6% ⚠️ |
| Class B ops (reads) | 804.37K | ▲ +103.8% ⚠️ |
| Egress | 137415MB | ▲ +54.0% ⚠️ |
| Storage | 35.22GB | ▲ +0.4%  |
| Objects | 126,026 | ▲ +1.0% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 0.99 | 5,349 | 346 | 2.10K | 1990 |
| stats47 | 26.29 | 104,363 | 10.42K | 601.13K | 122682 |
| doboku-note | 0.97 | 13,073 | 12.17K | 183.79K | 494 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 6.98 | 3,241 | 21 | 17.35K | 12248 |

## History

Last 7 days (`data/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-10-09,0,0,0,0,0,98967,95,42,49848,1000951,118369,33.635,117879
2026-10-10,0,0,0,0,0,108703,47,519,29760,778461,114834,33.769,119071
2026-10-11,0,0,0,0,0,66087,36,55,21610,506298,74537,34.152,120843
2026-10-12,0,0,0,0,0,96597,76,78,11706,450599,86216,34.582,123347
2026-10-13,0,0,0,0,0,153311,216,211,15103,784526,168686,34.728,123890
2026-10-14,0,0,0,0,0,109881,128,137,7925,394745,89245,35.073,124731
2026-10-15,0,0,0,0,0,130494,125,161,22953,804371,137415,35.224,126026
```
