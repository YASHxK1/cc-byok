# AI Gateway — Technical Design Document (TDD)

```
Project:        AI Gateway
Version:        v1.0
Status:         Draft
PRD Reference:  AI-Gateway-PRD.md
Author:         TBD (OSS maintainer)
Last Updated:   2026-07-15
```

---

## 1. System Overview

- **Architecture Pattern:** Modular monolith — a single Node.js/TypeScript process, not microservices. Chosen because this is a local, single-machine, single-user tool; distributed-systems complexity would add cost with no corresponding benefit here.

- **High-Level Diagram:**

```
┌──────────────┐      ┌─────────────────────────────┐      ┌───────────────────┐
│   Client      │ HTTP │        AI Gateway (Node)      │ IPC  │  Codex App-Server  │
│ (IDE/script/  │─────▶│  ┌────────────┐               │stdio │   (child process)  │
│  automation)  │◀─────│  │ API Layer  │               │◀────▶│                    │
└──────────────┘  SSE  │  │ (Fastify)  │               │      └───────────────────┘
                        │  ├────────────┤              │
                        │  │Runtime Mgr │              │      ┌───────────────────┐
                        │  ├────────────┤              │─────▶│  OS Keychain /     │
                        │  │Auth Manager│              │      │  Encrypted Store   │
                        │  └────────────┘              │      └───────────────────┘
                        └─────────────────────────────┘
```

- **Key Design Decisions:**

```
Decision:    Use Fastify for the HTTP layer
Reason:      Lightweight, native TypeScript support, first-class SSE/streaming ergonomics
Alternative: Express — rejected for heavier middleware overhead and weaker streaming support

Decision:    Bridge to Codex via its app-server JSON-RPC/stdio protocol, spawned as a child process
Reason:      Matches how the official Codex CLI itself operates; avoids reverse-engineering internal APIs
Alternative: Direct HTTP to Codex — revisit only if Codex ships a native local server mode

Decision:    Store Codex credentials in OS-native secure storage (keychain/credential manager)
Reason:      Avoids plaintext tokens on disk; matches expectations for a trusted local dev tool
Alternative: AES-256-encrypted local file — used as a fallback on platforms without keychain support

Decision:    Foreground CLI process by default, no daemonization in v1
Reason:      Simpler mental model for OSS users and contributors; "start when you need it" dev-tool pattern
Alternative: Background daemon (`cc-byok gateway start`) — planned for v1.1 once core stability is proven

Decision:    Expose Anthropic Messages and OpenAI Chat Completions adapters rather than Codex's native protocol
Reason:      Claude Code and OpenAI-compatible clients can both use the same supervised Codex runtime
Alternative: Expose Codex's native protocol directly — rejected; forces every consumer to write a custom client
```

---

## 2. Component Breakdown

### CLI Entrypoint (`cc-byok gateway`)
- **Responsibility:** Parse commands (`login`, `start`, `logout`, `status`, `rotate-key`); bootstrap the runtime.
- **Boundaries:** No business logic — delegates to Auth Manager / Runtime Manager.
- **Technology:** `commander`.
- **Communication:** stdin/stdout only.

### Auth Manager
- **Responsibility:** Drive Codex's official OAuth/device-code login flow; store, refresh, and revoke tokens.
- **Boundaries:** Does not talk to the HTTP API layer directly; exposes a typed internal interface only.
- **Technology:** Codex CLI's documented auth flow; OS keychain access via `keytar` (or `@napi-rs/keyring` as a maintained alternative).
- **Communication:** Loopback HTTP listener (ephemeral port) for the OAuth callback; child-process invocation of Codex's login flow.

### Runtime Manager (Session Manager)
- **Responsibility:** Spawn, monitor, and restart the Codex app-server child process; multiplex requests if concurrent use is supported.
- **Boundaries:** Does not parse HTTP; exposes only `sendPrompt()` / `streamPrompt()`-style internal methods.
- **Technology:** Node `child_process`, a JSON-RPC-over-stdio client.
- **Communication:** stdio/JSON-RPC to the Codex app-server subprocess.

### API Layer
- **Responsibility:** Expose `/v1/messages`, `/v1/chat/completions`, `/v1/models`, and `/v1/status`; normalize both public protocols into shared runtime requests and stream protocol-specific SSE events.
- **Boundaries:** No auth-flow logic, no process management.
- **Technology:** Fastify, TypeScript, Zod for request validation, native SSE support for streaming.
- **Communication:** HTTP/REST; Server-Sent Events for streaming.

