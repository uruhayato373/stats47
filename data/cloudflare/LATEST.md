# Cloudflare Usage — 2026-11-03

> 計測時刻: 2026-11-04T22:46:39.436Z
> 前日比: 2026-11-02

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
| Requests | 75.57K | ▲ +10.4% ✅ |
| Errors | 121 | ▲ +42.4% ⚠️ |
| Subrequests | 1.03K | ▼ -47.3% ✅ |

**Error rate**: 0.16% (121/75571)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 20.14K | ▼ -74.3% ✅ |
| Class B ops (reads) | 1.26M | ▲ +35.0% ⚠️ |
| Egress | 231649MB | ▲ +44.8% ⚠️ |
| Storage | 44.10GB | ▲ +1.5%  |
| Objects | 136,999 | ▲ +1.7% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 2.96 | 9,555 | 157 | 2.48K | 1127 |
| stats47 | 32.90 | 111,165 | 19.98K | 1.24M | 225618 |
| doboku-note | 0.91 | 12,146 | 4 | 12.75K | 158 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 7.33 | 4,133 | 0 | 6.92K | 4746 |

## History

Last 7 days (`data/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-10-28,0,0,0,0,0,78643,192,2153,33401,1138059,195943,42.594,130182
2026-10-29,0,0,0,0,0,71837,65,972,24126,593520,110395,42.860,130913
2026-10-30,0,0,0,0,0,93886,4,1628,17707,723369,151237,43.262,131223
2026-10-31,0,0,0,0,0,55696,5,1377,1188,319315,66168,43.244,131298
2026-11-01,0,0,0,0,0,63157,68,1639,61882,892102,170737,43.158,131123
2026-11-02,0,0,0,0,0,68453,85,1958,78355,934212,159936,43.448,134729
2026-11-03,0,0,0,0,0,75571,121,1031,20137,1260755,231649,44.096,136999
```
