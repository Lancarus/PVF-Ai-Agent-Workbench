# Skill Learnability / Skill Tree / Command / Cooldown 边界

状态：需验证

用途：回答技能脚本存在之后，角色如何学会、如何显示、如何满足输入、冷却与等级条件。

## 分层入口

| 层 | 常见字段或文件 | 边界 |
| --- | --- | --- |
| 职业 registry | `skill/skilllist.lst` 与职业 skill `.lst` | 同一数字可在不同职业指向不同技能；先定职业分支。 |
| `.skl` 学习 | `[required level]`、`[purchase cost]`、`[skill class]`、`[maximum level]`、growtype 字段 | 说明静态学习形状，不证明 UI 或服务端允许学习。 |
| 主动输入 | `[command]`、`[command key explain]`、`[executable states]` | 说明输入和状态候选，不证明释放成功。 |
| 资源消耗 | `[consume MP]`、其他目标文件中的消耗字段 | 列形必须按目标样本确认。 |
| 冷却 | `[cool time]`、`[start cool time]`、`[auto cooltime apply]` 与脚本冷却调用 | 静态字段、NUT 调用和 UI 显示是不同层。 |
| SP / TP 树 | `clientonly/skilltree/*_sp.co`、`*_tp.co` | 显示节点和前置线不能替代 `.skl` learnability。 |
| 默认技能 | `.chr [skill]`、growtype 段、`[awakening skill]` | 默认授予与技能树可点是不同入口。 |
| PVP 表 | `etc/pvpskilltree/*` | PVP 静态入口不覆盖普通技能树。 |
| common / cancel | common 与 cancel skill 列表 | 取消列表不是学习来源；公共技能仍按适用职业解析。 |

## 固定规则

- `atfighter`、`atgunner`、`atmage` 等是独立角色 / 职业分支，不是同名职业的觉醒、TP 或 Ex 阶段。
- 把技能加入 SP/TP 布局不会自动扩大 `.skl` 的 growtype 可学范围。
- `[next skill]` 是技能树显示前置候选，不等于 `.skl [pre required skill]`。
- `[skill levelup]` 是装备或其他系统的等级变更入口，不是学习费用。
- 任何写入都先读取目标职业的 registry、`.skl`、SP/TP/PVP/默认技能入口，并保持原始 segment、顺序、坐标和未知字段。
- 是否真正可学、扣点、默认获得、冷却显示与运行成功需要目标版本验证。

继续读取：

- `dictionaries/skill-learnability-command-cooldown-fields.zh-CN.md`
- `indexes/skill-tree-default-pvp-entry-boundary.zh-CN.md`
- `indexes/skill-learnability-cost-sp-tp-ui-boundary.zh-CN.md`
- `workflows/skill-tree-layout-and-merge-safety.zh-CN.md`
