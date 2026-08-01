# RandomOption / Mystic / Equipment Random Boundary

状态：默认可用


## 默认读法

1. `safety/README.zh-CN.md`
2. `task-cards/randomoption-mystic-readonly-audit.zh-CN.md`
3. `dictionaries/randomoption-mystic-fields.zh-CN.md`
4. `indexes/equipment-rule-fields.zh-CN.md`
5. 本矩阵


| 桶 | 目标核验 | 边界 |
| --- | --- | --- |
| randomoption registry | 需在当前目标 PVF 中只读确认 | 需在当前目标 PVF 中只读确认 |
| skill random option registry | 需在当前目标 PVF 中只读确认 | 跨版本候选；需在当前目标 PVF 中复核 |
| option 文件 | 需在当前目标 PVF 中只读确认 | 文件可读不证明实机抽取、应用、显示或概率。 |
| 支持表 | 需在当前目标 PVF 中只读确认 | 这些文件不是 `randomoption.lst` 漏注册词条；按全局支持表处理。 |
| equipment 侧规则 | 需在当前目标 PVF 中只读确认 | 装备侧字段不是随机词条池本体；不能凭装备字段反推出完整随机系统运行成功。 |
| mystic / avatar hidden option | 需在当前目标 PVF 中只读确认 | 属于 avatar roulette 配置；不等同 equipment `[hidden option]`。 |
| hidden option 缺口 | 需在当前目标 PVF 中只读确认 | 跨版本候选；需在当前目标 PVF 中复核 |

## 代表链路

| 链路 | 可复用结论 | 不要推导 |
| --- | --- | --- |
| `randomoption.lst` -> `options/*.etc` | 随机词条 ID 应先按 registry 解析，再读取词条文件字段。 | 不要从 ID 大小、文件名或中文属性名直接猜运行效果。 |
| `optiongrouping.etc` -> option ID | 组内 ID 可回到 `randomoption.lst` 检查是否存在。 | 权重列不等于已验证实机概率。 |
| `optiongroupselection.etc` / `partselection.etc` -> 部位 token | 可见装备部位 token 与选择/权重列。 | token 不是 equipment registry ID；不证明某装备一定会获得该词条。 |
| `.equ` -> `[random option]` | 装备文件可标记随机规则入口；当前注册 `.equ` 全量样本值为 `1`。 | 不证明该装备在实机一定生成随机词条。 |
| `.equ` -> `[no random]` | 装备文件可标记禁止随机；示例为无值存在标记。 | 不要按布尔整数或分类 token 处理。 |
| avatar roulette -> `[mystic circle]` | 文件内可见 `2675818`，但该 ID 未按常规 `.lst` registry 闭合。 | 不猜成 stackable、equipment、商店物品或实机消耗物。 |

## 字段分布

| 字段 / 入口 | 目标核验 | 结论 |
| --- | --- | --- |
| `etc/randomoption/` | 需在当前目标 PVF 中只读确认 | 随机词条系统文件规模较小，但支持表齐全。 |
| `etc/randomoption/options/*.etc` | 需在当前目标 PVF 中只读确认 | 需在当前目标 PVF 中只读确认 |
| `etc/avatar_roulette/` | 需在当前目标 PVF 中只读确认 | avatar hidden option 入口集中在 `avatarfixedhiddenoptionlist.etc`。 |
| `[random option]` in registered `.equ` | 需在当前目标 PVF 中只读确认 | 需在当前目标 PVF 中只读确认 |
| `[no random]` in registered `.equ` | 需在当前目标 PVF 中只读确认 | 按标签存在读取。 |
| `[Force Result Item Rule]` in registered `.equ` | 需在当前目标 PVF 中只读确认 | 数字列语义未封死；只作为装备规则字段保留。 |
| `[hidden option]` in registered `.equ` | 需在当前目标 PVF 中只读确认 | 需在当前目标 PVF 中只读确认 |
| `[mystic circle]` | 需在当前目标 PVF 中只读确认 | 只记录为未闭合内部引用。 |


## 使用检查

- 能从 `randomoption.lst` 闭合到每个 `options/*.etc`。
- 能区分随机词条文件、全局支持表、装备侧随机规则和 avatar roulette hidden option。
- 能说明静态只读不能证明抽词条、洗词条、扣费、UI、资源或服务端放行。
