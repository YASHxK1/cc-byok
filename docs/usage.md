# Usage

This guide describes the provider-neutral workflow for `cc-byok` v0.2.0.

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
```

For a custom Anthropic-compatible gateway:

```bash
cc-byok provider add team-gateway \
  --base-url https://gateway.example.com \
  --display-name "Team Gateway"
```

The prompt hides the provider key while you type. The key is stored under
service `cc-byok`, using the provider ID as its account, in your operating
system keychain.

Running the command when a key already exists asks for confirmation before
replacing it.

### 3. Select a Model

```bash
cc-byok use <provider-id> <model-id>
```

Examples:

```bash
cc-byok use openrouter qwen/qwen3-coder
cc-byok use vercel <provider/model-id>
cc-byok use team-gateway <provider/model-id>
```

Use the exact model ID accepted by the selected provider. Selecting a model
updates only the non-secret config file and does not make a network request.

Claude Code depends heavily on reliable tool calling. A model may be available
through a provider but still perform poorly in coding-agent workflows.

### 4. Check Status

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

### 5. Launch Claude Code

Run this command from the project directory where you want Claude Code to work:

```bash
cc-byok launch
```

`cc-byok` launches `claude` in the current directory with terminal input and
output attached directly.

## Forward Claude Code Arguments

Place Claude Code arguments after `--`:

```bash
cc-byok launch -- --print "Summarize this repository"
```

Another example:

```bash
cc-byok launch -- --model qwen/qwen3-coder
```

Claude Code command-line options can override environment-based settings. In
particular, `--model` overrides the model selected with `cc-byok use` for that
session.

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

The CLI includes OpenRouter and Vercel AI Gateway. Custom Anthropic-compatible
gateways can also be added from the CLI. The active provider is marked in the
output.

See [Gateway Providers](gateways.md) for setup commands.

## How Routing Works

The launched Claude Code process receives:

```text
ANTHROPIC_BASE_URL=<selected provider base URL>
ANTHROPIC_AUTH_TOKEN=<stored provider key>
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=<selected model>
```

`ANTHROPIC_API_KEY` is deliberately set to an empty value to prevent Claude Code
from falling back to an Anthropic API key inherited from your shell.

`cc-byok` does not run a proxy and does not send network requests itself. Claude
Code connects directly to the selected provider or gateway.

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

For built-ins, use `openrouter` or `vercel`.

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
