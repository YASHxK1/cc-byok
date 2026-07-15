# Usage

This guide describes the current provider-neutral workflow, including the
integrated local gateway.

## Initial Setup

### 1. Initialize Configuration

```bash
cc-byok init
```

This creates:

```text
~/.cc-byok/config.json
```

The file contains built-in provider definitions, custom gateway definitions, and
the active provider and model. It never contains API keys.

Running `init` again preserves your selection and custom providers. It also
migrates older config formats and adds missing built-in providers.

### 2. Configure a Provider

Choose one built-in provider:

```bash
# OpenRouter
cc-byok provider add openrouter

# Vercel AI Gateway
cc-byok provider add vercel

# Local Codex-backed AI Gateway
cc-byok provider add ai-gateway
```

For a custom Anthropic-compatible gateway:

```bash
cc-byok provider add team-gateway \
  --base-url https://gateway.example.com \
  --display-name "Team Gateway"
```

For OpenRouter, Vercel, and custom providers, the prompt hides the provider key
while you type. The key is stored under service `cc-byok`, using the provider
ID as its account, in your operating system keychain.

Running the command when a key already exists asks for confirmation before
replacing it. `provider add ai-gateway` is different: it generates or reuses a
managed local bearer key and does not prompt.

### 3. Select a Model

```bash
cc-byok use <provider-id> <model-id>
```

Examples:

```bash
cc-byok use openrouter qwen/qwen3-coder
cc-byok use vercel <provider/model-id>
cc-byok use ai-gateway codex-latest
cc-byok use team-gateway <provider/model-id>
```

Use the exact model ID accepted by the selected provider. Selecting a model
updates only the non-secret config file and does not make a network request.

Coding agents depend heavily on reliable tool calling. A model may be available
through a provider but still perform poorly in agent workflows.

### 4. List Available Targets

```bash
cc-byok target list
```

Displays all supported launch targets (`claude`, `codex`, `codex-app`,
`opencode`), the underlying command, the protocol each target uses, and
whether delegated restore is supported.

### 5. Check Status

```bash
cc-byok status
```

The command displays:

- config file path
- active provider
- active model
- provider base URL
- whether an API key is stored

It never displays the API key.

### 6. Launch a Target

Bare launch remains backward-compatible and starts Claude Code:

```bash
cc-byok launch
```

Supported targets are:

| Target | Command | Protocol | Restore |
|---|---|---|---|
| `claude` | `claude` | Anthropic | `--continue` |
| `codex` | `codex` | OpenAI Responses | `resume --last` |
| `codex-app` | `codex app` | OpenAI Responses | unsupported |
| `opencode` | `opencode` | OpenAI-compatible | unsupported |

Select a target and optionally override the active provider and model:

```bash
cc-byok launch codex --provider vercel --model openai/gpt-5
cc-byok launch codex-app --provider vercel --model deepseek/deepseek-v4-pro
cc-byok launch opencode --provider openrouter --model qwen/qwen3-coder
```

The overrides do not update the active provider or model in
`~/.cc-byok/config.json`. `codex-app` also persists the resolved model and
provider in `~/.codex/config.toml`, since Codex Desktop continues running after
the launcher process exits.

### Session Restore

Resume the last session of a supported target with `--restore`:

```bash
cc-byok launch --restore
cc-byok launch codex --restore
```

For Claude Code, this is equivalent to `claude --continue`. For Codex, it maps
to `codex resume --last`. Codex App and OpenCode do not support delegated
restore; pass target-specific arguments after `--` instead:

```bash
cc-byok launch -- --continue
cc-byok launch opencode -- --resume
```

### Forward Target Arguments

Place target arguments after `--`:

```bash
cc-byok launch -- --print "Summarize this repository"
cc-byok launch codex -- --help
cc-byok launch codex-app -- /path/to/project
```

Target command-line options may override settings supplied by `cc-byok`.

## Switch Models

Select another model and launch again:

```bash
cc-byok use <provider-id> <new-model-id>
cc-byok launch
```

The stored provider key is reused. You do not need to run `provider add` when
only changing models.

## Switch Providers

Configure the destination provider once, then select it with a model:

```bash
cc-byok provider add vercel
cc-byok use vercel <provider/model-id>
cc-byok status
cc-byok launch
```

Switching providers does not delete credentials or configuration for the
previous provider.

## List Providers

```bash
cc-byok provider list
```

The CLI includes OpenRouter, Vercel AI Gateway, and the local Codex-backed AI
Gateway. The local gateway exposes Anthropic Messages for Claude Code and Chat
Completions for OpenCode. Custom Anthropic-compatible gateways can also be
added from the CLI. The active provider is marked in the output.

See [Gateway Providers](gateways.md) for setup commands.

## Run the Local Codex Gateway

The local gateway requires Codex CLI 0.144.4 or newer. Codex account
credentials remain managed by the official Codex CLI.

Authenticate once:

```bash
cc-byok gateway login
# For a terminal without a usable browser callback:
cc-byok gateway login --device-auth
```

Start the gateway in the foreground from the workspace Codex should see:

```bash
cc-byok gateway start
```

The default workspace is the current directory and the default endpoint is
`http://127.0.0.1:3000/v1`. Both can be changed:

