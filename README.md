# 且听鲸吟 whale-whisper 🐋

[English](README_EN.md)

给 DeepSeek Harness Web 界面的原生运行状态行（"Deep diving..."）加上鲸鱼视角的轮播文案和上升气泡。

| 原生 | 增强后 |
|---|---|
| ![原生](docs/demo-initial.png) | ![增强](docs/demo-running.png) |

🎬 浏览器打开 [`docs/demo.html`](docs/demo.html) 可看对照演示。

## 效果

- 🫧 三颗上升气泡动画
- 🐋 120 条中文 + 120 条英文趣味文案（「给水母充电…」「叠海浪…」），4.5 秒一换
- 🌐 自动跟随界面语言（中/英）
- ⏱ 保留原生计时器（运行 15 秒后显示）
- ♿ 支持 `prefers-reduced-motion` 降级与 `aria-live` 播报

## 安装

```bash
dsh plugin --profile web add git@github.com:z331281772/whale-whisper.git
```

重启 `dsh web` 并刷新页面即可。适配 dsh `0.1.0-rc.6`。

## 卸载

```bash
dsh plugin --profile web remove whale-whisper
```

如需还原原生状态行，插件已在首次打补丁时备份了原 bundle：

```bash
B=~/.dsh/profiles/node_modules/@deepseek-ai/dsh-client-ui-conversation/lib/client.js
cp "$B.whale-whisper.bak" "$B"
```

或直接重装 `@deepseek-ai/dsh-client-ui-conversation` 包。

## 自定义文案

编辑 `captions.json`（zh/en 两个数组，条数任意），重装 ui-conversation 包后重启 `dsh web` 生效。

## License

[MIT](LICENSE)
