# Cloudflare Usage — 2026-10-30

> 計測時刻: 2026-10-31T20:36:09.049Z
> 前日比: 2026-10-29

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
| Requests | 93.89K | ▲ +30.7% ✅ |
| Errors | 4 | ▼ -93.8% ✅ |
| Subrequests | 1.63K | ▲ +67.5% ⚠️ |

**Error rate**: 0.00% (4/93886)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 17.71K | ▼ -26.6% ✅ |
| Class B ops (reads) | 723.37K | ▲ +21.9%  |
| Egress | 151237MB | ▲ +37.0% ⚠️ |
| Storage | 43.26GB | ▲ +0.9%  |
| Objects | 131,223 | ▲ +0.2% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 2.32 | 7,612 | 14 | 15 | 25 |
| stats47 | 32.69 | 107,376 | 17.67K | 707.91K | 148456 |
| doboku-note | 0.91 | 12,104 | 0 | 12.01K | 185 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 7.34 | 4,131 | 25 | 3.43K | 2571 |

## History

Last 7 days (`data/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-10-24,0,0,0,0,0,143318,8,598,6596,952980,138351,37.939,127032
2026-10-25,0,0,0,0,0,56457,10,211,3798,444138,93060,39.915,128508
2026-10-26,0,0,0,0,0,79966,4,508,14414,1081199,198874,41.207,127218
2026-10-27,0,0,0,0,0,76285,7,72,13935,799316,156624,41.745,129127
2026-10-28,0,0,0,0,0,78643,192,2153,33401,1138059,195943,42.594,130182
2026-10-29,0,0,0,0,0,71837,65,972,24126,593520,110395,42.860,130913
2026-10-30,0,0,0,0,0,93886,4,1628,17707,723369,151237,43.262,131223
```
