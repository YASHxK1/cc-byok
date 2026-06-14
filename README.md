# cc-byok

`cc-byok` is a CLI model router and launcher for coding agents. It selects a
provider and model, securely reads the provider credential from the operating
system keychain, builds the environment expected by the target application, and
launches it with inherited terminal input and output.

It is a configuration wrapper, not an API proxy or protocol translator.

## Requirements

- Node.js 20.17 or newer
- The coding agent you want to launch installed on `PATH`
- A provider API key, except for providers such as a local Ollama instance
- A working OS credential store

## Install

```bash
npm install --global cc-byok
```

## Quick Start

```bash
cc-byok init
cc-byok provider add openrouter
cc-byok use openrouter anthropic/claude-sonnet-4.5
cc-byok launch
```

`cc-byok launch` remains shorthand for launching the active target, which is
`claude` for new and migrated configurations.

Launch another built-in target:

```bash
cc-byok launch codex --provider vercel --model openai/gpt-4.1
cc-byok launch opencode --provider openrouter --model qwen/qwen3-coder
cc-byok launch codex-app
```

Forward arguments after `--`:

```bash
cc-byok launch claude -- --print "Summarize this repository"
cc-byok launch codex -- --help
```

The existing default-target form is also preserved:

```bash
cc-byok launch -- --print "Summarize this repository"
```

## Launch Targets

Built-in targets are:

| ID | Command | Environment profile |
|---|---|---|
| `claude` | `claude` | Anthropic |
| `codex` | `codex` | OpenAI |
| `codex-app` | `codex app` | OpenAI |
| `opencode` | `opencode` | OpenAI |
| `hermes` | `hermes` | OpenAI |
| `openclaw` | `openclaw` | OpenAI |

Manage targets with:

```bash
cc-byok targets list
cc-byok targets inspect codex
cc-byok targets add
cc-byok targets remove my-agent
```

`targets add` interactively asks for an ID, display name, executable, optional
description, and environment profile. A custom profile also asks for the
environment variable names used for the base URL, API key, and model. Custom
targets are stored in `~/.cc-byok/config.json`; built-in targets cannot be
replaced or removed.

An explicitly launched target becomes the active target after the child process
exits, including when the child returns a nonzero exit code.

## Providers

Configure built-ins:

```bash
cc-byok provider add openrouter
cc-byok provider add vercel
```

Add a custom provider:

```bash
cc-byok provider add team-gateway \
  --base-url https://gateway.example.com \
  --display-name "Team Gateway" \
  --type openai-compatible
```

Provider types are `anthropic-compatible`, `openai-compatible`, `ollama`,
`ai-gateway`, and `custom`. Custom providers default to
`anthropic-compatible` for backward compatibility. Ollama providers are saved
without prompting for an API key.

OpenRouter and Vercel AI Gateway expose protocol-specific endpoints:

| Provider | Anthropic profile | OpenAI profile |
|---|---|---|
| OpenRouter | `https://openrouter.ai/api` | `https://openrouter.ai/api/v1` |
| Vercel | `https://ai-gateway.vercel.sh` | `https://ai-gateway.vercel.sh/v1` |

## Compatibility

Before launch, `cc-byok` compares the target environment/API profile with the
provider capabilities. Known mismatches stop with a clear error:

```bash
cc-byok launch claude --provider an-openai-only-provider --model some-model
```

Use `--force` only when an external adapter makes the combination valid:

```bash
cc-byok launch claude --provider an-openai-only-provider \
  --model some-model --force
```

Unknown custom combinations warn and proceed. `--force` does not translate API
protocols.

## Status And Security

```bash
cc-byok status
```

Status reports the active target, provider/model, provider type, target
environment profile, resolved endpoint, and a fixed masked API-key value.
Credentials are never written to config or printed. They are read from the OS
keychain only when the selected target requires one.

Target applications may apply their own configuration precedence. A target's
CLI flags or local configuration can override environment-based model settings.

For `codex` and `codex-app`, `cc-byok` also supplies temporary Codex
configuration overrides for `model`, `model_provider`, provider `base_url`,
authentication environment variable, and the Responses API. This takes
precedence over the model and provider in `~/.codex/config.toml` without editing
that file.

## Development

```bash
npm install
npm run check
```

See [Usage](docs/usage.md), [Gateway Providers](docs/gateways.md), and
[CONTRIBUTING](CONTRIBUTING.md).
