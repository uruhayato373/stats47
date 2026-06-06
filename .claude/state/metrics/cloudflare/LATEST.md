# Cloudflare Usage — 2026-06-05

> 計測時刻: 2026-06-06T17:53:29.750Z
> 前日比: 2026-06-04

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
| Requests | 42.77K | ▼ -48.2% ⚠️ |
| Errors | 115 | ▼ -52.9% ✅ |
| Subrequests | 19.32K | ▼ -33.9% ✅ |

**Error rate**: 0.27% (115/42771)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 307 | ▼ -93.1% ✅ |
| Class B ops (reads) | 422.05K | ▼ -35.6% ✅ |
| Egress | 178397MB | ▼ -23.3% ✅ |
| Storage | 11.64GB | ▲ +1.6%  |
| Objects | 34,075 | ▲ +0.6% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 10.80 | 27,219 | 122 | 419.44K | 178179 |
| doboku-note | 0.84 | 6,856 | 179 | 2.61K | 218 |
| kakkom | 0.00 | 0 | 0 | 0 | 0 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-05-30,0,0,0,0,0,26472,108,8391,317,249126,109494,11.405,31876
2026-05-31,0,0,0,0,0,58938,98,12572,854,421901,156101,11.413,32021
2026-06-01,0,0,0,0,0,33408,148,13624,3396,316575,149609,11.424,32490
2026-06-02,0,0,0,0,0,33352,92,16017,2518,397318,165057,11.437,33648
2026-06-03,0,0,0,0,0,50400,90,20739,2581,458098,138223,11.440,33727
2026-06-04,0,0,0,0,0,82549,244,29248,4449,655782,232702,11.449,33880
2026-06-05,0,0,0,0,0,42771,115,19324,307,422050,178397,11.638,34075
```
