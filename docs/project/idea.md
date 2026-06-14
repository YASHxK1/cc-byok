> Historical document: this is the original product exploration and does not
> fully describe current v0.2.0 behavior. See [../usage.md](../usage.md) and
> [../gateways.md](../gateways.md).

Yes. Your idea should be structured as a **CLI-based model router for Claude Code**, not as a replacement for Claude Code.

The CLI’s job is to sit between the user and Claude Code, configure the right provider/model, optionally start a local gateway, and then launch Claude Code with the correct environment variables. Claude Code already supports request routing/model configuration through environment variables like `ANTHROPIC_BASE_URL`, `ANTHROPIC_AUTH_TOKEN`, and `ANTHROPIC_MODEL`; Anthropic’s docs also describe gateway usage for routing Claude Code traffic. ([Claude Code][1])

## Core idea

Build a CLI like:

```bash
cc-router use openrouter anthropic/claude-sonnet-4.5
cc-router use openrouter openai/gpt-4.1
cc-router use ollama qwen2.5-coder:32b
cc-router launch
```

Internally, it does this:

```text
User
  ↓
cc-router CLI
  ↓ sets env / starts gateway / selects model
Claude Code
  ↓ Anthropic-compatible API request
Provider / Gateway / Local model
```

Your product should **not** try to rewrite Claude Code. It should manage routing, provider keys, model presets, and launch behavior.

## MVP structure

### 1. CLI commands

Start with a small command surface:

```bash
cc-router init
cc-router provider add openrouter
cc-router provider add ollama
cc-router model list
cc-router use openrouter qwen/qwen3-coder
cc-router launch
cc-router status
```

Later:

```bash
cc-router cost
cc-router doctor
cc-router config
cc-router benchmark
cc-router fallback set openrouter/deepseek/deepseek-chat
```

Minimum useful commands:

| Command        | Purpose                                    |
| -------------- | ------------------------------------------ |
| `init`         | Create config directory and default config |
| `provider add` | Store provider credentials                 |
| `use`          | Select provider + model                    |
| `launch`       | Start Claude Code with correct env vars    |
| `status`       | Show active provider/model/base URL        |
| `doctor`       | Validate Claude Code, keys, model, gateway |

## 2. Configuration layout

Use a local config directory:

```text
~/.cc-router/
  config.json
  providers.json
  models.json
  logs/
```

Example config:

```json
{
  "activeProvider": "openrouter",
  "activeModel": "qwen/qwen3-coder",
  "launchMode": "env",
  "claudeCommand": "claude",
  "gateway": {
    "enabled": false,
    "port": 4000
  }
}
```

Provider config:

```json
{
  "openrouter": {
    "type": "anthropic-compatible",
    "baseUrl": "https://openrouter.ai/api",
    "authEnv": "ANTHROPIC_AUTH_TOKEN"
  },
  "ollama": {
    "type": "local-gateway",
    "baseUrl": "http://localhost:11434",
    "requiresGateway": true
  },
  "litellm": {
    "type": "gateway",
    "baseUrl": "http://localhost:4000"
  }
}
```

Do **not** store raw API keys in plain JSON. Use OS keychain if possible:

* macOS: Keychain
* Windows: Credential Manager
* Linux: Secret Service / libsecret
* fallback: encrypted local file

## 3. Routing modes

You need three routing modes.

### Mode A: Direct Anthropic-compatible provider

Use this when the provider already speaks Anthropic-style API.

Example:

```bash
ANTHROPIC_BASE_URL=https://openrouter.ai/api
ANTHROPIC_AUTH_TOKEN=sk-or-...
ANTHROPIC_MODEL=qwen/qwen3-coder
claude
```

OpenRouter’s Claude Code setup uses its Anthropic-compatible endpoint, so this can work without your own gateway for supported models.

### Mode B: Gateway mode

Use this when the provider is OpenAI-compatible but not Anthropic-compatible.

```text
Claude Code
  ↓ Anthropic Messages format
cc-router gateway
  ↓ OpenAI Chat Completions / Responses format
OpenAI / Groq / Together / DeepSeek / etc.
```

This is the most important mode if you want “any model.”

### Mode C: Local model mode

Use this for Ollama, LM Studio, llama.cpp, vLLM.

```text
Claude Code
  ↓ Anthropic format
local gateway
  ↓ Ollama/OpenAI-compatible local endpoint
local model
```

