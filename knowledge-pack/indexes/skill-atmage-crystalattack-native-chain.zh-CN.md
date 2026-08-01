# AT Mage / CrystalAttack 原生链只读索引

状态：默认可用


## 一句话结论

CrystalAttack 是男法 `skill 3`，由男法 `load_state` 注册到 `state 21`；进入 state 后，NUT 在当前动画帧推进到 `> 1` 时设置 `time event`，按 50ms 间隔尝试创建 `passiveobject 24221`。PO 读取写入的伤害倍率、角度、攻速、序号，在自身动画 `FRAME002` 的 `[SET FLAG] 1` 上重置默认攻击信息并写入当前攻击倍率。


| 环节 | 目标核验 | 边界 |
| --- | --- | --- |
| skill registry | 需在当前目标 PVF 中只读确认 | 只证明男法技能 registry 路由。 |
| `.skl` 基础字段 | 需在当前目标 PVF 中只读确认 | `[executable states]` 与 `[static data]` 是静态字段，不能单独证明释放成功、创建数量或伤害表现。 |
| header 常量 | 需在当前目标 PVF 中只读确认 | 常量只在当前男法脚本体系内成立。 |
| load_state state 注册 | 需在当前目标 PVF 中只读确认 | 证明 state NUT 有入口；不证明每个分支都已实机覆盖。 |
| load_state PO 注册 | 需在当前目标 PVF 中只读确认 | `24221` 必须按 `passiveobject/passiveobject.lst` 解析。 |
| state 切换 | 需在当前目标 PVF 中只读确认 | 这里没有 substate；是否能释放仍受冷却、状态和命令条件影响。 |
| 命令可用 | 需在当前目标 PVF 中只读确认 | 命令允许不等于技能一定命中或最终进入目标动作。 |
| 动作入口 | 需在当前目标 PVF 中只读确认 | `addElementalChain_ATMage` 还要求 `SKILL_ELEMENTAL_CHAIN` 等级大于 0；不能静态证明元素链实战生效。 |
| 角色 ANI | 需在当前目标 PVF 中只读确认 | 当前 state NUT 的 keyframe 处理函数是注释块；实际原生创建链走 `onProc + onTimeEvent`，不是这些 keyframe flag。 |
| time event | 需在当前目标 PVF 中只读确认 | 实际创建时还会比较 `timeEventCount` 与 `static data[1]`；静态只读不能证明实机触发节奏。 |
| 创建 PO 写包 | 需在当前目标 PVF 中只读确认 | 坐标、朝向、创建次数、同步和可见性必须实机确认。 |
| PO registry | 需在当前目标 PVF 中只读确认 | 这是 passiveobject registry 闭合，不是技能、怪物或 APC registry。 |
| PO `.obj` | 需在当前目标 PVF 中只读确认 | 文件名里同时出现 `CrystalCore` 与 `ATCrystalAttack` 资源；以 `.obj` 实际引用为准。 |
| PO base ANI | 需在当前目标 PVF 中只读确认 | `[ATTACK BOX]` 只证明静态盒存在，不证明实机命中、卡肉或范围。 |
| PO ATK | 需在当前目标 PVF 中只读确认 | 只证明静态 AttackInfo 字段；冰属性最终规则、伤害和 PVP 要实测。 |
| PO NUT | 需在当前目标 PVF 中只读确认 | `receiveData.readFloat/readWord/readDword` 当前仍按目标脚本回调参数用法记录，不升级成通用 API 规则。 |

## 参数流

