# AT Mage / WaterCannon 原生链只读索引

状态：默认可用


## 一句话结论

WaterCannon 是男法 `skill 26`，由男法 `load_state` 注册到 `state 43`；角色动画 `watercannon.ani` 在 `FRAME005` 设置 flag 1，state NUT 在该 keyframe 创建主水球 `passiveobject 24217`。主水球 PO 读取攻击倍率、大小、速度和距离后按动画时间移动，命中后用二进制写包在命中位置创建爆炸 PO `24256`，并把命中目标的 `group/id` 传给爆炸 PO 处理。


| 环节 | 目标核验 | 边界 |
| --- | --- | --- |
| skill registry | 需在当前目标 PVF 中只读确认 | 只证明男法技能 registry 路由。 |
| `.skl` 基础字段 | 需在当前目标 PVF 中只读确认 | `[static data]` 只按目标脚本解释，不能跨技能套用。 |
| `.skl` level data | 需在当前目标 PVF 中只读确认 | 实际伤害和大小表现必须实机确认。 |
| header 常量 | 需在当前目标 PVF 中只读确认 | 常量只在当前男法脚本体系内成立。 |
| load_state state 注册 | 需在当前目标 PVF 中只读确认 | 证明 state NUT 有入口；不证明释放条件和实机表现。 |
| load_state PO 注册 | 需在当前目标 PVF 中只读确认 | 两个 ID 都必须按 `passiveobject/passiveobject.lst` 解析。 |
| state 切换 | 需在当前目标 PVF 中只读确认 | 这里没有 substate；`IGNORE_FORCE` 的实战优先级不能仅靠静态推导。 |
| 命令可用 | 需在当前目标 PVF 中只读确认 | 命令允许不等于技能一定释放、命中或成功创建 PO。 |
| 动作入口 | 需在当前目标 PVF 中只读确认 | 元素链实际生效还要求元素链技能等级和运行时状态。 |
| 角色 ANI | 需在当前目标 PVF 中只读确认 | 只证明 keyframe 触发点静态存在；帧时序和手感需实机。 |
| 创建 24217 | 需在当前目标 PVF 中只读确认 | 坐标、方向、同步和可见性必须实机确认。 |
| 角色后退 | 需在当前目标 PVF 中只读确认 | 静态只读不能证明实际位移、摩擦、反向输入手感或同步。 |
| 24217 registry | 需在当前目标 PVF 中只读确认 | 这是 passiveobject registry 闭合，不是技能、怪物或 APC registry。 |
| 24217 `.obj` | 需在当前目标 PVF 中只读确认 | `.obj [name]` 显示复用名，不能用名称反推技能语义。 |
| 24217 NUT | 需在当前目标 PVF 中只读确认 | 轨迹、碰撞、到时销毁和同步均需实机。 |
| 24217 命中后二级 PO | 需在当前目标 PVF 中只读确认 | 只证明目标脚本尝试在命中位置创建爆炸；不证明每次命中都按预期触发。 |
| 24256 registry | 需在当前目标 PVF 中只读确认 | 该 PO 由 24217 命中后创建；不是 state NUT 直接创建。 |
| 24256 `.obj` | 需在当前目标 PVF 中只读确认 | 爆炸大小、命中次数和残留必须实机确认。 |
| 24256 NUT | 需在当前目标 PVF 中只读确认 | `sq_AddHitObject` 的最终命中效果、重复命中边界和目标有效性必须实机确认。 |
| PO ATK | 需在当前目标 PVF 中只读确认 | 只证明静态 AttackInfo 字段；击倒、推开、浮空和 PVP 最终表现要实测。 |
| PO ANI | 需在当前目标 PVF 中只读确认 | 攻击盒静态存在不等于实机命中范围或手感。 |

## 参数流

