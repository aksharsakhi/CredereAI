# Benchmark Harness

## Purpose
Provides p50/p95 latency and throughput scoreboards for judge demos.

## Prerequisite
Start backend API on a stable port (example `8012`).

## Run
```bash
python3 benchmark_harness.py --base-url http://127.0.0.1:8012/api --requests 20 --concurrency 5
```

## Output
- Prints a JSON scoreboard with:
  - sync research latency p50/p95 and throughput
  - async research submission latency p50/p95 and throughput
  - async completion polling p50/p95
- Saves output to `benchmark_scoreboard.json` by default.

## Judge demo tip
Run benchmark once before presentation and keep the generated JSON visible as objective performance evidence.
