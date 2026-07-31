# PVF 原子内容生成只读计划

状态：需验证

用途：为通关任务、礼盒、白金徽章或装备复制组织完整的新文件、registry 和引用 preview。

## 先读

- `dictionaries/atomic-content-generation-fields.zh-CN.md`
- `workflows/atomic-content-generation.zh-CN.md`
- `safety/README.zh-CN.md`

## 最小输入

- 目标 PVF。
- `clear-quest / box / platinum-emblem / equipment-copy`。
- 业务参数、是否允许输出新 PVF、是否可实机。

## 执行

1. 分别解析每种实体的 registry 和 ID。
2. 为每种新脚本读取目标约 3 个同类近邻样本。
3. 输出新脚本、registry 行、引用方、unresolved 和客户端候选的原子图。
4. Boss、技能、物品自动解析结果保留 candidate 状态。
5. 任一原子成员阻断则不生成 apply。
6. 实机表由 Agent 预先固定 `ID -> 插入顺序 -> 可见名称 / 行为`；客户端不显示数字 ID 时，不要求测试者猜代码。

## 禁止

- 把通关任务 Boss 候选写成已证明会掉任务物。
- 用固定任务 ID 范围、图标、稀有度或属性作为全版本默认。
- 离开目标近邻样本拼接礼盒 / 徽章模板。
- 装备复制时自动复制或修改客户端资源。
