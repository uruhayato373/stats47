# Cloudflare Usage — 2026-06-18

> 計測時刻: 2026-06-19T18:12:58.465Z
> 前日比: 2026-06-15

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
| Requests | 27.50K | ▲ +12.0% ✅ |
| Errors | 26 | ▲ +44.4% ⚠️ |
| Subrequests | 5.98K | ▲ +9.4%  |

**Error rate**: 0.09% (26/27499)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 259 | ▼ -95.2% ✅ |
| Class B ops (reads) | 35.19K | ▼ -34.1% ✅ |
| Egress | 26728MB | ▼ -26.4% ✅ |
| Storage | 30.35GB | ▲ +7.5%  |
| Objects | 53,308 | ▲ +7.0% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 28.62 | 44,947 | 259 | 32.72K | 26681 |
| doboku-note | 1.72 | 8,361 | 0 | 2.47K | 46 |
| kakkom | 0.00 | 0 | 0 | 0 | 0 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-06-10,0,0,0,0,0,25442,38,12758,337,188205,87275,11.691,34648
2026-06-11,0,0,0,0,0,25211,39,11909,34,165637,93385,11.704,34861
2026-06-12,0,0,0,0,0,49367,43,21568,3041,266064,119703,15.046,40467
2026-06-13,0,0,0,0,0,23447,40,5957,9772,107068,63954,21.272,45370
2026-06-14,0,0,0,0,0,20382,22,5356,5389,77923,50734,23.516,46780
2026-06-15,0,0,0,0,0,24552,18,5463,5391,53380,36311,28.230,49836
2026-06-18,0,0,0,0,0,27499,26,5978,259,35189,26728,30.346,53308
```
