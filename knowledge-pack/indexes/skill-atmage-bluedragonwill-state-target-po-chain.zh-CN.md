# AT Mage BlueDragonWill State/Target/PO 链只读索引

状态：默认可用


## 纯结论

| 问题 | 目标核验 | 边界 |
| --- | --- | --- |
| 技能入口 | 需在当前目标 PVF 中只读确认 | registry 只证明 ID 到 `.skl` 路由。 |
| state 入口 | 需在当前目标 PVF 中只读确认 | 只证明 state 被注册，不证明释放成功或实战表现。 |
| substate 流程 | 需在当前目标 PVF 中只读确认 | substate 数字只对本技能闭合，不能跨技能复用。 |
| 目标搜索 | 需在当前目标 PVF 中只读确认 | 目标优先级、角度判定、死亡/离场和联机一致性必须实机。 |
| 前冲位移 | 需在当前目标 PVF 中只读确认 | 最终落点、绕障、卡墙、Z 轴跳跃感和同步不能静态证明。 |
| PO 创建 | 需在当前目标 PVF 中只读确认 | 这是本技能创建的 `24245/24246` 窄链，不重开 PassiveObject / AttackInfo / Hitbox 广域主线。 |
| EX 边界 | 需在当前目标 PVF 中只读确认 | 当前 NUT 未看到专门检查 `SKILL_BLUEDRAGONWILL_EX` 的分支；最终叠加只能按引擎被动机制或实机确认。 |
| 柔化边界 | 需在当前目标 PVF 中只读确认 | 只说明 skill 254 appendage 生效时可尝试切入；当前未证明默认已学习或始终挂载。 |

## `.skl` 静态字段

| 文件 | 已确认字段 | 边界 |
| --- | --- | --- |
| `ATMage/BlueDragonWill.skl` | 主动；`feature skill index 222`；前置 `10 3`；需求等级 35；冷却 18000；施放时间 500；消耗物品 `3037 1 1`；static data 为 `700 250 150 350 20`，PVP 最后一项为 `10`。 | static data 含义按当前 NUT 只读闭合：其中 index 1 作无目标默认距离，index 2 作冲击范围倍率，index 3/4 作目标搜索距离/角度。 |
| `ATMage/BlueDragonWill.skl` level info | level info 为 2 列；当前 NUT 读取第 0 列为冰锤百分比攻击倍率，第 1 列为冲击波独立攻击力。 | 最终攻击力、EX 加成和 PVP 修正必须实机。 |
| `ATMage/BlueDragonWillEx.skl` | 被动；前置 `12 10`；需求等级 65；最大 10 级；说明为增加冰魄锤击攻击力。 | 未在当前 state NUT 中看到显式分支，不能写成已验证运行加成。 |

## state NUT 链路

| 回调 | 目标核验 | 边界 |
| --- | --- | --- |
| `checkExecutableSkill_BlueDragonWill` | 需在当前目标 PVF 中只读确认 | 冷却、物品消耗、施放条件和命令输入仍由运行时决定。 |
| `checkCommandEnable_BlueDragonWill` | 需在当前目标 PVF 中只读确认 | 命令允许不等于一定能成功切 state。 |
| `onSetState` substate 0 | 需在当前目标 PVF 中只读确认 | 当前动作静态只有 11 帧；frame 16 的返回值和读条时长需实机或引擎语义确认。 |
| `onEndCurrentAni` substate 0 | 需在当前目标 PVF 中只读确认 | 搜索结果有效性和目标离场处理需实机。 |
| `onSetState` substate 1 | 需在当前目标 PVF 中只读确认 | 这里不创建 PO。 |
| `onProc` substate 1 | 需在当前目标 PVF 中只读确认 | 前冲轨迹、阻挡、卡墙、Z 轴高度和同步必须实机。 |
| `onEndCurrentAni` substate 1 | 需在当前目标 PVF 中只读确认 | 中断路径未静态证明。 |
| `onSetState` substate 2 | 需在当前目标 PVF 中只读确认 | 创建时序、坐标偏移和双 PO 命中先后需实机。 |
| `onEndCurrentAni` substate 2 | 需在当前目标 PVF 中只读确认 | 被击、中断、取消和同步收尾需实机。 |
| `onEndState` | 需在当前目标 PVF 中只读确认 | 只证明清理调用存在。 |