### Local Credential Store
- **Responsibility:** Persist Codex tokens securely.
- **Technology:** OS keychain (primary), AES-256-encrypted file (fallback).
- **Communication:** Local filesystem / OS keychain API.

---

## 3. Data Models

```
Entity: Session
Fields:
  - id:             UUID (PK)
  - createdAt:      timestamp
  - status:         enum(active, expired, revoked)
  - codexAccountId: string
Relations:
  - Session belongs to the single local user (no multi-tenant model — local, single-user tool)
Storage:
  - In-memory during runtime, serialized to ~/.ai-gateway/session.json for restart persistence
```

```
Entity: CredentialRecord
Fields:
  - provider:      string ("codex")
  - accessToken:   string (encrypted at rest)
  - refreshToken:  string (encrypted at rest)
  - expiresAt:     timestamp
Storage:
  - OS keychain entry, keyed by provider name
```

```
Entity: RequestLog (optional, opt-in debugging)
Fields:
  - id:          UUID
  - timestamp:   timestamp
  - endpoint:    string
  - status:      number
  - durationMs:  number
Storage:
  - Rotating local JSON-lines file: ~/.ai-gateway/logs/*.jsonl
  - Disabled by default; enabled via `--verbose`
```

`N/A — No relational database is used.` This is a single-user, single-machine tool; a lightweight local JSON file replaces a full RDBMS. Revisit only if multi-session/multi-user support is added in v2.

---

## 4. API Contracts

```
POST /v1/chat/completions

Auth:         Bearer token (local API key, generated on first `cc-byok gateway start`)
Rate Limit:   None by default (local single-user); configurable via --rate-limit for shared-machine use

Request:
{
  "model":    string (optional, default: "codex-latest"),
  "messages": [{ "role": "system"|"user"|"assistant", "content": string }],
  "stream":   boolean (optional, default: false)
}

Response 200 (non-streaming):
{
  "id":      string,
  "object":  "chat.completion",
  "choices": [{ "index": 0, "message": { "role": "assistant", "content": string }, "finish_reason": string }],
  "usage":   { "prompt_tokens": number, "completion_tokens": number, "total_tokens": number }
}

Response 200 (streaming, stream: true):
  Server-Sent Events, each event a "chat.completion.chunk" in OpenAI's delta format,
  terminated by "data: [DONE]".

Errors:
  400 — Malformed request body
  401 — Missing/invalid local API key, or Codex session expired
  409 — Codex runtime not running / user not logged in
  500 — Upstream Codex app-server failure
  503 — Codex runtime crashed and automatic restart failed
```

```
GET /v1/models

Auth: Bearer token
Response 200: { "data": [{ "id": "codex-latest", "object": "model" }] }
```

```
POST /v1/auth/login

Auth:        None (endpoint is loopback-bound only)
Description: Triggers Codex's official browser-based login flow; blocks until login
             completes or a 120s timeout is reached.

Response 200: { "status": "authenticated", "expiresAt": timestamp }
Errors:
  408 — Login timed out
  500 — Codex auth flow failed
```

```
GET /v1/status

Auth: Bearer token
Response 200: { "runtime": "running"|"stopped", "authenticated": boolean, "uptimeSeconds": number }
```

---

## 5. Authentication and Authorization

- **Auth strategy (client ↔ AI Gateway):** A local API key generated on first run, stored in `~/.ai-gateway/config.json` (`0600` permissions), passed as `Authorization: Bearer <key>`. No OAuth needed at this layer — it's a single local user talking to a localhost-bound process.
- **Auth strategy (AI Gateway ↔ Codex):** Delegates entirely to Codex's official OAuth/device-code flow. AI Gateway never touches Codex account credentials directly, only the resulting tokens.
- **Permission model:** Flat — single local user, single API key, full access. `N/A for RBAC` — revisit only if a v2 shared/team-server mode is introduced.
- **Token lifecycle:** Codex access tokens are refreshed automatically via the refresh token before expiry. The local API key has no expiry but can be rotated with `cc-byok gateway rotate-key`.
- **Sensitive data:** Codex tokens are encrypted at rest (OS keychain, or AES-256 file fallback). The local API key is stored in plaintext locally — acceptable since it protects a localhost-bound API from other local processes rather than acting as a network secret — but the file is permission-restricted to the owner.

