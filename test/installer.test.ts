import { chmod, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const cleanup: string[] = [];

afterEach(async () => {
  await Promise.all(cleanup.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

describe("curl installer", () => {
  it("installs the latest npm package, verifies it, and initializes cc-byok", async () => {
    const fixture = await createFixture();
    const result = await runInstaller(fixture);

    expect(result.stdout).toContain("Installing cc-byok@latest on Linux (x86_64)");
    expect(result.stdout).toContain("Initialized by test");
    expect(result.stdout).toContain("cc-byok provider add openrouter");
    expect(result.stdout).toContain("cc-byok use openrouter qwen/qwen3-coder");
    expect(result.stdout).toContain("added");
    expect(await readLog(fixture.installLog)).toBe("install --global cc-byok@latest\n");
    expect(await readLog(fixture.cliLog)).toBe("--version\ninit\n");
  });

  it("supports macOS arm64", async () => {
    const fixture = await createFixture({
      MOCK_UNAME_S: "Darwin",
      MOCK_UNAME_M: "arm64",
    });
    const result = await runInstaller(fixture);

    expect(result.stdout).toContain("Installing cc-byok@latest on Darwin (arm64)");
    expect(await readLog(fixture.cliLog)).toBe("--version\ninit\n");
  });

  it("rejects Node.js versions older than 20.17 before installing", async () => {
    const fixture = await createFixture({ NODE_VERSION: "20.16.0" });
    const result = await runInstaller(fixture, false);

    expect(result.stderr).toContain("Node.js 20.17 or newer is required");
    expect(await readLog(fixture.installLog)).toBe("");
  });

  it("rejects unsupported operating systems", async () => {
    const fixture = await createFixture({ MOCK_UNAME_S: "FreeBSD" });
    const result = await runInstaller(fixture, false);

    expect(result.stderr).toContain("supports Linux and macOS");
    expect(await readLog(fixture.installLog)).toBe("");
  });

  it("reports npm installation failures without invoking sudo", async () => {
    const fixture = await createFixture({ INSTALL_FAIL: "1" });
    const result = await runInstaller(fixture, false);

    expect(result.stderr).toContain("npm global installation failed");
    expect(result.stderr).toContain("never uses sudo");
    expect(await readLog(fixture.cliLog)).toBe("");
  });
});

interface InstallerFixture {
  bin: string;
  installLog: string;
  cliLog: string;
  prefix: string;
  overrides: Record<string, string>;
}

async function createFixture(overrides: Record<string, string> = {}): Promise<InstallerFixture> {
  const root = await mkdtemp(join(tmpdir(), "cc-byok-installer-"));
  cleanup.push(root);
  const bin = join(root, "bin");
  const prefix = join(root, "npm-prefix");
  const installLog = join(root, "install.log");
  const cliLog = join(root, "cli.log");
  await mkdir(bin);
  await writeFile(installLog, "");
  await writeFile(cliLog, "");

  await writeExecutable(join(bin, "uname"), `#!/bin/sh
case "$1" in
  -s) printf '%s\\n' "\${MOCK_UNAME_S:-Linux}" ;;
  -m) printf '%s\\n' "\${MOCK_UNAME_M:-x86_64}" ;;
esac
`);
  await writeExecutable(join(bin, "node"), `#!/bin/sh
printf '%s\\n' "\${NODE_VERSION:-20.17.0}"
`);
  await writeExecutable(join(bin, "npm"), `#!/bin/sh
case "$*" in
  "--version") printf '%s\\n' "10.8.2" ;;
  "config get prefix") printf '%s\\n' "$NPM_PREFIX" ;;
  "install --global cc-byok@latest")
    printf '%s\\n' "$*" >> "$INSTALL_LOG"
    if [ "\${INSTALL_FAIL:-}" = "1" ]; then
      printf '%s\\n' "mock npm failure" >&2
      exit 1
    fi
    mkdir -p "$NPM_PREFIX/bin"
    cat > "$NPM_PREFIX/bin/cc-byok" <<'CLI'
#!/bin/sh
printf '%s\\n' "$*" >> "$CLI_LOG"
case "$1" in
  --version) printf '%s\\n' "0.3.2" ;;
  init) printf '%s\\n' "Initialized by test" ;;
esac
CLI
    chmod +x "$NPM_PREFIX/bin/cc-byok"
    ;;
  *) printf 'unexpected npm arguments: %s\\n' "$*" >&2; exit 1 ;;
esac
`);

  return { bin, installLog, cliLog, prefix, overrides };
}

async function writeExecutable(path: string, contents: string): Promise<void> {
  await writeFile(path, contents);
  await chmod(path, 0o755);
}

async function runInstaller(
  fixture: InstallerFixture,
  success = true,
): Promise<{ stdout: string; stderr: string }> {
  const script = join(process.cwd(), "scripts/install.sh");
  try {
    return await execFileAsync("/bin/sh", [script], {
      env: {
        ...process.env,
        PATH: `${fixture.bin}:/usr/bin:/bin`,
        NPM_PREFIX: fixture.prefix,
        INSTALL_LOG: fixture.installLog,
        CLI_LOG: fixture.cliLog,
        ...fixture.overrides,
      },
    });
  } catch (error) {
    if (success) {
      throw error;
    }
    const result = error as Error & { stdout: string; stderr: string };
    return { stdout: result.stdout, stderr: result.stderr };
  }
}

async function readLog(path: string): Promise<string> {
  return readFile(path, "utf8");
}
