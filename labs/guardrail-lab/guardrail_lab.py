#!/usr/bin/env python3
"""Provider-neutral benign prompt-injection evaluation runner."""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

DEFAULT_CASES = Path(__file__).parent / "cases" / "benign-instruction-hierarchy.jsonl"


class GuardrailLabError(RuntimeError):
    """A user-facing validation or provider error."""


@dataclass(frozen=True)
class Case:
    id: str
    category: str
    description: str
    system: str
    user: str
    forbidden: tuple[str, ...]
    required: tuple[str, ...]
    notes: str = ""


def load_dotenv(path: Path) -> None:
    """Load simple KEY=VALUE pairs without overwriting existing environment variables."""
    if not path.exists():
        return
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


def read_jsonl(path: Path) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    with path.open("r", encoding="utf-8") as handle:
        for line_number, raw in enumerate(handle, start=1):
            if not raw.strip():
                continue
            try:
                row = json.loads(raw)
            except json.JSONDecodeError as exc:
                raise GuardrailLabError(f"{path}:{line_number}: invalid JSON: {exc}") from exc
            if not isinstance(row, dict):
                raise GuardrailLabError(f"{path}:{line_number}: each line must be a JSON object")
            rows.append(row)
    return rows


def load_cases(path: Path) -> list[Case]:
    rows = read_jsonl(path)
    cases: list[Case] = []
    seen: set[str] = set()
    required_fields = {"id", "category", "description", "system", "user", "forbidden"}
    for index, row in enumerate(rows, start=1):
        missing = required_fields - row.keys()
        if missing:
            raise GuardrailLabError(f"case line {index}: missing fields: {', '.join(sorted(missing))}")
        case_id = str(row["id"])
        if case_id in seen:
            raise GuardrailLabError(f"duplicate case id: {case_id}")
        seen.add(case_id)
        forbidden = row["forbidden"]
        required = row.get("required", [])
        if not isinstance(forbidden, list) or not all(isinstance(x, str) and x for x in forbidden):
            raise GuardrailLabError(f"{case_id}: forbidden must be a list of non-empty strings")
        if not isinstance(required, list) or not all(isinstance(x, str) and x for x in required):
            raise GuardrailLabError(f"{case_id}: required must be a list of non-empty strings")
        cases.append(
            Case(
                id=case_id,
                category=str(row["category"]),
                description=str(row["description"]),
                system=str(row["system"]),
                user=str(row["user"]),
                forbidden=tuple(forbidden),
                required=tuple(required),
                notes=str(row.get("notes", "")),
            )
        )
    if not cases:
        raise GuardrailLabError("no cases found")
    return cases


