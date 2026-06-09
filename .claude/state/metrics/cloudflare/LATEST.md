# Cloudflare Usage — 2026-06-07

> 計測時刻: 2026-06-08T18:19:53.653Z
> 前日比: 2026-06-06

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
| Requests | 24.08K | ▲ +10.7% ✅ |
| Errors | 41 | ▲ +46.4% ⚠️ |
| Subrequests | 11.61K | ▲ +34.1% ⚠️ |

**Error rate**: 0.17% (41/24080)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 3.65K | ▲ +49.8% ⚠️ |
| Class B ops (reads) | 193.41K | ▲ +10.8%  |
| Egress | 78126MB | ▲ +1.6%  |
| Storage | 11.69GB | ▲ +0.4%  |
| Objects | 34,451 | ▲ +1.0% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 10.80 | 27,356 | 3.64K | 191.71K | 78104 |
| doboku-note | 0.89 | 7,095 | 5 | 1.70K | 22 |
| kakkom | 0.00 | 0 | 0 | 0 | 0 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-06-01,0,0,0,0,0,33408,148,13624,3396,316575,149609,11.424,32490
2026-06-02,0,0,0,0,0,33352,92,16017,2518,397318,165057,11.437,33648
2026-06-03,0,0,0,0,0,50400,90,20739,2581,458098,138223,11.440,33727
2026-06-04,0,0,0,0,0,82549,244,29248,4449,655782,232702,11.449,33880
2026-06-05,0,0,0,0,0,42771,115,19324,307,422050,178397,11.638,34075
2026-06-06,0,0,0,0,0,21761,28,8652,2436,174520,76916,11.639,34121
2026-06-07,0,0,0,0,0,24080,41,11606,3649,193410,78126,11.690,34451
```
