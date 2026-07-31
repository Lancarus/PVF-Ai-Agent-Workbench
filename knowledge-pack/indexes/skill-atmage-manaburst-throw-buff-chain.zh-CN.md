# AT Mage / ManaBurst Throw-Buff 链只读索引

状态：默认可用


## 一句话结论

ManaBurst 是男法 `skill 28`。`atmage_load_state.nut` 注册了 `STATE_MANABURST = 44`，但当前释放脚本不是直接切到 state 44，而是在站立/攻击/冲刺状态下通过 `STATE_THROW` 进入通用投掷流程。Throw 后置处理中，当 `throwState == 1` 时挂载 `ap_ATMage_ManaBurst.nut`：appendage 启动时按 `.skl level data[1]` 追加百分比攻击力加成，结束时移除；技能使用前回调再按 `.skl level data[0]` 临时提高目标技能 MP 消耗倍率，技能使用后恢复旧倍率。


| 环节 | 目标核验 | 边界 |
| --- | --- | --- |
| skill registry | 需在当前目标 PVF 中只读确认 | 只证明男法技能 registry 路由。 |
| `.skl` 基础字段 | 需在当前目标 PVF 中只读确认 | 说明文本是静态提示；是否能在具体动作中释放仍看脚本条件和实机。 |
| `.skl` 释放状态 | 需在当前目标 PVF 中只读确认 | 静态列表很宽；当前 `checkExecutableSkill_ManaBurst` 只放行 `STATE_STAND / STATE_ATTACK / STATE_DASH`。 |
| `.skl` level data | 需在当前目标 PVF 中只读确认 | 展示顺序和脚本读取顺序要分开；最终数值效果需实机。 |
| header 常量 | 需在当前目标 PVF 中只读确认 | 常量只在当前男法脚本体系内成立。 |
| load_state state 注册 | 需在当前目标 PVF 中只读确认 | 证明 state NUT 有入口；当前释放脚本仍实际转向 `STATE_THROW`。 |
| load_state Throw 注册 | 需在当前目标 PVF 中只读确认 | ManaBurst 当前链依赖通用 Throw 后置处理。 |
| passiveobject 需求 | 需在当前目标 PVF 中只读确认 | 不要把 ManaBurst 误写成 passiveobject registry 链。 |
| 释放入口 | 需在当前目标 PVF 中只读确认 | 冷却、MP、输入、当前动作和服务端规则仍需实机确认。 |
| Throw 参数向量 | 需在当前目标 PVF 中只读确认 | 这些数字只在当前 Throw 脚本语境下有意义，不能跨技能硬套。 |
| state 切换 | 需在当前目标 PVF 中只读确认 | 这解释了为什么注册了 `STATE_MANABURST` 仍走 Throw；不证明 Throw 动作手感或取消规则。 |
| 命令可用 | 需在当前目标 PVF 中只读确认 | 命令可按不等于技能最终释放成功。 |
| Throw 后置 | 需在当前目标 PVF 中只读确认 | 证明当前链有后置入口；具体时机由 Throw 运行时决定。 |
| appendage 挂载 | 需在当前目标 PVF 中只读确认 | 是否显示为 Buff、刷新规则、声音循环和有效期表现需实机。 |
| appendage 回调 | 需在当前目标 PVF 中只读确认 | 只证明回调名被注册；回调频率和真实生命周期由运行时决定。 |
| 视觉效果 | 需在当前目标 PVF 中只读确认 | 需在当前目标 PVF 中只读确认 |
| 攻击加成启动 | 需在当前目标 PVF 中只读确认 | 只证明追加百分比攻击加成接口被调用；最终伤害、叠加顺序和 PVP 需实机。 |
| 攻击加成结束 | 需在当前目标 PVF 中只读确认 | 提前失效、死亡、换图、重复释放和声音残留需实机。 |
| appendage 自终止 | 需在当前目标 PVF 中只读确认 | 当前链的结束主要依赖 Throw 后置设置的 valid time，而不是 `isEnd` 主动结束。 |
| MP 消耗提高 | 需在当前目标 PVF 中只读确认 | 这是技能使用前的倍率改写；不能静态证明最终扣蓝数值。 |
| Expression 叠加 | 需在当前目标 PVF 中只读确认 | ManaBurst 不是最终 MP 消耗的唯一来源；Expression 会在同一前置回调中继续改写倍率。 |
| MP 倍率恢复 | 需在当前目标 PVF 中只读确认 | 证明脚本尝试恢复旧倍率；异常中断、失败释放和特殊技能是否完全恢复需实机。 |
| 相邻被动不要混淆 | 需在当前目标 PVF 中只读确认 | Expression 是独立被动修正，不要把 ManaBurst 的 MP 增耗写成最终值。 |

