/**
 * whale-whisper (且听鲸吟) — node half.
 *
 * On plugin mount (dsh web startup), applies the TurnStatus patch to the
 * installed ui-conversation client bundle if it is not patched yet:
 * idempotent (skips when the "ddn-caption" marker is present), warn-only on
 * failure so a broken install never takes down the host.
 *
 * rc.6 rewrite: the ui-conversation bundle no longer ships inline locale
 * dictionaries — "Deep diving..." is a hardcoded string inside TurnStatus.
 * The patch therefore replaces the whole TurnStatus component with a
 * self-contained version (caption pools embedded from ./captions.json,
 * locale probed through the injected `t`, no dictionary writes needed).
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

/** Build the replacement TurnStatus block with the caption pools inlined. */
function buildReplacement(captions) {
  const zh = JSON.stringify(captions.zh);
  const en = JSON.stringify(captions.en);
  return `		//#region deep-diving native status (whale-whisper): rising bubbles + rotating fun captions
		const ddnCss = ".ddn-bubbles{position:relative;width:18px;height:14px;margin-right:8px;flex:none;display:inline-block;vertical-align:-2px}.ddn-bubble{position:absolute;bottom:0;width:4px;height:4px;border-radius:50%;background:var(--dsw-alias-label-tertiary);opacity:0;animation:ddn-rise 1.9s ease-in infinite}.ddn-bubble:nth-child(1){left:0;animation-delay:0s}.ddn-bubble:nth-child(2){left:7px;animation-delay:.65s}.ddn-bubble:nth-child(3){left:14px;animation-delay:1.3s}.ddn-caption{min-width:0;max-width:min(460px,68vw);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;animation:ddn-in .4s ease both}@keyframes ddn-rise{0%{transform:translateY(0) scale(.7);opacity:0}20%{opacity:.9}100%{transform:translateY(-11px) scale(1);opacity:0}}@keyframes ddn-in{0%{opacity:0;transform:translateY(4px)}100%{opacity:1;transform:translateY(0)}}@media (prefers-reduced-motion: reduce){.ddn-bubble,.ddn-caption{animation:none !important}}";
		const ddnTagId = "whale-whisper/DeepDiveStatus.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(ddnTagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "whale-whisper";
			tag.dataset.pluginCss = ddnTagId;
			tag.textContent = ddnCss;
			document.head.appendChild(tag);
		}
		/** Whale-themed caption pools keyed by locale (rc.6: no inline dicts, pools ship with the patch). */
		const DDN_CAPTIONS = { zh: ${zh}, en: ${en} };
		/** Caption rotation interval while the turn runs. */
		const DDN_CAPTION_INTERVAL_MS = 4500;
		/** Turn-level model activity label retained across first-token, tool, and streaming phases. */
		function TurnStatus({ startTime, t }) {
			const [mountedAt] = (0, react.useState)(() => Date.now());
			const anchor = startTime ?? mountedAt;
			const [elapsedMs, setElapsedMs] = (0, react.useState)(() => Math.max(0, Date.now() - anchor));
			const zh = /[\\u4e00-\\u9fff]/.test(t("duration.seconds", { seconds: 0 }));
			const pool = DDN_CAPTIONS[zh ? "zh" : "en"];
			const [caption, setCaption] = (0, react.useState)(() => Math.floor(Math.random() * pool.length));
			(0, react.useEffect)(() => {
				const tick = () => {
					setElapsedMs(Math.max(0, Date.now() - anchor));
				};
				tick();
				const id = setInterval(tick, 1e3);
				return () => {
					clearInterval(id);
				};
			}, [anchor]);
			(0, react.useEffect)(() => {
				const id = setInterval(() => {
					setCaption((current) => {
						const next = Math.floor(Math.random() * pool.length);
						return next === current ? (next + 1) % pool.length : next;
					});
				}, DDN_CAPTION_INTERVAL_MS);
				return () => {
					clearInterval(id);
				};
			}, [pool]);
			const showClock = elapsedMs >= 15e3;
			return (0, react_jsx_runtime.jsxs)("div", {
				className: ChatView_module_css_default.turnStatus,
				role: "status",
				"aria-live": "polite",
				children: [(0, react_jsx_runtime.jsxs)("span", {
					className: "ddn-bubbles",
					"aria-hidden": true,
					children: [(0, react_jsx_runtime.jsx)("span", {
						className: "ddn-bubble"
					}), (0, react_jsx_runtime.jsx)("span", {
						className: "ddn-bubble"
					}), (0, react_jsx_runtime.jsx)("span", {
						className: "ddn-bubble"
					})]
				}), (0, react_jsx_runtime.jsx)("span", {
					className: "ddn-caption",
					children: pool[caption % pool.length]
				}, caption), showClock && (0, react_jsx_runtime.jsx)("span", {
					className: ChatView_module_css_default.turnStatusClock,
					"aria-hidden": true,
					children: formatRunDuration(elapsedMs, t)
				})]
			});
		}
`;
}

/** Apply the patch; returns a short status string for the startup log. */
function applyPatch() {
  const bundle = bundlePath();
  const src = fs.readFileSync(bundle, "utf8");
  if (src.includes("ddn-caption")) return "already patched (skipped)";
  const captions = JSON.parse(fs.readFileSync(path.join(PKG_ROOT, "captions.json"), "utf8"));
  if (!Array.isArray(captions.zh) || !Array.isArray(captions.en) || captions.zh.length === 0 || captions.en.length === 0) {
    throw new Error("captions.json must hold non-empty zh/en arrays");
  }
  const turnStatusRe = /\t\t\/\*\* Turn-level model activity label[\s\S]*?\n\t\t\}\n/;
  const match = src.match(turnStatusRe);
  if (!match) throw new Error("TurnStatus block not found in bundle");
  if (!match[0].includes('"Deep diving..."')) {
    throw new Error("TurnStatus block found but hardcoded caption missing — bundle layout changed?");
  }
  const patched = src.replace(turnStatusRe, buildReplacement(captions));
  fs.writeFileSync(bundle, patched);
  return `patched TurnStatus (${captions.zh.length} zh + ${captions.en.length} en captions)`;
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
