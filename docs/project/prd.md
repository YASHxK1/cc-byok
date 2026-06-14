# Product Requirements Document
## `cc-byok` — BYOK Model Router for Claude Code

---

## 1. Executive Summary

### Problem Statement

Claude Code is locked to Anthropic's API by default. Developers who want to run Claude Code against cheaper, faster, local, or specialized coding models — using their own OpenRouter, Ollama, or LiteLLM keys — have no clean way to do it. The only option is manually exporting environment variables every session, which is fragile, annoying, and doesn't scale across projects or providers.

### Proposed Solution

`cc-byok` is a lightweight CLI that acts as a configuration manager and launcher for Claude Code. It stores provider credentials, manages the required Claude Code environment variables, and spawns the `claude` process with the correct context — so switching models is a single command, not a shell scripting exercise.

### Success Criteria

| Metric | Target |
|---|---|
| Time to first launch after setup | Under 2 minutes |
| CLI commands to switch provider + model | 2 commands max |
| Successful Claude Code session via OpenRouter | 100% on MVP demo flow |
| API key exposure risk | Zero — keys never written to config files or repos |
| Support for OpenRouter Anthropic-compatible endpoint | Verified working on MVP release |

---

## 2. User Experience & Functionality

### 2.1 User Personas

**Primary: Developer / Power User**
- Uses Claude Code regularly
- Wants to experiment with non-Anthropic models (Qwen, DeepSeek, Gemini, etc.)
- Has their own OpenRouter or Ollama setup
- Comfortable with CLI tools

**Secondary: Indie Hacker / AI Builder**
- Building with Claude Code as part of a larger workflow
- Wants per-project model configs
- Cost-sensitive — wants cheaper models for routine tasks, stronger models for complex ones

---

### 2.2 User Stories

**US-01 — Initial Setup**
As a developer, I want to initialize `cc-byok` once so that it creates the necessary config structure on my machine.

**Acceptance Criteria:**
- `cc-byok init` creates a config directory at `~/.cc-byok/`
- Creates `config.json` for non-secret settings (active provider, active model, base URLs)
- Does not store API keys in `config.json`
- Prints confirmation of setup path

---

**US-02 — Add Provider Key**
As a developer, I want to add my OpenRouter API key once so I don't have to re-enter it every session.

**Acceptance Criteria:**
- `cc-byok provider add openrouter` prompts for the API key via stdin (hidden input)
- Key is stored using OS keychain (`keytar`) or equivalent secure storage
- Key is never written to `config.json` or any file in the project directory
- Confirmation printed after successful save
- Running the command again overwrites the existing key after confirmation prompt

---

**US-03 — Set Active Model**
As a developer, I want to select which model to use so that Claude Code routes requests to the right model.

**Acceptance Criteria:**
- `cc-byok use openrouter qwen/qwen3-coder` sets the active provider and model
- Updates `config.json` with `activeProvider` and `activeModel`
- Prints summary of active config after setting

---

**US-04 — Launch Claude Code**
As a developer, I want to run a single command to launch Claude Code with my configured provider and model.

**Acceptance Criteria:**
- `cc-byok launch` reads active provider, model, and API key
- Sets the following environment variables before spawning `claude`:
  ```
  ANTHROPIC_BASE_URL=<provider-base-url>
  ANTHROPIC_AUTH_TOKEN=<provider-api-key>
  ANTHROPIC_API_KEY=
  ANTHROPIC_MODEL=<model-id>
  ```
- Spawns `claude` as a child process with stdin/stdout/stderr piped directly to the terminal
- Claude Code session behaves identically to normal — user is not aware of redirection
- If `claude` binary is not found, prints a clear error with install instructions

---

**US-05 — Status Check**
As a developer, I want to see my current configuration at a glance so I know which provider and model are active.

