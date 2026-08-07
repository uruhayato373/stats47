# Cloudflare Usage — 2026-08-06

> 計測時刻: 2026-08-07T18:11:32.572Z
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
| Requests | 48.99K | ▼ -23.2%  |
| Errors | 0 | → |
| Subrequests | 6.22K | ▼ -53.8% ✅ |

**Error rate**: 0.00% (0/48988)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 4.03K | ▼ -55.9% ✅ |
| Class B ops (reads) | 203.45K | ▼ -14.1% ✅ |
| Egress | 65169MB | ▼ -3.3% ✅ |
| Storage | 15.53GB | ▼ -1.1% ✅ |
| Objects | 57,889 | ▼ -1.4%  |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 11.52 | 48,594 | 4.03K | 201.16K | 64935 |
| doboku-note | 2.34 | 9,000 | 0 | 2.29K | 234 |
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
2026-08-06,0,0,0,0,0,48988,0,6225,4025,203453,65169,15.527,57889
```
