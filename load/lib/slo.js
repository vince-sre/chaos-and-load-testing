// SLO-derived k6 thresholds shared by every scenario. A load test "passes"
// only if the service would still meet its objectives under that load.
export const SLO = {
  availability: 0.999, // matches the 99.9% SLO in k8s-observability-stack
  latencyP95Ms: 300,
  latencyP99Ms: 800,
};

export function sloThresholds(extra = {}) {
  return {
    // http_req_failed counts only 5xx/network errors (see setResponseCallback in flows.js).
    http_req_failed: [`rate<${(1 - SLO.availability).toFixed(4)}`],
    'http_req_duration{expected_response:true}': [`p(95)<${SLO.latencyP95Ms}`, `p(99)<${SLO.latencyP99Ms}`],
    checks: ['rate>0.99'],
    ...extra,
  };
}
