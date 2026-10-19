"""Local stand-in for a checkout service so load tests run anywhere (incl. CI).

Simulates realistic behaviour: base latency with jitter, a small error rate,
and degradation under concurrency, all tunable with environment variables.
"""

import json
import os
import random
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

BASE_MS = float(os.getenv("BASE_LATENCY_MS", "40"))
JITTER_MS = float(os.getenv("JITTER_MS", "30"))
ERROR_RATE = float(os.getenv("ERROR_RATE", "0.002"))
SATURATION = int(os.getenv("SATURATION_CONCURRENCY", "50"))

_inflight = 0
_lock = threading.Lock()


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/healthz":
            return self._send(200, {"status": "ok"})
        if self.path.startswith("/api/products"):
            return self._work(lambda: {"items": [{"id": i, "price_cents": 1000 + i} for i in range(20)]})
        return self._send(404, {"error": "not found"})

    def do_POST(self):
        if self.path == "/api/checkout":
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length) or b"{}")
            if not body.get("items"):
                return self._send(400, {"error": "items required"})
            return self._work(lambda: {"order_id": f"o-{random.randint(1, 10**9)}", "status": "accepted"}, 201)
        return self._send(404, {"error": "not found"})

    def _work(self, payload, code=200):
        global _inflight
        with _lock:
            _inflight += 1
            load = _inflight
        try:
            # Latency grows once concurrency passes the saturation point.
            penalty = max(0, load - SATURATION) * 2
            time.sleep((BASE_MS + random.random() * JITTER_MS + penalty) / 1000)
            if random.random() < ERROR_RATE:
                return self._send(503, {"error": "upstream unavailable"})
            return self._send(code, payload())
        finally:
            with _lock:
                _inflight -= 1

    def _send(self, code, body):
        data = json.dumps(body).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, fmt, *args):
        pass


if __name__ == "__main__":
    port = int(os.getenv("PORT", "8080"))
    print(f"target listening on :{port}", flush=True)
    ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
