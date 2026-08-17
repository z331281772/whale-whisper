/**
 * whale-whisper (且听鲸吟) — node half.
 *
 * On plugin mount (dsh web startup), applies the TurnStatus patch to the
 * installed ui-conversation client bundle if it is not patched yet:
 * idempotent (skips when the "ddn-caption" marker is present), warn-only on
 * failure so a broken install never takes down the host.
 *
 * The patch content lives in ./dict-zh.txt and ./dict-en.txt next to this
 * package; regenerate them with scripts/generate-captions.mjs.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const PKG_ROOT = path.resolve(import.meta.dirname, "..");

/** Locate the installed ui-conversation client bundle (DSH_BUNDLE overrides). */
function bundlePath() {
  if (process.env.DSH_BUNDLE) return process.env.DSH_BUNDLE;
  const home = process.env.DSH_HOME || path.join(os.homedir(), ".dsh");
  return path.join(
    home, "profiles", "node_modules",
    "@deepseek-ai", "dsh-client-ui-conversation", "lib", "client.js"
  );
}

/** Apply the patch; returns a short status string for the startup log. */
function applyPatch() {
  const bundle = bundlePath();
  const src = fs.readFileSync(bundle, "utf8");
  if (src.includes("ddn-caption")) return "already patched (skipped)";
  const zhBlock = fs.readFileSync(path.join(PKG_ROOT, "dict-zh.txt"), "utf8").trimEnd();
  const enBlock = fs.readFileSync(path.join(PKG_ROOT, "dict-en.txt"), "utf8").trimEnd();
  const count = (zhBlock.match(/turnStatus\.caption\.\d{2,3}"/g) ?? []).length;
  const blockRe = /(\t\t\t"turnStatus\.caption\.\d{2,3}": "[^"]*",(?:\n\t\t\t"turnStatus\.caption\.\d{2,3}": "[^"]*",)+)/g;
  let hits = 0;
  const patched = src.replace(blockRe, (m) => {
    hits += 1;
    return hits === 1 ? zhBlock : enBlock;
  });
  if (hits !== 2) throw new Error(`expected 2 dict blocks, matched ${hits}`);
  const out = patched.replace(/const DDN_CAPTION_COUNT = \d+;/, `const DDN_CAPTION_COUNT = ${count};`);
  fs.writeFileSync(bundle, out);
  return `patched ${count} captions`;
}

/** Host plugin body: apply the patch, never throw. */
function apply() {
  try {
    console.log(`[whale-whisper] ${applyPatch()}`);
  } catch (error) {
    console.warn(`[whale-whisper] patch not applied (${error.message}) — run scripts/apply-to-bundle.mjs manually`);
  }
}

export { apply };
