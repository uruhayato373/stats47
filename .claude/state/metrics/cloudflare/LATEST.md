# Cloudflare Usage — 2026-05-19

> 計測時刻: 2026-05-20T18:18:24.988Z
> 前日比: 2026-05-18

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
| Requests | 22.18K | ▼ -11.9%  |
| Errors | 13 | ▼ -27.8% ✅ |
| Subrequests | 9.87K | ▲ +7.9%  |

**Error rate**: 0.06% (13/22178)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 21 | ▼ -99.8% ✅ |
| Class B ops (reads) | 108.67K | ▼ -9.8% ✅ |
| Egress | 53145MB | ▼ -6.3% ✅ |
| Storage | 8.20GB | ▲ +0.6%  |
| Objects | 29,129 | ▲ +0.2% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 7.02 | 20,108 | 21 | 106.32K | 53112 |
| doboku-note | 0.66 | 6,390 | 0 | 2.36K | 33 |
| kakkom | 0.52 | 2,631 | 0 | 0 | 0 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| obsidian-pdf | 0.00 | 0 | 0 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-05-13,0,0,0,0,0,12981,12,6486,64,65617,21356,7.850,27187
2026-05-14,0,0,0,0,0,16827,14,8138,3,86452,24446,7.850,27189
2026-05-15,0,0,0,0,0,17612,17,9619,47,112401,34825,7.900,27207
2026-05-16,0,0,0,0,0,20281,15,4848,22752,87398,27713,8.153,29008
2026-05-17,0,0,0,0,0,27525,20,6163,8620,114116,55312,8.153,29008
2026-05-18,0,0,0,0,0,25170,18,9141,10986,120504,56695,8.153,29063
2026-05-19,0,0,0,0,0,22178,13,9865,21,108675,53145,8.199,29129
```
