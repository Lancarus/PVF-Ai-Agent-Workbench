# Upgrade / Reinforce / Amplify / Enchant / Recipe Boundary

状态：默认可用


## 审计快照

| 项 | 目标核验 | 跨版本候选；需在当前目标 PVF 中复核 | 差异提示 |
| --- | ---: | ---: | --- |
| PVF 文件总数 | 需在当前目标 PVF 中只读确认 | 1052773 | 辅助体量更大。 |
| `equipment/equipment.lst` 条目 | 需在当前目标 PVF 中只读确认 | 107413 | 辅助装备 registry 更大。 |
| `stackable/stackable.lst` 条目 | 需在当前目标 PVF 中只读确认 | 20604 | 辅助消耗品 registry 更大。 |
| `itemshop/itemshop.lst` 条目 | 需在当前目标 PVF 中只读确认 | 147 | 辅助商店 registry 更大。 |
| `npc/npc.lst` 条目 | 需在当前目标 PVF 中只读确认 | 473 | 辅助 NPC registry 更大。 |


| 字段/线索 | 目标核验 | 代表文件 | 静态结论 |
| --- | ---: | --- | --- |
| `[equipment upgrade]` | 需在当前目标 PVF 中只读确认 | `equipment/character/common/magicstone/n_magicstone_450135.equ` | 装备条件块可按 `upgrade`/`amplify` 条件写入 `.equ`。 |
| `[not amplify]` | 需在当前目标 PVF 中只读确认 | `equipment/character/fighter/weapon/knuckle/102000029.equ` | 装备侧存在禁止增幅样标记。 |
| `[limit upgradable level]` | 需在当前目标 PVF 中只读确认 | `equipment/character/common/belt/larmor/111612.equ` | 装备侧可写普通强化与增幅强化等级段。 |
| `[impossible contents]` | 需在当前目标 PVF 中只读确认 | `equipment/character/common/magicstone/n_magicstone_450135.equ` | 装备侧可写不可参与内容 token。 |
| `[possible kiri protect]` | 需在当前目标 PVF 中只读确认 | 多数装备文件 | 保护相关空标签广泛存在。 |
| `[upgrade prob increase]` | 需在当前目标 PVF 中只读确认 | `equipment/character/common/title/vip_club.equ` | 强化概率修饰字段存在。 |
| `[upgrade cost discount]` | 需在当前目标 PVF 中只读确认 | `equipment/character/common/title/vip_club.equ` | 强化费用折扣字段存在。 |
| `[assault cost discount]` | 需在当前目标 PVF 中只读确认 | `equipment/character/common/title/i_am_bully.equ` | 街头争霸费用折扣与强化费用不是同一字段。 |
| `[item overpower part]` | 需在当前目标 PVF 中只读确认 | `equipment/character/common/jacket/cloth/100050072.equ` | 少量套装装备可见特殊空标签。 |
| `[expertjob only]` | 需在当前目标 PVF 中只读确认 | `equipment/character/common/support/support_440352.equ` | 副职业限制字段存在于装备和部分 stackable。 |
| `[prof compound rate]` | 需在当前目标 PVF 中只读确认 | `equipment/character/common/wrist/brac_22237.equ` | 专业制作/合成率修饰线索存在。 |
| `[prof result variation]` | 需在当前目标 PVF 中只读确认 | `equipment/character/common/support/support_440352.equ` | 专业制作结果变化线索存在。 |
| `[prof disjoint result variation]` | 需在当前目标 PVF 中只读确认 | `equipment/character/common/support/support_440353.equ` | 分解结果变化线索存在。 |
| `[prof material variation]` | 需在当前目标 PVF 中只读确认 | `equipment/character/common/support/support_440355.equ` | 材料变化线索存在。 |
| `[prof additional gain exp]` | 需在当前目标 PVF 中只读确认 | `equipment/character/common/wrist/brac_22235.equ` | 副职业经验修饰线索存在。 |
| `[stackable type]` + `` `[recipe]` `` | 需在当前目标 PVF 中只读确认 | `stackable/professional/recipe/rcp_equip_enchant1.stk` | stackable 配方道具大族存在。 |
| `[bead item]` | 需在当前目标 PVF 中只读确认 | `stackable/professional/recipe/rcp_28.stk` | 配方道具中常见宝珠/产物相关闭合块。 |
| `[enchant]` | 需在当前目标 PVF 中只读确认 | `stackable/monstercard/mcard_agaress.stk`、`stackable/emblem/blue/brightemblem2_bluehitrate.stk` | 附魔字段跨怪物卡片和徽章等父类型出现，必须按父类型区分。 |
| 文件名含 `Recipe` | 需在当前目标 PVF 中只读确认 | `itemshop/recipe1.shp`、`stackable/professional/recipe/*.stk` | 配方线索横跨 itemshop、stackable 和 etc 索引。 |