---

## 6. Infrastructure and Deployment

- **Hosting:** None — AI Gateway is a local-only CLI/daemon, distributed via npm (`npm install -g cc-byok`) and GitHub Releases.
- **CI/CD:** GitHub Actions pipeline: lint → typecheck → unit tests → integration tests (against a mocked Codex app-server) → publish to npm on tagged release.
- **Environment strategy:** dev (local `npm link`), CI (GitHub Actions runners), "prod" = the end user's own machine — no staging environment applies to a local tool.
- **Secrets management:** No server-side secrets exist; all secrets stay on the end user's machine. CI only needs an npm publish token, stored as a GitHub Actions secret.
- **Scaling strategy:** `N/A — single-user, single-machine tool by design.` No horizontal or vertical scaling applies in v1.

---

## 7. Error Handling and Observability

- **Error taxonomy:**
  1. Client errors — bad request body, missing/invalid local API key.
  2. Upstream errors — Codex app-server crash, Codex session expiry, Codex-side rate limiting.
  3. System errors — port already in use, filesystem permission failures.
- **Retry logic:** Runtime Manager retries spawning the Codex app-server up to 3 times with exponential backoff (1s, 2s, 4s) before returning a `503`. Token refresh is retried once before forcing re-login.
- **Logging:** Opt-in structured JSON logs (`pino`) at info/warn/error levels, written to `~/.ai-gateway/logs/`. No logs are transmitted externally — privacy-by-default is a trust requirement for an OSS tool handling credentials.
- **Monitoring:** Local-only. `/v1/status` exposes runtime health and uptime. No external monitoring service in v1, given the single-user local scope.
- **Incident playbook:** `N/A` — no on-call team for an OSS project; GitHub Issues serves as the bug/incident tracker.

---

## 8. Testing Strategy

- **Unit tests:** Auth Manager, Runtime Manager, and API request/response translation logic. Target ≥80% coverage using Vitest.
- **Integration tests:** Full request → mocked-Codex-app-server → response round trips, covering both streaming and non-streaming paths, using a stdio test double standing in for the real Codex binary.
- **Load tests:** Not a v1 priority given the single local user assumption; a basic concurrency test (5 simultaneous requests) confirms the Runtime Manager multiplexes correctly without deadlocking.
- **AI system evals:** A compatibility suite runs identical prompts through `openai-node`, LangChain, and Continue.dev against AI Gateway. Pass criteria is 100% schema/protocol conformance (not model output quality, which remains Codex's responsibility). Re-run on every Codex CLI version bump and any OpenAI API schema change.

---

## 9. Open Questions and Risks

```
[OPEN]  Does Codex's app-server protocol officially support concurrent multi-session use,
        or must AI Gateway serialize requests? Confirm against Codex app-server docs before
        implementing Runtime Manager multiplexing.

[RISK]  OpenAI's chat completions schema may evolve; strict schema-matching could break
        client compatibility on upstream changes. Mitigate with a versioned adapter layer.

[RISK]  Codex's auth flow (OAuth provider, scopes) could change without notice — there is no
        formal support contract from OpenAI for third-party wrapping of Codex.

[TODO]  Decide on a repository license (MIT vs. Apache-2.0) before public OSS launch —
        affects contribution and legal posture.

[TODO]  Confirm whether daemon mode (background process, planned for v1.1) is needed sooner
        based on early community feedback after MVP launch.
```

---

## 10. Phased Implementation Alignment

| Phase | PRD Goal | TDD Components Involved | Dependencies |
|---|---|---|---|
| MVP | Login + basic `/v1/chat/completions` with streaming | Auth Manager, Runtime Manager, API Layer (`chat/completions`, `models`, `status`) | Codex CLI installed locally |
| v1.1 | Repo analysis & file-modification passthrough, concurrent sessions, daemon mode | Runtime Manager (multiplexing), new API endpoints, `RequestLog`, Daemon Manager | MVP stable; Codex multi-session support confirmed (see Open Questions) |
| v2.0 | Plugin ecosystem, multi-provider abstraction, local dashboard | Plugin loader, provider adapter interface, dashboard UI | v1.1 stable; community contributor interest |

---

## Changelog

```
v1.0 — 2026-07-15 — Initial draft, generated from PRD.
```
