# Gateway Providers

## Built-In Providers

```bash
cc-byok provider add openrouter
cc-byok provider add vercel
```

OpenRouter endpoints:

| Target profile | Base URL |
|---|---|
| Anthropic | `https://openrouter.ai/api` |
| OpenAI | `https://openrouter.ai/api/v1` |

Vercel AI Gateway endpoints:

| Target profile | Base URL |
|---|---|
| Anthropic Messages | `https://ai-gateway.vercel.sh` |
| OpenAI-compatible | `https://ai-gateway.vercel.sh/v1` |

Examples:

```bash
cc-byok launch claude --provider openrouter \
  --model anthropic/claude-sonnet-4.5

cc-byok launch codex --provider vercel \
  --model openai/gpt-4.1

cc-byok launch opencode --provider vercel \
  --model anthropic/claude-sonnet-4
```

Model IDs are passed through unchanged. Availability and agent suitability
depend on the provider and target.

When launching Codex, `cc-byok` injects a temporary Codex model-provider
configuration and selects the model explicitly. Exporting generic `OPENAI_*`
variables alone is insufficient because Codex otherwise continues using the
`model` and `model_provider` from `~/.codex/config.toml`.

## Custom Providers

```bash
cc-byok provider add team-gateway \
  --base-url https://gateway.example.com \
  --display-name "Team Gateway" \
  --type openai-compatible
```

Supported types:

- `anthropic-compatible`
- `openai-compatible`
- `ollama`
- `ai-gateway`
- `custom`

The default is `anthropic-compatible`, preserving configuration created by
earlier releases. Providers declared as `ollama` do not prompt for or store an
API key.

## Compatibility Warnings

`cc-byok` validates the target profile against the provider type before launch.
A known mismatch is blocked because setting different environment variable names
does not translate the underlying API protocol.

Use `--force` only when an external gateway adapter handles translation:

```bash
cc-byok launch claude --provider openai-only \
  --model openai/gpt-4.1 --force
```

Custom/unknown combinations warn and launch. No compatibility check performs a
network request.

Official Vercel references:

- https://vercel.com/docs/ai-gateway/sdks-and-apis/anthropic-messages-api
- https://vercel.com/docs/ai-gateway/sdks-and-apis/openai-chat-completions
