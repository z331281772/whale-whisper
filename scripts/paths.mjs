/**
 * Shared path resolution for the deep-diving patch toolchain.
 *
 * Default target: the installed ui-conversation client bundle inside the dsh
 * web profile. Override with --bundle=<absolute path> on any script.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/** Default installed bundle location (DSH_HOME overrides ~/.dsh). */
export function defaultBundlePath() {
  const home = process.env.DSH_HOME || path.join(os.homedir(), ".dsh");
  return path.join(
    home, "profiles", "node_modules",
    "@deepseek-ai", "dsh-client-ui-conversation", "lib", "client.js"
  );
}

/** Resolve the bundle path from argv (--bundle=<path>) or the default. */
export function resolveBundlePath(argv = process.argv.slice(2)) {
  const flag = "--bundle=";
  const hit = argv.find((arg) => arg.startsWith(flag));
  return hit ? hit.slice(flag.length) : defaultBundlePath();
}

/** Read the bundle, returning its path and content. */
export function readBundle(argv = process.argv.slice(2)) {
  const bundlePath = resolveBundlePath(argv);
  return { path: bundlePath, src: fs.readFileSync(bundlePath, "utf8") };
}
