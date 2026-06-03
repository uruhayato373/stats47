# Cloudflare Usage — 2026-06-02

> 計測時刻: 2026-06-03T18:47:58.899Z
> 前日比: 2026-06-01

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
| Requests | 33.35K | ▼ -0.2%  |
| Errors | 92 | ▼ -37.8% ✅ |
| Subrequests | 16.02K | ▲ +17.6%  |

**Error rate**: 0.28% (92/33352)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 2.52K | ▼ -25.9% ✅ |
| Class B ops (reads) | 397.32K | ▲ +25.5%  |
| Egress | 165057MB | ▲ +10.3%  |
| Storage | 11.44GB | ▲ +0.1%  |
| Objects | 33,648 | ▲ +3.6% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 10.77 | 27,033 | 2.52K | 395.36K | 165027 |
| doboku-note | 0.67 | 6,615 | 0 | 1.96K | 30 |
| kakkom | 0.00 | 0 | 0 | 0 | 0 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-05-26,0,0,0,0,0,24640,260,14476,70,260956,66512,11.893,34111
2026-05-27,0,0,0,0,0,38008,213,14930,2859,302325,81611,11.894,34111
2026-05-29,0,0,0,0,0,46649,119,12271,3150,330426,92496,11.391,31828
2026-05-30,0,0,0,0,0,26472,108,8391,317,249126,109494,11.405,31876
2026-05-31,0,0,0,0,0,58938,98,12572,854,421901,156101,11.413,32021
2026-06-01,0,0,0,0,0,33408,148,13624,3396,316575,149609,11.424,32490
2026-06-02,0,0,0,0,0,33352,92,16017,2518,397318,165057,11.437,33648
```
