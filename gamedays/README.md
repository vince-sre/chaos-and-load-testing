# Game days

A game day is a planned, time-boxed chaos exercise with people watching.
The goal is to test **the system and the response to it**: alerts, dashboards,
runbooks and on-call handoffs, not just whether pods restart.

## Before
- [ ] Pick one hypothesis per experiment (use [`hypothesis-template.md`](hypothesis-template.md)).
- [ ] Staging first. Production only after the same experiment passed in staging twice.
- [ ] Name an incident commander and a scribe; tell support and stakeholders the time window.
- [ ] Confirm the abort path: `kubectl delete -f <experiment>` and the `steady-state.sh` guard.
- [ ] Load running? Start `k6 run load/scenarios/load.js` so there's traffic to measure.

## During
1. Record the steady state (error ratio, p95, saturation) from the SLO dashboard.
2. Apply the experiment through `scripts/steady-state.sh`.
3. The scribe timestamps every observation: alerts fired, who noticed, what they looked at.
4. Abort right away if a customer-facing SLO burns faster than planned.

## After
- Did the hypothesis hold? If not, that's a successful game day: you found the gap before an incident did.
- Did the right alert fire, with a runbook link that helped?
- File action items with owners; review them like postmortem items.

## Suggested progression
| Round | Experiment | Validates |
|---|---|---|
| 1 | `pod-kill.yaml` | replicas, PDB, readiness probes, retries |
| 2 | `cpu-stress.yaml` | HPA scale-out, node autoscaling, saturation alerts |
| 3 | `network-latency.yaml` | timeouts, retry budgets, latency SLO alerts |
| 4 | `az-outage.yaml` | topology spread, multi-AZ capacity, incident process |
