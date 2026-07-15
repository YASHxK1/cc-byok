# AI Gateway — Product Requirements Document (PRD)

**Version:** v1.0
**Status:** Draft
**Type:** Open-source developer tool

---

## 1. Executive Summary

**Problem Statement:** Developers who use OpenAI Codex have no standard, tool-agnostic way to plug their authenticated Codex session into other software — every IDE plugin, script, or automation system that wants Codex's capabilities has to reverse-engineer or reimplement the Codex CLI/app-server protocol from scratch.

**Proposed Solution:** AI Gateway is integrated into `cc-byok`, performs the official Codex login flow once, manages a local Codex runtime, and exposes Anthropic Messages plus OpenAI Chat Completions APIs so Claude Code, OpenCode, SDKs, and automation scripts can talk to Codex through a local base URL.

**Success Criteria:**
- The `/v1/chat/completions` endpoint passes compatibility tests against at least 3 popular OpenAI-ecosystem clients (`openai-node`, LangChain, Continue.dev) with zero client-side code changes beyond the base URL.
- Authenticated sessions persist across restarts with >99% success (no forced re-login) over a 30-day local usage window.
- Streaming responses add <150ms of latency overhead versus calling the Codex app-server directly.
- Zero credentials or prompt data leave the user's local machine (verified by code audit; no telemetry in v1).
- Meaningful early OSS traction within 6 months of public launch (tracked via GitHub stars, issues, and external PRs — exact target TBD post-launch).

---

## 2. User Experience & Functionality

### User Personas
- **Indie Dev Alex** — writes custom scripts and small tools, wants to call Codex the same way they'd call any OpenAI-compatible endpoint.
- **IDE Plugin Maintainer Priya** — maintains an editor extension (VS Code, Neovim, JetBrains) and wants a stable local HTTP API instead of hand-rolling the Codex app-server protocol.
- **Automation Engineer Sam** — wires Codex into CI pipelines or agent frameworks (LangChain, AutoGen, custom agents) that already expect an OpenAI-shaped API.

### User Stories

- **As Alex**, I want to run `cc-byok gateway login` once so my session persists without repeating an OAuth flow every time I use a script.
  - **AC:**
    - Login uses Codex's official browser/device-code flow.
    - Tokens are cached locally and auto-refreshed.
    - Subsequent `cc-byok gateway start` calls require no further login until the refresh token itself expires.

- **As Priya**, I want a `/v1/chat/completions` endpoint so my extension can reuse existing OpenAI client libraries without a custom integration.
  - **AC:**
    - Request/response schema matches the OpenAI chat completions spec closely enough that `openai-node` works by only changing `baseURL`.
    - Both streaming and non-streaming modes are supported.

- **As Sam**, I want streaming (SSE) responses so my agent framework receives tokens incrementally, matching OpenAI's native behavior.
  - **AC:**
    - `stream: true` returns `text/event-stream` chunks in OpenAI's delta format.
    - Stream terminates with `data: [DONE]`.

- **As Alex**, I want visibility into requests hitting the gateway so I can debug what my scripts are actually sending.
  - **AC:**
    - Opt-in `--verbose` flag enables structured local logs.
    - Logs never leave the local machine and are off by default.

- **As Priya**, I want the gateway to recover automatically if the underlying Codex process crashes, so my extension doesn't hang indefinitely.
  - **AC:**
    - Runtime Manager detects a dead Codex process and retries spawning it (bounded retries with backoff).
    - If recovery fails, the API returns a clear `503` rather than hanging.

### Non-Goals (v1)
- No hosted/cloud multi-tenant version — this is a local, single-user tool.
- No GUI/desktop app — CLI and HTTP API only.
- No reimplementation of Codex's native agentic file-editing UX — v1 wraps and exposes it, it does not replace it.
- No support for non-Codex model providers (no multi-provider abstraction in v1).

---

## 3. AI System Requirements

- **Tool Requirements:**
  - The official Codex CLI / app-server binary (external dependency, must be installed by the user or bundled as an npm dependency).
  - OAuth/device-code login flow as provided by Codex.
  - A local process supervisor to spawn and monitor the Codex app-server.
  - A protocol bridge translating Codex's app-server JSON-RPC/stdio protocol into standard HTTP/SSE.

- **Evaluation Strategy:**
  - A compatibility test suite that sends identical prompts through `openai-node`, LangChain, and Continue.dev pointed at AI Gateway's endpoint.
  - Pass criteria is **schema and protocol conformance** (does the response shape/streaming behavior match what an OpenAI client expects), not model output quality — model quality is Codex's responsibility and out of scope for this tool.
  - Suite re-run on every Codex CLI version bump and whenever OpenAI's public API schema changes.

---

## 4. Technical Specifications

- **Architecture Overview:** CLI login → local Runtime Manager spawns and supervises the Codex app-server as a child process → an HTTP API layer (Anthropic Messages and OpenAI Chat Completions REST + SSE) translates requests into Codex app-server calls and streams results back to clients.
- **Integration Points:** Codex CLI/app-server protocol, Anthropic Messages, OpenAI Chat Completions, and the local OS keychain.
- **Security & Privacy:** All credentials and session data stay on the user's machine (OS keychain or encrypted local file). The API binds to `localhost` by default. No telemetry or usage data is transmitted externally in v1.

---

## 5. Risks & Roadmap

### Phased Rollout
- **MVP:** `login` flow, Runtime Manager, `/v1/chat/completions` (streaming + non-streaming), `/v1/models`, `/v1/status`.
- **v1.1:** Repository analysis and file-modification passthrough endpoints, concurrent multi-session support, background daemon mode.
- **v2.0:** Plugin ecosystem, multi-provider abstraction (beyond Codex), local dashboard for monitoring/logs.

### Technical Risks
- Codex's app-server protocol is not a public, versioned API — changes upstream could silently break AI Gateway.
- OpenAI's chat completions schema may evolve, risking client compatibility.
- Codex's OAuth/login flow could change without notice, since there's no formal third-party integration contract.
- Concurrent requests from multiple local clients may expose race conditions in the Runtime Manager if Codex's app-server doesn't natively support multi-session use (open question — see companion TDD).

---

*Companion document: see `AI-Gateway-TDD.md` for full architecture, data models, API contracts, and implementation plan.*
