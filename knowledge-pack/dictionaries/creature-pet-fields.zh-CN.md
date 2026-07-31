# Creature / Pet 字段字典

状态：默认可用


## 入口与 registry

| 入口 | 目标核验 | 读法 |
| --- | --- | --- |
| `creature/creature.lst` | 需在当前目标 PVF 中只读确认 | 宠物本体 `.cre` 的主 registry。 |
| `creature/creature.jpn.lst` | 需在当前目标 PVF 中只读确认 | 辅助/地区化 registry；不要替代主 `creature.lst`。 |
| `creature/script/creature.lst` | 需在当前目标 PVF 中只读确认 | `.wrd` 文本/脚本入口，不是宠物本体文件。 |
| `pet/pet.lst` | 需在当前目标 PVF 中只读确认 | pet 是独立 registry，不等同 creature registry。 |
| `equipment/equipment.lst` -> `equipment/creature/*.equ` | 需在当前目标 PVF 中只读确认 | 宠物道具、宠物蛋和宠物装备走 equipment registry。 |
| `passiveobject/creature/` | 需在当前目标 PVF 中只读确认 | 宠物技能/效果运行资源入口；静态存在不证明实机技能成功。 |

## Creature 本体 `.cre`

| 字段 | 目标核验 | 边界 |
| --- | --- | --- |
| `[name]` | 需在当前目标 PVF 中只读确认 | 显示文本不证明客户端字库或 UI 正常。 |
| `[width]`、`[floating height]`、`[layer]`、`[gravity]` | 需在当前目标 PVF 中只读确认 | 不证明实机跟随位置或碰撞表现。 |
| `[move speed]` | 需在当前目标 PVF 中只读确认 | 实际跟随、路径和同步需实机。 |
| `[start level]`、`[permission level]`、`[max level]`、`[parent max level]` | 需在当前目标 PVF 中只读确认 | 不证明经验获取、升级或成长曲线正确。 |
| `[artifact slot]` | 需在当前目标 PVF 中只读确认 | 只证明槽位配置，不证明宠物装备实机可装或属性生效。 |
| `[skill recovery time]`、`[over skill recovery time]`、`[skill MP]`、`[over skill MP]` | 需在当前目标 PVF 中只读确认 | 不证明技能可释放、扣 MP 或冷却 UI 正常。 |
| `[basic motion]`、`[walk motion]`、`[run motion]`、`[skill motion]`、`[over skill motion]`、`[response motion]`、`[etc motion]` | 需在当前目标 PVF 中只读确认 | PVF 引用不证明客户端动画资源完整。 |
| `[attack info]` | 需在当前目标 PVF 中只读确认 | 攻击文件存在不证明命中、伤害或目标选择。 |
| `[skill string]`、`[skill explain]`、`[string data]`、`[int data]` | 需在当前目标 PVF 中只读确认 | 文本和参数不能直接写成运行效果。 |
| `[evolution quest]`、`[evolution creature id]`、`[evolution level]` | 需在当前目标 PVF 中只读确认 | 不证明任务可接、进化成功或材料扣除。 |
| `[using random skill]`、`[random motion]` | 需在当前目标 PVF 中只读确认 | 随机分布和运行触发需实机或日志。 |

## Equipment Creature `.equ`

| 字段 | 目标核验 | registry 口径 |
| --- | --- | --- |
| `[equipment type]` | 需在当前目标 PVF 中只读确认 | 都属于 equipment registry 下的装备类道具，不是 stackable。 |
| `[sub type]` | 需在当前目标 PVF 中只读确认 | sub type 含义需结合样本和实机确认，不能只凭数值改造。 |
| `[creature species]` | 需在当前目标 PVF 中只读确认 | 大多数情况下按 creature registry 复核；未闭合项必须记录风险。 |
| `[output index]` | 需在当前目标 PVF 中只读确认 | 它是 equipment ID 语境，不是 `creature/creature.lst` ID。 |
| `[need material]` | 需在当前目标 PVF 中只读确认 | 材料 ID 按 stackable 等正确 registry 解析；静态存在不证明扣除成功。 |
| `[creature minimum level]` | 需在当前目标 PVF 中只读确认 | 不证明实机可装备或等级检查通过。 |
| `[creature physical attack]`、`[creature magical attack]`、`[creature skill charge time rate]`、`[creature skill over charge time rate]`、`[creature experience amount rate]` 等 | 需在当前目标 PVF 中只读确认 | 属性字段存在不证明最终面板、生效范围或服务端放行。 |
| `[passive object]` | 需在当前目标 PVF 中只读确认 | 只作为运行资源入口线索，不证明触发。 |

## Pet `.pet`

| 字段 | 目标核验 | 边界 |
| --- | --- | --- |
| `pet/pet.lst` | 需在当前目标 PVF 中只读确认 | pet registry 很小，不能把 creature 主体都归入 pet。 |
| `[basic motion]`、`[etc motion]`、`[attack info]`、`[int data]`、`[name]` | 需在当前目标 PVF 中只读确认 | 只能证明 pet 文件结构存在；不证明实机宠物系统等同 creature 系统。 |

## 常见误判

- 不要把 `equipment/creature/*.equ` 的 ID 当成 `creature/creature.lst` ID。
- 不要把 `[output index]` 写成 creature ID；当前观察它闭合到 equipment registry。
- 不要把 `[creature species]` 无脑当作一定闭合；当前有未闭合样本。
- 不要把宠物装备 artifact 写成普通宠物本体。
- 不要把 `passiveobject/creature` 的攻击资源写成宠物技能实机命中。
