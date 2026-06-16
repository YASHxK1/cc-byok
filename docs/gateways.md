# Gateway Providers

This guide applies to `cc-byok` v0.3.2 and newer.

`cc-byok` supports two built-in providers and user-defined gateways:

| Provider ID | Anthropic endpoint | OpenAI endpoint |
|---|---|---|
| `openrouter` | `https://openrouter.ai/api` | `https://openrouter.ai/api/v1` |
| `vercel` | `https://ai-gateway.vercel.sh` | `https://ai-gateway.vercel.sh/v1` |

Custom gateways must implement the Anthropic Messages API, including
`POST /v1/messages`, streaming, and tool calls. An OpenAI-compatible endpoint by
itself is not sufficient for Claude Code.

Run `cc-byok init` before following either workflow:

```bash
cc-byok init
cc-byok provider list
```

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
