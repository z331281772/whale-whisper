// Smoke: load the patched ui-conversation client bundle factory with stubbed modules.
// Usage: node smoke-conversation.cjs [--bundle=<path>]
import vm from "node:vm";
import { readBundle } from "./paths.mjs";

const { path, src: code } = readBundle();
let loaded = null;
const sandbox = {
  window: { __ModuleLoader__: { load: (row) => { loaded = row; } } },
  document: undefined,
  console,
  Symbol,
  JSON,
  Math,
  Object,
  Date,
  setInterval: () => 0,
  clearInterval: () => {},
  setTimeout: () => 0,
  clearTimeout: () => {}
};
vm.createContext(sandbox);
vm.runInContext(code, sandbox);
if (!loaded) throw new Error("factory not registered");
if (loaded.id !== "@deepseek-ai/dsh-client-ui-conversation") throw new Error("bad id: " + loaded.id);
// Generic stub: any require returns a Proxy that yields functions/objects on demand.
const stub = new Proxy(function () {}, {
  get: (t, prop) => {
    if (prop === Symbol.toStringTag) return "Module";
    if (prop === "__esModule") return true;
    return stub;
  },
  apply: () => stub,
  construct: () => ({})
});
const exportsObj = loaded.factory(() => stub);
if (typeof exportsObj.apply !== "function") throw new Error("missing apply");
console.log(`factory smoke OK: id = ${loaded.id} (${path})`);
