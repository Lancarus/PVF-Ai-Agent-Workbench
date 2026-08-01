# AT Mage IceRoad State/Appendage/Disabled PO 边界只读核验

状态：默认可用


## 一句话结论


| 层级 | 目标核验 | 边界 |
| --- | --- | --- |
| skill registry | 需在当前目标 PVF 中只读确认 | 只证明技能 ID 到 `.skl` 路由。 |
| header 常量 | 需在当前目标 PVF 中只读确认 | 常量只在当前男法脚本上下文内解释。 |
| load_state | 需在当前目标 PVF 中只读确认 | 注册不等于运行时一定创建 PO。 |
| passiveobject registry | 需在当前目标 PVF 中只读确认 | 必须按 `passiveobject/passiveobject.lst` 解析；不能用 skill/monster/APC registry。 |
| `.skl` 主技能 | 需在当前目标 PVF 中只读确认 | 可释放状态、冷却、MP 和 on/off 行为仍需实机确认。 |
| `.skl level info` | 需在当前目标 PVF 中只读确认 | 当前脚本中 MP 消耗和 PO 创建代码为注释，不能只按 level info 写成运行事实。 |
| 强化技能 | 需在当前目标 PVF 中只读确认 | 强化数据只作为被动意图；当前 PO 创建入口未闭合时，冰冻运行效果不能静态证明。 |

## state 流程

| 回调 | 只读观察 | 边界 |
| --- | --- | --- |
| `checkExecutableSkill_IceRoad` | 如果角色已有有效 `ap_ATMage_IceRoad.nut`，直接调用 `sq_SendChangeSkillEffectPacket(obj, SKILL_ICEROAD)` 并返回 true；否则检查冷却，再 `sq_IsUseSkill(SKILL_ICEROAD)`，用 int vector 传 `SUB_STATE_ICEROAD_CASTING = 5` 进入 state。 | 再次施放发送的 skill effect packet 在当前 `IceRoad.nut` 内未读到同名接收回调；不能写成一定关闭或刷新。 |
| `checkCommandEnable_IceRoad` | 攻击 state 内额外查 `sq_IsCommandEnable(SKILL_ICEROAD)`，其他 state 返回 true。 | 命令层允许不等于实际释放成功。 |
| `onSetState` CASTING | 设置 `CUSTOM_ANI_ICEROAD_CASTING`，读取 `sq_GetCastTime`，再用 `sq_GetFrameStartTime(animation, 16)` 算读条，播放 `MW_ICEROAD` 并开始 cast gauge。 | 当前 `IceRoadCasting.ani` 静态只有 1 帧；frame 16 的返回语义必须运行确认。 |
| `onEndCurrentAni` CASTING | my control 时推入 `SUB_STATE_ICEROAD_0` 再次进入 `STATE_ICEROAD`。 | 只证明脚本推进形状；读条取消、失败释放和同步需实机。 |
| `onSetState` substate 0 | 设置 `CUSTOM_ANI_ICEROAD`。 | 当前角色 `IceRoad.ani` 只读为 10 帧、伤害盒，无攻击盒。 |
| `onProc` substate 0 | frame `>= 4` 追加通用视觉 appendage；frame `>= 7` 追加 `ap_ATMage_IceRoad.nut`，并在 my control 时 `skill.setSealActiveFunction(false)`。 | 这能闭合到 appendage 和技能 on/off 开关，不能闭合到 `24243` 创建。 |
| `onEndCurrentAni` substate 0 | my control 时回到 stand。 | 持续冰路是否保留完全取决于 appendage 生命周期和运行时。 |
| `onEndState` | 结束 cast gauge。 | UI 读条显示与取消必须实机。 |

## appendage 流程

### `ap_ATMage_IceRoad.nut`

| 回调 | 目标核验 | 边界 |
| --- | --- | --- |
| `sq_AddEffect` | 需在当前目标 PVF 中只读确认 | 当前读到的是视觉动画，不是 `24243` PO。 |
| `onStart` | 需在当前目标 PVF 中只读确认 | timer 只是准备；当前文本里实际事件触发创建 PO 的代码为注释。 |
| `proc` | 需在当前目标 PVF 中只读确认 | `t.isOnEvent`、扣 MP、创建 `24243`、`sendSetMpPacket` 均在注释块内。 |
| `onEnd` | 需在当前目标 PVF 中只读确认 | 声音残留与同步需实机。 |

### `ap_ATMage_IceRoadCS.nut`

| 回调 | 目标核验 | 边界 |
| --- | --- | --- |
| `onStart` | 需在当前目标 PVF 中只读确认 | 该 appendage 在当前脚本中由 `po_ATIceRoad.nut` 的 skill effect 接收端追加；若 PO 未创建，则入口不闭合。 |
| `proc` | 需在当前目标 PVF 中只读确认 | `sq_IsValidActiveStatus(ACTIVESTATUS_SLOW)` 判断存在但相关分支被注释；异常状态真实持续和视觉切换需实机。 |
| `onEnd` | 需在当前目标 PVF 中只读确认 | 只证明清理调用，不证明资源显示。 |

## `24243` PO 与攻击链边界

