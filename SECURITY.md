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

`cc-byok` stores provider credentials in the operating system keychain. A key is
placed in the environment of the launched Claude Code process because Claude
Code requires it for authentication. The project must never write that key to
its JSON configuration or logs.
