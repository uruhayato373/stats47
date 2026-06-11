# Cloudflare Usage — 2026-06-10

> 計測時刻: 2026-06-11T18:33:38.645Z
> 前日比: 2026-06-07

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
| Requests | 25.44K | ▲ +5.7% ✅ |
| Errors | 38 | ▼ -7.3% ✅ |
| Subrequests | 12.76K | ▲ +9.9%  |

**Error rate**: 0.15% (38/25442)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 337 | ▼ -90.8% ✅ |
| Class B ops (reads) | 188.21K | ▼ -2.7% ✅ |
| Egress | 87275MB | ▲ +11.7%  |
| Storage | 11.69GB | ▲ +0.0%  |
| Objects | 34,648 | ▲ +0.6% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 10.80 | 27,551 | 337 | 186.57K | 87253 |
| doboku-note | 0.89 | 7,097 | 0 | 1.63K | 23 |
| kakkom | 0.00 | 0 | 0 | 0 | 0 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-06-02,0,0,0,0,0,33352,92,16017,2518,397318,165057,11.437,33648
2026-06-03,0,0,0,0,0,50400,90,20739,2581,458098,138223,11.440,33727
2026-06-04,0,0,0,0,0,82549,244,29248,4449,655782,232702,11.449,33880
2026-06-05,0,0,0,0,0,42771,115,19324,307,422050,178397,11.638,34075
2026-06-06,0,0,0,0,0,21761,28,8652,2436,174520,76916,11.639,34121
2026-06-07,0,0,0,0,0,24080,41,11606,3649,193410,78126,11.690,34451
2026-06-10,0,0,0,0,0,25442,38,12758,337,188205,87275,11.691,34648
```
