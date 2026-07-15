# Gateway Providers

For error diagnosis and recovery steps, see
[Local AI Gateway Troubleshooting](gateway-troubleshooting.md).

This guide describes the current built-in and custom gateway behavior.

`cc-byok` supports three built-in providers and user-defined gateways:

| Provider ID | Anthropic endpoint | OpenAI endpoint |
|---|---|---|
| `openrouter` | `https://openrouter.ai/api` | `https://openrouter.ai/api/v1` |
| `vercel` | `https://ai-gateway.vercel.sh` | `https://ai-gateway.vercel.sh/v1` |
| `ai-gateway` | `http://127.0.0.1:3000` | `http://127.0.0.1:3000/v1` (Chat Completions) |

Custom gateways must implement the Anthropic Messages API, including
`POST /v1/messages`, streaming, and tool calls. An OpenAI-compatible endpoint by
itself is not sufficient for Claude Code.

Run `cc-byok init` before following either workflow:

```bash
cc-byok init
cc-byok provider list
```

## Local Codex-backed AI Gateway

The integrated AI Gateway exposes Codex through an authenticated,
OpenAI-compatible Chat Completions API. It requires Codex CLI 0.144.4 or newer.
Initialize the provider and authenticate Codex:

```bash
cc-byok provider add ai-gateway
cc-byok gateway login
```

Start it from the workspace Codex should treat as its working directory:

```bash
cc-byok gateway start
```

In another terminal, select it and launch Claude Code or OpenCode:

```bash
cc-byok use ai-gateway codex-latest
cc-byok launch claude
# or:
cc-byok launch opencode
```

The default endpoint is `http://127.0.0.1:3000/v1`. `gateway start --port`
persists a different loopback endpoint. `provider add ai-gateway` creates or
reuses the managed key without prompting. Use `gateway key` to configure an
external SDK and `gateway rotate-key` to invalidate the current key.

This provider supports the Anthropic Messages API used by `claude` and OpenAI
Chat Completions used by `opencode`. It remains incompatible with `codex` and
`codex-app`, which require the OpenAI Responses API. Compatibility is checked
before launch.

`gateway start` runs in the foreground until `Ctrl+C`. It accepts `--port`,
`--workspace`, and `--verbose`. Use `gateway login --device-auth` for the
device-code flow and `gateway logout` to delegate logout to Codex. Codex account
credentials are never copied into `cc-byok` storage.

### HTTP API

Every endpoint requires the local bearer key:

```text
Authorization: Bearer <gateway-key>
```

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/v1/messages` | Anthropic text, SSE streaming, tools, and tool results |
| `POST` | `/v1/chat/completions` | Text, SSE streaming, and OpenAI function tools |
| `GET` | `/v1/models` | Codex model catalog plus `codex-latest` |
| `GET` | `/v1/status` | Runtime, Codex version, uptime, and active requests |

Configure an external OpenAI-compatible client with:

```bash
export OPENAI_BASE_URL=http://127.0.0.1:3000/v1
export OPENAI_API_KEY="$(cc-byok gateway key)"
```

The gateway creates ephemeral read-only Codex threads. Native Codex command or
file escalation is not approved; functions supplied by the client are returned
as OpenAI `tool_calls`, and the client sends matching `tool` results in a later
Chat Completions request.

### Gateway Status and Keys

```bash
cc-byok gateway status
cc-byok gateway key
cc-byok gateway rotate-key
```

`gateway key` intentionally prints the secret. After `rotate-key`, update
clients and restart a gateway process that was already running so it loads the
replacement key.

## Vercel AI Gateway

Vercel AI Gateway exposes an Anthropic Messages endpoint that works with Claude
Code.

### 1. Create an API Key

In the Vercel dashboard:

1. Open AI Gateway.
2. Open API Keys.
3. Create an AI Gateway API key.
4. Keep the key available for the secure CLI prompt.

Vercel's setup documentation:

https://vercel.com/docs/ai-gateway/authentication-and-byok/authentication

### 2. Store the Key

```bash
cc-byok provider add vercel
```

Paste the Vercel AI Gateway key into the hidden prompt.

### 3. Select a Gateway Model

Vercel model IDs use `provider/model` format. Confirm current IDs in Vercel's
model catalog before selecting one.

```bash
cc-byok use vercel anthropic/claude-sonnet-4.6
```

Model availability changes over time. The example above reflects Vercel's
documented format, not a permanent compatibility guarantee.

### 4. Launch Claude Code

```bash
cc-byok status
cc-byok launch
```

The child process receives:

```text
ANTHROPIC_BASE_URL=https://ai-gateway.vercel.sh
ANTHROPIC_AUTH_TOKEN=<stored Vercel AI Gateway key>
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=<selected model>
```

Official Vercel Claude Code instructions:

https://vercel.com/docs/ai-gateway/sdks-and-apis/anthropic-messages-api

### Launch Codex App

Codex and Codex App use Vercel's OpenAI Responses endpoint:

```bash
cc-byok launch codex-app \
  --provider vercel \
  --model deepseek/deepseek-v4-pro
