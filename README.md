# 且听鲸吟 whisper 🐋

给 DeepSeek Harness **Web GUI 原生运行状态行**（"Deep diving..."）注入鲸鱼视角的趣味轮播文案与气泡动画——不打新插件、不加新 UI 元素，直接增强原生 `TurnStatus` 组件。

## 🎯 核心能力（一眼看懂）

| | 原生 | whisper |
|---|---|---|
| 状态行 | `Deep diving...` 静态流光文字，卡到本轮结束 | 三颗上升气泡 + **120 条中英轮播文案**，动个不停 |
| 换文案时机 | 无 | 每次**工具调用开始**随机换一条（Claude 同款）；纯思考时定时轮播 |
| 运行时长 | 15s 后显示计时器 | 同左（原生保留） |
| 无障碍 | — | `aria-live` 播报 + 减弱动态降级 |

**效果图**（演示页真实截图）：

| 原生 | 增强后 |
|---|---|
| ![原生](docs/demo-initial.png) | ![增强](docs/demo-running.png) |

**🎬 在线演示**：浏览器直接打开 [`docs/demo.html`](docs/demo.html)（或加 `?autoplay=1` 自动演示）——原生 vs 增强对照 + 120 条文案真实轮播 + 计时器，双击即见。

## 特性

- 🫧 **气泡动画**：三颗上升气泡 + 原生 DeepSeek 流光渐变文字
- 🐋 **120 条中英对齐文案**：鲸鱼视角的 Claude 式荒诞小句（「给水母充电…」「叠海浪…」「给沉船擦窗…」）
- ⚙️ **Claude 同款轮播逻辑**：
  - 每次**工具调用开始**随机换一条新文案并固定（排除当前条）
  - 纯思考/流式阶段 4.5s 定时轮播兜底
  - 运行 15s 后显示计时器（原生保留）
- ♿ `prefers-reduced-motion` 自动降级为静态；`aria-live` 播报
- 🔧 **可恢复**：一键 restore + 16 项自检 + unified diff 审阅

## 快速开始

前置：`dsh web` 已安装运行、Node.js ≥ 20.11（使用 `import.meta.dirname`）。

### 方式 A：作为 dsh 插件安装（推荐，一条命令）

```bash
dsh plugin --profile web add <仓库地址或本地路径>
# 例：dsh plugin --profile web add git@github.com:z331281772/whisper.git
```

安装后重启 `dsh web`：插件挂载时 **Node 半区自动检测并打补丁**（幂等，已打则跳过），刷新页面即见效果。卸载：`dsh plugin --profile web remove whisper`（bundle 补丁需用 `node scripts/restore-all.mjs` 还原，或重装 ui-conversation 包）。

> Windows 注意：本地路径跨盘（如 D: 装到 C: 的 profile）会触发 pnpm 的绝对路径 bug，请用 git URL 安装或先建 junction。

### 方式 B：工具链手动打补丁

```bash
git clone <your-repo-url> whisper
cd whisper

node scripts/apply-to-bundle.mjs    # 把 120 条文案写入原生 bundle
node scripts/self-check.mjs         # 16 项回归检查
```

**刷新 dsh Web 页面**（bundle 按 no-cache 重新拉取），发一条消息让 Agent 跑起来，聊天流末尾即可看到效果。

> 非默认安装：`node scripts/apply-to-bundle.mjs --bundle=C:\path\to\dsh-client-ui-conversation\lib\client.js`
> 路径默认取 `$DSH_HOME`（未设置时 `~/.dsh`）下的 `profiles/node_modules/@deepseek-ai/dsh-client-ui-conversation/lib/client.js`。

## 机制

| 时机 | 行为 |
|---|---|
| 新工具调用发起（`runningCalls` 末尾 `callId` 变化） | 随机换一条（绝不与当前条重复）并固定 |
| 无运行中工具（思考/流式） | 4.5s 定时轮播兜底（`DDN_CAPTION_INTERVAL_MS` 可调） |
| 运行 > 15s | 显示运行时长 |
| 系统开启减弱动态 | 全部动画关闭，静态展示 |

文案池由**词表组合生成**（36 个动作 × 70 个物件），采样约束：每物件 ≤3 次、每动作 ≤5 次，保证主题不腻。

## 文件结构

```
whisper/
├── package.json               # dsh 插件规范：dsh.bundle.patch + dsh.client + exports
├── cordis.patch.yml           # 注册进 Web 浏览器 roster
├── lib/
│   ├── index.js               # Node 半区：挂载时自动检测并打补丁（幂等，失败仅告警）
│   └── client.js              # 浏览器半区：满足 roster 契约的空 entry（ModuleLoader 格式）
├── scripts/
│   ├── generate-captions.mjs  # 词表驱动生成器（自定义文案改这里）
│   ├── apply-to-bundle.mjs    # 写入原生 bundle + 同步轮播池大小
│   ├── self-check.mjs         # 16 项回归检查
│   ├── smoke-conversation.mjs # 工厂冒烟测试
│   ├── restore-all.mjs        # 一键检测/恢复（pnpm 升级覆盖后）
│   ├── build-demo.mjs         # 生成 docs/demo.html 演示页
│   └── paths.mjs              # 路径解析（--bundle= 覆盖）
├── dict-zh.txt               # 现成 120 条中文文案（补丁数据）
├── dict-en.txt               # 现成 120 条英文文案（补丁数据）
├── captions.json             # 生成数据（zh/en 对齐）
├── patch/
│   └── ui-conversation-deep-diving.patch   # 完整 unified diff（审阅用）
├── docs/                     # 演示页 + 截图
├── LICENSE                   # MIT
└── README.md
```

## pnpm 升级后恢复

dsh 包升级会把 bundle 覆盖回原生版。一条命令检测并复原：

```bash
node scripts/restore-all.mjs
```

## 自定义文案

编辑 `scripts/generate-captions.mjs` 的 `POOL`（动作前缀 + 中英宾语配对），然后：

```bash
node scripts/generate-captions.mjs 120   # 重新生成
node scripts/apply-to-bundle.mjs         # 写回 bundle
node scripts/self-check.mjs              # 回归检查
```

## 还原原生

- `pnpm install @deepseek-ai/dsh-client-ui-conversation`（重装即还原）
- 或 `git apply -R patch/ui-conversation-deep-diving.patch`（需把路径改为你的 bundle 路径）

## 兼容性

- 目标文件：`@deepseek-ai/dsh-client-ui-conversation` `0.1.0-rc.6` 系列
- 版本升级后若 bundle 结构变化，`apply-to-bundle.mjs` 会报 `expected 2 dict blocks`——说明新版需要适配（可提 issue）

## License

[MIT](LICENSE)
