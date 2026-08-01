# Dungeon / Map / Spawn / Entry / Clear / Resource Boundary

状态：默认可用


## 默认读法

1. `safety/README.zh-CN.md`
2. `encyclopedia/pvf-file-types/dungeon-map-worldmap.zh-CN.md`
3. `dictionaries/dungeon-map-spawn-entry-clear-resource-fields.zh-CN.md`
4. `task-cards/dungeon-map-spawn-entry-clear-resource-readonly-audit.zh-CN.md`
5. 本矩阵
6. 需要怪物、任务、门票、独立掉落或清算细节时，只读对应现有入口，不重开旧主线。


| 桶 | 目标核验 | 边界 |
| --- | --- | --- |
| PVF 规模 | 需在当前目标 PVF 中只读确认 | 文件数只是静态规模，不证明客户端资源或服务端配置完整。 |
| registry 规模 | 需在当前目标 PVF 中只读确认 | 所有数字 ID 必须回到对应 registry，不能跨 registry 混用。 |
| 注册副本可读性 | 需在当前目标 PVF 中只读确认 | 只证明注册文件存在且可解析，不证明实机可进。 |
| 普通 `.dgn -> map` | 需在当前目标 PVF 中只读确认 | 仅适用于普通 map specification 父块。 |
| 旧式与反向 map 归属 | 需在当前目标 PVF 中只读确认 | 没有 `[map specification]` 的旧式副本不能直接判坏，要看 `.map [dungeon]`。 |
| 特殊副本分支 | 需在当前目标 PVF 中只读确认 | AdvanceAltar 是特殊规则，不并入普通副本地图规则。 |
| 副本等级 | 需在当前目标 PVF 中只读确认 | 需在当前目标 PVF 中只读确认 |
| 门票/入场物 | 需在当前目标 PVF 中只读确认 | 需在当前目标 PVF 中只读确认 |
| worldmap 展示 | 需在当前目标 PVF 中只读确认 | 展示配置不证明客户端资源或按钮可点。 |
| 城镇入口 | 需在当前目标 PVF 中只读确认 | 城镇入口静态存在不证明角色能到达或入口可用。 |
| `.map` 基础形状 | 需在当前目标 PVF 中只读确认 | 类型字符串不证明刷怪、清算或奖励。 |
| `.map` 房间资源 | 需在当前目标 PVF 中只读确认 | `.til/.ani/.act/.img` 引用不证明客户端资源完整。 |
| `.map` 怪物出生 | 需在当前目标 PVF 中只读确认 | 不重开 Monster 主线；不证明怪物实机刷出、AI 正常、掉落正确或锁门清算。 |
| `.map` 地图对象 | 需在当前目标 PVF 中只读确认 | 需在当前目标 PVF 中只读确认 |
| 独立掉落 | 需在当前目标 PVF 中只读确认 | 不证明实机掉率，也不等同任务奖励、怪物掉落或清算翻牌。 |
| 清算翻牌 | 需在当前目标 PVF 中只读确认 | 需在当前目标 PVF 中只读确认 |

## 代表链路

| 类型 | 链路 | 可复用结论 |
| --- | --- | --- |
| 城镇到副本 | `town/*.twn [area] -> [dungeon gate] -> worldmap/worldmap.lst -> worldmap/*.wdm [dungeon] -> dungeon/dungeon.lst -> .dgn` | 这是可观察到的静态入口链。 |
| 普通 dungeon 到 map | `dungeon/dungeon.lst -> .dgn [map specification] / [boss map specification] -> map/map.lst -> .map` | 第三列是 map ID，必须按 map registry 解析。 |
| map 反向归属 | `map/map.lst -> .map [dungeon] -> dungeon/dungeon.lst` | 用于补普通 map specification 之外的旧式闭合。 |
| 特殊副本 | `.dgn [advance altar map] -> map/map.lst -> .map` | 特殊副本使用专属父块，不套普通规则。 |
| 房间怪物 | `.map [monster] -> monster/monster.lst -> .mob` | 只确认静态出生记录和 monster registry。 |
| 地图对象 | `.map [passive object] -> passiveobject/passiveobject.lst -> .obj` | 只确认地图对象投放。 |
| 门票 | `.dgn [required item] -> stackable/stackable.lst -> .stk` | 只确认静态入场消耗。 |
| worldmap UI | `.wdm [ui path] -> worldmap/ui/*.ui [ui controls] -> .img/.act 引用` | 只确认 PVF UI 引用。 |
| 独立掉落 | `etc/independentdrop.lst -> etc/independentdrop/*.etc [list] -> item ID / weight` | 不与清算翻牌、任务奖励混用。 |
| 清算翻牌 | `etc/itemdropinfo_clearreward.etc -> gold card / pcroom / ref table 块` | 这是全局清算边界，不是普通怪物掉落。 |

## 不可静态证明

- 实机能进入副本。
- 怪物一定刷出、AI 正常、锁门或开门正确。
- Boss 被击杀后清算成功。
- 翻牌 UI 正常、金币扣除成功、奖励发放成功。
- 门票第三列、多门票组合、疲劳、组队、深渊、任务链外围或频道条件被服务端放行。
- 掉落概率与静态权重一致。
- `.img/.ani/.act/.til/.ui` 在客户端 ImagePacks2/NPK 中完整存在。
- BGM、音效、UI 点击、红叉、黑图和客户端显示正常。

## 使用检查

- 能从 town gate、worldmap、dungeon、map、monster、passiveobject、stackable registry 分别说明 ID 归属。
- 能区分普通 `[map specification]`、map 反向 `[dungeon]` 和 AdvanceAltar 特殊 `[advance altar map]`。
- 能说明副本门票、独立掉落、清算翻牌、任务奖励、怪物掉落分别属于不同边界。
- 能说明 PVF 资源引用和客户端资源完整性之间的边界。
- 能给出下一步实机测试项，而不是把静态闭合写成运行成功。
