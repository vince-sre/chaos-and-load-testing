// Stress: keep stepping up past expected peak to find the knee, where
// latency or errors break the SLO. Thresholds abort the run there so we don't
// hammer a shared environment for no reason.
import { SLO } from '../lib/slo.js';
import { shopperJourney } from '../lib/flows.js';

const PEAK_RPS = Number(__ENV.PEAK_RPS || 50);

export const options = {
  scenarios: {
    stepUp: {
      executor: 'ramping-arrival-rate',
      startRate: PEAK_RPS,
      timeUnit: '1s',
      preAllocatedVUs: 100,
      maxVUs: 1000,
      stages: [1, 1.5, 2, 3, 4, 5].flatMap((m) => [
        { target: PEAK_RPS * m, duration: '1m' },
        { target: PEAK_RPS * m, duration: '3m' },
      ]),
    },
  },
  thresholds: {
    'http_req_duration{expected_response:true}': [
      { threshold: `p(95)<${SLO.latencyP95Ms * 3}`, abortOnFail: true, delayAbortEval: '1m' },
    ],
    'http_req_failed{expected_response:false}': [{ threshold: 'rate<0.05', abortOnFail: true, delayAbortEval: '1m' }],
  },
};

export default shopperJourney;
