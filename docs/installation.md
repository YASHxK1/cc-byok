# Installation

## Requirements

Before installing `cc-byok`, make sure you have:

- Node.js 20.17 or newer
- the coding agent you want to launch installed on `PATH`
- either a provider API key or a Codex account for the integrated gateway
- an available operating system credential store

The integrated local AI Gateway does not require a separate provider API key.
It requires:

- Codex CLI 0.144.4 or newer on `PATH`
- a Codex account authenticated through `cc-byok gateway login`
- OpenCode or another OpenAI Chat Completions client

Supported provider paths:

- OpenRouter
- Vercel AI Gateway
- the integrated local Codex-backed AI Gateway
- a custom gateway implementing the Anthropic Messages API

Supported credential stores:

| Platform | Credential store | Status |
|---|---|---|
| macOS | Keychain | Supported |
| Linux | Secret Service, such as GNOME Keyring or KWallet | Supported |
| Windows | Credential Manager | Experimental |

Check Node.js and any target commands you plan to use:

```bash
node --version
claude --version
codex --version
opencode --version
```

Only the selected target is required. `codex-app` uses the `codex app`
subcommand supplied by Codex CLI. `cc-byok gateway start` always requires
Codex CLI, even when the gateway client is OpenCode.

## Install From npm

Install the published package globally:

```bash
npm install --global cc-byok
```

Verify the installation:

```bash
cc-byok --version
cc-byok --help
cc-byok gateway --help
```

## Install From Source

Use this method when developing the project, testing an unreleased version, or
installing before the npm package is published.

From the repository root:

```bash
npm install
npm run build
npm install --global .
```

Then verify that the global command is available:

```bash
cc-byok --help
```

To run the compiled CLI without installing it globally:

```bash
node dist/cli.js --help
```

## Linux Credential Store

`cc-byok` uses Secret Service on Linux. A desktop environment commonly provides
this through GNOME Keyring or KWallet.

If `cc-byok provider add <provider>` reports that the keychain is unavailable:

1. Install a Secret Service-compatible keyring for your distribution.
2. Start or unlock the keyring for the current login session.
3. Run the provider command again.

Examples:

```bash
cc-byok provider add openrouter
cc-byok provider add vercel
```

Provider API keys are not stored in `~/.cc-byok/config.json`.

## First-Time Setup

After installation:

```bash
cc-byok init
cc-byok provider list
```

Then configure a provider:

```bash
# OpenRouter
cc-byok provider add openrouter

# Vercel AI Gateway
cc-byok provider add vercel

# Local Codex-backed AI Gateway
cc-byok gateway login
cc-byok provider add ai-gateway
```

`provider add ai-gateway` generates or reuses a local bearer key in the OS
keychain and never prompts for an external API key. Start the gateway with
`cc-byok gateway start`; it runs in the foreground until `Ctrl+C`.

For custom gateway setup, see [Gateway Providers](gateways.md).

## Upgrade

Upgrade a globally installed npm release with:

```bash
npm install --global cc-byok@latest
```

Existing configuration and keychain credentials remain in place.

Run `cc-byok init` once after upgrading from v0.1.x. It migrates the config to
the current format and adds newly available built-in providers without removing
the active model or stored credentials.

## Uninstall

Remove the global command:

```bash
npm uninstall --global cc-byok
```

Uninstalling does not automatically remove:

- non-secret configuration in `~/.cc-byok/`
- provider credentials stored under service `cc-byok` in your operating system
  keychain

The local bearer key uses the `ai-gateway` account under that same keychain
service. Codex account credentials remain owned by the official Codex CLI;
`cc-byok gateway logout` delegates logout to Codex.

Remove those separately only when you no longer need them.
