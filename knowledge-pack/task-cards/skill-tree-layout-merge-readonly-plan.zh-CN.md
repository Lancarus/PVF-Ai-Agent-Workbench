# 技能树布局与合并只读计划

状态：需验证

用途：审计 SP / TP 技能树坐标、连线和职业 registry，并为多职业显示合并生成最小 preview。

## 先读

- `dictionaries/skill-tree-layout-merge-fields.zh-CN.md`
- `workflows/skill-tree-layout-and-merge-safety.zh-CN.md`
- `task-cards/character-job-growtype-class-enum-readonly-audit.zh-CN.md`

## 最小输入

- 目标 PVF、职业分支、SP 或 TP。
- 只审计布局，或提供源职业、目标 segment 和过滤条件。

## 执行

1. 从 skilllist 和正确职业 registry 闭合每个技能。
2. 保留原 segment、未知块和格式，报告重复节点 / 格位 / 坐标 / 连线。
3. 合并只加入指定 segment，不清空基础职业段。
4. `.skl` learnability 作为独立审计，不随布局自动改变。

## 运行判定

- 显示节点加入非适配 growtype 后，节点不显示或显示但不能学习，均可作为“未扩大 learnability”的安全结果。
- 只有非适配角色实际学会目标技能，才判定跨 growtype 学习隔离失败。
- TP 因基础 SP 不可学习而被连带拦截时，不把结果扩写为 TP 前置等级或扣点规则已独立验证。
- 优先一次验证最高风险，不为每个节点或普通 UI 做普遍性实机。

## 禁止

- 把 `at*` 分支当觉醒 / TP / Ex。
- SP 与 TP 混写。
- 因节点上树就自动扩大 growtype `0..4`。
- 整段重建并覆盖未修改 segment。