## PO 写包与攻击包

| PO | registry 解析 | 写入与读取 | 攻击包边界 |
| --- | --- | --- | --- |
| `24246` | `passiveobject.lst -> Character/Mage/ATBlueDragonWillSub.obj` | state 先写 float `spin_r`，再写 dword 冲击波独立攻击力；PO 读取后缩放图片和攻击盒，并设置当前 AttackInfo 的独立攻击力。 | `.obj` 是 bottom 层、pass all；`ATBlueDragonWillSub.atk` 为魔法、水属性、倒地、push aside 400、lift up 300。 |
| `24245` | `passiveobject.lst -> Character/Mage/ATBlueDragonWillExp.obj` | state 写 dword 冰锤百分比攻击倍率；PO 读取后设置当前 AttackInfo 的百分比攻击倍率。 | `.obj` 是 normal 层、pass all；`ATBlueDragonWillExp.atk` 为魔法、水属性、倒地、push aside 400、lift up 300。 |

## 动画锚点

| 资源 | 只读观察 | 边界 |
| --- | --- | --- |
| 角色动作 17/18/19 | `.chr [etc motion]` 对应 `BlueDragonWill1/2/3.ani`。 | 动作索引只对男法当前 `.chr` 闭合。 |
| `BlueDragonWill1.ani` | 11 帧，只有 damage box，没有 attack box。 | 用于蓄力/生成视觉，不证明攻击来源。 |
| `BlueDragonWill2.ani` | 6 帧，带 SUPERARMOR damage type；脚本在 frame 2-5 手动改 Z 轴。 | SUPERARMOR 静态标签和实机霸体表现需运行确认。 |
| `BlueDragonWill3.ani` | 15 帧，前 3 帧带 SUPERARMOR，后续多帧短 delay。 | 本体动画没有创建 PO 的 keyframe flag；PO 创建在 `onSetState` substate 2。 |
| `ATBlueDragonWillSub.obj` 动画 | 需在当前目标 PVF 中只读确认 | 攻击盒缩放后的范围和实际命中需实机。 |
| `ATBlueDragonWillExp.obj` 动画 | 需在当前目标 PVF 中只读确认 | 攻击盒、层级和消失残留需实机或资源链。 |
| 角色 `.als` | 三段动作引用多组 `ATBlueDragonWill` 视觉层，dash 段还创建 dust draw-only 视觉。 | 只证明动画引用，不证明客户端资源完整。 |

## 目标搜索公共函数

| 函数 | 目标核验 | 边界 |
| --- | --- | --- |
| `findAngleTarget(obj, distance, angle, targetMaxHeight)` | 需在当前目标 PVF 中只读确认 | 目标排序、距离权重、角度计算、目标死亡/离场和联机同步必须实机。 |
| `getObjectAngle` / `getAngle` | 需在当前目标 PVF 中只读确认 | 只记录当前公共脚本算法，不写成引擎通用锁定规则。 |

## 下一步怎么测

1. 普通释放：确认是否从蓄力进入前冲，再落锤并创建地面冲击和冰锤两个命中来源。
2. 有目标释放：在正前方、侧方、背后、空中目标分别测试锁定和前冲距离。
3. 无目标释放：确认是否按默认距离前冲并落锤。
4. 障碍测试：靠墙、地图边缘、不可移动格子释放，观察前冲是否被截断、是否卡位。
5. EX 测试：学习 `BlueDragonWillEx` 后对比伤害，确认 10% 被动加成是否实际生效。
6. 柔化测试：只有确认 `skill 254` appendage 实际生效后，再测 growtype 2 是否能柔化进入 BlueDragonWill。

## 禁止外推

- 不能把 `.atk` 的倒地、推开、浮空字段写成实机最终击退/浮空结论。
- 不能把 `findAngleTarget` 写成所有技能通用目标选择规则。
- 不能把 `BlueDragonWillEx.skl` 文本写成已经静态证明的最终伤害加成。
- 当前只允许记录 `24245/24246` 本技能 PO 窄链，不重开 PassiveObject / AttackInfo / Hitbox 广域采样。