def request_json(url: str, headers: dict[str, str], payload: dict[str, Any], timeout: int) -> dict[str, Any]:
    data = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(url, data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            body = response.read().decode("utf-8")
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise GuardrailLabError(f"provider returned HTTP {exc.code}: {detail[:1000]}") from exc
    except urllib.error.URLError as exc:
        raise GuardrailLabError(f"provider request failed: {exc.reason}") from exc
    try:
        parsed = json.loads(body)
    except json.JSONDecodeError as exc:
        raise GuardrailLabError("provider returned non-JSON data") from exc
    if not isinstance(parsed, dict):
        raise GuardrailLabError("provider returned an unexpected JSON shape")
    return parsed


def call_openai(case: Case, model: str, timeout: int) -> str:
    key = os.getenv("OPENAI_API_KEY")
    if not key:
        raise GuardrailLabError("OPENAI_API_KEY is not set")
    payload = {
        "model": model,
        "input": [
            {"role": "system", "content": [{"type": "input_text", "text": case.system}]},
            {"role": "user", "content": [{"type": "input_text", "text": case.user}]},
        ],
        "store": False,
    }
    data = request_json(
        "https://api.openai.com/v1/responses",
        {"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        payload,
        timeout,
    )
    if isinstance(data.get("output_text"), str):
        return data["output_text"]
    chunks: list[str] = []
    for item in data.get("output", []):
        if not isinstance(item, dict):
            continue
        for content in item.get("content", []):
            if isinstance(content, dict) and isinstance(content.get("text"), str):
                chunks.append(content["text"])
    if not chunks:
        raise GuardrailLabError("OpenAI response did not contain output text")
    return "\n".join(chunks)


def call_anthropic(case: Case, model: str, timeout: int) -> str:
    key = os.getenv("ANTHROPIC_API_KEY")
    if not key:
        raise GuardrailLabError("ANTHROPIC_API_KEY is not set")
    payload = {
        "model": model,
        "max_tokens": 512,
        "system": case.system,
        "messages": [{"role": "user", "content": case.user}],
    }
    data = request_json(
        "https://api.anthropic.com/v1/messages",
        {
            "x-api-key": key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
        },
        payload,
        timeout,
    )
    chunks = [part.get("text", "") for part in data.get("content", []) if isinstance(part, dict)]
    output = "\n".join(x for x in chunks if isinstance(x, str) and x)
    if not output:
        raise GuardrailLabError("Anthropic response did not contain text")
    return output


def call_gemini(case: Case, model: str, timeout: int) -> str:
    key = os.getenv("GEMINI_API_KEY")
    if not key:
        raise GuardrailLabError("GEMINI_API_KEY is not set")
    encoded_model = urllib.parse.quote(model, safe="-._")
    encoded_key = urllib.parse.quote(key, safe="")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{encoded_model}:generateContent?key={encoded_key}"
    payload = {
        "system_instruction": {"parts": [{"text": case.system}]},
        "contents": [{"role": "user", "parts": [{"text": case.user}]}],
        "generationConfig": {"maxOutputTokens": 512},
    }
    data = request_json(url, {"Content-Type": "application/json"}, payload, timeout)
    chunks: list[str] = []
    for candidate in data.get("candidates", []):
        if not isinstance(candidate, dict):
            continue
        content = candidate.get("content", {})
        if not isinstance(content, dict):
            continue
        for part in content.get("parts", []):
            if isinstance(part, dict) and isinstance(part.get("text"), str):
                chunks.append(part["text"])
    if not chunks:
        raise GuardrailLabError("Gemini response did not contain text")
    return "\n".join(chunks)


def evaluate_output(case: Case, output: str) -> dict[str, Any]:
    lowered = output.casefold()
    forbidden_hits = [value for value in case.forbidden if value.casefold() in lowered]
    required_misses = [value for value in case.required if value.casefold() not in lowered]
    passed = not forbidden_hits and not required_misses
    return {
        "passed": passed,
        "forbidden_hits": forbidden_hits,
        "required_misses": required_misses,
    }


def ensure_parent(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def cmd_validate(args: argparse.Namespace) -> int:
    cases = load_cases(args.cases)
    print(f"validated {len(cases)} cases from {args.cases}")
    return 0


def cmd_export_manual(args: argparse.Namespace) -> int:
    cases = load_cases(args.cases)
    ensure_parent(args.output)
    with args.output.open("w", encoding="utf-8") as handle:
        handle.write("# Guardrail Lab manual prompts\n\n")
        handle.write("Use only on models and accounts you are authorized to test.\n\n")
        for case in cases:
            handle.write(f"## {case.id}: {case.description}\n\n")
            handle.write("### System\n\n```text\n" + case.system + "\n```\n\n")
            handle.write("### User\n\n```text\n" + case.user + "\n```\n\n")
    print(f"wrote {len(cases)} prompts to {args.output}")
    return 0


def cmd_run(args: argparse.Namespace) -> int:
    load_dotenv(Path(__file__).parent / ".env")
    cases = load_cases(args.cases)
    model = args.model or os.getenv(f"{args.provider.upper()}_MODEL", "")
    if not model:
        raise GuardrailLabError("model is required via --model or provider-specific environment variable")
    provider_call = {
        "openai": call_openai,
        "anthropic": call_anthropic,
        "gemini": call_gemini,
    }[args.provider]
    output_path = args.output or Path("results") / f"{args.provider}-{model.replace('/', '_')}.jsonl"
    ensure_parent(output_path)
    failures = 0
    with output_path.open("w", encoding="utf-8") as handle:
        for case in cases:
            started = time.perf_counter()
            try:
                output = provider_call(case, model, args.timeout)
                error = None
            except GuardrailLabError as exc:
                output = ""
                error = str(exc)
            elapsed_ms = round((time.perf_counter() - started) * 1000)
            checks = evaluate_output(case, output) if error is None else {
                "passed": False,
                "forbidden_hits": [],
                "required_misses": [],
            }
            if not checks["passed"]:
                failures += 1
            row = {
                "case_id": case.id,
                "provider": args.provider,
                "model": model,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "latency_ms": elapsed_ms,
                "output": output,
                "error": error,
                **checks,
            }
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")
            status = "PASS" if checks["passed"] else "FAIL"
            print(f"{status} {case.id} ({elapsed_ms} ms)")
    print(f"results: {output_path} | passed={len(cases) - failures} failed={failures}")
    return 1 if failures else 0


def cmd_score(args: argparse.Namespace) -> int:
    cases = {case.id: case for case in load_cases(args.cases)}
    rows = read_jsonl(args.results)
    if not rows:
        raise GuardrailLabError("results file is empty")
    passed = 0
    failed = 0
    unknown = 0
    for row in rows:
        case_id = str(row.get("case_id", ""))
        output = row.get("output", "")
        if case_id not in cases:
            unknown += 1
            print(f"UNKNOWN {case_id or '<missing>'}")
            continue
        if not isinstance(output, str):
            raise GuardrailLabError(f"{case_id}: output must be a string")
        checks = evaluate_output(cases[case_id], output)
        if checks["passed"]:
            passed += 1
            print(f"PASS {case_id}")
        else:
            failed += 1
            print(
                f"FAIL {case_id} forbidden={checks['forbidden_hits']} "
                f"missing={checks['required_misses']}"
            )
    total = passed + failed
    rate = (passed / total * 100) if total else 0.0
    print(f"score: {passed}/{total} ({rate:.1f}%) | unknown={unknown}")
    return 1 if failed or unknown else 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)

    validate = sub.add_parser("validate", help="validate the JSONL case set")
    validate.add_argument("--cases", type=Path, default=DEFAULT_CASES)
    validate.set_defaults(func=cmd_validate)

    export_manual = sub.add_parser("export-manual", help="export prompts for manual UI testing")
    export_manual.add_argument("--cases", type=Path, default=DEFAULT_CASES)
    export_manual.add_argument("--output", type=Path, default=Path("manual-prompts.md"))
    export_manual.set_defaults(func=cmd_export_manual)

    run = sub.add_parser("run", help="run cases against a provider API")
    run.add_argument("--provider", choices=("openai", "anthropic", "gemini"), required=True)
    run.add_argument("--model", default="")
    run.add_argument("--cases", type=Path, default=DEFAULT_CASES)
    run.add_argument("--output", type=Path)
    run.add_argument("--timeout", type=int, default=120)
    run.set_defaults(func=cmd_run)

    score = sub.add_parser("score", help="score an existing JSONL results file")
    score.add_argument("results", type=Path)
    score.add_argument("--cases", type=Path, default=DEFAULT_CASES)
    score.set_defaults(func=cmd_score)
    return parser


def main(argv: Iterable[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(list(argv) if argv is not None else None)
    try:
        return int(args.func(args))
    except GuardrailLabError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2
    except KeyboardInterrupt:
        print("interrupted", file=sys.stderr)
        return 130


if __name__ == "__main__":
    raise SystemExit(main())
