# Cloudflare Usage — 2026-10-12

> 計測時刻: 2026-10-13T21:57:36.324Z
> 前日比: 2026-10-11

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
| Requests | 96.60K | ▲ +46.2% ✅ |
| Errors | 76 | ▲ +111.1% ⚠️ |
| Subrequests | 78 | ▲ +41.8% ⚠️ |

**Error rate**: 0.08% (76/96597)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 11.71K | ▼ -45.8% ✅ |
| Class B ops (reads) | 450.60K | ▼ -11.0% ✅ |
| Egress | 86216MB | ▲ +15.7%  |
| Storage | 34.58GB | ▲ +1.3%  |
| Objects | 123,347 | ▲ +2.1% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 0.51 | 4,589 | 1.65K | 5.83K | 242 |
| stats47 | 26.15 | 103,188 | 7.45K | 421.70K | 82015 |
| doboku-note | 0.95 | 12,351 | 2.34K | 17.90K | 275 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 6.97 | 3,219 | 265 | 5.17K | 3684 |

## History

Last 7 days (`data/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-10-06,0,0,0,0,0,103583,206,55,39490,1139598,199778,33.587,116829
2026-10-07,0,0,0,0,0,106021,194,64,70285,881513,169098,33.896,118333
2026-10-08,0,0,0,0,0,120617,166,122,99666,1330642,188895,33.724,118576
2026-10-09,0,0,0,0,0,98967,95,42,49848,1000951,118369,33.635,117879
2026-10-10,0,0,0,0,0,108703,47,519,29760,778461,114834,33.769,119071
2026-10-11,0,0,0,0,0,66087,36,55,21610,506298,74537,34.152,120843
2026-10-12,0,0,0,0,0,96597,76,78,11706,450599,86216,34.582,123347
```
