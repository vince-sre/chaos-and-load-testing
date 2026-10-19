.PHONY: validate target smoke load stress
validate: ; ./scripts/validate.sh
target: ; python3 target/server.py
smoke: ; k6 run load/scenarios/smoke.js
load: ; k6 run load/scenarios/load.js
stress: ; k6 run load/scenarios/stress.js