| 写入端 | 传入 PO 的字段 | 读取端 | 用途边界 |
| --- | --- | --- | --- |
| `sq_GetBonusRateWithPassive(SKILL_CRYSTALATTACK, STATE_CRYSTALATTACK, 0, 1.0)` | `sq_WriteDword(dmg)` | `receiveData.readDword()` | 写入当前攻击倍率；最终伤害必须实机确认。 |
| `CrystalAttackCreatePos[currentIndex][1]` | `sq_WriteFloat(angle.tofloat())` | `receiveData.readFloat()` 后 `sq_ToRadian(angle)` | 用于 PO 旋转；视觉朝向和命中方向需实机。 |
| `sq_GetIntData(SKILL_CRYSTALATTACK, 0)` | `sq_WriteWord(attackSpeedRate)` | `receiveData.readWord()` | 用于角色动画和 PO 动画速度；静态不证明手感。 |
| `timeEventCount - 1` | `sq_WriteWord(currentIndex)` | `receiveData.readWord()` | 用于选择 PO 自定义动画；越界和实际创建次数需实机。 |

## 内置 NUT API 事实目录 与目标脚本已核 API

| API | 当前可用结论 | 边界 |
| --- | --- | --- |
| `IRDCollisionObject.setTimeEvent(timeIndex, timeInterval, timeCount, bool)` | 设置时间事件；`bool=false` 表示先等一次间隔再触发。 | CrystalAttack 由角色对象调用，按继承到碰撞对象方法理解；触发节奏需实机。 |
| `IRDSQRCharacter.sq_WriteFloat(value)` | 向 PO `receiveData` 写入浮点数。 | 读取端顺序必须一致。 |
| `IRDSQRCharacter.sq_GetIntData(skill, staticIndex)` | 读取 `.skl [static data]` 对应位置。 | 只说明取静态数据；数值语义要结合目标脚本。 |
| `setCurrentAnimationFromCutomIndex(obj, index)` | 从自定义索引设置动画。 | 函数名原文为 `Cutom`；索引语义必须按当前对象自定义动画体系核。 |
| `sq_ToRadian(angle)` | 角度转弧度。 | 只说明单位转换，不证明视觉正确。 |
| `sq_SetCustomRotate(obj, angle)` | 设置对象自定义旋转。 | 旋转后的判定、显示和同步需实机。 |
| `sq_GetCurrentAnimation(obj)` / `CNRDAnimation.setSpeedRate(rate)` | 取得当前动画并设置播放速度。 | 不证明动画资源完整或实际手感。 |
| `sq_SetCurrentAttackInfo(obj, attackInfo)` / `CNRDPassiveObject.getDefaultAttackInfo()` | PO 可把当前攻击信息重置为默认攻击信息。 | 只证明脚本写法和 API 形状；不证明最终命中。 |
| `sq_SetCurrentAttackBonusRate(attackInfo, value)` | 设置当前攻击倍率。 | 静态只读不能证明最终伤害。 |
| `sq_SetMyShake(obj, shakeRate, shakeTime)` | 设置本机可见震动。 | 震动幅度、持续感和多人同步不是静态结论。 |
| `CNRDPassiveObject.getParent()` | 取得 PO 父对象。 | 父对象存在与否仍要脚本空值防护和实机确认。 |
| `sq_GetSkillLevel(obj, skillIndex)` / `sq_GetSkill(obj, skillIndex)` / `sq_CreateChangeStatus(...)` | `addElementalChain_ATMage` 用于判断元素链技能并创建属性攻击变化。 | 这里只确认公共函数依赖链；不证明角色学了元素链或 buff 实战生效。 |

## 不要外推

- 本文没有证明 CrystalAttack 的所有创建次数一定等于 `.skl [static data]` 第二列；它只是当前脚本中用于截断 time event 的静态线索。
- 本文没有证明 `[water element]` 在所有场景、PVP 或元素抗性环境里的最终效果。
- 本文没有重开 PassiveObject / AttackInfo / Hitbox 广域主线；这里只是为一个技能的原生链做最小只读闭合。

## 下一步实测建议

1. 用男法释放 CrystalAttack，确认动作进入后是否按时间间隔连续落下冰晶。
2. 观察大约第三帧后是否开始创建 PO，是否只出现 `.skl [static data]` 指定数量附近的冰晶。
3. 对普通怪确认是否命中、掉血、冰属性表现、屏幕震动和击退；这些不能由静态索引代替。
