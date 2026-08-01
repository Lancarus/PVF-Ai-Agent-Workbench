# PVF 原子内容生成词典

状态：需验证

## 原子内容

“原子”不是指只改一个文件，而是指一个业务内容涉及的脚本、registry 和引用方必须作为同一计划同时成功或同时阻断。

| 生成类别 | 最小原子集合 |
| --- | --- |
| 通关任务 | dungeon / Boss 候选、证明物 `.stk`、`stackable.lst`、任务 `.qst`、`n_quest/quest.lst`、奖励物引用。 |
| 礼盒 | wrapper `.stk`、候选物 ID / 数量 / 期限 / 权重、`stackable.lst`，以及目标同类 booster / package 结构。 |
| 白金徽章 | `skill/skilllist.lst`、正确职业技能 registry、技能 `.skl`、徽章 `.stk`、`stackable.lst`。 |
| 装备复制 | 源 `.equ`、新路径、新 ID、`equipment.lst`、技能增强引用和客户端资源候选。 |

## ID 分配

- 任务 ID、证明物 ID、礼盒 ID、徽章 ID 和装备 ID 分别在各自 registry 分配，不能共用一个“空闲号”结论。
- 扫描目标 registry 的已用 ID、路径冲突和预留约定；数字范围只可作为用户选择或工具输入限制，不能提升为 PVF 事实。
- 新路径不能等于源路径；同路径重复登记必须阻断。

## 模板边界

- 新 `.qst/.stk/.equ` 必须从目标 PVF 约 3 个同目录、同用途近邻样本确认块顺序、闭合、TAB、空列和配套字段。
- 礼盒可能使用 `[booster]`、`[booster random]`、`[booster selection]` 或其他目标结构；不能离开近邻样本凭字段名拼模板。
- 白金徽章的图标、稀有度、默认属性和职业 token 不可硬编码为跨版本事实。
- 装备 `[skill levelup]` 与 `[skill data up]` 的技能 ID、列义分别复核；不复制客户端资源。

## 候选不等于事实

自动解析出的 Boss、掉落者、奖励来源或技能只是一组候选。尤其通关任务向导中的 Boss 推断不能写成“已证明会掉落”；必须保留手工覆盖与 unresolved 状态。
