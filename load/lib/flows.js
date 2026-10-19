import http from 'k6/http';
import { check, group, sleep } from 'k6';

export const BASE_URL = __ENV.BASE_URL || 'http://127.0.0.1:8080';

// Treat 4xx as "expected": they're client mistakes and don't burn the error
// budget, so http_req_failed measures the same thing as the SLO (5xx + network).
http.setResponseCallback(http.expectedStatuses({ min: 200, max: 499 }));

const JSON_HEADERS = { headers: { 'Content-Type': 'application/json' }, tags: { name: 'checkout' } };

// One user journey: browse, then (sometimes) buy.
export function shopperJourney() {
  group('browse', () => {
    const res = http.get(`${BASE_URL}/api/products`, { tags: { name: 'products' } });
    check(res, {
      'products 200': (r) => r.status === 200,
      'products has items': (r) => r.status !== 200 || r.json('items').length > 0,
    });
  });
  sleep(Math.random() * 1.5 + 0.5); // think time

  if (Math.random() < 0.3) {
    group('checkout', () => {
      const res = http.post(`${BASE_URL}/api/checkout`, JSON.stringify({ items: [{ id: 1, qty: 1 }] }), JSON_HEADERS);
      check(res, { 'checkout accepted': (r) => r.status === 201 });
    });
  }
}
