/**
 * Build docs/demo.html — a self-contained, double-clickable showcase of the
 * core capability: native "Deep diving..." status line vs the enhanced one
 * (rising bubbles + 120 rotating zh/en captions + run timer).
 * Usage: node scripts/build-demo.mjs   → writes docs/demo.html
 */
import fs from "node:fs";

const HERE = import.meta.dirname;
const ROOT = `${HERE}/..`;
const captions = JSON.parse(fs.readFileSync(`${ROOT}/captions.json`, "utf8"));
const zh = JSON.stringify(captions.zh);
const en = JSON.stringify(captions.en);

const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>且听鲸吟 whale-whisper · 核心能力演示</title>
<style>
  body { margin:0; padding:40px 20px; font-family:system-ui,"PingFang SC","Microsoft YaHei",sans-serif; background:#f4f5f9; color:#1f2329; }
  .wrap { max-width:840px; margin:0 auto; }
  h1 { font-size:22px; margin:0 0 6px; }
  .sub { color:#6b7280; font-size:14px; margin-bottom:24px; }
  .card { background:#fff; border:1px solid #e6e8ef; border-radius:16px; padding:20px 24px; margin-bottom:18px; box-shadow:0 2px 10px rgba(15,23,42,.05); }
  .card h2 { font-size:15px; margin:0 0 2px; }
  .tag { font-size:12px; color:#9aa1ad; margin-bottom:14px; }
  .turn-status { height:26px; font-size:14px; font-weight:600; white-space:nowrap; display:inline-flex; align-items:center; }
  .shimmer { background:linear-gradient(90deg,#4d6bfe 0%,#4d6bfe 40%,#9db4ff 50%,#4d6bfe 60%,#4d6bfe 100%); background-size:250% 100%; background-position:100% 0; -webkit-background-clip:text; background-clip:text; color:transparent; animation:shimmer 1.8s linear infinite; }
  @keyframes shimmer { to { background-position:0 0; } }
  .bubbles { position:relative; width:18px; height:14px; display:inline-block; margin-right:8px; vertical-align:-2px; }
  .bubble { position:absolute; bottom:0; width:4px; height:4px; border-radius:50%; background:#8aa0ff; opacity:0; animation:rise 1.9s ease-in infinite; }
  .bubble:nth-child(1){ left:0; animation-delay:0s; }
  .bubble:nth-child(2){ left:7px; animation-delay:.65s; }
  .bubble:nth-child(3){ left:14px; animation-delay:1.3s; }
  @keyframes rise { 0%{transform:translateY(0) scale(.7); opacity:0} 20%{opacity:.9} 100%{transform:translateY(-11px) scale(1); opacity:0} }
  .caption { animation:in .4s ease both; }
  @keyframes in { from{opacity:0; transform:translateY(4px)} to{opacity:1; transform:translateY(0)} }
  .clock { font-size:12px; color:#8b93a1; margin-left:8px; font-weight:400; font-variant-numeric:tabular-nums; }
  .controls { display:flex; align-items:center; gap:14px; margin-bottom:26px; }
  button { font-size:14px; padding:8px 22px; border:none; border-radius:999px; background:#4d6bfe; color:#fff; cursor:pointer; }
  button:disabled { opacity:.5; cursor:default; }
  .lang { font-size:13px; color:#6b7280; }
  .lang label { cursor:pointer; }
  .footer { font-size:12px; color:#9aa1ad; margin-top:14px; line-height:1.8; }
  code { background:#eef1f8; border-radius:4px; padding:1px 5px; font-size:12px; }
</style>
</head>
<body>
<div class="wrap">
  <h1>🐋 且听鲸吟 whale-whisper</h1>
  <div class="sub">给 dsh Web 原生「Deep diving...」运行状态行加一点鲸鱼的幽默 —— 核心能力对照演示</div>

  <div class="card">
    <h2>原生（修改前）</h2>
    <div class="tag">静态流光文字，直到本轮结束</div>
    <div class="turn-status shimmer">Deep diving...</div>
  </div>

  <div class="card">
    <h2>增强后（本项目）</h2>
    <div class="tag">三颗上升气泡 + 120 条中英轮播文案（每 4.5s 一条，工具调用时随机换新并固定）+ 15s 运行计时器</div>
    <div class="turn-status shimmer" id="status">
      <span class="bubbles" aria-hidden="true"><span class="bubble"></span><span class="bubble"></span><span class="bubble"></span></span>
      <span class="caption" id="caption">Deep diving...</span>
      <span class="clock" id="clock"></span>
    </div>
  </div>

  <div class="controls">
    <button id="run">▶ 模拟运行</button>
    <span class="lang"><label><input type="radio" name="lang" value="zh" checked> 中文</label> <label><input type="radio" name="lang" value="en"> English</label></span>
  </div>
  <div class="footer">
    演示说明：点击「模拟运行」后，状态行按真实逻辑播报 —— 每 0.8s 换一条文案（演示加速，真实 4.5s）；5s 后出现运行计时器（演示加速，真实 15s）；本轮结束回到「Deep diving...」。
    <br>完整逻辑见 README：工具调用开始随机换一条并固定；纯思考阶段定时轮播兜底；<code>prefers-reduced-motion</code> 时全部动画降级为静态。
  </div>
</div>
<script>
const CAPTIONS_ZH = ${zh};
const CAPTIONS_EN = ${en};
const status = document.getElementById("status");
const captionEl = document.getElementById("caption");
const clockEl = document.getElementById("clock");
const runBtn = document.getElementById("run");
let timer = null;
let startedAt = 0;
let captionIdx = -1;

function pick() { return Math.floor(Math.random() * CAPTIONS_ZH.length); }
function lang() { return document.querySelector("input[name=lang]:checked").value; }
function text(i) { const pool = lang() === "zh" ? CAPTIONS_ZH : CAPTIONS_EN; return pool[i]; }
function tick() {
  const next = pick();
  captionIdx = next;
  captionEl.textContent = text(next);
  captionEl.style.animation = "none";
  void captionEl.offsetWidth; // restart animation
  captionEl.style.animation = "";
}
function clock() {
  const s = Math.floor((Date.now() - startedAt) / 1000);
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  clockEl.textContent = (lang() === "zh" ? "运行 " : "ran for ") + mm + ":" + ss;
}
runBtn.addEventListener("click", () => {
  if (timer) { clearInterval(timer); timer = null; runBtn.textContent = "▶ 模拟运行"; captionEl.textContent = "Deep diving..."; clockEl.textContent = ""; return; }
  runBtn.textContent = "■ 停止";
  startedAt = Date.now();
  tick();
  timer = setInterval(tick, 800);
  clockEl.textContent = "";
  const clockTimer = setInterval(clock, 1000);
  setTimeout(() => { clearInterval(clockTimer); }, 60000);
});
if (new URLSearchParams(location.search).get("autoplay") === "1") runBtn.click();
</script>
</body>
</html>
`;
fs.mkdirSync(`${ROOT}/docs`, { recursive: true });
fs.writeFileSync(`${ROOT}/docs/demo.html`, html);
console.log(`docs/demo.html written (${html.length} bytes, ${captions.zh.length} zh + ${captions.en.length} en captions embedded)`);
