// Load: ramp to expected peak (arrival-rate based, so a slow server can't
// hide behind fewer requests), hold, ramp down.
import { sloThresholds } from '../lib/slo.js';
import { shopperJourney } from '../lib/flows.js';

const PEAK_RPS = Number(__ENV.PEAK_RPS || 50);

export const options = {
  scenarios: {
    peak: {
      executor: 'ramping-arrival-rate',
      startRate: 1,
      timeUnit: '1s',
      preAllocatedVUs: 50,
      maxVUs: 400,
      stages: [
        { target: PEAK_RPS, duration: '2m' },
        { target: PEAK_RPS, duration: '10m' },
        { target: 0, duration: '1m' },
      ],
    },
  },
  thresholds: sloThresholds({ dropped_iterations: ['count<10'] }),
};

export default shopperJourney;
