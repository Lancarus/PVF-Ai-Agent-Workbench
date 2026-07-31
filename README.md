# PVF AI Agent Workbench

这是一个给 AI Agent 使用的 DNF / DFO PVF 工作台。

把 Codex、Claude Code、OpenCode、Trae 等 AI 工具的工作区指向这个文件夹，它就能按这里的资料和规则帮你分析 PVF 怎么改、该看哪些文件、哪些地方容易出错。

你可以一句话让 AI Agent 修改任意内容；也可以只将其当做老师，询问修改方法后自行操作。

## 下载使用

点 GitHub 页面右侧的 **Releases**，下载最新版的 **Source code (zip)**。

当前发行包面向 **64 位 Windows**。解压后，用你的 AI Agent 工具打开 `PVF-Agent-Workbench` 文件夹，先运行 `workbench.bat check`，再将这段话发给 AI：

```text
请先只读 AGENTS.md、knowledge-pack/README.zh-CN.md、knowledge-pack/safety/README.zh-CN.md 和 knowledge-pack/indexes/knowledge-index.json。
```

之后，Ai会向你提问：

- 你的 `Script.pvf` 在哪里
- 你想改什么，例如任务、商店、装备、技能、掉落、礼包、宠物或副本
- 是否允许生成新的输出 PVF
- 是否会进游戏实测

新手建议先让 AI 做只读分析，不要一上来就写 PVF。

Node.js 已包含在下载包中，不需要 npm、外部 MCP、TypeSquirrel 或已下架的 VSCode 插件。工作台优先使用 native 后端；如果系统缺少兼容的 Microsoft Visual C++ v14 runtime，会自动降级到内置的纯 JavaScript 只读备用后端。此时仍可查询和读取 PVF，但所有写入都会被硬阻断。`workbench.bat check` 会说明当前状态并给出微软官方页面和 x64 下载链接；也可手动运行 `workbench.bat runtime-help --open`。

## 能帮你做什么

- 查 PVF 字段、路径、ID 和注册表。
- 判断一个修改大概要动哪些文件。
- 用统一只读 dependency planner 预览副本、城镇、怪物、APC、ANI、装备、礼包、宝珠、任务和套装的跨文件依赖。
- 用内置“副本与世界”标准化路线处理地图宽屏补全、worldmap 副本接口布局、深渊组可视化、难度表、地狱名单、城镇预览和 ANI，不需要携带原工具。
- 用产品化能力总路由处理全包质检、双 PVF 语义对比与结果集、通用 LST 生命周期、独立掉落规范化、物品来源反查、技能树布局 / 合并，以及任务 / 礼盒 / 徽章 / 装备复制的原子预览。
- 用 SHA 锁定的只读兼容矩阵比较低噪声功能基线、动作化研究基线和内容兼容上界，不写客户端资源。
- 直接查询随包内置的 NUT API、PVF tag 注释和商城/爆率/registry 等任务书签，不需要另带知识目录。
- 用统一只读查询按需访问任务明确提供的来源、claim、谱系、planner 和客户端矩阵，不把整库塞进上下文。
- 提醒常见崩溃点和格式坑。
- 让 AI 按“只读 -> dry-run -> 受控输出”的路线做事。
- native 无法加载时自动保留只读工作能力；修复运行库以前不能生成输出 PVF。
- 减少 AI 靠猜修改 PVF 的概率。

## 几条底线

- 不要直接覆盖源 PVF。
- 不要默认修改客户端资源。
- 写 PVF 前先确认目标文件、ID、路径和注册表。
- 写出后要 readback 检查。
- 中文文本替换要用 PVF 原始文本，不要把简体显示文本或 HTML 实体写回去。

更多细节交给 AI 按需读取即可：

- [AGENTS.md](AGENTS.md)
- [README.zh-CN.md](README.zh-CN.md)
- [knowledge-pack/README.zh-CN.md](knowledge-pack/README.zh-CN.md)
- [docs/CLEAN-COPY.zh-CN.md](docs/CLEAN-COPY.zh-CN.md)

## 知识包可以拿去用

`knowledge-pack/` 默认使用 CC0。你可以复制、吸收、改写、重新分发，不需要提前问我，也不强制署名。

代码和工具脚本使用 MIT License。

## 有问题怎么办

点页面上方的 **Issues**，把你想改什么、已知 ID/路径、当前现象和尝试过的方法写清楚。

不要上传真实 PVF、客户端文件、账号信息、API key 或私有路径截图。
