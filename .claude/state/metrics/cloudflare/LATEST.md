# Cloudflare Usage — 2026-08-17

> 計測時刻: 2026-08-18T17:54:57.125Z
> 前日比: 2026-08-16

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
| Requests | 61.95K | ▲ +26.5% ✅ |
| Errors | 0 | → |
| Subrequests | 1.15K | ▲ +26.6%  |

**Error rate**: 0.00% (0/61948)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 44.10K | ▲ +235.9% ⚠️ |
| Class B ops (reads) | 411.32K | ▲ +82.3% ⚠️ |
| Egress | 86687MB | ▲ +20.4%  |
| Storage | 15.34GB | ▼ -0.4% ✅ |
| Objects | 61,363 | ▼ -0.6%  |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 11.33 | 52,066 | 44.10K | 407.98K | 86326 |
| doboku-note | 2.34 | 9,002 | 0 | 3.34K | 361 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 1.67 | 295 | 0 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-08-11,0,0,0,0,0,33608,0,5013,2756,150528,79648,15.630,60270
2026-08-12,0,0,0,0,0,36673,0,6044,17210,183539,84842,15.756,60918
2026-08-13,0,0,0,0,0,37720,0,4485,4098,158186,89439,15.784,61080
2026-08-14,0,0,0,0,0,42894,0,5773,4396,170812,84328,15.549,59860
2026-08-15,0,0,0,0,0,42945,1,3655,9733,277175,95286,15.541,61182
2026-08-16,0,0,0,0,0,48983,0,906,13128,225574,71975,15.400,61727
2026-08-17,0,0,0,0,0,61948,0,1147,44103,411319,86687,15.339,61363
```
