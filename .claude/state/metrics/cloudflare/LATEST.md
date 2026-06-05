# Cloudflare Usage — 2026-06-04

> 計測時刻: 2026-06-05T18:10:39.051Z
> 前日比: 2026-06-03

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
| Requests | 82.55K | ▲ +63.8% ✅ |
| Errors | 244 | ▲ +171.1% ⚠️ |
| Subrequests | 29.25K | ▲ +41.0% ⚠️ |

**Error rate**: 0.30% (244/82549)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 4.45K | ▲ +72.4% ⚠️ |
| Class B ops (reads) | 655.78K | ▲ +43.2% ⚠️ |
| Egress | 232702MB | ▲ +68.4% ⚠️ |
| Storage | 11.45GB | ▲ +0.1%  |
| Objects | 33,880 | ▲ +0.5% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 10.78 | 27,192 | 1.63K | 653.07K | 232533 |
| doboku-note | 0.67 | 6,688 | 2.82K | 2.72K | 169 |
| kakkom | 0.00 | 0 | 0 | 0 | 0 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-05-29,0,0,0,0,0,46649,119,12271,3150,330426,92496,11.391,31828
2026-05-30,0,0,0,0,0,26472,108,8391,317,249126,109494,11.405,31876
2026-05-31,0,0,0,0,0,58938,98,12572,854,421901,156101,11.413,32021
2026-06-01,0,0,0,0,0,33408,148,13624,3396,316575,149609,11.424,32490
2026-06-02,0,0,0,0,0,33352,92,16017,2518,397318,165057,11.437,33648
2026-06-03,0,0,0,0,0,50400,90,20739,2581,458098,138223,11.440,33727
2026-06-04,0,0,0,0,0,82549,244,29248,4449,655782,232702,11.449,33880
```
