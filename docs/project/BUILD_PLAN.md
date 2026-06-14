# cc-byok Build Plan

## 1. Product Boundary

Build `cc-byok` as a thin CLI wrapper around Claude Code.

The MVP will:

- configure one provider: OpenRouter
- store non-secret settings in `~/.cc-byok/config.json`
- store API keys in the operating system keychain
- select an active provider and model
- launch the installed `claude` command with an isolated environment
- report configuration and setup problems clearly

The MVP will not:

- proxy or translate API requests
- support Ollama, LiteLLM, or other agents
- add project-level configuration
- track tokens or cost
- provide a model picker or TUI

This follows the narrower scope in `prd.md`. The gateway and additional providers
described in `idea.md` remain post-MVP work.

## 2. Decisions to Lock Before Implementation

Use these defaults unless an initial technical spike disproves them:

| Area | Decision |
|---|---|
| Package and binary name | `cc-byok` |
| Runtime | A currently supported Node.js LTS release |
| Language | TypeScript |
| CLI framework | Commander |
| Config format | JSON with runtime schema validation |
| Secret storage | OS keychain adapter, initially backed by `keytar` or a maintained equivalent |
| Process launch | `child_process.spawn` with `stdio: "inherit"` |
| MVP platforms | macOS and Linux |
| Provider scope | Built-in OpenRouter provider only |
| Gateway | None in MVP |

Before feature work, run two short spikes:

1. Verify the exact OpenRouter Anthropic-compatible base URL and required headers
   with the current Claude Code release.
2. Verify keychain installation and read/write behavior on macOS and representative
   GNOME and KDE Linux environments.

These spikes are release blockers because the product depends on both assumptions.

## 3. Proposed Project Structure

```text
cc-byok/
  src/
    cli.ts
    commands/
      init.ts
      provider-add.ts
      provider-list.ts
      use.ts
      status.ts
      launch.ts
    core/
      config.ts
      config-schema.ts
      errors.ts
      paths.ts
      provider-registry.ts
      secret-store.ts
      env-builder.ts
      launcher.ts
    providers/
      openrouter.ts
    ui/
      prompt.ts
      output.ts
  test/
    unit/
    integration/
    fixtures/
  package.json
  tsconfig.json
  README.md
  LICENSE
```

Keep command modules thin. Commands should parse input and render output while the
`core` modules own config, secret storage, validation, environment construction,
and process launching.

## 4. Core Data Model

Use a versioned config so future migrations do not depend on guessing its shape:

```json
{
  "version": 1,
  "activeProvider": "openrouter",
  "activeModel": "qwen/qwen3-coder",
  "providers": {
    "openrouter": {
      "baseUrl": "https://openrouter.ai/api"
    }
  }
}
```

Rules:

- Resolve the directory from the user's home directory, never the current project.
- Create the directory with user-only permissions where the platform supports it.
- Write config atomically through a temporary sibling file and rename.
- Validate every config read and return a repair-oriented error for malformed data.
- Never include keys, tokens, or key fragments in config, logs, errors, or status output.
- Use keychain service `cc-byok` and provider name as the account.

## 5. Provider Contract

Even with one MVP provider, define a small internal provider interface:

```ts
interface ProviderDefinition {
  id: string;
  displayName: string;
  defaultBaseUrl: string;
  buildEnvironment(input: {
    baseUrl: string;
    apiKey: string;
    model: string;
  }): Record<string, string>;
}
```

The OpenRouter implementation must construct:

```text
ANTHROPIC_BASE_URL=<configured base URL>
ANTHROPIC_AUTH_TOKEN=<keychain value>
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=<selected model>
```

The launcher must merge these values into a copy of `process.env`; it must not
mutate the CLI process environment globally.

## 6. Command Behavior

### `cc-byok init`

1. Resolve `~/.cc-byok`.
2. Create the directory if absent.
3. Create a valid versioned config with the built-in OpenRouter provider.
4. If config already exists, leave it unchanged and report that initialization is
   already complete.
5. Print the absolute config path.

### `cc-byok provider add openrouter`

1. Reject unknown providers with the supported provider list.
2. Prompt for the API key with hidden input.
3. Reject empty input.
4. If a key exists, ask before replacing it.
5. Store it through the secret-store abstraction.
6. Print confirmation without revealing any part of the key.

Support `Ctrl+C` as a clean cancellation with no write and no stack trace.

### `cc-byok provider list`

Read config and print each provider's name and base URL. Mark the active provider.
Do not touch the keychain because key status is not required for this command.

### `cc-byok use <provider> <model-id>`

1. Validate that provider and model arguments are non-empty.
2. Require the provider to exist in config.
3. Update `activeProvider` and `activeModel` atomically.
4. Print provider, model, base URL, and routing mode.

Do not make a network request or claim that the model is compatible.

### `cc-byok status`

Print:

- config path
- active provider
- active model
- base URL
- API key status as `stored` or `missing`

Return a helpful setup instruction when initialization, provider selection, or the
key is missing.

### `cc-byok launch [-- <claude arguments...>]`

The PRD leaves argument forwarding open. Include it in the MVP because it requires
little extra machinery and preserves normal Claude Code usage.

