# Cloudflare Usage — 2026-05-22

> 計測時刻: 2026-05-23T17:50:19.731Z
> 前日比: 2026-05-21

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
| Requests | 28.45K | ▼ -17.8%  |
| Errors | 43 | ▼ -34.8% ✅ |
| Subrequests | 11.12K | ▼ -35.6% ✅ |

**Error rate**: 0.15% (43/28449)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 4.63K | ▼ -76.7% ✅ |
| Class B ops (reads) | 134.89K | ▼ -28.2% ✅ |
| Egress | 62545MB | ▼ -43.2% ✅ |
| Storage | 9.15GB | ▲ +0.1%  |
| Objects | 30,963 | ▲ +4.7% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47 | 7.97 | 21,942 | 4.63K | 132.62K | 62519 |
| doboku-note | 0.66 | 6,390 | 0 | 2.27K | 26 |
| kakkom | 0.52 | 2,631 | 0 | 0 | 0 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-05-16,0,0,0,0,0,20281,15,4848,22752,87398,27713,8.153,29008
2026-05-17,0,0,0,0,0,27525,20,6163,8620,114116,55312,8.153,29008
2026-05-18,0,0,0,0,0,25170,18,9141,10986,120504,56695,8.153,29063
2026-05-19,0,0,0,0,0,22178,13,9865,21,108675,53145,8.199,29129
2026-05-20,0,0,0,0,0,18353,45,8682,337,105246,68775,9.105,29429
2026-05-21,0,0,0,0,0,34613,66,17261,19902,187867,110184,9.142,29562
2026-05-22,0,0,0,0,0,28449,43,11123,4630,134887,62545,9.150,30963
```
