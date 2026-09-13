# Cloudflare Usage — 2026-09-11

> 計測時刻: 2026-09-12T19:35:10.383Z
> 前日比: 2026-09-10

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
| Requests | 122.77K | ▲ +51.7% ✅ |
| Errors | 142 | → |
| Subrequests | 1.02K | ▼ -41.0% ✅ |

**Error rate**: 0.12% (142/122768)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 10.06K | ▲ +11.8%  |
| Class B ops (reads) | 336.37K | ▲ +21.4%  |
| Egress | 63786MB | ▼ -0.7% ✅ |
| Storage | 29.85GB | ▼ -1.1% ✅ |
| Objects | 82,632 | ▼ -2.0%  |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 0.03 | 631 | 0 | 0 | 0 |
| stats47 | 21.88 | 68,593 | 9.71K | 330.52K | 63284 |
| doboku-note | 0.88 | 10,629 | 0 | 4.93K | 108 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 7.06 | 2,779 | 352 | 920 | 394 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-09-05,0,0,0,0,0,75828,0,644,39324,518633,87142,23.110,71833
2026-09-06,0,0,0,0,0,73726,0,1175,11633,399353,73017,22.934,73143
2026-09-07,0,0,0,0,0,108324,0,1743,34965,484405,83678,23.007,77794
2026-09-08,0,0,0,0,0,70298,0,1810,11152,185447,57876,26.268,79825
2026-09-09,0,0,0,0,0,71866,0,608,7892,190853,66315,26.305,80043
2026-09-10,0,0,0,0,0,80924,0,1731,9005,277189,64229,30.192,84302
2026-09-11,0,0,0,0,0,122768,142,1021,10065,336374,63786,29.852,82632
```
