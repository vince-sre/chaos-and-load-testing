// Smoke: 2 VUs for 30s. Runs on every PR, so a broken script or service is caught early.
import { sloThresholds } from '../lib/slo.js';
import { shopperJourney } from '../lib/flows.js';

export const options = {
  vus: 2,
  duration: __ENV.DURATION || '30s',
  thresholds: sloThresholds(),
};

export default shopperJourney;
