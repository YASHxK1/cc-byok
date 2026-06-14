# cc-byok

`cc-byok` launches Claude Code, Codex, Codex App, and OpenCode through BYOK
providers and compatible gateways. API keys are stored in your operating
system keychain.

It is a configuration wrapper, not an API proxy or protocol translator.

## Requirements

- Node.js 20.17 or newer
- the coding agent you want to launch installed on `PATH`
- an API key for OpenRouter, Vercel AI Gateway, or your custom gateway
- A working OS credential store
  - macOS: Keychain
  - Linux: Secret Service through GNOME Keyring, KWallet, or equivalent
  - Windows: Credential Manager (experimental for this release)

## Install

```bash
npm install --global cc-byok
```

Install each target separately. Supported target IDs are `claude`, `codex`,
`codex-app`, and `opencode`.

For source installation, platform notes, and setup verification, see
[Installation](docs/installation.md).

For a complete walkthrough from installation to chatting with an OpenRouter
model, see the
[OpenRouter and Claude Code Guide](docs/openrouter-claude-code-guide.md).

## Quick Start

```bash
cc-byok init
cc-byok provider add openrouter
cc-byok use openrouter qwen/qwen3-coder
cc-byok status
cc-byok launch
```

Bare `cc-byok launch` remains shorthand for Claude Code. Launch another target
with one-off provider and model overrides:

```bash
cc-byok launch -- --print "Summarize this repository"
cc-byok launch codex --provider vercel --model openai/gpt-5
cc-byok launch codex-app --provider vercel --model deepseek/deepseek-v4-pro
cc-byok launch opencode --provider openrouter --model qwen/qwen3-coder
```

## Commands

```text
cc-byok init
cc-byok provider add openrouter
cc-byok provider add vercel
cc-byok provider add team-gateway --base-url https://gateway.example.com
cc-byok provider list
cc-byok use <provider> <model-id>
cc-byok status
cc-byok launch [target] [--provider <provider>] [--model <model>] [-- <target arguments...>]
```

See the [Usage Guide](docs/usage.md) for command details and common workflows.

Non-secret configuration is stored in `~/.cc-byok/config.json`. Each provider's
API key is stored under service `cc-byok` in the OS keychain and is never written
to the config file.

See [Gateway Providers](docs/gateways.md) for Vercel AI Gateway and custom
gateway setup.

## Launch Targets

| Target | Executable | Provider protocol |
|---|---|---|
| `claude` | `claude` | Anthropic-compatible |
| `codex` | `codex` | OpenAI Responses |
| `codex-app` | `codex app` | OpenAI Responses |
| `opencode` | `opencode` | OpenAI-compatible |

Provider and model overrides do not change the selection saved by `cc-byok
use`. For `codex-app`, the resolved selection is also written to Codex
Desktop's config because the desktop process outlives the `codex app` launcher.

## How Launching Works

Claude Code receives:

```text
ANTHROPIC_BASE_URL=https://openrouter.ai/api
ANTHROPIC_AUTH_TOKEN=<keychain value>
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=<selected model>
```

The rest of your environment and the current working directory are preserved.
Terminal input and output are inherited directly, and `cc-byok` returns Claude
Code's exit code.

Codex CLI receives the selected key through `OPENAI_API_KEY` plus temporary
`-c` overrides defining a `cc_byok` provider.

Codex App instead receives a persistent `cc_byok` provider and model catalog in
`~/.codex`. A command-backed authentication helper retrieves the key from the
OS keychain when Codex needs it; the key is never written to TOML or JSON.
Before the first managed change, the existing config is backed up as
`~/.codex/config.toml.cc-byok.bak`.

Vercel resolves to `https://ai-gateway.vercel.sh` for Claude and
`https://ai-gateway.vercel.sh/v1` for Codex targets. Custom providers remain
Anthropic-compatible and are rejected for OpenAI-protocol targets.

## Troubleshooting

### Authentication conflict

If Claude Code was previously logged into an Anthropic account, start Claude Code
normally, run `/logout`, exit, and launch it again through `cc-byok`. OpenRouter
documents cached Anthropic login state as a cause of model-not-found errors.

### Linux keychain unavailable

Install and unlock a Secret Service provider such as GNOME Keyring or KWallet,
then retry `cc-byok provider add openrouter`.

### Model compatibility

Claude Code relies heavily on native tool use. OpenRouter notes that Claude Code
is only guaranteed to work with Anthropic's first-party provider; other model IDs
may connect but behave poorly in coding-agent workflows.

## Security

The API key is read from the OS keychain only when needed and is passed to the
launched process through its environment. `cc-byok` does not log it, write it to
configuration, or make network requests itself.

## Development

```bash
npm install
npm run check
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the repository structure and pull
request guidelines.