**Acceptance Criteria:**
- `cc-byok status` prints active provider, active model, base URL, and whether an API key is stored
- Does not print the API key value — only confirms it exists (or doesn't)

---

**US-06 — List Providers**
As a developer, I want to see which providers are configured so I can manage them without editing config files.

**Acceptance Criteria:**
- `cc-byok provider list` shows all configured providers with their base URLs
- Marks the currently active provider

---

### 2.3 Non-Goals (MVP)

The following are explicitly out of scope for v1.0:

- Ollama support (post-MVP)
- LiteLLM proxy mode (post-MVP)
- Per-project config files (post-MVP)
- Token usage tracking (post-MVP)
- Cost tracking (post-MVP)
- Interactive model picker / TUI (post-MVP)
- Model benchmarking or compatibility warnings (post-MVP)
- Support for Cursor, Aider, or other coding agents (future vision)
- Windows PowerShell support (nice to have, but not required for MVP)

---

## 3. Technical Specifications

### 3.1 Architecture Overview

```
User
  ↓
cc-byok CLI
  ↓ reads config.json + OS keychain
  ↓
Environment variable assembly
  ↓
spawn("claude", { env: claudeEnv, stdio: "inherit" })
  ↓
Claude Code process
  ↓
ANTHROPIC_BASE_URL → https://openrouter.ai/api
  ↓
OpenRouter Anthropic-compatible endpoint
  ↓
Selected model (e.g. qwen/qwen3-coder)
```

For the MVP, no local proxy is required. OpenRouter exposes a native Anthropic-compatible endpoint, so Claude Code routes directly.

---

### 3.2 CLI Command Reference

| Command | Description |
|---|---|
| `cc-byok init` | Initialize config directory and base config file |
| `cc-byok provider add <name>` | Add a provider and securely store its API key |
| `cc-byok provider list` | List configured providers |
| `cc-byok use <provider> <model-id>` | Set active provider and model |
| `cc-byok status` | Show current active config |
| `cc-byok launch` | Launch Claude Code with active config |

---

### 3.3 Config Structure

**`~/.cc-byok/config.json`** (non-secret, version-safe):

```json
{
  "activeProvider": "openrouter",
  "activeModel": "qwen/qwen3-coder",
  "providers": {
    "openrouter": {
      "baseUrl": "https://openrouter.ai/api"
    }
  }
}
```

**API Keys** — stored via OS keychain using `keytar`:

```
Service:  cc-byok
Account:  openrouter
Password: <api-key>
```

Keys are never written to disk as plaintext.

---

### 3.4 Environment Variables Injected at Launch

```bash
ANTHROPIC_BASE_URL=https://openrouter.ai/api
ANTHROPIC_AUTH_TOKEN=<retrieved-from-keychain>
ANTHROPIC_API_KEY=           # Explicitly cleared to prevent fallback
ANTHROPIC_MODEL=qwen/qwen3-coder
```

---

### 3.5 Recommended MVP Stack

| Layer | Choice | Reason |
|---|---|---|
| Language | Node.js + TypeScript | Fast CLI dev, native `child_process`, good keytar support |
| CLI framework | `commander` or `cac` | Lightweight, no unnecessary dependencies |
| Secret storage | `keytar` | OS-native keychain support on macOS/Linux/Windows |
| Config storage | JSON file | Simple, inspectable, no DB required |
| Process launch | `child_process.spawn` | Direct stdin/stdout/stderr inheritance |

---

### 3.6 Security & Privacy

- API keys are stored exclusively in OS keychain — never in config files, environment files, or version-controlled paths
- `config.json` is safe to inspect but should not be committed if it contains project-specific data
- `.gitignore` entry recommended: `~/.cc-byok/` should never appear in project repos
- No telemetry, analytics, or external calls except the spawned `claude` process itself

---

## 4. Risks & Constraints

| Risk | Impact | Mitigation |
|---|---|---|
| Not all OpenRouter models support tool calling well | High — Claude Code relies heavily on tool use | Document which models are tested and recommended; warn on known-bad models |
| Claude Code env var interface may change in future versions | Medium — could silently break routing | Pin to tested Claude Code version in docs; monitor upstream changes |
| OpenRouter Anthropic endpoint compatibility may vary by model | Medium — some models may not behave correctly | Test with at least 3 models at launch; note compatibility in README |
| `keytar` native build failures on some systems | Medium — breaks secure key storage | Provide fallback instructions for manual env var export |
| Windows shell spawning edge cases | Low for MVP | Document macOS/Linux as primary targets; Windows marked as experimental |

---

## 5. Phased Roadmap

### MVP — v1.0

**Goal:** Working OpenRouter integration with a clean CLI.

- `init`, `provider add`, `provider list`, `use`, `status`, `launch`
- OpenRouter only
- Global config
- OS keychain storage
- macOS + Linux support

**Exit criteria:** A user can run:
```bash
cc-byok provider add openrouter
cc-byok use openrouter qwen/qwen3-coder
cc-byok launch
```
And Claude Code starts using the specified OpenRouter model.

---

### v1.1 — Post-MVP Foundations

- Ollama local model support (direct or via Anthropic-compatible endpoint)
- Per-project config (`.cc-byok.json` in project root, ignored by git)
- Model aliases (`cc-byok alias set fast qwen/qwen3-coder`)
- Windows support (PowerShell + cmd)

---

### v2.0 — Power User Features

- LiteLLM proxy mode for non-Anthropic-compatible providers
- Token usage tracking per session
- Cost estimates per session (via OpenRouter pricing API)
- Interactive model picker (TUI)
- Compatibility warnings for models with weak tool-calling support
- Model benchmarking against Claude Code task types

---

### Long-Term Vision

`cc-byok` becomes a universal BYOK model launcher for developer agents — supporting not just Claude Code but Aider, Cursor CLI, Continue, and custom agent runners through a unified provider/model config layer.

---

## 6. Open Questions

| # | Question | Owner | Status |
|---|---|---|---|
| 1 | Does OpenRouter's `/api` base URL work for all Claude Code tool-use patterns? | Yash | Needs verification |
| 2 | Is `keytar` reliable enough on Linux (GNOME Keyring vs KDE Wallet)? | Yash | TBD |
| 3 | Should `cc-byok launch` support passing through arbitrary flags to `claude`? | Yash | Post-MVP |
| 4 | What's the package name for npm publish — `cc-byok` or `claude-router`? | Yash | TBD |

---

*This document reflects MVP scope only. Future scope sections are directional, not committed.*
