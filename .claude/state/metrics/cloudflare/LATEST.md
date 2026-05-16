# Cloudflare Usage — 2026-05-15

> 計測時刻: 2026-05-16T17:49:31.042Z
> 前日比: 2026-05-14

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
| Requests | 17.61K | ▲ +4.7% ✅ |
| Errors | 17 | ▲ +21.4%  |
| Subrequests | 9.62K | ▲ +18.2%  |

**Error rate**: 0.10% (17/17612)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 47 | ▲ +1466.7% ⚠️ |
| Class B ops (reads) | 112.40K | ▲ +30.0% ⚠️ |
| Egress | 34825MB | ▲ +42.5% ⚠️ |
| Storage | 7.90GB | ▲ +0.6%  |
| Objects | 27,207 | ▲ +0.1% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 6.72 | 18,186 | 47 | 110.38K | 34793 |
| doboku-note | 0.66 | 6,390 | 0 | 2.02K | 32 |
| kakkom | 0.52 | 2,631 | 0 | 0 | 0 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| obsidian-pdf | 0.00 | 0 | 0 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-05-09,0,0,0,0,0,26452,2,7756,964,90053,15778,7.840,27092
2026-05-10,0,0,0,0,0,17555,182,9439,16416,99491,22026,7.841,27135
2026-05-11,0,0,0,0,0,16112,26,8298,18,76355,20849,7.842,27140
2026-05-12,0,0,0,0,0,14983,11,8441,16,91357,25016,7.850,27187
2026-05-13,0,0,0,0,0,12981,12,6486,64,65617,21356,7.850,27187
2026-05-14,0,0,0,0,0,16827,14,8138,3,86452,24446,7.850,27189
2026-05-15,0,0,0,0,0,17612,17,9619,47,112401,34825,7.900,27207
```
