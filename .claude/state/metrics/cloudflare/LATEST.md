# Cloudflare Usage — 2026-06-08

> 計測時刻: 2026-06-09T18:16:30.969Z
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
| Requests | 30.97K | ▲ +28.6% ✅ |
| Errors | 117 | ▲ +185.4% ⚠️ |
| Subrequests | 13.77K | ▲ +18.6%  |

**Error rate**: 0.38% (117/30966)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 3.16K | ▼ -13.3% ✅ |
| Class B ops (reads) | 260.27K | ▲ +34.6% ⚠️ |
| Egress | 120544MB | ▲ +54.3% ⚠️ |
| Storage | 11.69GB | ▲ +0.0%  |
| Objects | 34,453 | ▲ +0.0% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 10.80 | 27,356 | 105 | 257.66K | 120344 |
| doboku-note | 0.89 | 7,097 | 3.06K | 2.61K | 200 |
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
2026-06-08,0,0,0,0,0,30966,117,13769,3162,260274,120544,11.690,34453
```
