# Cloudflare Usage — 2026-10-31

> 計測時刻: 2026-11-01T21:20:00.436Z
> 前日比: 2026-10-30

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
| Requests | 55.70K | ▼ -40.7% ⚠️ |
| Errors | 5 | ▲ +25.0%  |
| Subrequests | 1.38K | ▼ -15.4% ✅ |

**Error rate**: 0.01% (5/55696)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 1.19K | ▼ -93.3% ✅ |
| Class B ops (reads) | 319.31K | ▼ -55.9% ✅ |
| Egress | 66168MB | ▼ -56.2% ✅ |
| Storage | 43.24GB | ▼ -0.0% ✅ |
| Objects | 131,298 | ▲ +0.1% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 2.32 | 7,613 | 0 | 0 | 0 |
| stats47 | 32.72 | 107,454 | 1.16K | 288.13K | 61793 |
| doboku-note | 0.91 | 12,104 | 0 | 25.35K | 187 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 7.29 | 4,127 | 24 | 5.84K | 4188 |

## History

Last 7 days (`data/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-10-25,0,0,0,0,0,56457,10,211,3798,444138,93060,39.915,128508
2026-10-26,0,0,0,0,0,79966,4,508,14414,1081199,198874,41.207,127218
2026-10-27,0,0,0,0,0,76285,7,72,13935,799316,156624,41.745,129127
2026-10-28,0,0,0,0,0,78643,192,2153,33401,1138059,195943,42.594,130182
2026-10-29,0,0,0,0,0,71837,65,972,24126,593520,110395,42.860,130913
2026-10-30,0,0,0,0,0,93886,4,1628,17707,723369,151237,43.262,131223
2026-10-31,0,0,0,0,0,55696,5,1377,1188,319315,66168,43.244,131298
```
