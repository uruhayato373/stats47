# Cloudflare Usage — 2026-10-10

> 計測時刻: 2026-10-11T21:03:50.433Z
> 前日比: 2026-10-09

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
| Requests | 108.70K | ▲ +9.8% ✅ |
| Errors | 47 | ▼ -50.5% ✅ |
| Subrequests | 519 | ▲ +1135.7% ⚠️ |

**Error rate**: 0.04% (47/108703)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 29.76K | ▼ -40.3% ✅ |
| Class B ops (reads) | 778.46K | ▼ -22.2% ✅ |
| Egress | 114834MB | ▼ -3.0% ✅ |
| Storage | 33.77GB | ▲ +0.4%  |
| Objects | 119,071 | ▲ +1.0% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 0.24 | 2,562 | 83 | 146 | 49 |
| stats47 | 25.87 | 101,143 | 21.66K | 635.74K | 113362 |
| doboku-note | 0.95 | 12,311 | 7.93K | 141.99K | 1220 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 6.71 | 3,055 | 84 | 586 | 203 |

## History

Last 7 days (`data/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-10-04,0,0,0,0,0,67880,65,33,3888,192885,41814,33.399,115640
2026-10-05,0,0,0,0,0,108063,104,54,34831,469975,88343,33.592,116619
2026-10-06,0,0,0,0,0,103583,206,55,39490,1139598,199778,33.587,116829
2026-10-07,0,0,0,0,0,106021,194,64,70285,881513,169098,33.896,118333
2026-10-08,0,0,0,0,0,120617,166,122,99666,1330642,188895,33.724,118576
2026-10-09,0,0,0,0,0,98967,95,42,49848,1000951,118369,33.635,117879
2026-10-10,0,0,0,0,0,108703,47,519,29760,778461,114834,33.769,119071
```
