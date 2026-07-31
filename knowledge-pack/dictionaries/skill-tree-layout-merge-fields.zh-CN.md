# 技能树布局与合并词典

状态：需验证

## 路径与身份

| 层 | 常见入口 | 作用 |
| --- | --- | --- |
| 职业入口 | `skill/skilllist.lst` | 选择正确职业技能 registry。 |
| 技能 registry | 对应职业的 skill `.lst` | 将技能 ID 解析到 `.skl`。 |
| SP 树 | `clientonly/skilltree/*_sp.co` | 普通技能树分段、节点、坐标与连线候选。 |
| TP 树 | `clientonly/skilltree/*_tp.co` | TP / EX 显示入口；不能与 SP 自动合并。 |
| 技能本体 | `.skl` | 学习等级、费用、growtype 适配与运行脚本入口。 |

`atfighter`、`atgunner`、`atmage` 等是独立角色 / 职业分支。必须先从目标职业入口闭合，不能当作同名职业的觉醒、TP 或 Ex 阶段。

## 节点最小模型

一个布局节点至少记录：

- 所属原始 segment / `[character job]` 块。
- skill ID 及正确职业 registry 解析结果。
- X / Y 坐标。
- `[next skill]` 等显示连线候选。
- 原始顺序、未知字段、注释和格式。

## 冲突类别

- 同一 segment 内重复 skill ID。
- 两个不同技能占用同一格位或坐标。
- `[next skill]` 指向不存在、跨错职业或形成异常环。
- 节点存在但职业 registry 不解析。
- `.skl` 存在但学习条件 / growtype 与目标分支不闭合。
- SP / TP / PVP / 默认技能入口被混为一套。

技能树布局只说明显示与连线候选，不证明可学、扣点、默认获得或运行成功。

## 合并硬边界

- 不清空基础职业段后整段重写。
- 不用画布上的出现顺序覆盖目标原 segment。
- 不因为把技能放入技能树，就自动把 `.skl` 的可学 growtype 扩大到 `0..4`。
- 不把多职业合并理解为多职业均可学习；learnability 必须单独审阅并由用户明确授权。
