# Formal Region / Town / Worldmap / Area Entry Boundary

状态：默认可用


| 层 | 目标核验 | 结论 |
| --- | --- | --- |
| `region/region.lst` | 需在当前目标 PVF 中只读确认 | region ID 稀疏，不能按连续自然数推断。 |
| `region/*.rgn` | 需在当前目标 PVF 中只读确认 | 未注册文件存在只能记为静态线索，不能写成可用 region。 |
| `region/*.rgn [towns]` | 需在当前目标 PVF 中只读确认 | 需在当前目标 PVF 中只读确认 |
| `region/minimap/*.mm` | 需在当前目标 PVF 中只读确认 | minimap 是显示/入口层线索；`warfare.mm` 与未注册 `warfare.rgn` 只能作为静态旁路线索。 |
| `town/town.lst` | 需在当前目标 PVF 中只读确认 | town registry 与 region/worldmap/dungeon 分离。 |
| `town/*.twn` | 需在当前目标 PVF 中只读确认 | town area 是城镇入口核心；dungeon gate 后续数字按 worldmap 解析。 |
| `town/*.twn [limit level]` | 需在当前目标 PVF 中只读确认 | 等级字段是静态入场线索，不证明服务端放行。 |
| `worldmap/worldmap.lst` | 需在当前目标 PVF 中只读确认 | worldmap ID 可稀疏和高值，不能用条目数推断合法范围。 |
| `town/*.twn` 到 worldmap | 需在当前目标 PVF 中只读确认 | 需在当前目标 PVF 中只读确认 |
| `worldmap/*.wdm` | 需在当前目标 PVF 中只读确认 | `.wdm` 同时连接 dungeon 列表、UI 文件和入场条件线索。 |
| `worldmap/PowerStation.wdm` | 需在当前目标 PVF 中只读确认 | 这是静态部分配置/旁路风险，不能推断常规入口可用。 |
| `worldmap/Towers.wdm` | 需在当前目标 PVF 中只读确认 | dungeon ID 可远大于 `dungeon/dungeon.lst` 条目数；必须按 registry 解析。 |
| `worldmap/ui/*.ui` | 需在当前目标 PVF 中只读确认 | UI 控件 dungeon 绑定和 `.wdm [dungeon]` 是相邻但分层的配置。 |
| `map/*.map` | 需在当前目标 PVF 中只读确认 | 城镇地图移动区存在广泛配置，但静态不证明实机移动成功。 |


| 链路 | 解析规则 | 静态边界 |
| --- | --- | --- |
| Region 到 Town | `region/region.lst -> region/*.rgn [towns] -> town/town.lst` | `[towns]` 缺号只记风险，不补猜。 |
| Region 到 Minimap | `region/*.rgn [minimap] -> region/minimap/*.mm` | `.mm` 仅说明显示/点击层配置。 |
| Town 到 Map | `town/town.lst -> town/*.twn [area] -> map/<直接路径>` | 需在当前目标 PVF 中只读确认 |
| Town 到 Worldmap | `town/*.twn [area] -> `` `[dungeon gate]` `` -> worldmap/worldmap.lst` | dungeon gate 数字按 worldmap registry，不按 dungeon registry。 |
| Worldmap 到 Dungeon | `worldmap/worldmap.lst -> worldmap/*.wdm [dungeon] -> dungeon/dungeon.lst` | `[dungeon]` 后的副本数字按 dungeon registry；条件列不强行解释。 |
| Worldmap 到 UI | `worldmap/*.wdm [ui path] -> worldmap/ui/*.ui` | UI 文件和控件存在不证明客户端显示或点击正常。 |
| UI 到 Dungeon | `worldmap/ui/*.ui` balloon/control 末尾 dungeon 数字 -> `dungeon/dungeon.lst` | 需要和 `.wdm [dungeon]` 分层核查，不能只看 UI 数字。 |
| Map 内移动 | `town/*.twn [area]` 指向 `map/*.map`，再读 `[town movable area]` / `[virtual movable area]` | 只证明移动区配置存在，不证明传送成功。 |


