# PVF-Agent-Workbench 变更记录

## 1.1.0 - 2026-07-06

新增 DNF 动作游戏现代化改造知识路线。

- 将动作化拼刀 / 相杀入口升级为“DNF动作游戏现代化改造”任务卡和流程。
- 新增 `action-game-modernization` 路由别名。
- 补入普通相杀 / 拼刀、protection-only 顶招、不屈意志读条保护、破招专题边界四类处理口径。
- 固化已验证默认值：减伤上限 `10`、常规 protection-only `20`、慢启动特殊项 `40`、不屈读条尾窗 `castTime + 200ms`。
- 明确反馈吸收分类：PASS 登记、测试卡口径、技能栏不可达、protection-only 正常表现、PVF 行为错误、信息不足。
- 将该主线加入已完成封存状态，后续默认复核而非重开大规模采样。

## 1.0.0 - 2026-06-20

首次公开发布。

- 提供可由 Codex、Claude Code、OpenCode、Trae 等命令型桌面 Agent 使用的便携 PVF 工作台。
- 支持项目级 Agent Skill、MCP 接入和 `workbench.bat` 命令行降级通道。
- 默认只读；PVF 写出必须使用显式输出、时间戳备份、最小修改、保存清单和 readback。
- 内置纯净 knowledge-pack、任务路由、字段词典、工作流、环境检查、Agent 回归评测和三阶段发布门禁。
- 真实 PVF、客户端、机器路径、索引、报告和 release stage 不进入干净 Workbench。
- 运行产物默认保存在 Workbench 外部，并由纯净度检查阻止回写到源目录。
