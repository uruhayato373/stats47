# Cloudflare Usage — 2026-09-15

> 計測時刻: 2026-09-16T20:22:16.253Z
> 前日比: 2026-09-14

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
| Requests | 124.83K | ▲ +32.3% ✅ |
| Errors | 1691 | ▲ +57.3% ⚠️ |
| Subrequests | 1.15K | ▼ -9.0% ✅ |

**Error rate**: 1.35% (1691/124832)

## R2

| 指標 | 当日 | 前日比 |
|---|---|---|
| Class A ops (writes) | 8.23K | ▲ +8.9%  |
| Class B ops (reads) | 616.42K | ▲ +169.5% ⚠️ |
| Egress | 99913MB | ▲ +84.4% ⚠️ |
| Storage | 33.03GB | ▲ +2.3%  |
| Objects | 111,412 | ▲ +9.5% ✅ |

### Bucket breakdown

| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |
|---|---|---|---|---|---|
| stats47-private | 0.03 | 631 | 0 | 0 | 0 |
| stats47 | 25.04 | 96,960 | 7.86K | 607.87K | 99660 |
| doboku-note | 0.90 | 10,894 | 0 | 7.74K | 229 |
| stats47-cache | 0.00 | 0 | 0 | 0 | 0 |
| doboku-note-archive | 7.06 | 2,927 | 367 | 810 | 25 |

## History

Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):

```
date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects
2026-09-09,0,0,0,0,0,71866,0,608,7892,190853,66315,26.305,80043
2026-09-10,0,0,0,0,0,80924,0,1731,9005,277189,64229,30.192,84302
2026-09-11,0,0,0,0,0,122768,142,1021,10065,336374,63786,29.852,82632
2026-09-12,0,0,0,0,0,67207,123,543,9682,279017,49400,32.179,100849
2026-09-13,0,0,0,0,0,96601,632,1610,27152,470812,68533,32.260,101521
2026-09-14,0,0,0,0,0,94328,1075,1265,7553,228700,54181,32.303,101734
2026-09-15,0,0,0,0,0,124832,1691,1151,8226,616417,99913,33.034,111412
```
