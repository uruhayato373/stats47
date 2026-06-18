# Cloudflare Usage — 2026-06-17

> 計測時刻: 2026-06-18T18:20:14.515Z
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
| Requests | 28.53K | ▲ +16.2% ✅ |
| Errors | 39 | ▲ +116.7% ⚠️ |
| Subrequests | 4.66K | ▼ -14.7% ✅ |

**Error rate**: 0.14% (39/28529)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 5.12K | ▼ -5.1% ✅ |
| Class B ops (reads) | 55.20K | ▲ +3.4%  |
| Egress | 36452MB | ▲ +0.4%  |
| Storage | 30.16GB | ▲ +6.8%  |
| Objects | 52,162 | ▲ +4.7% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 28.44 | 43,801 | 1.01K | 51.71K | 35415 |
| doboku-note | 1.72 | 8,361 | 4.11K | 3.48K | 1037 |
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
2026-06-17,0,0,0,0,0,28529,39,4661,5115,55197,36452,30.164,52162
```
