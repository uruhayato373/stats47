# Cloudflare Usage — 2026-10-11

> 計測時刻: 2026-10-12T23:45:43.531Z
> 前日比: 2026-10-10

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
| Requests | 66.09K | ▼ -39.2% ⚠️ |
| Errors | 36 | ▼ -23.4% ✅ |
| Subrequests | 55 | ▼ -89.4% ✅ |

**Error rate**: 0.05% (36/66087)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 21.61K | ▼ -27.4% ✅ |
| Class B ops (reads) | 506.30K | ▼ -35.0% ✅ |
| Egress | 74537MB | ▼ -35.1% ✅ |
| Storage | 34.15GB | ▲ +1.1%  |
| Objects | 120,843 | ▲ +1.5% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 0.25 | 3,450 | 960 | 4.56K | 337 |
| stats47 | 25.98 | 101,864 | 5.34K | 380.24K | 72293 |
| doboku-note | 0.95 | 12,311 | 15.23K | 120.89K | 1731 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 6.97 | 3,218 | 83 | 612 | 176 |

## History

Last 7 days (`data/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-10-05,0,0,0,0,0,108063,104,54,34831,469975,88343,33.592,116619
2026-10-06,0,0,0,0,0,103583,206,55,39490,1139598,199778,33.587,116829
2026-10-07,0,0,0,0,0,106021,194,64,70285,881513,169098,33.896,118333
2026-10-08,0,0,0,0,0,120617,166,122,99666,1330642,188895,33.724,118576
2026-10-09,0,0,0,0,0,98967,95,42,49848,1000951,118369,33.635,117879
2026-10-10,0,0,0,0,0,108703,47,519,29760,778461,114834,33.769,119071
2026-10-11,0,0,0,0,0,66087,36,55,21610,506298,74537,34.152,120843
```
