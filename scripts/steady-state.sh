#!/usr/bin/env bash
# Run a chaos experiment with guardrails: verify the steady state first,
# apply the experiment, watch the SLO while it runs, and delete it at once
# if the error ratio crosses the abort threshold.
#
# Usage: steady-state.sh <experiment.yaml> [duration_seconds]
# Env:   PROM_URL (default http://localhost:9090), JOB (default checkout),
#        ABORT_ERROR_RATIO (default 0.005, i.e. 5x the 0.1% budget)
set -euo pipefail

EXPERIMENT=${1:?usage: $0 <experiment.yaml> [duration_seconds]}
DURATION=${2:-300}
PROM_URL=${PROM_URL:-http://localhost:9090}
JOB=${JOB:-checkout}
ABORT=${ABORT_ERROR_RATIO:-0.005}
INTERVAL=15

error_ratio() {
  local q="sum(rate(http_requests_total{job=\"${JOB}\",code=~\"5..\"}[1m])) / sum(rate(http_requests_total{job=\"${JOB}\"}[1m]))"
  curl -fsS --get "${PROM_URL}/api/v1/query" --data-urlencode "query=${q}" \
    | jq -r '.data.result[0].value[1] // "0"'
}

above() { awk -v a="$1" -v b="$2" 'BEGIN { exit !(a > b) }'; }

echo "==> steady-state check"
before=$(error_ratio)
if above "$before" "$ABORT"; then
  echo "error ratio already ${before} (> ${ABORT}); not starting chaos on an unhealthy system"
  exit 1
fi
echo "    error ratio ${before}: OK"

echo "==> applying ${EXPERIMENT}"
kubectl apply -f "$EXPERIMENT"
trap 'echo "==> cleaning up"; kubectl delete -f "$EXPERIMENT" --ignore-not-found' EXIT

end=$((SECONDS + DURATION))
while (( SECONDS < end )); do
  sleep "$INTERVAL"
  now=$(error_ratio)
  printf '    t+%3ss error ratio %s\n' "$((DURATION - (end - SECONDS)))" "$now"
  if above "$now" "$ABORT"; then
    echo "!! abort threshold crossed (${now} > ${ABORT}); hypothesis falsified, stopping experiment"
    exit 2
  fi
done

echo "==> experiment finished within SLO guardrails; hypothesis held"