## level data 读取点

| index | 当前脚本读取位置 | 用途边界 |
| ---: | --- | --- |
| 0 | `useSkill_before_ATMage` | ManaBurst 有效时提高当前使用技能的 MP 消耗倍率。 |
| 1 | `onStart_appendage_atmage_manaburst` | 作为 `sq_AddPassiveSkillAttackBonusRate` 的 level data 号位，用于百分比攻击力加成。 |
| 2 | `onAfterSetState_ManaBurst` | appendage 有效时间；实机 Buff 显示与结束时序另验。 |

## 内置 NUT API 事实目录 与目标脚本已核 API

| API | 当前可用结论 | 边界 |
| --- | --- | --- |
| `sq_GetCastTime(obj, skillIndex, skillLevel)` | 读取技能施放时间；ManaBurst 用作 Throw 充能时间。 | 只说明取数形状；动作手感和读条表现需实机。 |
| `IRDActiveObject.GetSquirrelAppendage(path)` | 按 `sqr/` 下相对路径读取指定 appendage，返回 `CNSquirrelAppendage`。 | 是否存在、是否有效、是否过期要看运行上下文。 |
| `IRDCharacter.getSkillMpRate(skillIndex)` / `setSkillMpRate(skillIndex, newMpRate)` | 读取/设置技能 MP 消耗倍率；ManaBurst 与 Expression 在技能使用前后改写。 | 静态只读不能证明最终扣蓝、失败释放恢复或服务端一致性。 |
| `IRDSQRCharacter.sq_AddPassiveSkillAttackBonusRate(skillIndex, skillLevelDataIndex)` / `sq_RemovePassiveSkillAttackBonusRate(skillIndex)` | 添加/移除百分比伤害加成；ManaBurst appendage 启动/结束时使用。 | 不能静态证明最终伤害、叠加优先级、面板显示或 PVP。 |
| `CNSquirrelAppendage.sq_AddEffectFront(Anipath)` | 给 appendage 添加人物前景动画效果。 | 只证明接口和引用路径；资源存在、显示层级和残留需资源链或实机。 |
| `CNSquirrelAppendage.sq_SetValidTime(time)` / `CNSquirrelAppendage.sq_Append(...)` | 设置 appendage 有效时间并追加到对象。 | 生命周期、刷新、跨图和异常失效需实机。 |

## 不要外推

- ManaBurst 当前释放脚本走 `STATE_THROW`，不要因为 `load_state` 注册了 `STATE_MANABURST = 44` 就写成直接进入 state 44。
- `.skl [executable states]` 很宽，但当前脚本只放行站立、攻击、冲刺；不要只拿 `.skl` 列表判断可释放动作。
- ManaBurst 不创建 passiveobject，不要扩成 PassiveObject / AttackInfo / Hitbox 广域样本。
- MP 消耗最终值还受 Expression 被动继续改写；不要把 ManaBurst 的增耗列写成最终扣蓝。
- 静态只读不能证明最终伤害、最终 MP、动作取消、Buff 图标、音效循环、PVP、同步或客户端资源完整性。

## 下一步实测建议

1. 男法释放 ManaBurst，确认是否通过 Throw 动作完成释放，记录读条/施放时长、声音和 Buff 持续时间。
2. 在 ManaBurst 有效期内释放同一技能，对比无 ManaBurst 与有 ManaBurst 的伤害和 MP 消耗；同时测有/无 Expression 被动时的 MP 扣除差异。
3. 测试站立、普通攻击、冲刺、其他 `.skl` 列出的状态，确认脚本限制和实机释放窗口是否一致。
4. 检查重复释放、死亡、换图、Buff 结束后的攻击加成移除、MP 倍率恢复和循环音残留。
