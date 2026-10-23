# Cloudflare Usage — 2026-10-21

> 計測時刻: 2026-10-22T20:43:55.065Z
> 前日比: 2026-10-20

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
| Requests | 65.17K | ▲ +4.2% ✅ |
| Errors | 32 | ▲ +190.9% ⚠️ |
| Subrequests | 218 | ▼ -21.0% ✅ |

**Error rate**: 0.05% (32/65168)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 12.71K | ▲ +67.5% ⚠️ |
| Class B ops (reads) | 865.38K | ▲ +30.3% ⚠️ |
| Egress | 167044MB | ▲ +27.9%  |
| Storage | 36.49GB | ▲ +4.1%  |
| Objects | 124,744 | ▼ -0.2%  |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 1.05 | 5,789 | 0 | 0 | 0 |
| stats47 | 27.51 | 104,125 | 12.52K | 842.21K | 160837 |
| doboku-note | 0.89 | 10,746 | 170 | 14.77K | 342 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 7.03 | 4,084 | 19 | 8.41K | 5865 |

## History

Last 7 days (`data/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-10-15,0,0,0,0,0,130494,125,161,22953,804371,137415,35.224,126026
2026-10-16,0,0,0,0,0,79591,37,264,19584,750975,116859,34.772,123785
2026-10-17,0,0,0,0,0,81896,51,540,12225,680649,116447,34.924,124647
2026-10-18,0,0,0,0,0,49345,25,478,15143,607191,82314,35.159,127135
2026-10-19,0,0,0,0,0,85167,90,317,14430,964212,152967,34.854,122829
2026-10-20,0,0,0,0,0,62561,11,276,7587,664002,130567,35.059,125055
2026-10-21,0,0,0,0,0,65168,32,218,12712,865382,167044,36.487,124744
```
