# Cloudflare Usage — 2026-05-20

> 計測時刻: 2026-05-21T18:12:11.980Z
> 前日比: 2026-05-19

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
| Requests | 18.35K | ▼ -17.2%  |
| Errors | 45 | ▲ +246.2% ⚠️ |
| Subrequests | 8.68K | ▼ -12.0% ✅ |

**Error rate**: 0.25% (45/18353)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 337 | ▲ +1504.8% ⚠️ |
| Class B ops (reads) | 105.25K | ▼ -3.2% ✅ |
| Egress | 68775MB | ▲ +29.4%  |
| Storage | 9.11GB | ▲ +11.1%  |
| Objects | 29,429 | ▲ +1.0% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 7.92 | 20,408 | 337 | 102.93K | 68744 |
| doboku-note | 0.66 | 6,390 | 0 | 2.31K | 31 |
| kakkom | 0.52 | 2,631 | 0 | 0 | 0 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| obsidian-pdf | 0.00 | 0 | 0 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-05-14,0,0,0,0,0,16827,14,8138,3,86452,24446,7.850,27189
2026-05-15,0,0,0,0,0,17612,17,9619,47,112401,34825,7.900,27207
2026-05-16,0,0,0,0,0,20281,15,4848,22752,87398,27713,8.153,29008
2026-05-17,0,0,0,0,0,27525,20,6163,8620,114116,55312,8.153,29008
2026-05-18,0,0,0,0,0,25170,18,9141,10986,120504,56695,8.153,29063
2026-05-19,0,0,0,0,0,22178,13,9865,21,108675,53145,8.199,29129
2026-05-20,0,0,0,0,0,18353,45,8682,337,105246,68775,9.105,29429
```
