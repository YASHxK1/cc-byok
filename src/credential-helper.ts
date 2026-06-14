#!/usr/bin/env node

import { KeyringSecretStore } from "./core/secret-store.js";

const providerId = process.argv[2]?.trim();
if (!providerId) {
  process.stderr.write("Missing provider ID.\n");
  process.exitCode = 2;
} else {
  const secret = await new KeyringSecretStore().get(providerId);
  if (!secret) {
    process.stderr.write(`No API key is stored for provider "${providerId}".\n`);
    process.exitCode = 1;
  } else {
    process.stdout.write(secret);
  }
}
