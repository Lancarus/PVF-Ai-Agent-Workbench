# NUT 社区教程来源线索分流

状态：默认可用

## 适用

用于处理 B 站、贴吧、论坛、网盘说明、本地 nut 攻略、函数声明 stub、截图/OCR 等 NUT/Squirrel 教程资料的只读分流。

## 先读

- `safety/README.zh-CN.md`
- `dictionaries/nut-runtime-api-boundary-quick.zh-CN.md`
- `task-cards/skill-state-nut-runtime-readonly-audit.zh-CN.md`
- `workflows/nut-skill-buff-po-controlled-planner.zh-CN.md`

## 执行

1. 记录资料类型和可访问范围，只提炼主题、入口、API 名、风险点。
2. 不复制教程全文、截图、网盘文件、源码转储或本地证据路径进 clean knowledge-pack。
3. 将教程中的技能 ID、state、substate、PO ID、APID、路径、static data index 标为 `source-clue` 线索。
4. 本地资料较多时，先用 `workbench.bat nut-source scan --source <file-or-directory>` 生成外部 source-clue 报告，再人工挑选可迁移规则。
5. 回目标 PVF 查职业 registry、skill `.lst`、目标 `.skl`、`load_state`、`pushState`、`pushPassiveObj`、appendage/PO 文件。
6. API 名优先 TypeSquirrel；无 TypeSquirrel 时只能标“需 TypeSquirrel 或目标 PVF 同类脚本核验”。
7. 对 `dofile`、`sq_RunScript`、调试 UI、外部热加载标为本地调试线索，不能作为发布 PVF 默认方案。
8. 输出分为：可迁移流程规则、目标 PVF 待核线索、禁止直接照抄项、需实机验证项。

## 验收

- 没有把社区教程当目标 PVF 事实。
- 没有把裸数字 ID 当事实。
- 没有把教程代码直接改入 PVF。
- 已说明哪些内容仍需目标 PVF、TypeSquirrel、客户端资源或实机验证。
