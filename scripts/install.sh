#!/bin/sh

set -eu

fail() {
  printf 'cc-byok installer: %s\n' "$*" >&2
  exit 1
}

for dependency in curl uname node npm; do
  command -v "$dependency" >/dev/null 2>&1 ||
    fail "Required command '$dependency' was not found on PATH."
done

os=$(uname -s) || fail "Could not detect the operating system."
architecture=$(uname -m) || fail "Could not detect the machine architecture."

case "$os:$architecture" in
  Linux:x86_64|Linux:amd64|Linux:aarch64|Linux:arm64|Darwin:x86_64|Darwin:amd64|Darwin:arm64|Darwin:aarch64)
    ;;
  Linux:*)
    fail "Unsupported Linux architecture '$architecture'. Supported architectures are x86_64 and arm64."
    ;;
  Darwin:*)
    fail "Unsupported macOS architecture '$architecture'. Supported architectures are x86_64 and arm64."
    ;;
  *)
    fail "Unsupported operating system '$os'. cc-byok supports Linux and macOS."
    ;;
esac

node_version=$(node -p 'process.versions.node' 2>/dev/null) ||
  fail "Node.js is installed but could not report its version."
case "$node_version" in
  *-*)
    fail "Node.js $node_version is a prerelease; install a stable Node.js release 20.17 or newer."
    ;;
esac

old_ifs=$IFS
IFS=.
set -- $node_version
IFS=$old_ifs
node_major=${1:-}
node_minor=${2:-}
case "$node_major:$node_minor" in
  *[!0-9:]*|:*|*:)
    fail "Could not parse Node.js version '$node_version'."
    ;;
esac
if [ "$node_major" -lt 20 ] ||
  { [ "$node_major" -eq 20 ] && [ "$node_minor" -lt 17 ]; }; then
  fail "Node.js 20.17 or newer is required; found $node_version. Upgrade Node.js and rerun this command."
fi

npm_version=$(npm --version 2>/dev/null) ||
  fail "npm is installed but could not report its version."
[ -n "$npm_version" ] || fail "npm returned an empty version."

printf 'Installing cc-byok@latest on %s (%s) with Node.js %s and npm %s...\n' \
  "$os" "$architecture" "$node_version" "$npm_version"
if ! npm install --global cc-byok@latest; then
  printf '%s\n' \
    "cc-byok installer: npm global installation failed." \
    "Check your network connection and npm permissions. This installer never uses sudo." \
    "If the global npm directory is not writable, use a Node version manager or configure a user-owned npm prefix." >&2
  exit 1
fi

npm_prefix=$(npm config get prefix 2>/dev/null) ||
  fail "Could not determine npm's global installation prefix."
[ -n "$npm_prefix" ] || fail "npm returned an empty global installation prefix."
global_bin=${npm_prefix%/}/bin
installed_cli=$global_bin/cc-byok
[ -x "$installed_cli" ] ||
  fail "npm completed, but '$installed_cli' is not executable. Check npm's global prefix and permissions."

path_before=${PATH:-}
case "$path_before" in
  "$global_bin"|"$global_bin":*)
    path_adjusted=0
    ;;
  *)
    PATH=$global_bin:$path_before
    export PATH
    path_adjusted=1
    printf 'Note: added %s to PATH for this installer process.\n' "$global_bin"
    ;;
esac

command -v cc-byok >/dev/null 2>&1 ||
  fail "cc-byok was installed, but could not be resolved on PATH. Add '$global_bin' to your shell PATH."
cc-byok --version ||
  fail "The installed cc-byok executable failed its version check."
cc-byok init ||
  fail "cc-byok was installed, but initialization failed. Run 'cc-byok init' after resolving the error."

printf '\n%s\n' \
  "Installation complete. Existing cc-byok configuration and credentials were not removed." \
  "" \
  "Next, add a provider and choose a model:" \
  "  cc-byok provider add openrouter" \
  "  cc-byok use openrouter qwen/qwen3-coder" \
  "  cc-byok status" \
  "" \
  "For other providers and installation help, see:" \
  "  https://github.com/YASHxK1/cc-byok/blob/main/docs/installation.md"

if [ "$path_adjusted" -eq 1 ]; then
  printf '\nAdd this directory to your shell PATH to use cc-byok in new terminals:\n  %s\n' "$global_bin"
fi
