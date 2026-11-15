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
- an OpenAI Chat Completions client for gateway chat use

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
```

Only the selected target is required. `chatgpt-app` uses the `chatgpt`
launcher supplied by the ChatGPT desktop app. `cc-byok gateway start` always
requires Codex CLI.

## Install From npm

### One-command installer (Linux and macOS)

Run the installer from the repository's `main` branch:

```bash
curl -fsSL https://raw.githubusercontent.com/YASHxK1/cc-byok/main/scripts/install.sh | bash
```

It checks the operating system, architecture, Node.js, and npm; installs the
latest published `cc-byok` package globally through npm; verifies the
executable; and runs `cc-byok init`. It never uses `sudo` or downloads an
executable binary outside npm. Re-running the command upgrades to the latest
release and initializes the configuration if needed. Existing configuration
and operating-system keychain credentials are preserved.

The installer requires:

- Linux or macOS on x86_64/amd64 or arm64/aarch64
- Node.js 20.17 or newer
- npm and curl

The coding agent and credential store are only needed when you configure and
use a provider. On Linux, provider credentials require a Secret
Service-compatible store, such as GNOME Keyring or KWallet.

After it finishes, configure a provider and model:

```bash
cc-byok provider add openrouter
cc-byok use openrouter qwen/qwen3-coder
cc-byok status
```

`provider add` prompts for the provider API key and stores it in the operating
system keychain; the installer does not read or print credentials.

### Install From npm

For a manual installation or platforms not supported by the shell installer:

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

Re-run the one-command installer to install the latest release and initialize
without removing existing configuration:

```bash
curl -fsSL https://raw.githubusercontent.com/YASHxK1/cc-byok/main/scripts/install.sh | bash
```

Or upgrade a globally installed npm release manually:

```bash
npm install --global cc-byok@latest
```

Existing configuration and keychain credentials remain in place.

Run `cc-byok init` once after upgrading from v0.1.x. It migrates the config to
the current format and adds newly available built-in providers without removing
the active model or stored credentials.

## Uninstall

Remove the globally installed package:

```bash
npm uninstall --global cc-byok
```

This works whether the package was installed with the one-command installer or
directly through npm. Uninstalling does not remove user configuration or
keychain credentials.

Uninstalling does not automatically remove:

- non-secret configuration in `~/.cc-byok/`
- provider credentials stored under service `cc-byok` in your operating system
  keychain

The local bearer key uses the `ai-gateway` account under that same keychain
service. Codex account credentials remain owned by the official Codex CLI;
`cc-byok gateway logout` delegates logout to Codex.

Remove those separately only when you no longer need them.

## Troubleshooting

- **Node.js is too old:** install Node.js 20.17 or newer, then rerun the
  installer. The installer does not change your Node.js installation.
- **npm global installation fails or reports permissions:** the installer
  intentionally never uses `sudo`. Use a Node version manager or configure npm
  with a user-owned global prefix, then rerun it.
- **`cc-byok` is not found in a new terminal:** add the global npm `bin`
  directory printed by the installer to your shell's `PATH`, then start a new
  terminal. You can locate the npm prefix with `npm config get prefix`; on
  Linux and macOS its executable directory is typically `<prefix>/bin`.
- **Provider credentials cannot be saved on Linux:** install and unlock a
  Secret Service-compatible keyring for your desktop session.
- **Initialization reports an invalid configuration:** the installer does not
  delete or replace it. Follow the CLI error to inspect or repair the existing
  `~/.cc-byok/config.json`; provider credentials remain in the OS keychain.
