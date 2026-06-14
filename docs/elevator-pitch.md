# cc-byok — Elevator Pitch

## The 30-Second Pitch

**cc-byok** is a lightweight CLI that lets you run Claude Code, Codex, and other AI coding agents using *your own* API keys through OpenRouter, Vercel AI Gateway, or any custom provider. No proxies, no vendor lock-in, no pasting environment variables into every terminal session. One command to configure, one command to launch. Your keys stay in your OS keychain where they belong.

---

## The Problem

Claude Code and other coding agents default to their vendor's API. Developers who want to use cheaper, faster, local, or specialized models through their own OpenRouter or custom gateway accounts are stuck manually exporting environment variables every session — fragile, tedious, and error-prone.

## The Solution

`cc-byok` sits between you and your coding agent, handling provider configuration, secure credential storage, and environment assembly. You pick a provider and model once, then launch with a single command:

```bash
cc-byok provider add openrouter
cc-byok use openrouter anthropic/claude-sonnet-4.5
cc-byok launch
```

## Why It Matters

| Without cc-byok | With cc-byok |
|---|---|
| Manually export 4+ env vars per session | `cc-byok launch` |
| API keys in shell history or `.env` files | Keys in OS keychain, never on disk |
| No easy way to switch providers | `cc-byok use vercel openai/gpt-4.1` |
| Claude Code only | Launches Claude Code, Codex, OpenCode, and custom targets |
| Guess if provider/model combo works | Built-in compatibility validation |

## Key Facts

- **Zero network requests** — cc-byok doesn't proxy, translate, or intercept API calls
- **Multi-target** — launch `claude`, `codex`, `opencode`, or any custom agent
- **Multi-provider** — OpenRouter, Vercel AI Gateway, Ollama, or any Anthropic/OpenAI-compatible gateway
- **Secure by design** — API keys live in the OS keychain, never in config files
- **Single global install** — `npm install --global cc-byok`, works on macOS, Linux, and Windows

## The Tagline

**One CLI to route any coding agent through any provider. Bring your own key.**