1. Validate config, active provider, active model, and stored key.
2. Resolve the provider and build the child environment.
3. Spawn `claude` with forwarded arguments, inherited stdio, and the current
   working directory.
4. Forward termination signals to the child where needed.
5. Exit with the child's exit code.
6. Detect a missing executable and print Claude Code installation guidance.
7. Never print the assembled environment or secret-bearing spawn options.

## 7. Error Model

Define typed operational errors and map them to concise CLI messages:

| Condition | User-facing action |
|---|---|
| Not initialized | Run `cc-byok init` |
| Invalid config | Show path and explain how to repair or recreate it |
| Unknown provider | Show supported providers |
| Missing active model | Run `cc-byok use openrouter <model>` |
| Missing key | Run `cc-byok provider add openrouter` |
| Keychain unavailable | Explain required OS keychain dependency |
| Claude missing | Show the current official install command or documentation URL |
| Spawn failure | Show the non-secret system error |

Expected user errors should not print stack traces. Unexpected errors may print a
stack trace only when a debug environment flag is enabled.

## 8. Delivery Phases

### Phase 0: Compatibility Spikes

- verify OpenRouter and Claude Code routing end to end
- evaluate the secret-storage package on target systems
- record tested versions and exact setup requirements

Exit gate: one manual Claude Code tool-use session succeeds through OpenRouter and
keychain access works on the target platform matrix.

### Phase 1: Project Foundation

- initialize package metadata and TypeScript build
- add linting, formatting, unit-test runner, and executable entry point
- implement paths, config schema, atomic config store, and typed errors
- add CI for supported Node.js and operating systems

Exit gate: the packaged CLI runs `cc-byok --help`, and config tests pass.

### Phase 2: Configuration Commands

- implement `init`
- implement provider registry
- implement keychain-backed secret store
- implement `provider add`, `provider list`, `use`, and `status`

Exit gate: all command acceptance criteria pass using isolated temporary home
directories and a fake secret store.

### Phase 3: Launch Flow

- implement OpenRouter environment builder
- implement Claude process launcher and argument forwarding
- propagate exit codes and signals
- handle missing binary and incomplete setup

Exit gate: an integration test captures the child environment without exposing the
real key, followed by a successful manual OpenRouter launch.

### Phase 4: Hardening and Release

- audit output and errors for secret leakage
- test interrupted prompts, corrupt config, key replacement, and spawn failures
- write installation, quick-start, troubleshooting, and security documentation
- test `npm pack` and installation from the generated tarball
- publish a prerelease, run the full demo flow, then publish v1.0

Exit gate: every PRD acceptance criterion is covered by an automated test or a
documented manual release check.

## 9. Test Strategy

### Unit Tests

- config defaults, validation, migration boundary, and atomic writes
- provider lookup
- exact environment construction
- secret-store error mapping
- command input validation
- redaction and user-facing error formatting

### Integration Tests

- run commands with a temporary home/config root
- use an in-memory or fake keychain adapter
- use a fake `claude` executable that records arguments, selected non-secret
  environment fields, working directory, signals, and exit code
- verify `ANTHROPIC_API_KEY` is explicitly empty in the child
- verify existing unrelated environment variables survive
- verify child exit codes are returned by `cc-byok`

Never place a real API key in fixtures, snapshots, CI variables, or recorded output.

### Manual Release Checks

- clean installation on macOS
- clean installation on GNOME-based Linux
- KDE Linux check or documented limitation
- key add and overwrite flow
- OpenRouter launch with at least three tool-capable models
- Claude Code read/edit/terminal tool loop
- cancellation and non-zero child exit behavior

Windows can receive best-effort smoke testing but is not an MVP release blocker.

## 10. Security Checklist

- secrets exist only in the OS keychain and child process environment
- prompt input is hidden
- config and directory permissions are restrictive
- errors and debug logs redact credentials
- no telemetry or network request is performed by `cc-byok`
- spawned process receives only a copied environment
- package contents are inspected before publishing
- dependencies are pinned by lockfile and audited before release

The API key necessarily exists in the launched process environment. Documentation
should describe this accurately rather than claiming zero in-memory exposure.

## 11. PRD Traceability

| Requirement | Implementation | Verification |
|---|---|---|
| US-01 Init | Config store and `init` command | Integration test |
| US-02 Add key | Prompt and secret-store adapter | Unit plus integration test |
| US-03 Set model | `use` command and atomic config update | Integration test |
| US-04 Launch | Env builder and process launcher | Integration plus manual E2E |
| US-05 Status | Config and key-existence lookup | Integration test |
| US-06 List providers | Provider registry and list command | Integration test |

## 12. Post-MVP Sequence

After v1.0 usage validates the wrapper:

1. Add `doctor`, shell completion, and per-project config.
2. Add Ollama and LiteLLM only where they expose a compatible endpoint.
3. Add model metadata, aliases, and compatibility warnings.
4. Build a translation gateway only if demand justifies the complexity of
   streaming, tool-call, error, and stop-reason translation.

Do not combine the custom gateway with the MVP. It changes the product from a
configuration launcher into a protocol implementation and substantially increases
the correctness and maintenance burden.
