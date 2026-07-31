# AT Mage / WindStrike 原生链只读索引

状态：默认可用


## 一句话结论

WindStrike 是男法 `skill 1`，由男法 `load_state` 注册到 `state 20`，角色动画第 2 帧触发 `SET FLAG 1` 后，NUT 写入百分比攻击力、独立攻击力、浮空力三个参数并创建 `passiveobject 24201`；该 PO 再在 `setCustomData` 中读回参数并改写当前攻击信息。


| 环节 | 目标核验 | 边界 |
| --- | --- | --- |
| skill registry | 需在当前目标 PVF 中只读确认 | 只证明男法技能 registry 路由。 |
| `.skl` 基础字段 | 需在当前目标 PVF 中只读确认 | `[executable states]` 与 `[static data]` 是静态字段，不能单独证明释放成功或伤害表现。 |
| header 常量 | 需在当前目标 PVF 中只读确认 | 常量只在当前男法脚本体系内成立。 |
| load_state state 注册 | 需在当前目标 PVF 中只读确认 | 证明 state NUT 有入口；不证明每个分支都已实机覆盖。 |
| load_state PO 注册 | 需在当前目标 PVF 中只读确认 | `24201` 必须按 `passiveobject/passiveobject.lst` 解析，不能按技能、怪物或 APC registry 猜。 |
| state 切换 | 需在当前目标 PVF 中只读确认 | 这里没有 substate；是否能释放仍受冷却、状态和命令条件影响。 |
| 命令可用 | 需在当前目标 PVF 中只读确认 | 命令允许不等于技能一定命中或最终进入目标动作。 |
| 动作入口 | 需在当前目标 PVF 中只读确认 | 只证明动作被 NUT 指定；动作资源表现需客户端资源链和实机确认。 |
| keyframe 创建 PO | 需在当前目标 PVF 中只读确认 | direction 参数在目标脚本调用中省略；坐标、朝向、同步和可见性不能靠静态只读证明。 |
| 角色 ANI flag | 需在当前目标 PVF 中只读确认 | 说明创建 PO 的静态触发帧；实际帧节奏仍要实机感受。 |
| PO registry | 需在当前目标 PVF 中只读确认 | 这是 passiveobject registry 闭合，不是技能 registry。 |
| PO `.obj` | 需在当前目标 PVF 中只读确认 | `.obj [name]` 链接显示为 `火焰爆炸`，只当显示/字符串现象，不改写 WindStrike 机制结论。 |
| PO ANI | 需在当前目标 PVF 中只读确认 | 命中盒静态存在不等于实机命中、卡肉或浮空成立。 |
| PO ATK | 需在当前目标 PVF 中只读确认 | 只证明静态 AttackInfo 字段；伤害、浮空、击倒、PVP 要实测。 |
| PO NUT | 需在当前目标 PVF 中只读确认 | `receiveData.readDword/readWord` 当前未在 内置 NUT API 事实目录 中找到独立内置定义，只记录为目标脚本回调参数用法。 |

## 参数流

| 写入端 | 传入 PO 的字段 | 读取端 | 用途边界 |
| --- | --- | --- | --- |
| `sq_GetBonusRateWithPassive(SKILL_WIND_STRIKE, STATE_WIND_STRIKE, 0, 1.0)` | `sq_WriteDword(attackBonusRate)` | `receiveData.readDword()` | 设置当前攻击百分比攻击力；数值效果需实机。 |
| `sq_GetPowerWithPassive(SKILL_WIND_STRIKE, STATE_WIND_STRIKE, 1, 0, 1.0)` | `sq_WriteDword(power)` | `receiveData.readDword()` | 设置当前独立攻击力；参数 4 按目标脚本实见记录，不外推为通用写法。 |
| `obj.sq_GetLevelData(2)` | `sq_WriteWord(upForce)` | `receiveData.readWord()` | 设置当前攻击浮空力；浮空表现必须实机确认。 |

## 内置 NUT API 事实目录 已核 API

| API | 当前可用结论 | 边界 |
| --- | --- | --- |
| `IRDSQRCharacter.sq_IsCommandEnable(skillId)` | 判断是否允许按下技能命令。 | 只代表命令层条件，不代表释放和命中成功。 |
| `IRDSQRCharacter.sq_StartWrite()` | 开始向 PO 的 `receiveData` 写入数据。 | 必须跟创建 PO 的调用链匹配。 |
| `IRDSQRCharacter.sq_WriteDword(value)` | 写入 4 字节整数。 | 读取端顺序必须一致。 |
| `IRDSQRCharacter.sq_WriteWord(value)` | 写入 2 字节整数。 | 读取端顺序必须一致。 |
| `IRDSQRCharacter.sq_SendCreatePassiveObjectPacket(index, level, x, y, z, direction)` | 创建 passiveobject。 | `index` 仍要 registry 闭合；direction 可按脚本调用省略，但不可凭空补语义。 |
| `IRDSQRCharacter.sq_GetBonusRateWithPassive(...)` | 读取带被动修正的百分比类伤害数据。 | 只确认函数形状；最终数值和加成来源需实机或专项数值测试。 |
| `IRDSQRCharacter.sq_GetPowerWithPassive(...)` | 读取带被动修正的固伤类数据。 | 只确认函数形状；参数含义不得跨技能硬套。 |
| `IRDSQRCharacter.sq_GetLevelData(...)` | 读取技能 level data。 | 目标脚本出现一参数便捷用法，当前按脚本实见记录，不外推。 |
| `sq_GetCurrentAttackInfo(obj)` | 获取当前 AttackInfo。 | 返回数据包可被改写，但不能证明命中。 |
| `sq_SetCurrentAttackBonusRate(attackInfo, value)` | 设置当前百分比攻击力。 | 只说明字段写入接口，不证明最终伤害。 |
| `sq_SetCurrentAttackPower(attackInfo, value)` | 设置当前独立攻击力。 | 只说明字段写入接口，不证明最终伤害。 |
| `sq_SetCurrentAttacknUpForce(attackInfo, value)` | 设置当前攻击浮空力。 | 只说明字段写入接口，不证明浮空表现。 |
| `sq_SendDestroyPacketPassiveObject(obj)` | 在 PO 内销毁自身。 | 销毁时序和同步仍需实机。 |

## 不要外推

- 本文没有重开 PassiveObject / AttackInfo / Hitbox 广域主线；这里只是为一个技能的原生链做最小只读闭合。
- `receiveData.readDword/readWord` 只能作为当前目标脚本回调参数读法记录，不能写成 内置 NUT API 事实目录 已确认通用 API。

## 下一步实测建议

1. 用男法角色释放 WindStrike，确认动作能进入并在第三帧附近出现旋风 PO。
2. 用普通怪记录是否命中、掉血、浮空或击倒；这些结果不能由静态索引代替。
3. PVP、塔类副本、异常网络同步和客户端资源缺失要分开测，不要用单次普通副本结果覆盖。
