# Appendage / Item Common / Equipment Special Effect Boundary

状态：需验证


## 方法边界

- 数字 ID 必须看父块和上下文，不能跨 registry 借义。


| 小桶 | 目标核验 | 结论 |
| --- | --- | --- |
| 装备 appendage 入口 | 需在当前目标 PVF 中只读确认 | 装备触发和条件块可引用 APD，但每个数字要回 `appendage/appendage.lst`。 |
| 消耗品效果入口 | 需在当前目标 PVF 中只读确认 | 消耗品可携带效果分组或被动对象入口；列公式未在示例完整解释。 |
| 装备 passive object | 需在当前目标 PVF 中只读确认 | 第一列是 passiveobject ID 语境，必须解析到 `.obj` 后继续读对象链。 |
| 附加效果映射 | 需在当前目标 PVF 中只读确认 | 附加效果编号走 ETC 映射族，不是普通 `.lst` registry ID。 |
| `item_common` 字面 | 需在当前目标 PVF 中只读确认 | 当前不能写成独立通用物品效果数据域。 |

## 代表链路

| 链路 | 目标核验 | 风险 |
| --- | --- | --- |
| 装备 appendage | 需在当前目标 PVF 中只读确认 | 静态只读只证明配置链；霸体、速度、附加伤害、持续、冷却和 PVP 表现需实机。 |
| 装备唯一 appendage | 需在当前目标 PVF 中只读确认 | `unique` 的覆盖、刷新和退出时机不能静态证明。 |
| 消耗品 appendage group | 需在当前目标 PVF 中只读确认 | `0` 不是 appendage registry ID；当前不解释 group 规则。 |
| 消耗品 passive object | 需在当前目标 PVF 中只读确认 | 只证明道具可指向被动对象；使用时目标、模式切换、对象创建成功和资源显示需运行验证。 |
| 装备 passive object | 需在当前目标 PVF 中只读确认 | 不证明消耗成功、施放成功、下游对象命中、伤害、轨迹、同步或资源完整。 |
| 装备附加效果 | 需在当前目标 PVF 中只读确认 | 6221 在常规 registry 中未闭合；必须走 ETC 映射族。动画路径不证明客户端实际显示。 |
| `item_common` 字面 | 需在当前目标 PVF 中只读确认 | 这是 UI 动画资源，不是物品共通效果规则。 |


| 项 | 跨版本候选；需在当前目标 PVF 中复核 |
| --- | --- |
| equipment `[appendage]` | 需在当前目标 PVF 中只读确认 |
| equipment `[my appendage]` | 需在当前目标 PVF 中只读确认 |
| stackable `[appendage group]` | 需在当前目标 PVF 中只读确认 |
| stackable `[passive object in stackable]` | 需在当前目标 PVF 中只读确认 |
| `item_common` 字面 | 同样只命中抓娃娃 UI 动画资源。 |
| 样本 ID | 跨版本候选；需在当前目标 PVF 中复核 |


## 可复用规则

- 先定父块，再定 registry；同一个数字可以在多个 registry 中存在，不能离开父块解释。
- APD 是静态 appendage 配置；NUT appendage 是运行脚本体系，二者不能混写。
- 装备 `[passive object]` 与 `.act [CREATE PASSIVEOBJECT] [INDEX]` 都可进入 passiveobject 链，但所处父块不同，参数列不能互套。
- `[additional effect index]` 的正确入口是 ETC 映射族；找不到映射时保留原值，标记未解析。
- `item_common` 当前不是可编辑数据家族；遇到该字面先查文件类型和父目录。

## 未证明事项

- 不证明 appendage 叠加、持续、刷新、失效、buff 图标、PVP 修正或服务端同步。
- 不证明 passiveobject 命中、伤害、AI、轨迹、击退、浮空、对象销毁或客户端资源完整。
- 不证明 additional effect 足迹、翅膀、光效类动画实际显示。
- 不证明 stackable 使用成功、扣除、冷却、背包检查或服务端放行。
