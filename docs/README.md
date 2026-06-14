# cc-byok Documentation

`cc-byok` is a CLI wrapper that launches Claude Code through OpenRouter with an
API key stored in your operating system keychain.

## Guides

- [OpenRouter and Claude Code Step-by-Step](openrouter-claude-code-guide.md):
  complete walkthrough from installation to chatting with a model
- [Installation](installation.md): requirements, npm and source installation,
  upgrades, and uninstalling
- [Usage](usage.md): initial setup, model selection, launching Claude Code, and
  troubleshooting

## Project Documents

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

Claude Code must already be installed and available as the `claude` command.
