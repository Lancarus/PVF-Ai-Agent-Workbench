# AT Mage IceSword State/AttackInfo/EX Rewind 链只读索引

状态：默认可用


## 纯结论

| 问题 | 目标核验 | 边界 |
| --- | --- | --- |
| `IceSword` 入口 | 需在当前目标 PVF 中只读确认 | 只证明技能入口和 state 绑定；不证明释放成功率。 |
| state 参数 | 需在当前目标 PVF 中只读确认 | 不要给本技能硬套其他技能的 substate 数字。 |
| 动作锚点 | 需在当前目标 PVF 中只读确认 | 动作索引只对男法当前 `.chr` 闭合。 |
| 攻击包锚点 | 需在当前目标 PVF 中只读确认 | AttackInfo 被切换不等于一定命中或产生最终伤害。 |
| PO 边界 | 需在当前目标 PVF 中只读确认 | 不重开 PassiveObject / AttackInfo / Hitbox 广域主线。 |
| EX 边界 | 需在当前目标 PVF 中只读确认 | 静态链路提示第三击可能被前两击重复替代；实际命中列表、节奏和同步必须实机。 |
| 强制/柔化边界 | 需在当前目标 PVF 中只读确认 | 当前未做 skill 254 完整可达性审计，不能写成默认已启用。 |

## `.skl` 静态字段

| 文件 | 已确认字段 | 边界 |
| --- | --- | --- |
| `ATMage/IceSword.skl` | 名称为冰魄剑；主动；`feature skill index 218`；`[executable states] 0 14 8`；`[static data] 100`；冷却 `4000`；level info 为 5 列。 | `static data[0]` 在当前 NUT 中按 `/100` 转成动作速度倍率；不要跨技能外推。 |
| `ATMage/IceSword.skl` level info | 5 列依次被当前脚本用作第一/二击攻击倍率、第三击攻击倍率、减速等级、减速概率、减速持续时间。 | 第 5 列展示缩放为秒，但脚本读取仍按数值传入异常状态。 |
| `ATMage/IceSwordEx.skl` | 强化 - 冰魄剑；被动；前置 `8 10`；最大 1 级；说明文本为取消原第三击动作并重复前两击动作。 | 运行效果不由 `.skl` 单独决定，已在 `ice_sword.nut` 通过等级检查和回卷逻辑闭合。 |
| `ATMage/CancelIceSword.skl` | 强制 - 冰魄剑；被动；说明文本为强制中断普通攻击并立即施放冰魄剑。 | 只读 `.skl` 不能证明实际强制窗口，必须结合运行脚本或实机。 |

## state NUT 链路

| 回调 | 目标核验 | 边界 |
| --- | --- | --- |
| `checkExecutableSkill_IceSword` | 需在当前目标 PVF 中只读确认 | 释放条件、冷却和输入仍由运行时决定。 |
| `checkCommandEnable_IceSword` | 需在当前目标 PVF 中只读确认 | 命令可用不等于一定能切 state。 |
| `onSetState_IceSword` | 需在当前目标 PVF 中只读确认 | `addElementalChain_ATMage` 当前只记录为未展开函数调用；转换、特效、元素链最终表现需实机。 |
| `onKeyFrameFlag_IceSword flag 1` | 需在当前目标 PVF 中只读确认 | 不证明该帧一定命中。 |
| `onKeyFrameFlag_IceSword flag 2` | 需在当前目标 PVF 中只读确认 | 减速是否触发、抗性、免疫、PVP 修正规则必须实机。 |
| `onKeyFrameFlag_IceSword flag 3` | 需在当前目标 PVF 中只读确认 | 回卷后的攻击盒、命中列表重置和第三击替代效果必须运行确认。 |
| `onEndCurrentAni_IceSword` | 需在当前目标 PVF 中只读确认 | 中断、被击、取消或 EX 回卷路径需实机覆盖。 |
| `onAttack_IceSword` | 需在当前目标 PVF 中只读确认 | 这是视觉层观察，不证明异常或伤害。 |

## 动画与 AttackInfo 静态锚点

| 资源 | 只读观察 | 边界 |
| --- | --- | --- |
| `ATAnimation/IceSword.ani` | 需在当前目标 PVF 中只读确认 | flag 3 在第三个攻击盒前出现；EX 回卷是否确实跳过第三击需实机。 |
| `ATAnimation/IceSword.ani.als` | 引用多组 `ATIceSword` 视觉层和烟尘效果。 | 只证明脚本/动画引用路径；不证明客户端资源完整。 |
| `ATAttackInfo/IceSword.atk` | 魔法攻击，水属性，武器伤害应用，受击反馈为伤害类，击退为 `-1`。 | 最终伤害、卡肉、方向和击退需实机。 |
| `ATAttackInfo/IceSwordLast.atk` | 魔法攻击，水属性，受击反馈为倒地类，含 `push aside 500`、`lift up 200`、`knuck back 1`。 | 倒地、推开、浮空和抗性表现不可静态证明。 |

## 通用 comminterrupt 关系

| 链路 | 目标核验 | 边界 |
| --- | --- | --- |
| `atmage_comminterrupt.skl` | 需在当前目标 PVF 中只读确认 | 只证明技能文件存在。 |
| `passive_skill_ATMage.nut` | 需在当前目标 PVF 中只读确认 | 当前未证明角色默认已学习或始终挂载。 |
| `ap_atmage_comminterrupt.nut` | 需在当前目标 PVF 中只读确认 | 这是通用柔化/切 state 入口，不是 `IceSword.skl` 本体自带的强制证明。 |

## 下一步怎么测

1. 普通释放：男法进图释放冰魄剑，确认是否正常进动作、是否三段攻击盒都能命中。
2. EX 释放：学习 `IceSwordEx` 后在非 PVP 测一次，重点看第三击是否被前两击重复替代、动画是否只回卷一次。
3. PVP 对照：在 PVP 场景学习 EX 后释放，确认 flag 3 的回卷是否被跳过。
4. 减速测试：用可受异常目标记录减速是否触发、持续时间和抗性表现。
5. 强制测试：只有确认 `skill 254` appendage 实际生效后，再测普攻或其他技能中是否能柔化进入冰魄剑。

## 禁止外推

- 不能把 `IceSwordLast.atk` 的推开/浮空字段写成实机最终击退结论。
- 不能把 EX 文本说明当成运行事实；必须以 `ice_sword.nut` 和实机表现为准。
- 不能把 `CancelIceSword.skl` 文本当成所有状态都可强制。
- 当前链不创建 PO；不要因此重开 PassiveObject / AttackInfo / Hitbox 广域采样。
