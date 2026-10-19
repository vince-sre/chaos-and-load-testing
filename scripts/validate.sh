#!/usr/bin/env bash
# Local equivalent of CI. Needs: k6, kubeconform, yamllint, shellcheck, ruff, python3 (+PyYAML), curl.
set -euo pipefail
cd "$(dirname "$0")/.."

CHAOS_MESH_VERSION=${CHAOS_MESH_VERSION:-v2.6.3}
PORT=${PORT:-18080}

echo "==> lint"
yamllint -s .
shellcheck scripts/*.sh
ruff check target scripts

echo "==> chaos manifests (schemas from Chaos Mesh ${CHAOS_MESH_VERSION} CRDs)"
if [[ ! -d .schemas ]]; then
  curl -fsSL -o /tmp/chaos-mesh-crd.yaml \
    "https://raw.githubusercontent.com/chaos-mesh/chaos-mesh/${CHAOS_MESH_VERSION}/manifests/crd.yaml"
  python3 scripts/crd_to_schema.py /tmp/chaos-mesh-crd.yaml .schemas
fi
kubeconform -strict -summary \
  -schema-location '.schemas/{{.ResourceKind}}_{{.ResourceAPIVersion}}.json' chaos

echo "==> k6 scripts parse"
for s in load/scenarios/*.js; do k6 inspect "$s" >/dev/null && echo "    ok $s"; done

echo "==> k6 smoke against local target (ERROR_RATE=0 so the run is deterministic)"
PORT=$PORT ERROR_RATE=0 python3 target/server.py >/tmp/target.log 2>&1 &
pid=$!
trap 'kill $pid 2>/dev/null || true' EXIT
for _ in $(seq 1 20); do curl -fsS "http://127.0.0.1:${PORT}/healthz" >/dev/null 2>&1 && break; sleep 0.25; done
BASE_URL="http://127.0.0.1:${PORT}" DURATION=${DURATION:-15s} k6 run --quiet load/scenarios/smoke.js
echo "==> all checks passed"
