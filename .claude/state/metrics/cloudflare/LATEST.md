# Cloudflare Usage — 2026-08-09

> 計測時刻: 2026-08-10T18:13:01.428Z
> 前日比: 2026-08-04

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
| Requests | 36.65K | ▼ -42.5% ⚠️ |
| Errors | 0 | → |
| Subrequests | 3.16K | ▼ -76.5% ✅ |

**Error rate**: 0.00% (0/36646)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 3.35K | ▼ -63.3% ✅ |
| Class B ops (reads) | 154.11K | ▼ -34.9% ✅ |
| Egress | 75711MB | ▲ +12.3%  |
| Storage | 15.47GB | ▼ -1.4% ✅ |
| Objects | 59,430 | ▲ +1.3% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 11.47 | 50,135 | 3.35K | 152.46K | 75556 |
| doboku-note | 2.34 | 9,000 | 0 | 1.65K | 155 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 1.67 | 295 | 0 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-07-30,0,0,0,0,0,46282,1,11001,15657,211862,46543,15.723,56064
2026-07-31,0,0,0,0,0,43562,0,10953,8125,202130,41445,15.718,55925
2026-08-01,0,0,0,0,0,35250,0,9854,971,171979,48197,15.751,57390
2026-08-02,0,0,0,0,0,32161,0,4641,29729,247682,53773,15.611,57123
2026-08-03,0,0,0,0,0,58689,0,11662,9461,188243,61842,15.719,57501
2026-08-04,0,0,0,0,0,63781,0,13479,9127,236759,67420,15.697,58691
2026-08-09,0,0,0,0,0,36646,0,3164,3347,154107,75711,15.470,59430
```
