# Installation

## Requirements

Before installing `cc-byok`, make sure you have:

- Node.js 20.17 or newer
- Claude Code installed and available as `claude`
- an OpenRouter account and API key
- an available operating system credential store

Supported credential stores:

| Platform | Credential store | Status |
|---|---|---|
| macOS | Keychain | Supported |
| Linux | Secret Service, such as GNOME Keyring or KWallet | Supported |
| Windows | Credential Manager | Experimental |

Check your Node.js and Claude Code installations:

```bash
node --version
claude --version
```

Install Claude Code from its
[official setup guide](https://code.claude.com/docs/en/setup) if the second
command is unavailable.

## Install From npm

Once the package has been published, install it globally:

```bash
npm install --global cc-byok
```

Verify the installation:

```bash
cc-byok --version
cc-byok --help
```

## Install From Source

Use this method when developing the project or before the npm package is
published.

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

If `cc-byok provider add openrouter` reports that the keychain is unavailable:

1. Install a Secret Service-compatible keyring for your distribution.
2. Start or unlock the keyring for the current login session.
3. Run `cc-byok provider add openrouter` again.

API keys are not stored in `~/.cc-byok/config.json`.

## Upgrade

Upgrade a globally installed npm release with:

```bash
npm install --global cc-byok@latest
```

Existing configuration and keychain credentials remain in place.

## Uninstall

Remove the global command:

```bash
npm uninstall --global cc-byok
```

Uninstalling does not automatically remove:

- non-secret configuration in `~/.cc-byok/`
- the `cc-byok` credential from your operating system keychain

Remove those separately only when you no longer need them.
