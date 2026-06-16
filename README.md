# cc-byok

`cc-byok` launches coding agents with your own provider keys. It supports
Claude Code, Codex CLI, Codex App, and OpenCode through OpenRouter, Vercel AI
Gateway, or custom Anthropic-compatible gateways.

It is a local configuration wrapper. It does not proxy requests, translate
protocols, log API keys, or send network requests itself. The selected target
connects directly to the configured provider.

## Documentation

- [Usage Guide](docs/usage.md)
- [Gateway Providers](docs/gateways.md)
- [OpenRouter and Claude Code Guide](docs/openrouter-claude-code-guide.md)
- [Installation](docs/installation.md)
- [Changelog](docs/changelog.md)

## Features

- Launch Claude Code, Codex CLI, Codex App, and OpenCode from one CLI
- Keep API keys in the operating system keychain
- Configure OpenRouter and Vercel AI Gateway as built-in providers
- Add custom Anthropic-compatible gateways from the CLI
- Select an active provider and model once, then reuse it
- Override provider and model per launch with `--provider` and `--model`
- Forward target-specific arguments after `--`
- Resume supported sessions with `--restore`
- List configured providers with `provider list`
- List supported launch targets with `target list`
- Route Claude Code through Anthropic-compatible environment variables
- Route Codex, Codex App, and OpenCode through OpenAI-compatible environment
  variables
- Configure Codex CLI with temporary `-c` provider overrides
- Configure Codex App with a managed `cc_byok` provider and model catalog
- Preserve existing Codex App config with a one-time backup
- Override config locations with environment variables

## Requirements

- Node.js 20.17 or newer
- At least one supported target installed on `PATH`
- An API key for OpenRouter, Vercel AI Gateway, or a custom gateway
- A working operating system credential store

Supported credential stores:

| Platform | Credential store | Status |
|---|---|---|
| macOS | Keychain | Supported |
| Linux | Secret Service, such as GNOME Keyring or KWallet | Supported |
| Windows | Credential Manager | Experimental |

Only the target you launch needs to be installed. For example, `cc-byok launch
codex` requires `codex`, but not `claude` or `opencode`.

## Installation

Install globally from npm:

```bash
npm install --global cc-byok
```

Verify the CLI:

```bash
cc-byok --version
cc-byok --help
```

Install from source:

```bash
npm install
npm run build
npm install --global .
```

See [Installation](docs/installation.md) for platform notes, upgrade steps, and
uninstall instructions.

## Quick Start

Configure OpenRouter and launch Claude Code:

```bash
cc-byok init
cc-byok provider add openrouter
cc-byok use openrouter qwen/qwen3-coder
cc-byok status
cc-byok launch
```

Bare `cc-byok launch` is shorthand for Claude Code.

Launch another target with one-off overrides:

```bash
cc-byok launch codex --provider vercel --model openai/gpt-5
cc-byok launch codex-app --provider vercel --model deepseek/deepseek-v4-pro
cc-byok launch opencode --provider openrouter --model qwen/qwen3-coder
```

Forward arguments to the target after `--`:

```bash
cc-byok launch -- --print "Summarize this repository"
cc-byok launch codex -- --help
cc-byok launch codex-app -- /path/to/project
```

## Commands

```text
cc-byok init
cc-byok provider add openrouter
cc-byok provider add vercel
cc-byok provider add <provider-id> --base-url <url> [--display-name <name>]
cc-byok provider list
cc-byok target list
cc-byok use <provider-id> <model-id>
cc-byok status
cc-byok launch [target] [--provider <provider-id>] [--model <model-id>] [--restore] [-- <target arguments...>]
```

## Providers

`cc-byok` includes two built-in providers:

| Provider ID | Anthropic endpoint | OpenAI endpoint |
|---|---|---|
| `openrouter` | `https://openrouter.ai/api` | `https://openrouter.ai/api/v1` |
| `vercel` | `https://ai-gateway.vercel.sh` | `https://ai-gateway.vercel.sh/v1` |

Add a built-in provider:

```bash
cc-byok provider add openrouter
cc-byok provider add vercel
```

Add a custom Anthropic-compatible gateway:

```bash
cc-byok provider add team-gateway \
  --base-url https://gateway.example.com \
  --display-name "Team Gateway"
```

Custom gateways must implement the Anthropic Messages API, including streaming
and tool calls. They are available only to the `claude` target. `cc-byok` does
not translate Anthropic requests into OpenAI requests.

Provider API keys are stored under service `cc-byok` in the OS keychain. The
non-secret provider configuration is stored in `~/.cc-byok/config.json`.