Ollama has its own Claude Code integration now, but your router can still wrap it for a better UX.

## 4. Internal modules

A clean project structure:

```text
cc-router/
  src/
    cli/
      index.ts
      commands/
        init.ts
        provider.ts
        use.ts
        launch.ts
        status.ts
        doctor.ts

    core/
      config.ts
      keychain.ts
      provider-registry.ts
      model-registry.ts
      launcher.ts
      env-builder.ts

    gateway/
      server.ts
      anthropic-to-openai.ts
      openai-to-anthropic.ts
      stream-adapter.ts
      tool-adapter.ts

    providers/
      openrouter.ts
      ollama.ts
      litellm.ts
      openai.ts
      deepseek.ts
      groq.ts
      together.ts

    utils/
      logger.ts
      shell.ts
      validation.ts
```

Use **TypeScript + Node.js** for the CLI if you want easy npm distribution. Use **Go** if you want a single binary and simpler installation. For this type of developer tool, Go is probably better long term, but TypeScript is faster for MVP.

## 5. What the router must handle

Claude Code is not just simple chat. The router needs to preserve:

* Streaming responses
* Tool-use calls
* Tool results
* System prompts
* Long context
* Stop reasons
* Error mapping
* Rate-limit handling
* Model capability warnings

The hardest part is **tool calling translation**. Many models claim tool support but behave badly in an agent loop. Your CLI should warn users when a model is weak for Claude Code.

Example:

```bash
cc-router use openrouter mistral/small
```

Output:

```text
Warning: this model may have weak tool-calling reliability.
Recommended for chat, not full Claude Code agent workflows.
```

## 6. MVP scope

Do not overbuild the first version.

### MVP v0.1

Support:

* OpenRouter
* Ollama
* LiteLLM-compatible gateway
* `init`
* `provider add`
* `use`
* `launch`
* `status`
* `doctor`

No custom gateway yet. Just manage env vars and launch Claude Code.

That gives you a real usable product quickly.

### v0.2

Add:

* model registry
* per-project config
* fallback model
* cost display
* shell completion
* `.env` import/export

### v0.3

Add your own gateway:

* Anthropic `/v1/messages` compatibility
* OpenAI-compatible provider adapter
* streaming support
* basic tool-call translation

### v1.0

Add:

* UI dashboard
* team config
* usage analytics
* provider health checks
* routing rules
* model benchmarking
* compatibility scoring

## 7. Ideal user experience

The CLI should feel like this:

```bash
cc-router init
```

```text
Detected Claude Code: installed
Detected Ollama: installed
Detected OpenRouter: not configured

Choose default provider:
1. OpenRouter
2. Ollama
3. LiteLLM
```

Then:

```bash
cc-router provider add openrouter
```

```text
OpenRouter API key saved securely.
```

Then:

```bash
cc-router use openrouter qwen/qwen3-coder
```

```text
Active model set:
Provider: OpenRouter
Model: qwen/qwen3-coder
Mode: direct Anthropic-compatible
```

Then:

```bash
cc-router launch
```

```text
Launching Claude Code through OpenRouter...
```

Internally it launches:

```bash
ANTHROPIC_BASE_URL=https://openrouter.ai/api \
ANTHROPIC_AUTH_TOKEN=... \
ANTHROPIC_MODEL=qwen/qwen3-coder \
claude
```

## 8. Best positioning

The clean positioning is:

> **A BYOK model router for Claude Code. Use OpenRouter, Ollama, LiteLLM, or your own gateway models from one CLI.**

Avoid saying “run any model in Claude Code” without qualification. More accurate:

> **Run Claude Code through any compatible model provider or gateway.**

That matters because some models will technically connect but fail at tool-heavy agentic coding.

## Final recommended architecture

Build it in two layers:

```text
Layer 1: CLI Wrapper
- provider config
- secure key storage
- model selection
- Claude Code launch
- env var management

Layer 2: Optional Gateway
- Anthropic-compatible endpoint
- OpenAI/Ollama/provider adapters
- streaming
- tool-call translation
- usage logging
```

Start with **Layer 1 only**. That gives you a useful product fast. Add Layer 2 only after users actually need providers that do not already support Claude Code-compatible routing.

[1]: https://code.claude.com/docs/en/env-vars?utm_source=chatgpt.com "Environment variables - Claude Code Docs"
