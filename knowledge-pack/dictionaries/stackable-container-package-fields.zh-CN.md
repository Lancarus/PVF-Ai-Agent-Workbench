# Stackable Container / Package 字段字典

状态：默认可用


## 入口与规模

| 入口 | 目标核验 | 读法 |
| --- | --- | --- |
| `stackable/stackable.lst` | 需在当前目标 PVF 中只读确认 | 所有 stackable 容器/礼包 ID 先走该 registry。 |
| 路径含 package / box / booster / random / select 等关键词 | 需在当前目标 PVF 中只读确认 | 只能当候选范围；最终以字段块为准。 |
| 容器/礼包核心 tag | 需在当前目标 PVF 中只读确认 | 这是字段命中规模，不等于都能实机打开。 |

## Root 与可交互性

| 结构 | 读法 | 边界 |
| --- | --- | --- |
| root wrapper | 按 `stackable/stackable.lst` 和 root `.stk` 读取名称、类型、说明、包装字段。 | registry 存在、说明存在或 iteminfo 存在，不证明可右键交互。 |
| `[stackable type]` | 只能辅助判断普通道具、容器、booster、宝珠、任务物等大类。 | 类型字段不能单独证明开包、抽奖、附魔或发放成功。 |
| child item | 按父块选择 stackable、equipment、creature 或其它 registry 继续闭合。 | child item 可用不反推 root wrapper 可用。 |

## 固定礼包与选择礼包

| 字段 | 目标核验 | 边界 |
| --- | --- | --- |
| `[package data]` | 需在当前目标 PVF 中只读确认 | 候选 ID 必须按上下文解析；同一数字可能在多个 registry 中存在，不能凭数字大小判断；该字段不证明 root 可打开。 |
| `[package data selection]` | 需在当前目标 PVF 中只读确认 | 静态只读只证明可选候选配置，不证明实机 UI 可选、限选数量正确或发放成功。 |
| `[avatar package preview info]` | 需在当前目标 PVF 中只读确认 | PVF 引用不证明客户端 IMG 存在或预览 UI 正常。 |
| `[secret add item]` | 需在当前目标 PVF 中只读确认 | 只能作为额外物品线索；触发条件和发放仍需实机。 |

## Booster / 选择器

| 字段 | 目标核验 | 边界 |
| --- | --- | --- |
| `[booster info]` | 需在当前目标 PVF 中只读确认 | 空体不等于无效；具体交互、选择、随机和产物生成仍需运行验证。 |
| `[booster category num]` | 需在当前目标 PVF 中只读确认 | 数字列不能脱离后续分类块解释。 |
| `[booster selection num]` | 需在当前目标 PVF 中只读确认 | 不证明实机限选数量或 UI 正常。 |
| `[booster select category]` | 需在当前目标 PVF 中只读确认 | 分类块内数字列需结合相邻候选块读取，不能裸猜。 |
| `[booster category name]` | 需在当前目标 PVF 中只读确认 | 显示文本不证明分类内容完整或客户端字库正常。 |
| `[hide booster info]` | 需在当前目标 PVF 中只读确认 | 只作为隐藏显示线索；不证明 UI 行为。 |
| `[booster equipment upgrade]` | 需在当前目标 PVF 中只读确认 | 只按特殊选择器字段保留；升级逻辑需另验。 |

## 候选池块

| 字段 | 目标核验 | registry 口径 |
| --- | --- | --- |
| `[equipment]` | 需在当前目标 PVF 中只读确认 | 走 `equipment/equipment.lst`，不要按 stackable 解释。 |
| `[avatar]` | 需在当前目标 PVF 中只读确认 | 仍走 `equipment/equipment.lst`，并保留 avatar 父块上下文。 |
| `[stackable]` | 需在当前目标 PVF 中只读确认 | 走 `stackable/stackable.lst`。 |
| `[creature]` | 需在当前目标 PVF 中只读确认 | 优先按 equipment creature 商品/蛋语境核查；不要直接跳到 `creature/creature.lst`。 |
| `[recommend]` | 需在当前目标 PVF 中只读确认 | 推荐候选不是完整候选池，仍需按块内 ID 解析。 |
| `[default select]` | 需在当前目标 PVF 中只读确认 | 默认选择不证明玩家不能改选或 UI 正常。 |
| `[result item]` | 需在当前目标 PVF 中只读确认 | 结果 ID 需按上下文解析；权重不等于已验证概率，也不证明产物已发放。 |
| `[consume item]` | 需在当前目标 PVF 中只读确认 | 静态存在不证明实机扣除成功。 |
| `[target item id]` | 需在当前目标 PVF 中只读确认 | 只作为目标物品 ID 线索；父块决定 registry。 |

## 随机箱

| 字段 | 目标核验 | 边界 |
| --- | --- | --- |
| `[random]` | 需在当前目标 PVF 中只读确认 | 不证明随机逻辑已实机运行。 |
| `[random list]` | 需在当前目标 PVF 中只读确认 | 候选 ID 要逐项解析；权重列、保底、重复项、最终概率和产物生成必须实机或更强证据确认。 |

## 实机反馈规则

- 实机 UI 未显示 stackable ID 不构成缺口。应由 Agent 先用 registry 和容器候选池闭合 ID，再以可见名称、数量和行为接收反馈。

## 常见误判

- 不要把 `[package data]` 的所有数字都解释成物品 ID；数量、权重、分类或标志列也会混在同一行。
- 不要把 `[package data]` 写成 root wrapper 可交互或可开启。
- 不要把 `[avatar]` 候选按 stackable 解析；avatar 是 equipment 语境。
- 不要把 `[creature]` 候选直接按 `creature/creature.lst` 解析；样本中它常闭合到 `equipment/creature` 的宠物或宠物蛋。
- 不要把宠物蛋、宠物道具和 creature 本体混为同一层。
- 不要把资源预览字段写成客户端资源完整。
