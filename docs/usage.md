# Usage

## Initial Setup

### 1. Initialize Configuration

```bash
cc-byok init
```

This creates:

```text
~/.cc-byok/config.json
```

The file contains the OpenRouter base URL and active model selection. It never
contains your API key.

Running `init` again leaves an existing valid configuration unchanged.

### 2. Store an OpenRouter API Key

Create an API key in your OpenRouter account, then run:

```bash
cc-byok provider add openrouter
```

The prompt hides the key while you type. The key is stored under service
`cc-byok` in your operating system keychain.

Running the command when a key already exists asks for confirmation before
replacing it.

### 3. Select a Model

```bash
cc-byok use openrouter <model-id>
```

Example:

```bash
cc-byok use openrouter qwen/qwen3-coder
```

Use the exact model ID listed by OpenRouter. Selecting a model updates only the
non-secret config file and does not make a network request.

Claude Code depends heavily on reliable tool calling. A model may be available
through OpenRouter but still perform poorly in coding-agent workflows.

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
cc-byok use openrouter anthropic/claude-sonnet-4
cc-byok launch
```

The stored OpenRouter key is reused. You do not need to run `provider add` when
only changing models.

## List Providers

```bash
cc-byok provider list
```

The MVP includes OpenRouter only. The active provider is marked in the output.

## How Routing Works

The launched Claude Code process receives:

```text
ANTHROPIC_BASE_URL=https://openrouter.ai/api
ANTHROPIC_AUTH_TOKEN=<stored OpenRouter key>
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=<selected model>
```

`ANTHROPIC_API_KEY` is deliberately set to an empty value to prevent Claude Code
from falling back to an Anthropic API key inherited from your shell.

`cc-byok` does not run a proxy and does not send network requests itself. Claude
Code connects directly to OpenRouter.

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
cc-byok use openrouter <model-id>
```

### API Key Is Missing

Run:

```bash
cc-byok provider add openrouter
```

### Authentication or Model-Not-Found Errors

If Claude Code was previously logged into an Anthropic account:

1. Start `claude` normally.
2. Run `/logout` inside Claude Code.
3. Exit Claude Code.
4. Start it again with `cc-byok launch`.

Cached Anthropic authentication can conflict with `ANTHROPIC_AUTH_TOKEN`.

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
