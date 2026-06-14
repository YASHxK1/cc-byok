# cc-byok Documentation

These guides document `cc-byok` v0.2.0.

`cc-byok` launches Claude Code, Codex, Codex App, and OpenCode through BYOK
providers and compatible gateways. Provider API keys are stored in your
operating system keychain.

## Guides

- [Usage](usage.md): provider-neutral setup, target launching, model selection,
  switching providers, and troubleshooting
- [Gateway Providers](gateways.md): Vercel AI Gateway and custom
  Anthropic-compatible gateway setup
- [OpenRouter and Claude Code Step-by-Step](openrouter-claude-code-guide.md):
  complete OpenRouter walkthrough from installation to chatting with a model
- [Installation](installation.md): requirements, npm and source installation,
  upgrades, and uninstalling

## Project Documents

The following documents preserve the original v0.1 product and implementation
planning. They are historical and may not describe current v0.2.0 behavior.

- [Product requirements](project/prd.md)
- [Original product idea](project/idea.md)
- [Build plan](project/BUILD_PLAN.md)

## Quick Start

After installing `cc-byok`, run:

```bash
cc-byok init
cc-byok provider add openrouter
cc-byok use openrouter qwen/qwen3-coder
cc-byok status
cc-byok launch
```

For Vercel AI Gateway:

```bash
cc-byok provider add vercel
cc-byok launch codex-app --provider vercel --model deepseek/deepseek-v4-pro
```

The selected target command must already be installed on `PATH`.
