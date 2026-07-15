# cc-byok Documentation

These guides document the current `cc-byok` source tree.

`cc-byok` launches Claude Code, Codex, Codex App, and OpenCode through BYOK
providers and compatible gateways. It also includes an authenticated,
loopback-only Codex-backed OpenAI Chat Completions gateway. Provider keys and
the local gateway bearer key are stored in your operating system keychain.

## Guides

- [Usage](usage.md): provider-neutral setup, target launching, model selection,
  switching providers, and troubleshooting
- [Changelog](changelog.md): release notes and compatibility notes for recent
  versions
- [Gateway Providers](gateways.md): integrated local Codex gateway, Vercel AI
  Gateway, and custom gateways
- [Local Gateway Troubleshooting](gateway-troubleshooting.md): authentication,
  startup, model, protocol, keychain, streaming, and tool-call errors
- [OpenRouter and Claude Code Step-by-Step](openrouter-claude-code-guide.md):
  complete OpenRouter walkthrough from installation to chatting with a model
- [Installation](installation.md): requirements, npm and source installation,
  upgrades, and uninstalling

## Quick Start

After installing `cc-byok`, run:

```bash
cc-byok init
cc-byok provider add openrouter
cc-byok use openrouter qwen/qwen3-coder
cc-byok status
cc-byok launch
```

Use `cc-byok target list` to see the supported launch targets and whether
delegated restore is available for each one.

For Vercel AI Gateway:

```bash
cc-byok provider add vercel
cc-byok launch codex-app --provider vercel --model deepseek/deepseek-v4-pro
```

For the local Codex-backed AI Gateway:

```bash
cc-byok gateway login
cc-byok provider add ai-gateway
cc-byok use ai-gateway codex-latest
cc-byok gateway start
```

Keep the foreground gateway running. In another terminal:

```bash
cc-byok launch claude --provider ai-gateway --model codex-latest
# or:
cc-byok launch opencode --provider ai-gateway --model codex-latest
```

The selected target command must already be installed on `PATH`. The local
gateway additionally requires Codex CLI 0.144.4 or newer.
