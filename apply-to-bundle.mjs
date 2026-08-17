/**
 * Apply generated captions to the native ui-conversation bundle:
 *   1. replace the zh dict block (turnStatus.caption.NN …) with dict-zh.txt
 *   2. replace the en dict block with dict-en.txt
 *   3. bump DDN_CAPTION_COUNT to the generated count
 * Usage: node apply-to-bundle.mjs [--bundle=<path>]
 * Reads ./dict-zh.txt and ./dict-en.txt (run generate-captions.mjs first).
 */
import fs from "node:fs";
import { readBundle } from "./paths.mjs";

const HERE = import.meta.dirname;
const { path: BUNDLE, src } = readBundle();
const zhBlock = fs.readFileSync(`${HERE}/dict-zh.txt`, "utf8").trimEnd();
const enBlock = fs.readFileSync(`${HERE}/dict-en.txt`, "utf8").trimEnd();
const count = (zhBlock.match(/turnStatus\.caption\.\d{2,3}"/g) ?? []).length;

const blockRe = /(\t\t\t"turnStatus\.caption\.\d{2,3}": "[^"]*",(?:\n\t\t\t"turnStatus\.caption\.\d{2,3}": "[^"]*",)+)/g;
let hits = 0;
const patched = src.replace(blockRe, (m) => {
  hits += 1;
  return hits === 1 ? zhBlock : enBlock;
});
if (hits !== 2) throw new Error(`expected 2 dict blocks in ${BUNDLE}, matched ${hits}`);
const out = patched.replace(/const DDN_CAPTION_COUNT = \d+;/, `const DDN_CAPTION_COUNT = ${count};`);
fs.writeFileSync(BUNDLE, out);
console.log(`applied: zh+en blocks replaced in ${BUNDLE} (${count} captions), DDN_CAPTION_COUNT = ${count}`);
