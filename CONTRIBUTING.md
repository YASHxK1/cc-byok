# Contributing

Thanks for helping improve `cc-byok`.

## Development Setup

Requirements:

- Node.js 20.17 or newer
- npm

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
test/                 Unit and integration tests
docs/                 User documentation
docs/project/         Product requirements and implementation planning
.github/workflows/    GitHub Actions configuration
```

Keep command handlers in `src/commands/` thin. Configuration, credential
storage, provider behavior, and process launching belong in `src/core/` or
`src/providers/`.

## Pull Requests

- Keep changes focused.
- Add or update tests for behavior changes.
- Update documentation when commands or setup steps change.
- Do not commit API keys, credentials, generated `dist/` files, or
  `node_modules/`.
- Run `npm run check` before opening a pull request.

## Security

Never add plaintext credential fallbacks. API keys must remain in the operating
system keychain and must not appear in logs, errors, fixtures, or configuration.