| 链路 | 目标核验 | 已闭合 registry | 边界 |
| --- | --- | --- | --- |
| 装备条件 | 需在当前目标 PVF 中只读确认 | 文件本体来自 `equipment/equipment.lst` 家族。 | 只证明装备效果条件配置，不证明强化/增幅状态实机正确。 |
| 禁止增幅 | 需在当前目标 PVF 中只读确认 | 装备 ID 按 `equipment/equipment.lst`。 | 不证明服务端拒绝增幅或保护券生效。 |
| 等级限制 | 需在当前目标 PVF 中只读确认 | 装备 ID 按 `equipment/equipment.lst`。 | 不证明最终可强化等级判断。 |
| 强化概率/费用 | 需在当前目标 PVF 中只读确认 | 装备称号按 `equipment/equipment.lst`。 | 不证明最终概率、叠加规则或金币扣除。 |
| 副职业修饰 | 需在当前目标 PVF 中只读确认 | `22237` 按 `equipment/equipment.lst` 为附魔手镯。 | 不证明制作成功率公式。 |
| 配方道具 | 需在当前目标 PVF 中只读确认 | `2600507` 按 `stackable/stackable.lst` 为附魔师设计图。 | 不硬命名全部 `[int data]` 列，不证明学习或制作成功。 |
| 配方商店 | 需在当前目标 PVF 中只读确认 | 8238、1284、1183 均按 `stackable/stackable.lst` 解析为增幅/扭转/净化相关消耗品。 | 不证明 NPC 商店 UI、购买或金币扣除成功。 |
| 诺顿配方入口 | 需在当前目标 PVF 中只读确认 | `13` 按 `npc/npc.lst` 为诺顿。 | 需在当前目标 PVF 中只读确认 |
| 怪物卡片附魔 | 需在当前目标 PVF 中只读确认 | `3701` 按 stackable 为阿加雷斯卡片；`61165` 按 monster 为混乱的阿加雷斯；`3340` 按 stackable 为百万金币。 | 不证明卡片附魔成功、材料扣除或 UI 卡面显示。 |
| 徽章附魔 | 需在当前目标 PVF 中只读确认 | 徽章仍按 `stackable/stackable.lst`。 | 属于 avatar/emblem/socket 边界，不等同怪物卡片附魔。 |

## `itemshop/itemshop.lst` 配方入口

| itemshop ID | 注册文件 | 目标核验 |
| ---: | --- | --- |
| 8 | `Recipe1.shp` | 需在当前目标 PVF 中只读确认 |
| 32 | `Recipe2.shp` | 需在当前目标 PVF 中只读确认 |
| 35 | `Recipe3.shp` | 需在当前目标 PVF 中只读确认 |


| 字段/线索 | 目标核验 | 跨版本候选；需在当前目标 PVF 中复核 | 只读提示 |
| --- | ---: | ---: | --- |
| `[equipment upgrade]` | 需在当前目标 PVF 中只读确认 | 12 | 需在当前目标 PVF 中只读确认 |
| `[not amplify]` | 需在当前目标 PVF 中只读确认 | 141 | 基本同形，但数量不同。 |
| `[limit upgradable level]` | 需在当前目标 PVF 中只读确认 | 53 | 等级限制分布差异很大。 |
| `[upgrade prob increase]` | 需在当前目标 PVF 中只读确认 | 16 | 辅助概率修饰命中更多。 |
| `[upgrade cost discount]` | 需在当前目标 PVF 中只读确认 | 7 | 数量一致不代表数值或文件完全一致。 |
| `[expertjob only]` | 需在当前目标 PVF 中只读确认 | 27 | 辅助多 1 个命中。 |
| `[prof compound rate]` | 需在当前目标 PVF 中只读确认 | 4 | 辅助可见额外命中。 |
| `[bead item]` | 需在当前目标 PVF 中只读确认 | 583 | 辅助配方/宝珠类配置更多。 |
| `[enchant]` | 需在当前目标 PVF 中只读确认 | 2484 | 辅助附魔相关配置更多。 |
| `[stackable type]` + `` `[recipe]` `` | 需在当前目标 PVF 中只读确认 | 8879 | 辅助配方道具量级更大。 |
| 文件名含 `Recipe` | 需在当前目标 PVF 中只读确认 | 7488 | 辅助有大量 recipe 相关文件。 |

辅助代表差异：

- 辅助 `itemshop/itemshop.lst` 同样注册 `Recipe1.shp`、`Recipe2.shp`、`Recipe3.shp`，但 itemshop 条目总数为 147。

## 静态与动态边界

静态只读可以确认：

- 字段、闭合块、文件家族、registry 路由和代表 ID 解析。
- 某些装备、stackable、itemshop、NPC 文件之间存在静态链路。

静态只读不能确认：

- 强化、增幅、附魔、制作、学习、购买、材料扣除、金币扣除或装备状态改变成功。
- 强化概率、增幅概率、费用折扣、制作成功率、产物数量或材料变化的最终公式。
- NPC 对话、商店 UI、附魔 UI、配方 UI、卡片卡面、徽章镶嵌 UI 或客户端资源完整。
- 服务端是否采用这些字段、是否放行、是否另有覆盖规则。
