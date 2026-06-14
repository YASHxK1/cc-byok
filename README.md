# cc-byok

`cc-byok` launches Claude Code through OpenRouter using an API key stored in your
operating system keychain.

It is a configuration wrapper, not an API proxy. Claude Code connects directly to
OpenRouter's Anthropic-compatible endpoint.

## Requirements

- Node.js 20.17 or newer
- Claude Code installed and available as `claude`
- An OpenRouter API key
- A working OS credential store
  - macOS: Keychain
  - Linux: Secret Service through GNOME Keyring, KWallet, or equivalent
  - Windows: Credential Manager (experimental for this release)

## Install

```bash
npm install --global cc-byok
```

Install Claude Code separately using its official instructions:
https://code.claude.com/docs/en/setup

For source installation, platform notes, and setup verification, see
[Installation](docs/installation.md).

For a complete walkthrough from installation to chatting with an OpenRouter
model, see the
[OpenRouter and Claude Code Guide](docs/openrouter-claude-code-guide.md).

## Quick Start

```bash
cc-byok init
cc-byok provider add openrouter
cc-byok use openrouter qwen/qwen3-coder
cc-byok status
cc-byok launch
```

Arguments after `launch` are forwarded to Claude Code:

```bash
cc-byok launch -- --print "Summarize this repository"
```

## Commands

```text
cc-byok init
cc-byok provider add openrouter
cc-byok provider list
cc-byok use <provider> <model-id>
cc-byok status
cc-byok launch [-- <claude arguments...>]
```

See the [Usage Guide](docs/usage.md) for command details and common workflows.

Non-secret configuration is stored in `~/.cc-byok/config.json`. API keys are
stored under service `cc-byok` in the OS keychain and are never written to the
config file.

## How Launching Works

The child `claude` process receives:

```text
ANTHROPIC_BASE_URL=https://openrouter.ai/api
ANTHROPIC_AUTH_TOKEN=<keychain value>
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=<selected model>
```

The rest of your environment and the current working directory are preserved.
Terminal input and output are inherited directly, and `cc-byok` returns Claude
Code's exit code.

## Troubleshooting

### Authentication conflict

If Claude Code was previously logged into an Anthropic account, start Claude Code
normally, run `/logout`, exit, and launch it again through `cc-byok`. OpenRouter
documents cached Anthropic login state as a cause of model-not-found errors.

### Linux keychain unavailable

Install and unlock a Secret Service provider such as GNOME Keyring or KWallet,
then retry `cc-byok provider add openrouter`.

### Model compatibility

Claude Code relies heavily on native tool use. OpenRouter notes that Claude Code
is only guaranteed to work with Anthropic's first-party provider; other model IDs
may connect but behave poorly in coding-agent workflows.

## Security

The API key is read from the OS keychain only when needed and is passed to the
launched process through its environment. `cc-byok` does not log it, write it to
configuration, or make network requests itself.

## Development

```bash
npm install
npm run check
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the repository structure and pull
request guidelines.
