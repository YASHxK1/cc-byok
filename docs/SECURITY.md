# Security Policy

## Reporting a Vulnerability

Do not open a public issue for a vulnerability that could expose credentials.
Use GitHub's private vulnerability reporting feature for this repository after
it is published.

Include:

- the affected version or commit
- operating system and Node.js version
- reproduction steps
- potential credential or process-environment exposure
- any suggested mitigation

Do not include real API keys or other secrets in the report.

## Credential Handling

`cc-byok` stores provider credentials in the operating system keychain. A key
is placed in the launched target's environment when that target requires it.
The project must never write provider keys to JSON configuration or logs.

The integrated gateway generates a 32-byte random base64url bearer key under
the `ai-gateway` keychain account. `gateway key` is the only command that
intentionally prints it. `gateway rotate-key` replaces the stored key. Restart
a gateway process that was already running so it loads the replacement; clients
must then use the new key.

The gateway binds only to `127.0.0.1` and still requires
`Authorization: Bearer <key>` on every endpoint. It runs Codex threads with a
read-only sandbox and approval policy `never`; client-provided function tools,
not native Codex command or file escalation, perform external actions.

Codex authentication remains owned by the official Codex CLI. `cc-byok` does
not read, copy, or persist Codex access or refresh tokens.
