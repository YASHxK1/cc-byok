# Local AI Gateway Troubleshooting

This guide covers the Codex-backed gateway started with:

```bash
cc-byok gateway start
```

The default endpoints are:

| Client | Base URL |
|---|---|
| Claude Code / Anthropic Messages | `http://127.0.0.1:3000` |
| OpenCode / OpenAI Chat Completions | `http://127.0.0.1:3000/v1` |

The gateway runs in the foreground. Keep its terminal open while using a
client, and stop it with `Ctrl+C`.

## Quick Diagnostic Checklist

Run these commands in order:

```bash
codex --version
cc-byok gateway status
cc-byok status
```

Confirm that:

- Codex CLI is version 0.144.4 or newer.
- Codex login reports `authenticated`.
- The bearer key reports `stored`.
- HTTP health reports `healthy` while the gateway is running.
- The active provider is `ai-gateway`.
- The active model is `codex-latest` or an ID returned by `/v1/models`.

For detailed runtime output, restart the gateway with:

```bash
cc-byok gateway start --verbose
```

## Gateway Is Unavailable

Typical error:

```text
The local AI Gateway is unavailable. Run "cc-byok gateway start" in another terminal.
```

Start the gateway from the project Codex should use as its workspace:

```bash
cd /path/to/project
cc-byok gateway start
```

Keep that terminal running. In a second terminal, launch the client:

```bash
cc-byok launch claude
# or
cc-byok launch opencode
```

If a different port was configured, inspect the persisted endpoint:

```bash
cc-byok gateway status
```

## Codex Is Missing or Too Old

Check the installed version:

```bash
codex --version
```

The gateway requires Codex CLI 0.144.4 or newer. After upgrading, verify that
the `codex` executable found first on `PATH` is the expected installation:

```bash
command -v codex
codex --version
```

## Codex Is Not Authenticated

Log in through the delegated official Codex flow:

```bash
cc-byok gateway login
```

On a remote or headless machine, use:

```bash
cc-byok gateway login --device-auth
```

Then verify:

```bash
cc-byok gateway status
```

To clear the Codex session and authenticate again:

```bash
cc-byok gateway logout
cc-byok gateway login
```

## Provider or API Key Is Missing

Initialize the managed local provider and select a model:

```bash
cc-byok init
cc-byok provider add ai-gateway
cc-byok use ai-gateway codex-latest
```

Unlike external providers, `provider add ai-gateway` does not prompt for an API
key. It generates or reuses a local bearer key in the OS keychain.

## Claude Reports an Incompatible Protocol

Old builds may report:

```text
Target expects the "anthropic" protocol, but provider "ai-gateway" supports only: openai-chat.
```

Rebuild and reinstall the current source version:

```bash
cd /path/to/cc-byok
npm install
npm run build
npm install --global .
```

Restart the gateway and launch Claude again:

```bash
cc-byok gateway start
```

In another terminal:

```bash
cc-byok launch claude
```

## Claude Reports an Invalid Message Role

Old builds may report:

```text
API Error: 400 Invalid option: expected one of "user"|"assistant"
```

Claude Code 2.1.209 can send a `system` entry inside message history in addition
to the top-level system prompt. Current gateway builds support this shape. If
you see this error, rebuild and reinstall the project, stop the previous gateway
process, and start the new build:

```bash
cd /path/to/cc-byok
npm run build
npm install --global .
cc-byok gateway start
```

## Unknown Codex Model

Typical error:

```text
API Error: 400 Unknown Codex model "openai/gpt-5.6-sol".
```

The local gateway accepts native Codex model IDs, not provider-prefixed IDs.
List the models exposed by the running Codex app-server:

```bash
curl -s http://127.0.0.1:3000/v1/models \
  -H "Authorization: Bearer $(cc-byok gateway key)" |
  jq -r '.data[].id'
```

Select an ID exactly as printed. For example:

```bash
cc-byok use ai-gateway gpt-5.6-sol
cc-byok launch claude
```

Do not add an `openai/` prefix unless that exact prefixed value appears in the
model list. Start a new client session after changing models.

To restore automatic Codex model selection:

```bash
cc-byok use ai-gateway codex-latest
```

## Authentication Error or HTTP 401

Every gateway endpoint requires the local bearer key. Display it explicitly
with:

```bash
cc-byok gateway key
```

Treat the output as a password. Configure an external OpenAI-compatible client:

```bash
export OPENAI_BASE_URL=http://127.0.0.1:3000/v1
export OPENAI_API_KEY="$(cc-byok gateway key)"
```

Anthropic-compatible clients may use either:

```text
Authorization: Bearer <key>
```

or:

```text
x-api-key: <key>
```

If the key was rotated, stop and restart the running gateway so it loads the
replacement key, then update every client:

```bash
cc-byok gateway rotate-key
# Stop the existing gateway with Ctrl+C, then:
cc-byok gateway start
```

In the client terminal, load the replacement key with
`cc-byok gateway key`.

## Missing `anthropic-version` Header

Direct calls to `/v1/messages` must include an Anthropic API version:

```bash
curl http://127.0.0.1:3000/v1/messages \
  -H "Authorization: Bearer $(cc-byok gateway key)" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{
    "model": "codex-latest",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

Claude Code supplies this header automatically.

## Port Is Already in Use

Typical startup error:

```text
Could not start gateway on 127.0.0.1:3000
```

Find the process using the port or choose another loopback port:

```bash
cc-byok gateway start --port 3100
```

The selected endpoint is persisted. Confirm it with:

```bash
cc-byok gateway status
```

Do not run two gateway processes against the same port.

## OS Keychain Is Unavailable

On Linux, ensure a Secret Service provider such as GNOME Keyring or KWallet is
installed, running, and unlocked. On macOS, unlock Keychain. On Windows, verify
Credential Manager is available.

Retry after the credential service is available:

```bash
cc-byok provider add ai-gateway
cc-byok gateway status
```

The bearer key must not be placed manually in `~/.cc-byok/config.json`.

## Tool Call Is Unknown, Missing, or Expired

Tool calls are suspended in gateway memory while Claude Code or OpenCode runs
the requested client-side tool. A tool result can fail when:

- its `tool_use_id` or `tool_call_id` does not match the pending call;
- only some results from a parallel tool-call batch are returned;
- more than 10 minutes pass before results are returned;
- the gateway restarts while a tool call is pending.

Start a new client turn after an expired or lost tool session. Do not restart
the gateway while tools are running.

## Streaming Stops or the Codex Runtime Crashes

Run the gateway with verbose logging:

```bash
cc-byok gateway start --verbose
```

The gateway fails in-flight requests when `codex app-server` crashes and does
not replay prompts automatically. It attempts supervised restarts with backoff.
Retry the client request only after `cc-byok gateway status` reports healthy.

## Source Changes Are Not Reflected

The globally installed CLI may still point to an older build. From the project
root, rebuild and reinstall:

```bash
npm run check
npm install --global .
cc-byok gateway --help
```

Stop any gateway process that was started before rebuilding and launch it again.

## Collect Safe Diagnostics

Useful diagnostic output:

```bash
node --version
codex --version
claude --version
cc-byok --version
cc-byok gateway status
cc-byok status
```

Do not share the output of `cc-byok gateway key`, provider keys, OAuth URLs,
authorization headers, full prompts, or tool results. When reporting a problem,
include the command, error text, operating system, versions, and whether the
problem affects Claude Code, OpenCode, or both.