```

Codex Desktop receives persistent configuration equivalent to:

```toml
model = "deepseek/deepseek-v4-pro"
model_provider = "cc_byok"
model_catalog_json = "~/.codex/cc-byok-models.json"

[model_providers.cc_byok]
name = "Vercel AI Gateway"
base_url = "https://ai-gateway.vercel.sh/v1"
wire_api = "responses"

[model_providers.cc_byok.auth]
command = "<node executable>"
args = ["<cc-byok credential helper>", "vercel"]
```

The model ID is not rewritten or special-cased. `cc-byok` also writes
`~/.codex/cc-byok-models.json` so Desktop displays the gateway model as a
custom model. The authentication helper reads the key from the OS keychain; the
key is not written to disk. The pre-existing Codex config is backed up once as
`~/.codex/config.toml.cc-byok.bak`.

## Custom Gateway

Add a custom gateway entirely through the CLI:

```bash
cc-byok provider add team-gateway \
  --base-url https://gateway.example.com \
  --display-name "Team Gateway"
```

On PowerShell, the same command can be written on one line:

```powershell
cc-byok provider add team-gateway --base-url https://gateway.example.com --display-name "Team Gateway"
```

The provider ID:

- must contain lowercase letters, numbers, and hyphens
- identifies the keychain credential
- is used by `cc-byok use`

The display name is optional. If omitted, the provider ID is displayed.

The trailing slash in a supplied base URL is removed before it is stored.

After entering the gateway API key, select a model:

```bash
cc-byok use team-gateway provider/model-id
cc-byok status
cc-byok launch
```

## Update a Custom Gateway

Run `provider add` again with the same ID:

```bash
cc-byok provider add team-gateway \
  --base-url https://new-gateway.example.com \
  --display-name "Team Gateway"
```

The CLI asks before replacing the stored API key.

The current release does not include a provider removal command. Custom provider
configuration can be removed manually from `~/.cc-byok/config.json`, but remove
keychain credentials separately through your operating system's credential
manager.

## Compatibility Requirements

A custom gateway must accept Claude Code's Anthropic Messages requests at:

```text
<base-url>/v1/messages
```

It should support:

- streaming responses
- Anthropic tool definitions and tool-use blocks
- tool results
- system prompts
- Anthropic stop reasons and errors
- the model IDs supplied through `ANTHROPIC_MODEL`

Custom gateways configured by this release are available only to the `claude`
target. `cc-byok` does not translate Anthropic requests into OpenAI requests
and does not validate a gateway over the network.

## Troubleshooting

### Custom Provider Requires `--base-url`

The first time you add a custom provider ID, include its endpoint:

```bash
cc-byok provider add my-gateway --base-url https://gateway.example.com
```

### Gateway Accepts OpenAI Requests Only

An endpoint exposing only `/v1/chat/completions` or `/v1/responses` cannot be
used directly. Add an Anthropic-compatible translation layer before using it
with `cc-byok`.

### Model Is Rejected

`cc-byok` passes the model ID through unchanged. Check the gateway's model
catalog and use the exact supported ID:

```bash
cc-byok use <provider-id> <exact-model-id>
```

### Codex Login or Version Error

```bash
codex --version
cc-byok gateway status
cc-byok gateway login
```

The gateway rejects missing Codex installations and versions older than
0.144.4 with an upgrade-oriented error.

### Port Is Already in Use

Choose another loopback port and update clients to the persisted endpoint:

```bash
cc-byok gateway start --port 3100
```
