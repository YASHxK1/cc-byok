# Usage

## Setup

```bash
cc-byok init
cc-byok provider add openrouter
cc-byok use openrouter anthropic/claude-sonnet-4.5
cc-byok status
```

Non-secret configuration is stored in `~/.cc-byok/config.json`. Provider keys
are stored in the OS keychain under service `cc-byok`.

## Launch

New configurations use `claude` as the active target:

```bash
cc-byok launch
cc-byok launch claude
```

Select another target and optionally override the active provider and model for
that launch:

```bash
cc-byok launch codex --provider vercel --model openai/gpt-4.1
cc-byok launch opencode --provider openrouter --model qwen/qwen3-coder
cc-byok launch codex-app
```

Overrides do not change the active provider or model. An explicitly selected
target becomes the active target after its process exits.

Pass target arguments after `--`:

```bash
cc-byok launch claude -- --print "Summarize this repository"
cc-byok launch codex -- --help
```

The backward-compatible default target form remains valid:

```bash
cc-byok launch -- --print "Summarize this repository"
```

## Manage Targets

```bash
cc-byok targets list
cc-byok targets inspect opencode
cc-byok targets add
cc-byok targets remove my-agent
```

The add flow asks for:

- target ID, display name, command, and description
- Anthropic, OpenAI, Ollama, or custom environment profile
- custom base URL, API key, and model variable names when applicable

Custom targets cannot use a built-in ID. Removing the active custom target
restores `claude` as the active target.

## Environment Profiles

Anthropic targets receive:

```text
ANTHROPIC_BASE_URL=<resolved endpoint>
ANTHROPIC_AUTH_TOKEN=<keychain value>
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=<model>
```

OpenAI targets receive:

```text
OPENAI_BASE_URL=<resolved endpoint>
OPENAI_API_KEY=<keychain value>
OPENAI_MODEL=<model>
```

Ollama targets receive:

```text
OLLAMA_HOST=<provider base URL>
MODEL=<model>
```

Custom targets receive only their configured mappings. Credentials are loaded
only when the profile maps an API-key variable.

## Compatibility

Known provider/profile mismatches are blocked because `cc-byok` does not
translate requests. Use `--force` when a separately installed adapter makes the
combination valid:

```bash
cc-byok launch claude --provider my-openai-gateway \
  --model openai/gpt-4.1 --force
```

Unknown custom combinations produce a warning and continue.

## Target Configuration Precedence

`cc-byok` supplies provider settings through environment variables. A target
application may prioritize command-line flags, project configuration, or its own
credential store over those variables. Consult the target's documentation when
the selected model or endpoint is not honored.

Codex requires more than `OPENAI_BASE_URL` and `OPENAI_MODEL`. For the `codex`
and `codex-app` targets, `cc-byok` passes per-process `-c` overrides that select
the requested model and define a temporary `cc_byok` model provider using the
selected endpoint, `OPENAI_API_KEY`, and the Responses API. The user's
`~/.codex/config.toml` is not modified.
