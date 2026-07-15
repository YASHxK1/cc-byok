# Contributing

Thanks for helping improve `cc-byok`.

## Development Setup

Requirements:

- Node.js 20.17 or newer
- npm
- Codex CLI 0.144.4 or newer for optional real gateway smoke tests

Install dependencies:

```bash
npm install
```

Run the complete validation suite:

```bash
npm run check
```

The command runs type checking, tests, and the production build.

## Project Structure

```text
src/                  CLI source code
src/gateway/          HTTP server and Codex app-server bridge
test/                 Unit and integration tests
docs/                 User documentation
```

Keep command handlers in `src/commands/` thin. Configuration, credential
storage, provider behavior, and process launching belong in `src/core/` or
`src/providers/`. Gateway HTTP translation and app-server protocol handling
belong in `src/gateway/`.

## Pull Requests

- Keep changes focused.
- Add or update tests for behavior changes.
- Update documentation when commands or setup steps change.
- Do not commit API keys, credentials, generated `dist/` files, or
  `node_modules/`.
- Run `npm run check` before opening a pull request.
- Keep normal tests independent of a real Codex account. Use a mocked gateway
  runtime or app-server fixture unless a test is explicitly an opt-in smoke
  test.

## Security

Never add plaintext credential fallbacks. API keys must remain in the operating
system keychain and must not appear in logs, errors, fixtures, or configuration.
