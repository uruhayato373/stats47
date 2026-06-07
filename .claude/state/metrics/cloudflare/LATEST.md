# Cloudflare Usage — 2026-06-06

> 計測時刻: 2026-06-07T17:54:04.351Z
> 前日比: 2026-06-05

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
| Requests | 21.76K | ▼ -49.1% ⚠️ |
| Errors | 28 | ▼ -75.7% ✅ |
| Subrequests | 8.65K | ▼ -55.2% ✅ |

**Error rate**: 0.13% (28/21761)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 2.44K | ▲ +693.5% ⚠️ |
| Class B ops (reads) | 174.52K | ▼ -58.6% ✅ |
| Egress | 76916MB | ▼ -56.9% ✅ |
| Storage | 11.64GB | ▲ +0.0%  |
| Objects | 34,121 | ▲ +0.1% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 10.80 | 27,265 | 2.44K | 173.21K | 76900 |
| doboku-note | 0.84 | 6,856 | 0 | 1.31K | 17 |
| kakkom | 0.00 | 0 | 0 | 0 | 0 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-05-31,0,0,0,0,0,58938,98,12572,854,421901,156101,11.413,32021
2026-06-01,0,0,0,0,0,33408,148,13624,3396,316575,149609,11.424,32490
2026-06-02,0,0,0,0,0,33352,92,16017,2518,397318,165057,11.437,33648
2026-06-03,0,0,0,0,0,50400,90,20739,2581,458098,138223,11.440,33727
2026-06-04,0,0,0,0,0,82549,244,29248,4449,655782,232702,11.449,33880
2026-06-05,0,0,0,0,0,42771,115,19324,307,422050,178397,11.638,34075
2026-06-06,0,0,0,0,0,21761,28,8652,2436,174520,76916,11.639,34121
```
