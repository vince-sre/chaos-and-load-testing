# Experiment: <name>

| Field | Value |
|---|---|
| Date / window | |
| Environment | staging / production |
| Incident commander | |
| Scribe | |
| Manifest | `chaos/experiments/<file>.yaml` |

## Hypothesis
> When **<fault>** happens to **<target>**, **<SLI>** stays within **<threshold>**,
> because **<mechanism we're relying on>**.

## Steady state (before)
- Error ratio:
- p95 latency:
- Saturation (CPU / connections / queue depth):

## Abort conditions
- Error ratio > 0.5% for 1 minute (the `steady-state.sh` default)
- Any customer-reported impact

## Observations (timestamped)
| Time | Observation |
|---|---|
| | |

## Result
- [ ] Hypothesis held
- [ ] Hypothesis falsified, and here's what we learned:

## Action items
| Item | Owner | Due |
|---|---|---|
