# Cloudflare Usage — 2026-10-13

> 計測時刻: 2026-10-14T20:54:40.543Z
> 前日比: 2026-10-12

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
| Requests | 153.31K | ▲ +58.7% ✅ |
| Errors | 216 | ▲ +184.2% ⚠️ |
| Subrequests | 211 | ▲ +170.5% ⚠️ |

**Error rate**: 0.14% (216/153311)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 15.10K | ▲ +29.0%  |
| Class B ops (reads) | 784.53K | ▲ +74.1% ⚠️ |
| Egress | 168686MB | ▲ +95.7% ⚠️ |
| Storage | 34.73GB | ▲ +0.4%  |
| Objects | 123,890 | ▲ +0.4% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 0.57 | 4,650 | 1.22K | 3.11K | 574 |
| stats47 | 26.23 | 103,648 | 13.77K | 697.47K | 156727 |
| doboku-note | 0.95 | 12,351 | 40 | 67.62K | 208 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 6.98 | 3,241 | 74 | 16.32K | 11178 |

## History

Last 7 days (`data/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-10-07,0,0,0,0,0,106021,194,64,70285,881513,169098,33.896,118333
2026-10-08,0,0,0,0,0,120617,166,122,99666,1330642,188895,33.724,118576
2026-10-09,0,0,0,0,0,98967,95,42,49848,1000951,118369,33.635,117879
2026-10-10,0,0,0,0,0,108703,47,519,29760,778461,114834,33.769,119071
2026-10-11,0,0,0,0,0,66087,36,55,21610,506298,74537,34.152,120843
2026-10-12,0,0,0,0,0,96597,76,78,11706,450599,86216,34.582,123347
2026-10-13,0,0,0,0,0,153311,216,211,15103,784526,168686,34.728,123890
```
