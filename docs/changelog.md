# Changelog

## Unreleased

- Added `cc-byok catalog add`, `catalog remove`, and `catalog list` for
  managing a shared model catalog.
- The shared model catalog is now validated on launch for every target: the
  selected model must be the active model or a catalog model.
- The ChatGPT App catalog now preserves the built-in model list (read from
  `~/.codex/models_cache.json`) and appends the active model plus configured
  catalog models instead of replacing the entire list.
- Removed the `opencode` launch target and the `openai-chat` protocol. The local
  gateway's `/v1/chat/completions` endpoint remains available to external
  OpenAI-compatible clients.
- Integrated `cc-byok gateway` with Codex login/logout, foreground lifecycle,
  status, managed bearer keys, and key rotation.
- Added authenticated loopback OpenAI Chat Completions, model-list, and status
  endpoints backed by `codex app-server`, including SSE and function tools.
- Added an Anthropic Messages translation endpoint with text streaming,
  system prompts, tool use, and tool-result continuation for Claude Code.
- Added Codex version checks and local gateway launch preflight.
- Added the built-in `ai-gateway` provider for the local Codex-backed OpenAI
  Chat Completions gateway at `http://127.0.0.1:3000/v1`.
- Added protocol capability checks that allow the local gateway with Claude
  Code while rejecting OpenAI Responses targets before launch.
- Fixed the `codex-app` launch target: the Codex App desktop application was
  renamed to the ChatGPT App, and the `codex app` CLI subcommand was removed.
  The target now launches the renamed app via the `chatgpt` command instead of
  the removed `codex app` subcommand. The target identifier `codex-app` is
  unchanged.

## v0.3.2

`cc-byok` expanded from a Claude Code-only BYOK launcher into a multi-agent
launcher for Claude Code, Codex, Codex App, and OpenCode.

### Added

- Launch targets: `claude`, `codex`, `codex-app`, and `opencode`
- `cc-byok target list`
- `cc-byok launch [target]`
- one-off launch overrides with `--provider` and `--model`
- `--restore` for supported targets
- OpenAI-compatible routing for Codex, Codex App, and OpenCode
- protocol-specific OpenRouter and Vercel AI Gateway endpoints
- Codex CLI temporary `-c` provider configuration
- Codex App profile configuration in `~/.codex/config.toml`
- Codex App model catalog generation in `~/.codex/cc-byok-models.json`
- Codex App key access through a command-backed credential helper
- `CODEX_HOME` override for Codex App configuration
- target-aware executable checks and missing-command errors

### Changed

- Bare `cc-byok launch` remains compatible with v0.2.0 and still launches
  Claude Code.
- OpenRouter and Vercel AI Gateway now support both Anthropic and OpenAI
  protocol targets.
- Custom gateways remain Anthropic-compatible only and are rejected for OpenAI
  targets.
- The package description now reflects support for multiple coding agents.
- The test script runs Vitest with `--pool=threads`.
- Package build preparation moved from `prepack` to `prepare`.

### Restore Behavior

| Target | Restore mapping |
|---|---|
| `claude` | `claude --continue` |
| `codex` | `codex resume --last` |
| `codex-app` | unsupported |
| `opencode` | unsupported |

Unsupported restore requests fail before launch with an explicit error.

### Compatibility

Existing v0.2.0 workflows continue to work:

```bash
cc-byok init
cc-byok provider add openrouter
cc-byok use openrouter qwen/qwen3-coder
cc-byok launch
```

For new targets, use:

```bash
cc-byok target list
cc-byok launch codex --provider vercel --model openai/gpt-5
cc-byok launch codex-app --provider vercel --model deepseek/deepseek-v4-pro
cc-byok launch opencode --provider openrouter --model qwen/qwen3-coder
```