| 项 | 目标核验 | 边界 |
| --- | --- | --- |
| `ATIceRoad.obj` | 需在当前目标 PVF 中只读确认 | 对象静态可读，但当前 NUT 未闭合到创建。 |
| `ATIceRoad.atk` | 需在当前目标 PVF 中只读确认 | 攻击包静态存在不证明会被创建或命中。 |
| PO 动画 | 需在当前目标 PVF 中只读确认 | 攻击盒只在 PO 被实际创建并运行时才可能参与判定；当前创建入口未闭合。 |
| `po_ATIceRoad.nut` receiveData | 需在当前目标 PVF 中只读确认 | 读取端存在，但写入端/创建端未闭合。 |
| `po_ATIceRoad.nut` onAttack | 需在当前目标 PVF 中只读确认 | 只有 PO 被创建并命中时才可能触发；当前不能写成已生效减速。 |
| `po_ATIceRoad.nut` onChangeSkillEffect | 需在当前目标 PVF 中只读确认 | 需在当前目标 PVF 中只读确认 |

## 动画与资源引用

| 文件 | 只读观察 | 边界 |
| --- | --- | --- |
| `character/mage/atanimation/iceroadcasting.ani` | frame max 1，只有 damage box。 | state 读取 frame 16 是静态边界，需运行确认。 |
| `character/mage/atanimation/iceroad.ani` | frame max 10，frame 3 播放 `ICEBLADE_CAST`，只有 damage box。 | 角色动作本身不提供攻击盒。 |
| `Character/Mage/Effect/Animation/ATIceRoad/loop/00_icebottom_dodge.ani` | appendage 主视觉，loop，未见攻击盒。 | 视觉层不等于攻击来源。 |
| `Character/Mage/Effect/Animation/ATIceRoad/loop/01_iceup_dodge.ani` | 目标 CS appendage 视觉，loop，未见攻击盒。 | 只有 CS appendage 入口闭合时才可能显示。 |
| `Character/Mage/Effect/Animation/ATIceRoad/end/00_icebottom_dodge.ani` | 目标 CS appendage 收尾视觉，未见攻击盒。 | 视觉结束不证明异常结束规则。 |
| `Character/Mage/Effect/Animation/ATIceRoad/03_icecloud_dodge.ani` | 前几帧 image 为空，后续引用 `03_icecloud_dodge.img`，未见攻击盒。 | 当前核验未发现它是攻击来源；资源完整性仍需客户端链检查。 |

## 内置 NUT API 事实目录 API 边界

| API | 本桶用途 | 边界 |
| --- | --- | --- |
| `sq_SendChangeSkillEffectPacket(obj, skillIndex)` | IceRoad 再次施放、PO onAttack 都发送技能效果变化包。 | 必须有运行时接收端；当前 `IceRoad.nut` 未读到接收回调，PO 接收端又依赖 PO 创建。 |
| `CNRDSkill.setSealActiveFunction(bool)` | substate 0 追加主 appendage 后把 IceRoad 技能设为 off。 | on/off UI、再次施放、冷却和失败恢复需实机。 |
| `CNSquirrelAppendage.sq_AppendAppendage(...)` / `sq_Append(...)` | 追加 IceRoad 主 appendage、通用视觉 appendage、目标 CS appendage。 | appendage 生命周期、叠加、死亡清理、跨图和同步需实机。 |
| `EventTimer.setParameter(...)` / `resetInstant(...)` | 主 appendage 根据 dash/stand 调整事件间隔。 | 当前创建/扣 MP 事件代码为注释；timer 本身不证明会产出 PO。 |
| `CNSquirrelAppendage.sq_AddChangeStatusAppendageID(...)` | PO 的 skill effect 接收端给目标追加移动速度 change status。 | 当前 PO 创建入口未闭合；减速最终数值和刷新规则需实机。 |
| `sq_IsValidActiveStatus(...)` / `sq_IsEnd(...)` | CS appendage 检查异常状态和收尾动画是否结束。 | 相关慢速状态检查分支部分注释；异常是否存在和动画结束时机需实机。 |

## 禁止外推

- 不要把 `ATIceRoad.obj` 的攻击盒写成已命中来源。攻击盒必须以 PO 实际创建为前提。
- 不要把 `.skl` 的 MP 消耗描述写成已扣 MP。当前主 appendage 中扣 MP 逻辑为注释。
- 不要把 `IceRoadEx` 的冰冻描述写成已生效。当前只能确认强化 `.skl` 和 PO 读取端意图。

## 下一步验收

1. 运行测试：施放 IceRoad 后观察技能是否进入 on/off 状态、是否出现脚下视觉、再次按技能是否关闭或刷新。
2. 运行测试：dash/走路/站立时是否实际生成能碰撞敌人的冰雾；若没有，符合当前静态“PO 创建入口未闭合”风险。
3. 运行测试：确认是否扣 MP；当前静态文本不能证明扣 MP。
4. 运行测试：若想恢复减速/冰冻，需要单独设计目标 PVF 实验，先补创建写包，再验证 `24243` 命中、减速、IceRoadEx 冰冻和资源显示。