| 写入端 | 传入字段 | 读取端 | 用途边界 |
| --- | --- | --- | --- |
| `sq_GetBonusRateWithPassive(SKILL_WATER_CANNON, STATE_WATER_CANNON, 0, 1.0)` | `sq_WriteDword(attackBonusRate)` | `receiveData.readDword()` | 24217 和 24256 都用来设置当前攻击倍率；最终伤害必须实机确认。 |
| `sq_GetLevelData(obj, SKILL_WATER_CANNON, 1, skillLevel)` | `sq_WriteWord(sizeRate)` | `receiveData.readWord()` | 24217 用于图片、自动层级动画和攻击盒缩放；24256 接收的是命中后再减 30 的尺寸。 |
| `sq_GetIntData(obj, SKILL_WATER_CANNON, 0)` | `sq_WriteWord(xVelocityWaterCannon)` | `receiveData.readWord()` | 用于计算 24217 到达时间；轨迹需实机。 |
| `sq_GetIntData(obj, SKILL_WATER_CANNON, 1)` | `sq_WriteWord(distance)` | `receiveData.readWord()` | 用于 24217 移动距离；实际位置需实机。 |
| 24217 `onAttack` 的 `sq_GetGroup(damager)` / `sq_GetUniqueId(damager)` | `sq_BinaryWriteDword(group/id)` | 24256 `receiveData.readDword()` | 用于爆炸 PO 找回命中目标；目标失效、重复命中边界需实机。 |

## 内置 NUT API 事实目录 与目标脚本已核 API

| API | 当前可用结论 | 边界 |
| --- | --- | --- |
| `sq_SendCreatePassiveObjectPacketPos(obj, index, level, X, Y, Z)` | 按地图坐标创建 PO；WaterCannon 用它在命中位置创建 `24256`。 | 坐标系、父对象有效性和同步需实机。 |
| `sq_BinaryStartWrite()` / `sq_BinaryWriteDword(value)` | 全局二进制写包，用于创建 PO 前传参。 | 读取顺序必须和目标 PO 一致；当前只见 Dword。 |
| `sq_GetUniformVelocity(start, final, current, useTime)` / `sq_GetDistancePos(start, direction, target)` / `sq_setCurrentAxisPos(obj, axis, pos)` | 24217 用当前动画时间算匀速位移并设置 X 轴位置。 | 静态只读不证明实机轨迹、碰撞或同步。 |
| `sq_GetCurrentTime(ani)` / `sq_GetAnimationFrameIndex(ani)` | 可读取动画时间和帧号；24217 用当前时间控制移动。 | 帧率、延迟和实际触发节奏需实机。 |
| `CNRDAnimation.setImageRateFromOriginal(w, h)` / `setAutoLayerWorkAnimationAddSizeRate(rate)` | 用于按技能等级调整 PO 视觉大小。 | 视觉缩放不等于攻击范围一定同步。 |
| `sq_SetAttackBoundingBoxSizeRate(currentAni, xRate, yRate, zRate)` | 设置 PO 动画攻击盒缩放。 | 只证明脚本尝试缩放攻击盒；实机范围需测试。 |
| `sq_GetGroup(obj)` / `sq_GetUniqueId(obj)` / `sq_GetObject(parent, group, id)` | 用 group/id 记录并找回目标对象。 | 目标对象死亡、消失或跨同步状态下的结果需实机。 |
| `sq_GetCNRDObjectToCollisionObject(obj)` / `sq_AddHitObject(obj, colObj)` | 将对象转为碰撞对象并标记为已命中过。 | 该标记如何影响重复命中和最终伤害，不能靠静态只读证明。 |
| `IRDSQRCharacter.sq_SetStaticMoveInfo(...)` / `sq_SetMoveDirection(...)` | WaterCannon 在发射后设置角色后退移动参数。 | 内置 NUT API 事实目录 可查到接口，但参数细节和实际移动表现必须实机确认。 |

## 不要外推

- `24217` 和 `24256` 只在 WaterCannon 原生链内按当前脚本记录，不能扩成 PassiveObject / AttackInfo / Hitbox 广域结论。
- `ATWaterCannon.obj` 与 `ATWaterCannonExp.obj` 的 `[name]` 复用为 `火焰爆炸`，不能用展示名反推技能类型；以 registry、NUT 和 `.obj` 引用为准。
- `sq_AddHitObject` 只证明脚本尝试标记命中过目标，不证明爆炸 PO 的最终命中、伤害或重复命中规则。
- `[down]`、`[push aside] 300`、`[lift up] 200` 是静态 AttackInfo 字段，不能证明实机击倒、推开或浮空手感。

## 下一步实测建议

1. 用男法释放 WaterCannon，确认 `FRAME005` 附近是否发射水球，角色是否有后退位移。
2. 对单体怪观察水球命中后是否在命中位置生成爆炸，爆炸是否只影响该目标或周边目标。
3. 分别测试正向输入和反向输入时的后退距离、速度、击倒、浮空、推开和 PVP 表现。