```bash
cc-byok gateway start --port 3100 --workspace /path/to/project --verbose
```

The server binds only to `127.0.0.1`. A non-default port is persisted in the
built-in provider configuration. Keep this process running and launch Claude
Code or OpenCode from another terminal:

```bash
cc-byok use ai-gateway codex-latest
cc-byok launch claude
# or:
cc-byok launch opencode
```

Gateway management commands:

```text
cc-byok gateway status
cc-byok gateway key
cc-byok gateway rotate-key
cc-byok gateway logout
```

`gateway status` reports the Codex installation and version, Codex login state,
configured endpoint, key state, and HTTP health. `gateway key` intentionally
prints the bearer key for external SDK configuration. Treat that output like a
password. After rotating a key, restart a currently running gateway and update
all clients.

## How Routing Works

Claude Code receives:

```text
ANTHROPIC_BASE_URL=<selected provider base URL>
ANTHROPIC_AUTH_TOKEN=<stored provider key>
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=<selected model>
```

`ANTHROPIC_API_KEY` is deliberately set to an empty value to prevent Claude Code
from falling back to an Anthropic API key inherited from your shell.

Codex CLI receives:

```text
OPENAI_BASE_URL=<OpenAI-compatible endpoint>
OPENAI_API_KEY=<stored provider key>
OPENAI_MODEL=<selected model>
```

For the `codex` target, `cc-byok` also passes temporary `-c` configuration
overrides for `model`, `model_provider`, provider `base_url`, `env_key`, and
`wire_api="responses"`. The model string is passed through unchanged and the
user's `~/.codex/config.toml` is not modified.

Codex App writes top-level `model`, `model_provider`, and
`model_catalog_json` settings plus a managed `cc_byok` provider block under
`~/.codex/config.toml`. It also writes `cc-byok-models.json` under `~/.codex`.
The managed provider uses a command-backed helper to read the API key from the
OS keychain, so no credential is stored in Codex configuration. The original
Codex config is preserved once as `config.toml.cc-byok.bak`.

OpenRouter and Vercel use protocol-specific endpoints:

| Provider | Anthropic | OpenAI |
|---|---|---|
| OpenRouter | `https://openrouter.ai/api` | `https://openrouter.ai/api/v1` |
| Vercel | `https://ai-gateway.vercel.sh` | `https://ai-gateway.vercel.sh/v1` |
| Local AI Gateway | `http://127.0.0.1:3000` | `http://127.0.0.1:3000/v1` (Chat Completions) |

Custom providers configured through `provider add --base-url` are
Anthropic-compatible only. Launching `codex`, `codex-app`, or `opencode` with
one fails with an explicit compatibility error.

For OpenRouter, Vercel, and custom providers, the target connects directly to
the selected provider. The opt-in `cc-byok gateway start` process is a local
proxy: it accepts authenticated Chat Completions requests and communicates with
the Codex app-server child over stdio. Gateway status and launch preflight also
make loopback health requests.

## Environment Variables

`cc-byok` accepts these optional environment variables:

| Variable | Purpose |
|---|---|
| `CC_BYOK_HOME` | Override the default `~/.cc-byok` config directory |
| `CC_BYOK_DEBUG` | Print full error stacks when enabled (set to any non-empty value) |
| `CODEX_HOME` | Override the default `~/.codex` directory when writing Codex App configuration |

Example:

```bash
CC_BYOK_HOME=/path/to/alt-config cc-byok status
CC_BYOK_DEBUG=1 cc-byok launch
```

## Troubleshooting

### `cc-byok` Is Not Found

Confirm npm's global executable directory is on your `PATH`, or install from the
repository with:

```bash
npm install --global .
```

### Claude Code Is Not Found

Install Claude Code and verify:

```bash
claude --version
```

Then retry:

```bash
cc-byok launch
```

### No Active Model Is Selected

Run:

```bash
cc-byok use <provider-id> <model-id>
```

### API Key Is Missing

Run:

```bash
cc-byok provider add <provider-id>
```

For external built-ins, use `openrouter` or `vercel`. For the local gateway,
use `cc-byok provider add ai-gateway`.

### Local Gateway Is Unavailable

Start it in another terminal from the intended workspace:

```bash
cc-byok gateway status
cc-byok gateway start
```

If startup reports that Codex is missing or too old, install or upgrade Codex
CLI and verify that `codex --version` reports 0.144.4 or newer. If Codex is not
authenticated, run `cc-byok gateway login`.

### Authentication or Model-Not-Found Errors

If Claude Code was previously logged into an Anthropic account:

1. Start `claude` normally.
2. Run `/logout` inside Claude Code.
3. Exit Claude Code.
4. Start it again with `cc-byok launch`.

Cached Anthropic authentication can conflict with `ANTHROPIC_AUTH_TOKEN`.

Also confirm:

- the selected model ID exists on the provider
- the provider key is active
- the account has available credit or budget
- a custom gateway implements Anthropic `/v1/messages`, streaming, and tools

### Inspect Configuration

The non-secret config is safe to inspect:

```bash
cat ~/.cc-byok/config.json
```

On PowerShell:

```powershell
Get-Content "$HOME/.cc-byok/config.json"
```

Do not manually place API keys in this file.
