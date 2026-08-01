# ActionObject / MapObject / BreakableObject / SPC Object Boundary

状态：需验证


## 方法边界

- 数字 ID 必须回到父块和上下文：map 放置、被动对象创建、怪物召唤、APC 召唤分别走不同 registry。


| 小桶 | 目标核验 | 结论 |
| --- | ---: | --- |
| `passiveobject/passiveobject.lst` | 需在当前目标 PVF 中只读确认 | 对象 ID 的第一入口；不能靠数字外形猜 registry。 |
| `passiveobject/` `.obj` | 需在当前目标 PVF 中只读确认 | 物理文件数可高于 registry 项数；是否注册要回 `.lst`。 |
| `actionobject/` `.obj` | 需在当前目标 PVF 中只读确认 | 行为对象大族，常见 `.act/.atk/.ani` 链路。 |
| `actionobject/map/` `.obj` | 需在当前目标 PVF 中只读确认 | 地图相关 actionobject，不等于 mapobject。 |
| `actionobject/monster/` `.obj` | 需在当前目标 PVF 中只读确认 | 怪物相关 actionobject，不等于 monster registry 本体。 |
| `actionobject/common/` `.obj` | 需在当前目标 PVF 中只读确认 | 通用对象候选，需 owner 链路确认。 |
| `actionobject/breakableobject/` `.obj` | 需在当前目标 PVF 中只读确认 | actionobject 层破坏物，可含 `.act`、HP、销毁粒子。 |
| `actionobject/spc/` `.obj` | 需在当前目标 PVF 中只读确认 | SPC 对象家族，样本确认 `.obj -> .act/.atk/.ani`。 |
| `mapobject/` `.obj` | 需在当前目标 PVF 中只读确认 | 地图物件大族，常见 motion、string/int data。 |
| `mapobject/breakableobject/` `.obj` | 需在当前目标 PVF 中只读确认 | mapobject 层破坏物，和 actionobject 破坏物分层。 |
| `mapobject/pathgate/` `.obj` | 需在当前目标 PVF 中只读确认 | 路径门对象候选，静态字段不证明门逻辑。 |
| `mapobject/trap/` `.obj` | 需在当前目标 PVF 中只读确认 | 陷阱/机关候选，静态字段不证明触发。 |
| `mapobject/obstacle/` `.obj` | 需在当前目标 PVF 中只读确认 | 障碍候选，静态字段不证明碰撞。 |
| `mapobject/particlefactory/` `.obj` | 需在当前目标 PVF 中只读确认 | 粒子候选，静态字段不证明渲染。 |


| 链路 | 目标核验 | 风险边界 |
| --- | --- | --- |
| `ActionObject .obj -> [basic action]` | 需在当前目标 PVF 中只读确认 | 只说明 `.obj` 引用 `.act`，不证明动作触发。 |
| `ActionObject .obj -> [attack info]` | 需在当前目标 PVF 中只读确认 | `.atk` payload 不证明 hitbox 命中或伤害。 |
| `MapObject .obj -> [basic motion]` | 需在当前目标 PVF 中只读确认 | 直接 motion 不是 `.act` 行为链。 |
| `MapObject .obj -> [etc motion]` | 需在当前目标 PVF 中只读确认 | 多动画/空串都需要保留原样，不硬解释列。 |
| `MapObject .obj -> [attack info]` | 需在当前目标 PVF 中只读确认 | 少量 mapobject 也可携带 `.atk`，但不代表所有地图物件可攻击。 |
| `MapObject .obj -> [object destroy condition]` | 需在当前目标 PVF 中只读确认 | 不能把 actionobject 常见销毁条件外推到 mapobject 全族。 |
| `MapObject .obj -> [hp max]` | 需在当前目标 PVF 中只读确认 | 不能把 actionobject 破坏物 HP 外推到 mapobject。 |
| `ActionObject .act -> [CREATE PASSIVEOBJECT]` | 需在当前目标 PVF 中只读确认 | `[INDEX]` 走 passiveobject registry；不证明实机创建成功。 |
| `MapObject .act -> [CREATE PASSIVEOBJECT]` | 需在当前目标 PVF 中只读确认 | 跨版本候选；需在当前目标 PVF 中复核 |
| `ActionObject .act -> [SUMMON MONSTER]` | 需在当前目标 PVF 中只读确认 | `[INDEX]` 走 monster registry。 |
| `ActionObject .act -> [SUMMON APC]` | 需在当前目标 PVF 中只读确认 | `[INDEX]` 走 aicharacter registry。 |
| `.map -> [passive object]` | 需在当前目标 PVF 中只读确认 | map 放置块首列走 passiveobject registry，不走 map registry。 |

