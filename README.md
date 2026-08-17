# Deep Diving Status

给 DeepSeek Harness **Web GUI 原生运行状态行**注入 Claude 风格的趣味轮播文案与气泡动画——不打新插件、不加新 UI 元素，直接增强原生 `TurnStatus` 组件（聊天流末尾的 "Deep diving..." 流光文字）。

> 效果：Agent 运行时聊天流末尾出现原生流光渐变文字 + 三颗上升气泡 + 轮播文案（「给水母充电…」「叠海浪…」），15s 后附运行计时器。可在 `docs/` 自行放截图。

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

```bash
git clone <your-repo-url> deep-diving-status
cd deep-diving-status

node apply-to-bundle.mjs    # 把 120 条文案写入原生 bundle
node self-check.mjs         # 16 项回归检查
```

**刷新 dsh Web 页面**（bundle 按 no-cache 重新拉取），发一条消息让 Agent 跑起来，聊天流末尾即可看到效果。

> 非默认安装：`node apply-to-bundle.mjs --bundle=C:\path\to\dsh-client-ui-conversation\lib\client.js`
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
deep-diving-status/
├── generate-captions.mjs     # 词表驱动生成器（自定义文案改这里）
├── apply-to-bundle.mjs       # 写入原生 bundle + 同步轮播池大小
├── self-check.mjs            # 16 项回归检查
├── smoke-conversation.cjs    # 工厂冒烟测试
├── restore-all.mjs           # 一键检测/恢复（pnpm 升级覆盖后）
├── paths.mjs                 # 路径解析（--bundle= 覆盖）
├── dict-zh.txt               # 现成 120 条中文文案（可直接应用）
├── dict-en.txt               # 现成 120 条英文文案
├── captions.json             # 生成数据（zh/en 对齐）
├── patch/
│   └── ui-conversation-deep-diving.patch   # 完整 unified diff（审阅用）
├── LICENSE                   # MIT
└── README.md
```

## pnpm 升级后恢复

dsh 包升级会把 bundle 覆盖回原生版。一条命令检测并复原：

```bash
node restore-all.mjs
```

## 自定义文案

编辑 `generate-captions.mjs` 的 `POOL`（动作前缀 + 中英宾语配对），然后：

```bash
node generate-captions.mjs 120   # 重新生成
node apply-to-bundle.mjs         # 写回 bundle
node self-check.mjs              # 回归检查
```

## 还原原生

- `pnpm install @deepseek-ai/dsh-client-ui-conversation`（重装即还原）
- 或 `git apply -R patch/ui-conversation-deep-diving.patch`（需把路径改为你的 bundle 路径）

## 兼容性

- 目标文件：`@deepseek-ai/dsh-client-ui-conversation` `0.1.0-rc.6` 系列
- 版本升级后若 bundle 结构变化，`apply-to-bundle.mjs` 会报 `expected 2 dict blocks`——说明新版需要适配（可提 issue）

## License

[MIT](LICENSE)
