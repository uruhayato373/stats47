# Cloudflare Usage — 2026-10-08

> 計測時刻: 2026-10-09T21:52:12.314Z
> 前日比: 2026-10-07

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
| Requests | 120.62K | ▲ +13.8% ✅ |
| Errors | 166 | ▼ -14.4% ✅ |
| Subrequests | 122 | ▲ +90.6% ⚠️ |

**Error rate**: 0.14% (166/120617)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 99.67K | ▲ +41.8% ⚠️ |
| Class B ops (reads) | 1.33M | ▲ +50.9% ⚠️ |
| Egress | 188895MB | ▲ +11.7%  |
| Storage | 33.72GB | ▼ -0.5% ✅ |
| Objects | 118,576 | ▲ +0.2% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 0.19 | 1,701 | 58 | 100 | 39 |
| stats47 | 25.90 | 101,817 | 78.36K | 998.86K | 186036 |
| doboku-note | 0.93 | 12,028 | 21.22K | 331.29K | 2814 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 6.69 | 3,030 | 27 | 389 | 6 |

## History

Last 7 days (`data/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-10-02,0,0,0,0,0,80902,102,47,19559,358660,70106,33.338,115281
2026-10-03,0,0,0,0,0,115250,208,41,19043,455150,79503,33.386,115955
2026-10-04,0,0,0,0,0,67880,65,33,3888,192885,41814,33.399,115640
2026-10-05,0,0,0,0,0,108063,104,54,34831,469975,88343,33.592,116619
2026-10-06,0,0,0,0,0,103583,206,55,39490,1139598,199778,33.587,116829
2026-10-07,0,0,0,0,0,106021,194,64,70285,881513,169098,33.896,118333
2026-10-08,0,0,0,0,0,120617,166,122,99666,1330642,188895,33.724,118576
```
