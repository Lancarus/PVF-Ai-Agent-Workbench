# NUT 技能 / BUFF / PassiveObject 受控规划流程

状态：需验证

用途：规划新增或改造 NUT 技能链，包括 `load_state` 入口、state/substate、多动作、强制中断、抓取、移动、数据传递、Appendage/BUFF、PassiveObject 和动态攻击包。本文只做规划和核查，不授权直接写 PVF。

## 入口

1. 确认目标 PVF、目标职业/角色分支、意图、是否允许输出 PVF、是否有实机验证。
2. 若需求来自教程/截图/网盘/本地攻略，先走 `task-cards/nut-community-source-clue-triage.zh-CN.md`。
3. 先读取 `dictionaries/nut-runtime-api-boundary-quick.zh-CN.md` 和 `task-cards/skill-state-nut-runtime-readonly-audit.zh-CN.md`。
4. API 名先查 TypeSquirrel；无工具时只把 API 名当候选。

## 只读闭合

1. 解析 `character/character.lst`、目标 `.chr`、职业 skill registry 和目标 `.skl`。
2. 查技能树、SP/TP/Ex/特性覆盖；新技能或灰技能只算阶段性 smoke，不算运行成功。
3. 查 `sqr/character/<job>_load_state.nut` 或职业实际入口。
4. 闭合 `pushScriptFiles`、`pushState`、`pushPassiveObj`。
5. 多动作/强制中断：闭合 `.chr [etc motion]`、ANI、`sq_IntVectPush`、`onSetState` 读取端、`substate` 分支和按键条件。
6. 数据传递：闭合写入顺序和读取顺序，例如 `sq_StartWrite`/`sq_Write*` 对 `receiveData.read*`，或 state vector 对 `sq_GetVectorData`。
7. BUFF/Appendage：闭合 AP 文件路径、`sq_AddFunctionName`、APID/BUFF ID 冲突、有效期、图标、change status 目标、重复挂载和清理。
8. PassiveObject：解析 `passiveobject/passiveobject.lst`，闭合 `.obj`、PO NUT、创建包、接收端、销毁条件、AttackInfo/ATK/ANI 链。
9. 视觉/音效/UI/图标/动画资源只做 Script 引用核查；客户端资源另验。
10. 记录“目标 PVF 已确认 / 教程线索 / TypeSquirrel 候选 / 需实机”。

## 写入前置

1. 用户明确授权写出。
2. 明确源 PVF 和非源路径输出 PVF。
3. 只做最小改动，不重排无关脚本。
4. 使用 raw no-simplified 文本构造 change-set。
5. dry-run 后 apply，写出后重新打开输出 PVF 读回。
6. 生成 manifest 或变更清单。

## 实机验证

- 技能可学习、可放出，但这不是完整验收。
- 多动作、substate、强制中断、按键窗口不乱触发。
- BUFF 图标、持续时间、属性倍率、重复施放、死亡/换图清理。
- PO 创建、轨迹、命中、伤害、销毁、同步、PVP。
- 客户端视觉、音效、IMG/NPK 资源完整性。

## 禁止

- 不把教程代码、图片 OCR、网盘样例直接写入目标 PVF。
- 不把 `dofile`、`sq_RunScript` 或调试 UI 当发布方案。
- 不把教程中的 ID/APID/state/substate/static data index 跨 PVF 硬套。
- 不把 NUT 改动列为低风险。
