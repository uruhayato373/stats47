# Cloudflare Usage — 2026-10-22

> 計測時刻: 2026-10-23T20:35:48.804Z
> 前日比: 2026-10-21

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
| Requests | 85.77K | ▲ +31.6% ✅ |
| Errors | 59 | ▲ +84.4% ⚠️ |
| Subrequests | 228 | ▲ +4.6%  |

**Error rate**: 0.07% (59/85765)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 30.54K | ▲ +140.2% ⚠️ |
| Class B ops (reads) | 680.76K | ▼ -21.3% ✅ |
| Egress | 148403MB | ▼ -11.2% ✅ |
| Storage | 37.60GB | ▲ +3.1%  |
| Objects | 126,914 | ▲ +1.7% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 1.93 | 6,503 | 11 | 12 | 11 |
| stats47 | 27.75 | 105,581 | 30.18K | 652.16K | 143868 |
| doboku-note | 0.89 | 10,746 | 330 | 22.49K | 338 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 7.03 | 4,084 | 20 | 6.10K | 4186 |

## History

Last 7 days (`data/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-10-16,0,0,0,0,0,79591,37,264,19584,750975,116859,34.772,123785
2026-10-17,0,0,0,0,0,81896,51,540,12225,680649,116447,34.924,124647
2026-10-18,0,0,0,0,0,49345,25,478,15143,607191,82314,35.159,127135
2026-10-19,0,0,0,0,0,85167,90,317,14430,964212,152967,34.854,122829
2026-10-20,0,0,0,0,0,62561,11,276,7587,664002,130567,35.059,125055
2026-10-21,0,0,0,0,0,65168,32,218,12712,865382,167044,36.487,124744
2026-10-22,0,0,0,0,0,85765,59,228,30536,680759,148403,37.601,126914
```
