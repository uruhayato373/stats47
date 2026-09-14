# Cloudflare Usage — 2026-09-13

> 計測時刻: 2026-09-14T21:02:50.394Z
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
| Requests | 96.60K | ▼ -21.3%  |
| Errors | 632 | ▲ +345.1% ⚠️ |
| Subrequests | 1.61K | ▲ +57.7% ⚠️ |

**Error rate**: 0.65% (632/96601)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 27.15K | ▲ +169.8% ⚠️ |
| Class B ops (reads) | 470.81K | ▲ +40.0% ⚠️ |
| Egress | 68533MB | ▲ +7.4%  |
| Storage | 32.26GB | ▲ +8.1%  |
| Objects | 101,521 | ▲ +22.9% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 0.03 | 631 | 0 | 0 | 0 |
| stats47 | 24.27 | 87,097 | 24.99K | 464.80K | 67994 |
| doboku-note | 0.90 | 10,894 | 1.62K | 4.90K | 362 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 7.06 | 2,899 | 537 | 1.12K | 177 |

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
2026-09-13,0,0,0,0,0,96601,632,1610,27152,470812,68533,32.260,101521
```
