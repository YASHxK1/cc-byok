# Use OpenRouter Models in Claude Code

This guide explains how to install `cc-byok`, add an OpenRouter API key, select
an OpenRouter model, and chat with that model through Claude Code.

This guide is specifically for OpenRouter. For Vercel AI Gateway or a custom
gateway, see [Gateway Providers](gateways.md).

## 1. Install the Requirements

You need:

- Node.js 20.17 or newer
- Claude Code
- an OpenRouter account
- this `cc-byok` repository

Check Node.js:

```powershell
node --version
```

Install Claude Code by following its official setup guide:

https://code.claude.com/docs/en/setup

Verify that Claude Code is installed:

```powershell
claude --version
```

## 2. Install cc-byok

The package is not published to npm yet, so install it from the local repository.

Open PowerShell in the repository:

```powershell
cd E:\cc-byok
```

Install dependencies and build the tool:

```powershell
npm install
npm run build
```

Install the CLI globally:

```powershell
npm install --global .
```

Do not run `npm install --global cc-byok` yet. That command installs from the npm
registry, where this package has not been published.

Verify the local installation:

```powershell
cc-byok --version
cc-byok --help
```

## 3. Create an OpenRouter API Key

1. Open https://openrouter.ai/
2. Sign in or create an account.
3. Add credits if the model you want to use is paid.
4. Open the API Keys page.
5. Create a new API key.
6. Keep the key available for the next step.

Treat the API key like a password. Do not put it in source code, Git, `.env`
files, screenshots, or chat messages.

## 4. Initialize cc-byok

Run:

```powershell
cc-byok init
```

This creates the non-secret configuration file:

```text
%USERPROFILE%\.cc-byok\config.json
```

The file stores built-in and custom provider definitions plus the active
provider and model. It does not store API keys.

## 5. Add the OpenRouter API Key

Run:

```powershell
cc-byok provider add openrouter
```

When prompted:

1. Paste your OpenRouter API key.
2. Press Enter.

The input is hidden. `cc-byok` stores the key in Windows Credential Manager
instead of the config file.

If a key is already stored, the CLI asks whether you want to replace it.

## 6. Find an OpenRouter Model ID

Open the OpenRouter models page:

https://openrouter.ai/models

Choose a model with reliable tool-use support because Claude Code needs tools to
read files, edit code, and run terminal commands.

Copy the exact OpenRouter model ID. Example IDs may look like:

```text
qwen/qwen3-coder
anthropic/claude-sonnet-4
```

Model availability and IDs can change, so confirm the current ID on OpenRouter
before selecting it.

## 7. Select the Model

Use the model ID with this command:

```powershell
cc-byok use openrouter <model-id>
```

Example:

```powershell
cc-byok use openrouter qwen/qwen3-coder
```

The selected model becomes the default for future `cc-byok launch` sessions.

## 8. Confirm the Configuration

Run:

```powershell
cc-byok status
```

You should see:

- OpenRouter as the active provider
- your selected model
- `https://openrouter.ai/api` as the base URL
- `stored` as the API-key status

The API-key value is never displayed.

You can also list configured providers:

```powershell
cc-byok provider list
```

The list includes the built-in OpenRouter and Vercel AI Gateway entries, plus
any custom gateways you have added.

## 9. Start Claude Code

Move to the project you want Claude Code to work on:

```powershell
cd C:\path\to\your\project
```

Launch Claude Code through OpenRouter:

```powershell
cc-byok launch
```

`cc-byok` starts Claude Code in the current directory and routes its requests to
the selected OpenRouter model.

## 10. Chat With the Model

After Claude Code opens, type a prompt and press Enter.

For example:

```text
Explain the structure of this project.
```

You can then continue the conversation:

```text
Find the main entry point and explain how it works.
```

For a coding task:

```text
Add validation to the login form and run the relevant tests.
```

Claude Code may ask for permission before reading files, editing files, or
running commands. Review each requested action before approving it.

Exit Claude Code with:

```text
/exit
```

You can also use `Ctrl+C` when appropriate.

## 11. Send a One-Time Prompt

Use Claude Code's print mode to send one prompt without opening an interactive
chat:

```powershell
cc-byok launch -- --print "Summarize this repository"
```

Arguments after `--` are passed directly to Claude Code.

## 12. Switch to Another Model

Choose another current model ID from https://openrouter.ai/models and run:

```powershell
cc-byok use openrouter <new-model-id>
cc-byok status
cc-byok launch
```

You do not need to add the API key again when only changing models.

## 13. Update the OpenRouter API Key

To replace an expired or revoked key:

```powershell
cc-byok provider add openrouter
```

Confirm the replacement, then enter the new key.

## Troubleshooting

### `cc-byok` Is Not Recognized

Reinstall it from the repository:

```powershell
cd E:\cc-byok
npm run build
npm install --global .
```

Close and reopen PowerShell if the global npm executable directory was just
added to your `PATH`.

### `npm install --global cc-byok` Returns 404

The package has not been published to npm. Install from the repository:

```powershell
npm install --global .
```

### Claude Code Is Not Found

Verify:

```powershell
claude --version
```

If it is unavailable, install Claude Code using:

https://code.claude.com/docs/en/setup

### API Key Is Missing

Run:

```powershell
cc-byok provider add openrouter
```

Then verify:

```powershell
cc-byok status
```

### No Active Model Is Selected

Run:

```powershell
cc-byok use openrouter <model-id>
```

### Authentication or Model-Not-Found Error

Claude Code may have cached an Anthropic login.

1. Run `claude` normally.
2. Enter `/logout`.
3. Exit Claude Code.
4. Run `cc-byok launch` again.

Also confirm that the model ID still exists on OpenRouter and that your account
has enough credit to use it.

### The Model Chats but Cannot Complete Coding Tasks

Not every OpenRouter model handles Claude Code's tool calls reliably. Select a
model with strong native tool-use support and try again.

## What cc-byok Does

When launching Claude Code, `cc-byok` supplies:

```text
ANTHROPIC_BASE_URL=https://openrouter.ai/api
ANTHROPIC_AUTH_TOKEN=<your stored OpenRouter key>
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=<your selected model>
```

Claude Code then communicates directly with OpenRouter. `cc-byok` does not run a
proxy and does not send API requests itself.
