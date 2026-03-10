#!/usr/bin/env python3
"""
Credere AI Benchmark Harness
Measures latency (p50/p95) and throughput for key APIs.
"""

from __future__ import annotations

import argparse
import concurrent.futures
import json
import statistics
import time
from dataclasses import dataclass
from typing import Any

import requests


@dataclass
class RunResult:
    ok: bool
    latency_ms: float
    status_code: int
    error: str | None = None


def percentile(values: list[float], p: float) -> float:
    if not values:
        return 0.0
    if len(values) == 1:
        return values[0]
    sorted_vals = sorted(values)
    k = (len(sorted_vals) - 1) * (p / 100.0)
    f = int(k)
    c = min(f + 1, len(sorted_vals) - 1)
    if f == c:
        return sorted_vals[f]
    return sorted_vals[f] + (sorted_vals[c] - sorted_vals[f]) * (k - f)


def timed_call(session: requests.Session, method: str, url: str, **kwargs: Any) -> RunResult:
    start = time.perf_counter()
    try:
        resp = session.request(method=method, url=url, timeout=60, **kwargs)
        latency = (time.perf_counter() - start) * 1000
        return RunResult(ok=resp.ok, latency_ms=latency, status_code=resp.status_code)
    except Exception as exc:
        latency = (time.perf_counter() - start) * 1000
        return RunResult(ok=False, latency_ms=latency, status_code=0, error=str(exc))


def benchmark_health(base_url: str, requests_count: int, concurrency: int) -> dict[str, Any]:
    url = f"{base_url}/module2/health"

    start = time.perf_counter()
    results: list[RunResult] = []

    with requests.Session() as session:
        with concurrent.futures.ThreadPoolExecutor(max_workers=concurrency) as executor:
            futures = [
                executor.submit(
                    timed_call,
                    session,
                    "GET",
                    url,
                )
                for _ in range(requests_count)
            ]
            for f in concurrent.futures.as_completed(futures):
                results.append(f.result())

    duration = time.perf_counter() - start
    return summarize("module2_health", results, duration)


def benchmark_case_ops(base_url: str, requests_count: int, concurrency: int) -> dict[str, Any]:
    url = f"{base_url}/module2/cases"

    start = time.perf_counter()
    results: list[RunResult] = []

    with requests.Session() as session:
        with concurrent.futures.ThreadPoolExecutor(max_workers=concurrency) as executor:
            futures = [
                executor.submit(
                    timed_call,
                    session,
                    "POST",
                    url,
                    headers={"Content-Type": "application/json"},
                    data=json.dumps(
                        {
                            "companyName": f"Benchmark Company {i}",
                            "priority": "MEDIUM",
                            "summary": "Benchmark case creation",
                            "alertTitles": ["Signal-A", "Signal-B"],
                        }
                    ),
                )
                for i in range(requests_count)
            ]
            for f in concurrent.futures.as_completed(futures):
                results.append(f.result())

    duration = time.perf_counter() - start
    return summarize("module2_case_ops", results, duration)


def benchmark_async_research(base_url: str, requests_count: int, concurrency: int) -> dict[str, Any]:
    payload = {
        "companyName": "TCS Limited",
        "industry": "IT Services",
        "promoterNames": ["N Chandrasekaran"],
        "directors": ["K Krithivasan"],
    }

    submit_url = f"{base_url}/module2/research/async"

    start = time.perf_counter()
    submit_results: list[RunResult] = []
    job_ids: list[str] = []

    with requests.Session() as session:
        for _ in range(requests_count):
            start_req = time.perf_counter()
            try:
                resp = session.post(submit_url, json=payload, timeout=60)
                latency = (time.perf_counter() - start_req) * 1000
                submit_results.append(RunResult(ok=resp.ok, latency_ms=latency, status_code=resp.status_code))
                data = resp.json()
                if resp.ok and data.get("success") and data.get("data", {}).get("jobId"):
                    job_ids.append(data["data"]["jobId"])
            except Exception as exc:
                latency = (time.perf_counter() - start_req) * 1000
                submit_results.append(RunResult(ok=False, latency_ms=latency, status_code=0, error=str(exc)))
                continue

        poll_latencies = []
        for job_id in job_ids[: min(len(job_ids), 10)]:
            poll_start = time.perf_counter()
            for _ in range(3):
                status_resp = session.get(f"{base_url}/module2/research/async/{job_id}", timeout=30)
                if status_resp.ok:
                    data = status_resp.json()
                    status = data.get("data", {}).get("status")
                    if status in {"COMPLETED", "FAILED", "RUNNING", "QUEUED"}:
                        break
                time.sleep(0.2)
            poll_latencies.append((time.perf_counter() - poll_start) * 1000)

    duration = time.perf_counter() - start
    summary = summarize("module2_async_research_submit", submit_results, duration)
    summary["poll_p50_ms"] = round(percentile(poll_latencies, 50), 2) if poll_latencies else 0.0
    summary["poll_p95_ms"] = round(percentile(poll_latencies, 95), 2) if poll_latencies else 0.0
    summary["tracked_jobs"] = len(job_ids)
    return summary


def summarize(name: str, results: list[RunResult], duration_s: float) -> dict[str, Any]:
    ok_results = [r for r in results if r.ok]
    latencies = [r.latency_ms for r in ok_results]

    total = len(results)
    success = len(ok_results)
    fail = total - success
    throughput = success / duration_s if duration_s > 0 else 0

    return {
        "benchmark": name,
        "total_requests": total,
        "success": success,
        "fail": fail,
        "success_rate_pct": round((success / total) * 100, 2) if total else 0.0,
        "duration_s": round(duration_s, 2),
        "throughput_rps": round(throughput, 2),
        "p50_ms": round(percentile(latencies, 50), 2) if latencies else 0.0,
        "p95_ms": round(percentile(latencies, 95), 2) if latencies else 0.0,
        "avg_ms": round(statistics.mean(latencies), 2) if latencies else 0.0,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Credere AI benchmark harness")
    parser.add_argument("--base-url", default="http://127.0.0.1:8001/api", help="API base URL")
    parser.add_argument("--requests", type=int, default=20, help="Number of requests per benchmark")
    parser.add_argument("--concurrency", type=int, default=5, help="Concurrent workers")
    parser.add_argument("--output", default="benchmark_scoreboard.json", help="Output JSON file")
    args = parser.parse_args()

    print("Running benchmark suite...")
    health_stats = benchmark_health(args.base_url, args.requests, args.concurrency)
    case_ops_stats = benchmark_case_ops(args.base_url, args.requests, args.concurrency)
    async_stats = benchmark_async_research(args.base_url, args.requests, args.concurrency)

    scoreboard = {
        "generated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "base_url": args.base_url,
        "health": health_stats,
        "case_ops": case_ops_stats,
        "async": async_stats,
    }

    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(scoreboard, f, indent=2)

    print("\n=== Judge Scoreboard ===")
    print(json.dumps(scoreboard, indent=2))
    print(f"\nSaved to {args.output}")


if __name__ == "__main__":
    main()
