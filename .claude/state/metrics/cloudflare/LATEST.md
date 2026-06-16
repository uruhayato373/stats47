# Cloudflare Usage — 2026-06-15

> 計測時刻: 2026-06-16T18:50:41.188Z
> 前日比: 2026-06-14

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
| Requests | 24.55K | ▲ +20.5% ✅ |
| Errors | 18 | ▼ -18.2% ✅ |
| Subrequests | 5.46K | ▲ +2.0%  |

**Error rate**: 0.07% (18/24552)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 5.39K | ▲ +0.0%  |
| Class B ops (reads) | 53.38K | ▼ -31.5% ✅ |
| Egress | 36311MB | ▼ -28.4% ✅ |
| Storage | 28.23GB | ▲ +20.0%  |
| Objects | 49,836 | ▲ +6.5% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 27.33 | 42,503 | 2.33K | 51.38K | 36153 |
| doboku-note | 0.91 | 7,333 | 3.06K | 2.00K | 159 |
| kakkom | 0.00 | 0 | 0 | 0 | 0 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-06-09,0,0,0,0,0,32299,51,14654,2828,230255,114795,11.691,34648
2026-06-10,0,0,0,0,0,25442,38,12758,337,188205,87275,11.691,34648
2026-06-11,0,0,0,0,0,25211,39,11909,34,165637,93385,11.704,34861
2026-06-12,0,0,0,0,0,49367,43,21568,3041,266064,119703,15.046,40467
2026-06-13,0,0,0,0,0,23447,40,5957,9772,107068,63954,21.272,45370
2026-06-14,0,0,0,0,0,20382,22,5356,5389,77923,50734,23.516,46780
2026-06-15,0,0,0,0,0,24552,18,5463,5391,53380,36311,28.230,49836
```
