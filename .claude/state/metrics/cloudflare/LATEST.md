# Cloudflare Usage — 2026-05-29

> 計測時刻: 2026-05-30T17:52:11.759Z
> 前日比: 2026-05-27

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
| Requests | 46.65K | ▲ +22.7% ✅ |
| Errors | 119 | ▼ -44.1% ✅ |
| Subrequests | 12.27K | ▼ -17.8% ✅ |

**Error rate**: 0.26% (119/46649)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 3.15K | ▲ +10.2%  |
| Class B ops (reads) | 330.43K | ▲ +9.3%  |
| Egress | 92496MB | ▲ +13.3%  |
| Storage | 11.39GB | ▼ -4.2% ✅ |
| Objects | 31,828 | ▼ -6.7%  |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 10.73 | 25,314 | 484 | 328.09K | 92354 |
| doboku-note | 0.66 | 6,514 | 2.65K | 2.33K | 142 |
| kakkom | 0.00 | 0 | 0 | 0 | 0 |
| stats47-cache | 0.00 | 0 | 3 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-05-22,0,0,0,0,0,28449,43,11123,4630,134887,62545,9.150,30963
2026-05-23,0,0,0,0,0,23005,64,10272,2919,164618,49461,9.480,31286
2026-05-24,0,0,0,0,0,30515,219,14207,728,319573,92347,9.922,31497
2026-05-25,0,0,0,0,0,60102,218,15683,787,403597,146101,9.922,31572
2026-05-26,0,0,0,0,0,24640,260,14476,70,260956,66512,11.893,34111
2026-05-27,0,0,0,0,0,38008,213,14930,2859,302325,81611,11.894,34111
2026-05-29,0,0,0,0,0,46649,119,12271,3150,330426,92496,11.391,31828
```