See [Gateway Providers](docs/gateways.md) for Vercel AI Gateway and custom
gateway setup.

## Targets

| Target | Command | Protocol | Restore |
|---|---|---|---|
| `claude` | `claude` | Anthropic | `--continue` |
| `codex` | `codex` | OpenAI Responses | `resume --last` |
| `codex-app` | `codex app` | OpenAI Responses | unsupported |
| `opencode` | `opencode` | OpenAI-compatible | unsupported |

List targets:

```bash
cc-byok target list
```

Provider and model overrides do not change the active selection saved by
`cc-byok use`.

## Session Restore

Resume the last session of a supported target:

```bash
cc-byok launch --restore
cc-byok launch codex --restore
```

Restore maps to the target's native command:

| Target | Restore mapping |
|---|---|
| `claude` | `claude --continue` |
| `codex` | `codex resume --last` |

Codex App and OpenCode do not support delegated restore through `cc-byok`.
Pass target-specific restore arguments after `--` when needed:

```bash
cc-byok launch opencode -- --resume
```

## How Routing Works

Claude Code receives:

```text
ANTHROPIC_BASE_URL=<selected Anthropic-compatible endpoint>
ANTHROPIC_AUTH_TOKEN=<stored provider key>
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=<selected model>
```

`ANTHROPIC_API_KEY` is deliberately set to an empty value to avoid falling back
to an Anthropic key inherited from your shell.

Codex CLI, Codex App, and OpenCode receive:

```text
OPENAI_BASE_URL=<selected OpenAI-compatible endpoint>
OPENAI_API_KEY=<stored provider key>
OPENAI_MODEL=<selected model>
```

Codex CLI also receives temporary `-c` configuration overrides for a `cc_byok`
provider using `wire_api="responses"`.

Codex App writes managed configuration under `~/.codex`:

- `config.toml` top-level `model`, `model_provider`, and `model_catalog_json`
- a managed `[model_providers.cc_byok]` block
- a command-backed auth helper that reads the key from the OS keychain
- `cc-byok-models.json` so the selected model appears as a custom model
- `config.toml.cc-byok.bak` as a one-time backup of the previous config

The API key is not written to Codex TOML or JSON files.

## Environment Variables

| Variable | Purpose |
|---|---|
| `CC_BYOK_HOME` | Override the default `~/.cc-byok` config directory |
| `CC_BYOK_DEBUG` | Print full error stacks when enabled |
| `CODEX_HOME` | Override the default `~/.codex` directory for Codex App configuration |

Examples:

```bash
CC_BYOK_HOME=/path/to/config cc-byok status
CC_BYOK_DEBUG=1 cc-byok launch
CODEX_HOME=/path/to/codex-home cc-byok launch codex-app --provider vercel --model openai/gpt-5
```

## Troubleshooting

### `cc-byok` Is Not Found

Confirm npm's global executable directory is on `PATH`, or install from source:

```bash
npm install --global .
```

### Target Command Is Not Found

Install the target you want to launch and verify it is on `PATH`:

```bash
claude --version
codex --version
opencode --version
```

Then retry the matching launch command.

### No Active Model Is Selected

Select a provider and model:

```bash
cc-byok use <provider-id> <model-id>
```

Or pass both values for a single launch:

```bash
cc-byok launch codex --provider vercel --model openai/gpt-5
```

### API Key Is Missing

Store a key for the selected provider:

```bash
cc-byok provider add <provider-id>
```

### Authentication or Model Errors

If Claude Code was previously logged into an Anthropic account, start Claude
Code normally, run `/logout`, exit, and launch again with `cc-byok launch`.

Also confirm:

- the model ID exists on the selected provider
- the provider key is active
- the account has available credit or budget
- a custom gateway implements Anthropic `/v1/messages`, streaming, and tools
- an Anthropic-only custom gateway is not being used with an OpenAI target

### Linux Keychain Is Unavailable

Install and unlock a Secret Service provider such as GNOME Keyring or KWallet,
then retry:

```bash
cc-byok provider add openrouter
```

## Documentation

- [Usage Guide](docs/usage.md)
- [Gateway Providers](docs/gateways.md)
- [OpenRouter and Claude Code Guide](docs/openrouter-claude-code-guide.md)
- [Installation](docs/installation.md)
- [Changelog](docs/changelog.md)

## Security

The API key is read from the OS keychain only when needed and passed to the
launched target through its environment, or through the Codex App credential
helper. `cc-byok` does not log the key, write it to configuration files, or make
network requests itself.

## Development

```bash
npm install
npm run check
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for repository structure and pull
request guidelines.
