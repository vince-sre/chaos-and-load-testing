// Soak: moderate load for hours to surface leaks, connection-pool exhaustion
// and slow degradation (watch memory and GC on the dashboards while it runs).
import { sloThresholds } from '../lib/slo.js';
import { shopperJourney } from '../lib/flows.js';

export const options = {
  scenarios: {
    soak: {
      executor: 'constant-arrival-rate',
      rate: Number(__ENV.SOAK_RPS || 20),
      timeUnit: '1s',
      duration: __ENV.DURATION || '4h',
      preAllocatedVUs: 50,
      maxVUs: 200,
    },
  },
  thresholds: sloThresholds(),
};

export default shopperJourney;