## Registry 样本

| 上下文 | ID | 解析结果 | 边界 |
| --- | ---: | --- | --- |
| `passiveobject/passiveobject.lst` | 221 | `MapObject/BreakableObject/Barrel.obj` | passiveobject registry 可注册 mapobject 破坏物。 |
| `.map [passive object]` | 708 | `MapObject/Obstacle/Act3_1stBackbonesmallwall.obj` | 地图放置块首列走 passiveobject registry。 |
| `.map [passive object]` | 709 | `MapObject/Obstacle/Act31stBackboneFar.obj` | 同上，不能按数字猜成 map ID。 |
| `.map [passive object]` | 779 | `MapObject/BreakableObject/1stBackboneLongPot.obj` | special/passive object 附近数字仍需看父块。 |
| `passiveobject/passiveobject.lst` | 2722 | `Character/Common/OlympicFairyShield.obj` | passiveobject registry 也可注册 character/common 对象。 |
| `passiveobject/passiveobject.lst` | 344 | `Monster/Skeleton/FallingStone1.obj` | passiveobject registry 里出现 Monster 路径也不是 monster registry ID。 |
| `.act [CREATE PASSIVEOBJECT] [INDEX]` | 10185 | `ActionObject/Act8/Map/pirateonthetrain/enginecover_1.obj` | 创建被动对象时走 passiveobject registry。 |
| `.act [SUMMON MONSTER] [INDEX]` | 61218 | `monster/Act8/Merman/Merman.mob` | 召唤怪物时走 monster registry。 |
| `.act [SUMMON MONSTER] [INDEX]` | 61219 | `monster/Act8/MermanMage/MermanMage.mob` | 同一 `.act` 可召唤多个 monster ID。 |
| `.act [SUMMON APC] [INDEX]` | 409 | `aicharacter/swordman/die_swordman/die_swordman.aic` | 召唤 APC 时走 aicharacter registry。 |


| 项 | 跨版本候选；需在当前目标 PVF 中复核 | 处理方式 |
| --- | ---: | --- |
| PVF 文件总数 | 1052773 | 只说明目标集更大。 |
| `passiveobject/passiveobject.lst` | 15519 entries | 需在当前目标 PVF 中只读确认 |
| `passiveobject/` `.obj` | 17393 | 需在当前目标 PVF 中只读确认 |
| `actionobject/` `.obj` | 8901 | 只提示对象家族扩张。 |
| `actionobject/map/` `.obj` | 2766 | 只作未来差异复核方向。 |
| `actionobject/spc/` `.obj` | 203 | 需在当前目标 PVF 中只读确认 |
| `mapobject/` `.obj` | 1955 | 需在当前目标 PVF 中只读确认 |
| `mapobject/pathgate/` `.obj` | 1176 | 路径门家族明显扩张。 |
| `.map [passive object]` | 4049 | 只说明辅助版本 map 放置更多。 |
| `actionobject [CREATE PASSIVEOBJECT]` | 3044 | 需在当前目标 PVF 中只读确认 |
| `mapobject [CREATE PASSIVEOBJECT]` | 4 | 需在当前目标 PVF 中只读确认 |
| `actionobject [SUMMON MONSTER]` | 440 | 需在当前目标 PVF 中只读确认 |
| `actionobject [SUMMON APC]` | 17 | 需在当前目标 PVF 中只读确认 |

## 可复用规则

- 先看父块，再选 registry；不要把数字 ID 当全局 ID。
- 先按 owner 相对路径闭合 `.obj/.act/.atk/.ani`，再判断是否还有资源或 runtime 风险。
- `ActionObject` 与 `MapObject` 目录名只能作为静态路由，不作为实机行为分类。
- `BreakableObject` 同名家族存在于 actionobject 和 mapobject 两层，不能混成一个字段模型。
- `SPC` 样本可按 actionobject 链路处理，但不证明具体技能或特殊效果实机触发。

## 未证明事项

- 不证明对象实际创建、销毁、递归、同步、阵营、生效半径、碰撞、路径阻挡或路径门开关。
- 不证明攻击命中、伤害、元素、异常状态、击退、浮空、血效或 PVP 最终规则。
- 不证明破坏物掉落、任务计数器、机关触发、怪物或 APC 召唤在实机成功。
- 不证明 ANI/TIL/PTL/音效 token 在客户端资源中完整，也不证明 NPK 加载顺序正确。
- 不证明服务端会放行任何静态配置。
