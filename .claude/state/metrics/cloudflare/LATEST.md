# Cloudflare Usage — 2026-09-12

> 計測時刻: 2026-09-13T19:40:33.732Z
> 前日比: 2026-09-11

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
| Requests | 67.21K | ▼ -45.3% ⚠️ |
| Errors | 123 | ▼ -13.4% ✅ |
| Subrequests | 543 | ▼ -46.8% ✅ |

**Error rate**: 0.18% (123/67207)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 9.68K | ▼ -3.8% ✅ |
| Class B ops (reads) | 279.02K | ▼ -17.1% ✅ |
| Egress | 49400MB | ▼ -22.6% ✅ |
| Storage | 32.18GB | ▲ +7.8%  |
| Objects | 100,849 | ▲ +22.0% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 0.03 | 631 | 0 | 0 | 0 |
| stats47 | 24.21 | 86,750 | 9.04K | 275.06K | 49051 |
| doboku-note | 0.88 | 10,629 | 0 | 2.92K | 123 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 7.06 | 2,839 | 641 | 1.03K | 226 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-09-06,0,0,0,0,0,73726,0,1175,11633,399353,73017,22.934,73143
2026-09-07,0,0,0,0,0,108324,0,1743,34965,484405,83678,23.007,77794
2026-09-08,0,0,0,0,0,70298,0,1810,11152,185447,57876,26.268,79825
2026-09-09,0,0,0,0,0,71866,0,608,7892,190853,66315,26.305,80043
2026-09-10,0,0,0,0,0,80924,0,1731,9005,277189,64229,30.192,84302
2026-09-11,0,0,0,0,0,122768,142,1021,10065,336374,63786,29.852,82632
2026-09-12,0,0,0,0,0,67207,123,543,9682,279017,49400,32.179,100849
```