| 样本 | 只读确认 | 用途 |
| --- | --- | --- |
| `region/heaven.rgn` | 需在当前目标 PVF 中只读确认 | 证明 `[towns]` 必须逐项解析，缺号不能靠名字或辅助 PVF 补齐。 |
| `region/warfare.rgn` | 文件存在且 `[towns]` 指向 7，但不在 `region/region.lst` 注册。 | 证明未注册文件不能直接当可用入口。 |
| `town/HendonMyre.twn` | 多个 `[area]`，含普通区域、gate、dungeon gate；dungeon gate 指向 worldmap 2、7、8、14 等。 | 证明一个 town 可挂多个 worldmap 入口。 |
| `town/WestCoast.twn` | dungeon gate 指向 worldmap 3、4、9、10、100 等。 | 证明 worldmap ID 100 可由 town gate 引用。 |
| `worldmap/SkyCastle.wdm` | `[dungeon]` 含 dungeon 11、12、13、14、15、17、504 及若干 `[in progress]` 条目；`[ui path]` 指向 UI。 | 证明 `.wdm` 是 worldmap 到 dungeon 和 UI 的中间层。 |
| `worldmap/UI/SkyCastle.ui` | balloon 控件末尾数字对应 dungeon 11、12、13、14、17、15、504。 | 证明 UI 控件与 `.wdm [dungeon]` 需要共同核查。 |
| `worldmap/PowerStation.wdm` | worldmap ID 19 注册；常规 `[dungeon]` 空；未在 registered town gate 样本中出现。 | 证明注册存在不等于常规入口完整。 |
| `worldmap/Towers.wdm` | worldmap ID 100；高 dungeon ID 可解析到 `dungeon/dungeon.lst` 条目。 | 证明 registry 条目数不是 ID 上限。 |

## 跨 registry 数字风险

| 数字 | 正确 registry 上下文 | 目标核验 |
| --- | --- | --- |
| `7` | `town/town.lst`、`worldmap/worldmap.lst`、`dungeon/dungeon.lst` 各自独立。 | 需在当前目标 PVF 中只读确认 |
| `14` | 需在当前目标 PVF 中只读确认 | 需在当前目标 PVF 中只读确认 |
| `3` | 需在当前目标 PVF 中只读确认 | 需在当前目标 PVF 中只读确认 |
| `100` | 在 `worldmap/worldmap.lst` 可解析为 Towers；不是 town ID。 | 需在当前目标 PVF 中只读确认 |
| `504` | 在 `dungeon/dungeon.lst` 可解析为 dungeon。 | 需在当前目标 PVF 中只读确认 |


| 项 | 跨版本候选；需在当前目标 PVF 中复核 |
| --- | --- |
| registry 数量 | 需在当前目标 PVF 中只读确认 |
| region | 跨版本候选；需在当前目标 PVF 中复核 |
| town gate | 跨版本候选；需在当前目标 PVF 中复核 |
| worldmap | 跨版本候选；需在当前目标 PVF 中复核 |
| ID 14 | 跨版本候选；需在当前目标 PVF 中复核 |

## 静态不能证明

- 不能证明城镇按钮、worldmap UI、气泡、点击区域、地图移动区实机可用。
- 不能证明入场等级、任务、门票、物品条件、深渊条件被服务端放行。
- 不能证明客户端 `ImagePacks2`、UI 图像、地图 tile、动画、声音资源完整。
- 不能证明副本可进入、怪物刷新、清图、翻牌、掉落、奖励结算成功。

## 后续工作入口

- 要做新区域或新城镇：先复核本链路，再转 Dungeon / Map / Client Assets / Audio。
- 要做新副本入口：本链路只处理入口层，副本内部仍走 Dungeon / Map / Spawn / Entry / Clear / Resource Boundary。
- 要解释入场条件、任务门票或翻牌：转 Quest / Type / Reward / Drop / Ticket Boundary 或后续 Clear Reward / Card Flip 主线。
