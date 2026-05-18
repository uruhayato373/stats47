# Cloudflare Usage — 2026-05-17

> 計測時刻: 2026-05-18T18:10:40.338Z
> 前日比: 2026-05-16

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
| Requests | 27.52K | ▲ +35.7% ✅ |
| Errors | 20 | ▲ +33.3% ⚠️ |
| Subrequests | 6.16K | ▲ +27.1%  |

**Error rate**: 0.07% (20/27525)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 8.62K | ▼ -62.1% ✅ |
| Class B ops (reads) | 114.12K | ▲ +30.6% ⚠️ |
| Egress | 55312MB | ▲ +99.6% ⚠️ |
| Storage | 8.15GB | ▲ +0.0%  |
| Objects | 29,008 | → |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 6.97 | 19,987 | 8.62K | 111.55K | 55280 |
| doboku-note | 0.66 | 6,390 | 0 | 2.57K | 31 |
| kakkom | 0.52 | 2,631 | 0 | 0 | 0 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| obsidian-pdf | 0.00 | 0 | 0 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-05-11,0,0,0,0,0,16112,26,8298,18,76355,20849,7.842,27140
2026-05-12,0,0,0,0,0,14983,11,8441,16,91357,25016,7.850,27187
2026-05-13,0,0,0,0,0,12981,12,6486,64,65617,21356,7.850,27187
2026-05-14,0,0,0,0,0,16827,14,8138,3,86452,24446,7.850,27189
2026-05-15,0,0,0,0,0,17612,17,9619,47,112401,34825,7.900,27207
2026-05-16,0,0,0,0,0,20281,15,4848,22752,87398,27713,8.153,29008
2026-05-17,0,0,0,0,0,27525,20,6163,8620,114116,55312,8.153,29008
```
