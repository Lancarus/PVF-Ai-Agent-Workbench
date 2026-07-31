# AT Mage / DarkChange state 失明攻击包边界只读索引

状态：默认可用


## 一句话结论

DarkChange 是男法 `skill 4`，注册到 `STATE_DARK_CHANGE = 23`。释放成功后按 `READY(0) -> START(1)` 两段 substate 运行，READY 段设置 `CUSTOM_ATTACK_INFO_DARK_CHANGE = 0` 和攻击倍率，START 段播放带 `[ATTACK BOX]` 的动作并按 level data 的范围倍率缩放当前动画攻击盒。非 PVP 分支通过全场 active 对象回调给屏幕内敌人发送 `ACTIVESTATUS_BLIND` 异常状态包；PVP 分支在 `onAttack` 中把失明写入当前 AttackInfo。当前链没有 passiveobject，也没有专属 appendage NUT。


| 环节 | 目标核验 | 边界 |
| --- | --- | --- |
| skill registry | 需在当前目标 PVF 中只读确认 | 只证明男法技能 registry 路由。 |
| `.skl` 基础字段 | 需在当前目标 PVF 中只读确认 | 说明技能依赖和 EX 入口；不证明最终释放或伤害。 |
| `.skl` 释放状态 | 需在当前目标 PVF 中只读确认 | 静态列表只作释放线索；具体窗口、取消和失败条件需实机。 |
| `.skl` 等级列 | 需在当前目标 PVF 中只读确认 | PVP 静态分区数据不等于 PVP 最终规则。 |
| EX 技能 | 需在当前目标 PVF 中只读确认 | 只能写作静态加成意图；最终被动叠加和数值需运行验证。 |
| header 常量 | 需在当前目标 PVF 中只读确认 | 常量只在当前男法脚本体系内成立。 |
| load_state 注册 | 需在当前目标 PVF 中只读确认 | 证明 state NUT 有入口；不证明释放一定成功。 |
| passiveobject 需求 | 需在当前目标 PVF 中只读确认 | 不要把 DarkChange 写成 passiveobject registry 链。 |
| 初始切状态 | 需在当前目标 PVF 中只读确认 | substate 0 只在当前 DarkChange 链内有意义，不能跨技能外推。 |
| READY 段 | 需在当前目标 PVF 中只读确认 | 设置攻击包和倍率不证明最终命中或伤害。 |
| START 段 | 需在当前目标 PVF 中只读确认 | 攻击盒缩放、命中范围和中断还原需实机验证。 |
| START 攻击盒 | 需在当前目标 PVF 中只读确认 | 静态攻击盒不证明命中、伤害、卡肉或范围表现。 |
| 攻击信息槽 | 需在当前目标 PVF 中只读确认 | `.atk` 字段只证明攻击包静态参数；最终反馈需实机。 |
| 非 PVP 失明 | 需在当前目标 PVF 中只读确认 | 只证明脚本尝试发送失明；概率、等级、抗性、免疫、屏幕判定和同步需实机。 |
| PVP 失明 | 需在当前目标 PVF 中只读确认 | 只证明 PVP 分支尝试把失明写入攻击包；触发时序和最终规则需实机。 |
| END 还原 | 需在当前目标 PVF 中只读确认 | 中断、死亡、换状态和异常路径下是否完全还原需实机。 |
| 视觉层 | 需在当前目标 PVF 中只读确认 | Script 内资源路径可见不等于客户端 NPK/ImagePacks2 一定完整。 |
| 元素链调用 | 需在当前目标 PVF 中只读确认 | 本桶未展开该函数定义，不能把元素链最终效果写成 DarkChange 已确认事实。 |

## level data 读取点

| index | 当前脚本读取位置 | 用途边界 |
| ---: | --- | --- |
| 0 | READY 段 `sq_GetBonusRateWithPassive(...)` | 百分比攻击力列，最终伤害需实机。 |
| 1 | START 段 `sq_GetLevelData(...)` | 攻击范围缩放倍率，脚本除以 100 后用于当前动画攻击盒缩放。 |
| 2 | 非 PVP 回调 / PVP onAttack | 失明等级。 |
| 3 | 非 PVP 回调 / PVP onAttack | 失明概率。 |
| 4 | 非 PVP 回调 / PVP onAttack | 失明持续时间。 |

## 内置 NUT API 事实目录 与目标脚本已核 API

| API | 当前可用结论 | 边界 |
| --- | --- | --- |
| `IRDSQRCharacter.sq_SetCurrentAttackInfo(attackInfoIndex)` | 设置 `.chr [etc attack info]` 槽位；DarkChange 用槽 0。 | 槽位必须由当前 `.chr` 闭合。 |
| `IRDSQRCharacter.sq_SetCurrentAttackBonusRate(rate)` / `sq_GetBonusRateWithPassive(...)` | 读取含被动修正的攻击列并写入当前攻击倍率。 | 最终伤害和被动叠加不能静态证明。 |
| `sq_StartDrawCastGauge(obj, time, bool)` / `sq_EndDrawCastGauge(obj)` | READY 开始读条，START 结束读条。 | 读条显示、取消和手感需实机。 |
| `sq_flashScreen(...)` / `sq_SetMyShake(...)` | START 段黑色闪屏，keyframe flag 1 触发本机震动。 | 视觉和震动表现需实机或资源链。 |
| `CNRDAnimation.setAttackBoundingBoxSizeRate(sizeRate, bool)` | DarkChange 对当前角色动画攻击盒做缩放，并在离开 state 时尝试还原。 | 命中范围、还原时序、中断路径和同步需实机。 |
| `IRDSQRCharacter.callBackAllObject(...)` | DarkChange 非 PVP 分支用它回调 active object，再自行筛屏幕碰撞和敌对关系。 | 内置 NUT API 事实目录 签名说明较弱；对象范围、调用频率和同步需实机。 |
| `sq_sendSetActiveStatusPacket(damager, parentObj, status, rate, level, bool, time)` | 直接给目标发送异常状态包；DarkChange 非 PVP 用于失明。 | 概率、等级、抗性、免疫和持续时间不能静态证明。 |
| `sq_SetChangeStatusIntoAttackInfo(attackInfo, 0, status, rate, level, time)` | 向 AttackInfo 写入异常状态；DarkChange PVP 用于失明。 | 异常是否随本次攻击触发、PVP 修正和抗性需实机。 |

## 不要外推

- DarkChange 不创建 passiveobject，不要扩成 PassiveObject / AttackInfo / Hitbox 广域样本。
- `SUB_STATE_DARK_CHANGE_READY/START` 只在 DarkChange 链内有意义。
- 非 PVP 直接发异常包、PVP 写 AttackInfo 是当前脚本的分支形状，不等于失明最终一定生效。
- `.atk` 的 push aside、lift up 和 dark element 只证明静态字段，不能证明实战击退、浮空、卡肉或元素最终规则。
- Script 内可读视觉路径不等于客户端资源完整。
- 静态只读不能证明命中、伤害、失明概率、抗性、免疫、PVP 规则、同步或中断后攻击盒还原。

## 下一步实测建议

1. 在普通地下城释放 DarkChange，确认 READY 读条、START 攻击盒范围和失明是否覆盖屏幕内敌人。
2. 在 PVP 环境或 PVP 规则模拟中测试命中目标是否触发失明，重点记录概率、等级、持续时间与 `.skl` PVP 行是否一致。
3. 用不同技能等级测试攻击范围缩放，确认 level data 第 1 列是否等价于实际命中范围倍率。
4. 在释放中被打断、死亡、换状态时观察攻击盒是否还原，避免范围残留或下一动作异常。
